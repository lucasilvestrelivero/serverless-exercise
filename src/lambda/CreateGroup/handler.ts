import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import schema from './schema';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;

const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log('Processing event: ', event);
  const itemId = uuidv4();

  const parsedBody = event.body;

  const newItem = {
    id: itemId,
    ...parsedBody
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise();

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(newItem)
  }
}

export const main = middyfy(createGroup);
