import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import schema from './schema';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';

const docClient = new AWS.DynamoDB.DocumentClient();
const imagesTable = process.env.IMAGES_TABLE;
const groupsTable = process.env.GROUPS_TABLE;
const bucketName = process.env.IMAGE_S3_BUCKET;
const ulrExpiration: number = +process.env.SIGNED_URL_EXPIRATION_SECONDS;

const s3 = new AWS.S3({
  signatureVersion: 'v4' // Use Sigv4 algorithm
})

const createImage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log('Processing event: ', event);

  const parsedBody = event.body;

  const validGroupId = await groupExist(parsedBody.groupId);

  if (!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Group does not exist'
      })
    }
  }

  const itemId = uuidv4();
  const newImage = await saveImage(itemId, parsedBody);

  const url = getUploadUrl(itemId);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({item: newImage, uploadUrl: url})
  }
}

async function groupExist(groupId: string) {
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise();
  
  return !!result.Item;
}

async function saveImage(itemId: string, body: any) {
  const timestamp = new Date().toISOString();
  
  const newImage = {
    imageId: itemId,
    groupId: body.groupId,
    timestamp: timestamp,
    name: body.name,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${itemId}`
  }

  console.log('Storing new Item: ', newImage)
  await docClient.put({
    TableName: imagesTable,
    Item: newImage
  }).promise();

  return newImage;
}

function getUploadUrl(itemId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: itemId,
    Expires: ulrExpiration
  })
}

export const main = middyfy(createImage);
