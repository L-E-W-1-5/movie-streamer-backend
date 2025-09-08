import { GetObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js"


export const getObjects = () => {

    try{

        const params = {
            Bucket: process.env.S3_BUCKET_NAME
        };

        

    }catch(err){
        console.log(err);
    }
}