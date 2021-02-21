import type { AWS } from '@serverless/typescript';

import { hello } from './src/functions';

import { createGroup, getGroup } from './src/lambda';

const serverlessConfiguration: AWS = {
  service: 'serverless-exercise',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: 'dev',
    region: 'sa-east-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      GROUPS_TABLE: "Groups-${self:provider.stage}",
      IMAGES_TABLE: "Images-${self:provider.stage}",
      IMAGE_ID_INDEX: "imageIdIndex"
    },
    lambdaHashingVersion: '20201221',
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:GetItem"],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}"
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query", "dynamodb:PutItem"],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}"
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query"],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}"
      }
    ]
  },
  functions: { hello, createGroup, getGroup},
  resources: {
    Resources: {
      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S"
            }
          ],
          keySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.GROUPS_TABLE}"
        }
      },
      ImagesDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "groupId",
              AttributeType: "S"
            },
            {
              AttributeName: "timestamp",
              AttributeType: "S"
            },
            {
              AttributeName: "imageId",
              AttributeType: "S"
            }
          ],
          keySchema: [
            {
              AttributeName: "groupId",
              KeyType: "HASH"
            },
            {
              AttributeName: "timestamp",
              KeyType: "RANGE"
            },
          ],
          GlobalSecondarySchema: [
            {
              IndexName: "${self:provider.environment.IMAGE_ID_INDEX",
              KeySchema: [
                {
                  AttributeName: "imageId",
                  KeyType: "HASH"
                }
              ],
              Projection: {
                ProjectionType: "ALL"
              }
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.IMAGES_TABLE}"
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
