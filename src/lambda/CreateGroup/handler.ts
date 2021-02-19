import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { v4 as uuidv4 } from 'uuid';

import schema from './schema';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log('Processing event: ', event);
  const itemId = uuidv4();

  const parsedBody = event.body;

  const newItem = {
    id: itemId,
    ...parsedBody
  }

  return {
    statusCode: 201,
    headers: {
      'Acess-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(newItem)
  }
}

export const main = middyfy(createGroup);
