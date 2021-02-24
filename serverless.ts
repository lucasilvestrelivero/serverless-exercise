import { 
  CreateGroup,
  CreateImage, 
  GetGroup,
  GetImagesByGroupId,
  GetImagesById,
  SendUploadNotification,
  ConnectHandler,
  DisconnectHandler
} from './src/lambda';

import type { AWS } from '@serverless/typescript';

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
      CONNECTION_TABLE: "Connections-${self:provider.stage}",
      IMAGE_ID_INDEX: "ImageIdIndex",
      IMAGE_S3_BUCKET: "serverless-udagram-images",
      SIGNED_URL_EXPIRATION_SECONDS: "300"
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
      },
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource: "arn:aws:s3:::${self:provider.environment.IMAGE_S3_BUCKET}/*"
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CONNECTION_TABLE}"
      }
    ]
  },
  functions: {
    CreateGroup,
    CreateImage,
    GetGroup,
    GetImagesById,
    GetImagesByGroupId,
    SendUploadNotification,
    ConnectHandler,
    DisconnectHandler
  },
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
          KeySchema: [
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
          KeySchema: [
            {
              AttributeName: "groupId",
              KeyType: "HASH"
            },
            {
              AttributeName: "timestamp",
              KeyType: "RANGE"
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.IMAGE_ID_INDEX}",
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
      },
      AttachmentsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:provider.environment.IMAGE_S3_BUCKET}",
          NotificationConfiguration: {
            LambdaConfigurations: [
              {
                Event: "s3:ObjectCreated:*",
                Function: {"Fn::GetAtt": ["SendUploadNotificationLambdaFunction", "Arn"]}
              }
            ]
          },
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ["*"],
                AllowedHeaders: ["*"],
                AllowedMethods: [
                  "GET",
                  "PUT",
                  "POST",
                  "DELETE",
                  "HEAD"
                ],
                MaxAge: 3000
              }
            ]
          }
        }
      },
      SendUploadNotificationPermission: {
        Type: "AWS::Lambda::Permission",
        Properties: {
          FunctionName: {Ref: "SendUploadNotificationLambdaFunction"},
          Principal: "s3.amazonaws.com",
          Action: "lambda:InvokeFunction",
          SourceAccount: {Ref: "AWS::AccountId"},
          SourceArn: "arn:aws:s3:::${self:provider.environment.IMAGE_S3_BUCKET}"
        }
      },
      BucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          PolicyDocument: {
            Id: "MyPolicyImageS3",
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicReadForGetBucketObjects",
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: "arn:aws:s3:::${self:provider.environment.IMAGE_S3_BUCKET}/*"
              }
            ]
          },
          Bucket: { Ref: "AttachmentsBucket" }
        }
      },
      WebSocketConnectionsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S"
            }
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.CONNECTIONS_TABLE}"
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
