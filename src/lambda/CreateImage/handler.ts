import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import schema from './schema';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';

const docClient = new AWS.DynamoDB.DocumentClient();
const imagesTable = process.env.IMAGES_TABLE;
const groupsTable = process.env.GROUPS_TABLE;

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

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(newImage)
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
    name: body.name
  }

  console.log('Storing new Item: ', newImage)
  await docClient.put({
    TableName: imagesTable,
    Item: newImage
  }).promise();

  return newImage;
}

export const main = middyfy(createImage);


