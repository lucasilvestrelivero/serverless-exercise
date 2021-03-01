import 'source-map-support/register';

import { middyfy } from '@libs/lambda';
import { SNSEvent, SNSHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import mime from 'mime';

const Jimp = require('jimp/es');
const s3 = new AWS.S3()
const thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET

const resizeImage: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
      const s3EventStr = snsRecord.Sns.Message
      console.log('Processing S3 event', s3EventStr)

      const s3Event = JSON.parse(s3EventStr)


      for (const record of s3Event.Records) {
          console.log('Processing S3EventRecord ', record)
          const resizedImage = await getAndResizeImage(record)
          const thumbNailImage = resizedImage ? await putThumbNailInBucket(record.s3.object.key, resizedImage) : undefined

          thumbNailImage ? console.log('Image upload successful', thumbNailImage) : console.log('Error occured in resizeImage Function')
      }
  }
}

async function getAndResizeImage(record) {

  const objectId = record.s3.object.key
  const bucketName = record.s3.bucket.name

  console.log('Processing Image ', objectId, 'in bucket', bucketName)

  try {

      const response = await s3.getObject({
          Bucket: bucketName,
          Key: objectId
      }).promise()

      console.log(`Got This from Bucket (${bucketName}):`, response)
      // Read an image with the Jimp library
      const image = await Jimp.read(response.Body)

      // Resize an image maintaining the ratio between the image's width and height
      image.resize(150, Jimp.AUTO)

      // Convert an image to a buffer that we can write to a different bucket
      const convertedBuffer = await image.getBufferAsync(Jimp.AUTO)
      console.log('Resizing done', convertedBuffer)

      return convertedBuffer
  }
  catch (e) {
      console.log('Error occured', e)
      return undefined
  }

}

async function putThumbNailInBucket(objectId, imageFile) {

  if (!imageFile) {
      console.log('Error: Image is undefined')
      return undefined
  }

  const thumbNailImage = await s3.putObject({
      Bucket: thumbnailBucketName,
      Key: 'thumbNail_'+objectId,
      Body: imageFile,
      ContentType: mime.getType(objectId)
  }).promise()

  console.log('ThubNailImage uploaded', thumbNailImage)

  return thumbNailImage
}

export const main = middyfy(resizeImage);