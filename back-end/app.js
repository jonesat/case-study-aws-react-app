// const express = require('express');
// const responseTime = require('response-time')
// const axios = require('axios');
// const redis = require('redis');
require("dotenv").config();



const { SQSClient } = require('@aws-sdk/client-sqs');
const { S3Client } = require('@aws-sdk/client-s3');
const {GetQueueUrl,CreateS3Bucket,ReceiveMessagesFromQueue, SendMessageToQueue,DeleteMessageFromQueue,DeleteObjectFromS3, PutObjectInS3} = require('./api/aws-methods');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const {Run,DownloadImage} = require('./api/tf-methods.js');

async function PollingQueue(queueUrl,bucketName,sqsClient,s3Client,model){
  // Set Interval wrap this stuff:
  let result = await ReceiveMessagesFromQueue(queueUrl,sqsClient)

  if(result.Messages !== undefined){
    console.log(`${result.Messages.length} messages were retrieved`)
    result.Messages.forEach(async (element) => {
      let jobName = element.MessageAttributes.jobId.StringValue+'.jpg'
      let jobUrl = element.Body    
      await DeleteObjectFromS3(bucketName,jobName,s3Client) 
      let image = await DownloadImage(jobUrl);    
      await PutObjectInS3(bucketName,jobName,image,'image/jpeg',s3Client)      
      let outputImage = await Run(image,model);
      await PutObjectInS3(bucketName,jobName,outputImage,'image/jpeg',s3Client)      
      await DeleteMessageFromQueue(element.ReceiptHandle,queueUrl,sqsClient)
    });      
  }
}

(async ()=>{  
  const bucketName = "s3-cloud-project";
  const queueName = "sqs-cloud-project"
  
  const configObject = { 
    region: "ap-southeast-2" , 
    // credentials:{
    //   accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    //   sessionToken: process.env.AWS_SESSION_TOKEN,      
    // }
  }
  
  try{
    const sqsClient = new SQSClient({region:configObject.region});
    const s3Client = new S3Client({region:configObject.region});    
    const queueUrl = await GetQueueUrl(queueName,sqsClient)
    let model = await cocoSsd.load() 

    // let body = 'https://t3.ftcdn.net/jpg/06/15/48/68/360_F_615486892_aozUyTfkyojEl6WJ2Gq8GtTvLLOTmHRV.jpg'
    // // let body = 'https://cdn.shopify.com/s/files/1/0997/4496/articles/3-Cats_52fcafa8-42ad-41c0-aec3-915a7e80422f.jpg?v=1588962860'
    // SendMessageToQueue(body,'12345cats',queueUrl,sqsClient)

    setInterval(async ()=>{
      console.log(`Commencing next run..`)
      await PollingQueue(queueUrl,bucketName,sqsClient,s3Client,model)
    },5000);   

  } catch(err){
      console.log(`Error in main function: ${err}`)
  }
  
})();




