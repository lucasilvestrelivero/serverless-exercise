import 'source-map-support/register';

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { v4 as uuidv4 } from 'uuid';

import schema from './schema';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';

const getGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const listGroup = [
    {
      name: uuidv4(),
      description: 'Test 1'
    },
    {
      name: uuidv4(),
      description: 'Test 2'
    },
    {
      name: uuidv4(),
      description: 'Test 3'
    }
  ]
  return {
    statusCode: 200,
    headers: {
      'Acess-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(listGroup)
  };
}

export const main = middyfy(getGroup);
