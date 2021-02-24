import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();
const connectionTable = process.env.CONNECTION_TABLE;

const connectHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket connect: ', event);

  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();

  const item = {
    id: connectionId,
    timestamp
  }

  await docClient.put({
    TableName: connectionTable,
    Item: item
  }).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  };
}

export const main = middyfy(connectHandler);
