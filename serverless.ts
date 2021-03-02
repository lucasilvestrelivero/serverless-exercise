import { 
  CreateGroup,
  CreateImage, 
  GetGroup,
  GetImagesByGroupId,
  GetImagesById,
  SendUploadNotification,
  ConnectHandler,
  DisconnectHandler,
  Authorization
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
      SIGNED_URL_EXPIRATION_SECONDS: "300",
      TOPIC_NAME: "imagesTopic-${self:provider.stage}",
      THUMBNAILS_S3_BUCKET: "serverless-udagram-thumbnail",
      API_ENDPOINT: {
        "Fn::Join": [
          "",
          [
            {
              "Ref": "WebsocketsApi"
            },
            ".execute-api.",
            {
              "Ref": "AWS::Region"
            },
            ".amazonaws.com/",
            "${self:provider.stage}"
          ]
        ]
      },
      JWT_SECURITY_TOKEN: "udagram-serveless-token"
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
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource: "arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*"
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CONNECTION_TABLE}"
      }
    ]
  },
  functions: {
    Authorization,
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
      GatewayResponseDefault4XX: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST'"
          },
          ResponseType: "DEFAULT_4XX",
          RestApiId: { Ref: "ApiGatewayRestApi" }
        }
      },
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
        DependsOn: ["SNSTopicPolicy"],
        Properties: {
          BucketName: "${self:provider.environment.IMAGE_S3_BUCKET}",
          NotificationConfiguration: {
            TopicConfigurations: [
              {
                Event: "s3:ObjectCreated:Put",
                Topic: { Ref: "ImagesTopic" }
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
      ThumbnailsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:provider.environment.THUMBNAILS_S3_BUCKET}",
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
          TableName: "${self:provider.environment.CONNECTION_TABLE}"
        }
      },
      ImagesTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          DisplayName: "Image bucket topic",
          TopicName: "${self:provider.environment.TOPIC_NAME}"
        }
      },
      SNSTopicPolicy: {
        Type: "AWS::SNS::TopicPolicy",
        Properties: {
          PolicyDocument: {
            Id: "MyPolicyImageSNS",
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  AWS: "*"
                },
                Action: "sns:Publish",
                Resource: { Ref: "ImagesTopic" },
                Condition: {
                  ArnLike: {
                    "AWS:SourceArn": "arn:aws:s3:::${self:provider.environment.IMAGE_S3_BUCKET}"
                  }
                }
              }
            ]
          },
          Topics: [
            { Ref: "ImagesTopic" }
          ]
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
