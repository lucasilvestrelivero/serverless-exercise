import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { generateToken } from '../../auth/UtilToken'

const securityToken = process.env.JWT_SECURITY_TOKEN;


const getToken: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event);

  const token = generateToken('fake user', securityToken);

  const items = {
    token
  };
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(items)
  };
}

export const main = middyfy(getToken);
