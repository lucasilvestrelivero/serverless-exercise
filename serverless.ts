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
    region: 'sa-east-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  functions: { hello, createGroup, getGroup}
}

module.exports = serverlessConfiguration;
