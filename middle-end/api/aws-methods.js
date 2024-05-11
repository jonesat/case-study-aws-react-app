
const { SQSClient,CreateQueueCommand,GetQueueUrlCommand,SendMessageCommand,ReceiveMessageCommand,DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { GetObjectCommand,DeleteObjectCommand, PutObjectCommand,S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');


const CreateSQSQueue = async(queueName,client)=>{
    try{
        const command = new CreateQueueCommand({
            QueueName:queueName,
            Attributes:{
                DelaySeconds:"0",
                MessageRetentionPeriod:"120",
                ReceiveMessageWaitTimeSeconds:"2",
                VisibilityTimeout:"20",
            }
        })
        let response = await client.send(command)
        console.log(`Sucessfully created sqs queue called ${queueName} which lives at: ${response.QueueUrl}`)
    } catch(err){
        console.log(`There was an error trying to make an sqs queue called ${queueName}: ${err}`)
    }
}

const GetQueueUrl= async(queueName,client)=>{
    try{
        const command = new GetQueueUrlCommand({QueueName: queueName})
        const response = await client.send(command)
        console.log(`The queue url for ${queueName} is: ${response.QueueUrl}`)
        return response.QueueUrl
    }catch(err){
        console.log(`There was an error in GetQueueUrl(): ${err}`)
    }
}
const SendMessageToQueue = async (body,jobId,queueUrl,client)=>{
    try{
        const command = new SendMessageCommand({
            MessageBody:body,
            QueueUrl:queueUrl,
            MessageAttributes:{
                "jobId":{DataType:"String",StringValue:jobId},
            }
        })
        const result = await client.send(command)
        // console.log(`The message was added to the queue successfully!`)
    } catch(err){
        console.log(`There was an error in sendMessageToQueue(): ${err}`)
    }
}
const DeleteMessageFromQueue = async (ReceiptHandler,queueUrl,client)=>{
    try{
        const data = await client.send(new DeleteMessageCommand({            
            QueueUrl:queueUrl,
            ReceiptHandle:ReceiptHandler
        }))
        console.log(`Successfully deleted message from queue!`)

    }catch(err){
        console.log(err)
    }

}
const ReceiveMessagesFromQueue = async(queueUrl,client)=>{
    try{
        const command = new ReceiveMessageCommand({
            MaxNumberOfMessages:5,
            QueueUrl:queueUrl,
            WaitTimeSeconds:5,
            MessageAttributeNames:["All"],
            VisibilityTimeout:10,

        });
        return await client.send(command)
        
        
        
    }catch(err){
        console.log(`There was an error in ReceiveMessagesFromQueue(): ${err}`)
    }
}
const CreateS3Bucket = async(bucketName,client)=>{
    try{
        const command = new CreateBucketCommand({
            Bucket:bucketName
        })
        const response = await client.send(command)
        console.log(`Bucket created: ${response}`)

    } catch(err){
        console.log(`There was an error in CreateS3Bucket(): ${err}`)
    }
}
const PutObjectInS3 = async(bucketName,key,content,contentType,client)=>{
    try{
        const command = new PutObjectCommand({
            Bucket:bucketName,
            Key:key,
            Body:content,
            ContentType:contentType,
            ACL:"public-read"
        })
        console.log(`The upload of ${key} should be complete...`)  
        return await client.send(command)
    }catch(err){
        console.log(`There was an error in PutObjectInS3 ${err}`)
    }
}
const GetObjectFromS3 = async(bucketName,key,client)=>{
    try{
        const command = new GetObjectCommand({
            Bucket:bucketName,
            Key:key,
        })
        return await client.send(command)
    }catch(err){
        console.log(`There was an error in GetObjectFromS3 ${err}`)
    }
}
const DeleteObjectFromS3 = async(bucketName,key,client)=>{
    try{
        const command = new DeleteObjectCommand({
            Bucket:bucketName,
            Key:key,
        })
        const response = await client.send(command)
        console.log(`${key} was deleted from s3 bucket`)

    } catch(err){
        console.log(`There was an error in DeleteObjectFromS3 ${err} `)
    }

}
module.exports = {
    CreateSQSQueue,
    GetQueueUrl,
    SendMessageToQueue,
    DeleteMessageFromQueue,
    ReceiveMessagesFromQueue,
    CreateS3Bucket,
    PutObjectInS3,
    DeleteObjectFromS3,
    GetObjectFromS3,
}





// Poll for messages for the first time
// Set Interval Function
// Poll for messages
// get message
// delete s3 image for message id    https://aws.s3bucket/${jobId}.jpg
// process using run(url) function from tensorflow commands
// upload output image to s3 bucket
// delete message from queue