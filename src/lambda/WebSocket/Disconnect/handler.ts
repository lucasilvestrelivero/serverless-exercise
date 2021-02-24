import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();
const connectionTable = process.env.CONNECTION_TABLE;

const disconnectHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket disconnect: ', event);

  const connectionId = event.requestContext.connectionId;

  const key = {
    id: connectionId,
  }

  await docClient.delete({
    TableName: connectionTable,
    Key: key
  }).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  };
}

export const main = middyfy(disconnectHandler);
