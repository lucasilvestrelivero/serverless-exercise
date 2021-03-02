import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { APIGatewayAuthorizerHandler, APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { verify } from 'jsonwebtoken';

import { JwtToken } from '../../auth/JwtToken';

const securityToken = process.env.JWT_SECURITY_TOKEN;

const authorization: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    console.log('Processing event ', event)
    console.log('event type ', typeof event)
    
    const decodedToken = verifyToken(event.authorizationToken, securityToken)

    console.log(`User ${decodedToken.id} was authorized`)

    return {
        principalId: decodedToken.id,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: '*'
                }
            ]
        }
    }
  } catch (e) {
      console.log('User was not authorized', e.message)

      return {
          principalId: 'user',
          policyDocument: {
              Version: '2012-10-17',
              Statement: [
                  {
                      Action: 'execute-api:Invoke',
                      Effect: 'Deny',
                      Resource: '*'
                  }
              ]
          }
      }
  }
}

function verifyToken(authorizationToken: String, secret:string): JwtToken {

  if (!authorizationToken) {
      throw new Error('no authentication header')
  }

  console.log('Processing Token ', authorizationToken)

  if (!authorizationToken.toLocaleLowerCase().startsWith('bearer')) {
      throw new Error('invalid authentication header')
  }

  const split = authorizationToken.split(' ')

  const token = split[1]


  return verify(token, secret) as JwtToken
}

export const main = middyfy(authorization);
