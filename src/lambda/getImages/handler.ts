import 'source-map-support/register';

import { middyfy } from '@libs/lambda';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import * as AWS from 'aws-sdk';
import schema from './schema';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

const getGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log('Caller event', event);
  const groupId = event.pathParameters.groupId;

  const validGroupId = await groupExist(groupId);

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

  const images = await getImagesPerGroup(groupId);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(images)
  };
}

export const main = middyfy(getGroup);

async function groupExist(groupId: string) {
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise();

  return !!result.Item;
}

async function getImagesPerGroup(groupId: string) {
  const result = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
      ':groupId': groupId
    },
    ScanIndexForward: false
  }).promise();

  return result.Items;
}

