// const {Canvas, createCanvas, Image, ImageData, loadImage} = require('canvas')


// const AWS = require("aws-sdk");
const { SQSClient } = require('@aws-sdk/client-sqs');
const { S3Client } = require('@aws-sdk/client-s3');


const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');
const canvas = require('canvas');
const awsMethods = require('./aws-methods.js');

require("dotenv").config();


async function DownloadImage(url) {
    console.log(`\nBeginning to download image from ${url}...`)
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    try{
        console.log(`The download was successful`)
        return response.data        
    } catch (err){
        console.log(`There was an error in downloadImage(): ${err}`)
    }
}

async function Predict(image,model){      
//   let model;  
  console.log("Commencing Prediction...")
  try{   
    image = tf.node.decodeImage(new Uint8Array(image), 3)      
  } catch (err) {
    console.log(`There was an error in predict() at the point of loading the model: ${err}`)
  }
  if (image){      
    try {      
      let predictions = await model.detect(image)
      console.log(`Returning the predictions:`)
    //   console.log(predictions)
      return {predictions: predictions, tfImage:image}
    } catch (err) {
      console.log(`There was an error in predict() at the point of generating the predictions: ${err}`)
    }
  } 
}  
  
async function GenerateCanvasImage(imageData,width,height,predictions){
    console.log(`Generating canvas and bounding boxes from prediction...`)
    return new Promise((resolve,reject)=>{
        let sourceImage = new canvas.Image();
        sourceImage.onload = function(){
        
        let imgCanvas = canvas.createCanvas(width,height);
        let context = imgCanvas.getContext('2d');
        context.drawImage(sourceImage,0,0,width,height)
        
        predictions.forEach((prediction)=>{
            if (prediction.class==="car"){
                let coordinates = {};
                let color = 'hsl(' + 360 * Math.random() + ', 95%, 50%)'
                coordinates.x = prediction.bbox[0];
                coordinates.y = prediction.bbox[1];
                coordinates.width = prediction.bbox[2];
                coordinates.height = prediction.bbox[3];
                
                context.beginPath();
                context.fillStyle =  color // text colour
                context.rect(coordinates.x,coordinates.y,coordinates.width,coordinates.height)
                context.lineWidth = 5;
                context.strokeStyle= color // Bounding box colour
                context.stroke();
                context.font = `bold 16px trebuchet ms`
                context.fillText(`${prediction.class} - ${prediction.score.toFixed(3)*100}%`,(coordinates.x),(coordinates.y-5));                       
            }            
        })
        resolve(imgCanvas.toBuffer('image/jpeg'))
        }
        sourceImage.src = imageData;
    })
}

async function Run(image,model){    
    
    let prediction = await Predict(image,model)      
    let outputImage = await GenerateCanvasImage(image,prediction.tfImage.shape[1],prediction.tfImage.shape[0],prediction.predictions)
    outputName = "output"
    console.log(`Attempting to write update image with type ${typeof outputImage} to file...`)

    if(outputImage){
        return outputImage
    }
  
}

module.exports ={
    DownloadImage,Predict,GenerateCanvasImage,Run
}
