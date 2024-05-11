const _ = require('lodash');
const axios = require('axios');
const {GetQueueUrl,CreateS3Bucket,ReceiveMessagesFromQueue, SendMessageToQueue,DeleteMessageFromQueue,DeleteObjectFromS3, PutObjectInS3} = require('./aws-methods');

function createId(node){
    let splitUrl = node.image.split("/")
    let fileName = splitUrl[splitUrl.length-1]    
    let jobName = fileName.split('.').length>1?fileName.substr(0,fileName.lastIndexOf('.')):fileName    
    return jobName
}


function trafficNode(data){
    let node = {
        id:data['properties']['id'],
        geometryType: data['geometry']['type'],
        longitude: data['geometry']['coordinates'][0],
        latitude: data['geometry']['coordinates'][1],
        description:data['properties']['description'],
        suburb:data['properties']['locality'],
        postcode:data['properties']['postcode'],
        image:data['properties']['image_url'],        
    }
    return node
}

 async function getTraffic(resolution,sqsClient,bucketUrl,queueName){
    let trafficKey = process.env.PRIVATE_TRAFFIC_KEY
    let hostName = "https://api.qldtraffic.qld.gov.au"
    let requestURL = `${hostName}/v1/webcams?apikey=${trafficKey}`

    console.log(`Accessing url: ${requestURL}`)
    const result = await axios.get(requestURL);    
    const queueUrl = await GetQueueUrl(queueName,sqsClient)

    if(result.status ===200){        
        let events = result.data.features
        console.log(`Status code: ${result.status} reponse is ${result.statusText} with ${events.length} events fetched`) 
        
        let resolutionLookup = {
            Low:5,
            Medium:30,
            High: events.length
        }
        events = _.sampleSize(events,resolutionLookup[resolution])
        let nodes = events.map((event=>{
            try{

                let node = trafficNode(event)
                node.id = createId(node)
                SendMessageToQueue(node.image,node.id,queueUrl,sqsClient)
                node.image = bucketUrl+node.id+'.jpg'
                return node
            } catch(err){
                console.log(`There was an error mapping over the nodes in getTraffic(): ${err}`)
            }
        }))      
        console.log(`Added ${nodes.length} jobs to processing queue!`)  
     


        // I've now got all the nodes for each nodes a few things have to happen
        // 1. Construct a unique identifier for each node
        // 2. Create a job for the queue that has unique id and url
        // 3. Add job to the queue
        // 4. Send queue id in a get request to scaling backend
        // 5. await response, a url in the s3 bucket
        // 6. add bbox to each object in 
        return nodes

    } else{
        console.log(`Status code: ${result.status} reponse is ${result.statusText}`)
        
    }
}


module.exports={
    getTraffic
}