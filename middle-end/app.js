const traffic_methods = require('./api/traffic-methods.js')
const express = require('express')
const responseTime = require('response-time')

const axios = require('axios');
let cors = require('cors');
require("dotenv").config();
const app = express();


const port = 3000;
app.use(responseTime());
app.use(cors());


const { SQSClient } = require('@aws-sdk/client-sqs');
const { S3Client } = require('@aws-sdk/client-s3');
const {CreateSQSQueue,GetQueueUrl,CreateS3Bucket,ReceiveMessagesFromQueue, SendMessageToQueue,DeleteMessageFromQueue,DeleteObjectFromS3, PutObjectInS3} = require('./api/aws-methods');


const bucketName = "n6912125-s3-cloud-project";
const queueName = "n6912125-sqs-cloud-project";

const configObject = { 
    region: "ap-southeast-2" , 
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,      
    }
}
// const sqsClient = new SQSClient({region:configObject.region});
// const s3Client = new S3Client({region:configObject.region});

const sqsClient = new SQSClient(configObject);
const s3Client = new S3Client(configObject);

let bucketUrl = `https://${bucketName}.s3.${configObject.region}.amazonaws.com/`;

(async()=>{
    try{        
        await CreateS3Bucket(bucketName,s3Client)  
        await CreateSQSQueue(queueName,sqsClient)     
    } catch(err){
        console.log(`There was an error on startup of server: ${err}`)
    }        
})();





app.use(express.static('build'))
app.get("/api/traffic/:resolution",async function(request,response) {    
    try {
        let resolution = request.params.resolution
        console.log(`Received a request at url 'traffic/${resolution}`)
        let nodes = await traffic_methods.getTraffic(resolution,sqsClient,bucketUrl,queueName)
        
        response.header("Access-Control-Allow-Origin", "*")
        response.setHeader('Content-Type', 'application/json')
        response.send(JSON.stringify(nodes))
    } catch (err){
        console.log(`There is an error in app.get(traffic:resolution): ${err}`)
    }
});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    
    // render the error page
    res.status(err.status || 500);
    res.send("error");
});

app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});

  