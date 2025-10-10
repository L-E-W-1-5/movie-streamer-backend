import { GetObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"


export const getObjects = async (title: string) => {

    try{

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${title}`,
        };

        const command = new GetObjectCommand(params);

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600})

        if(url) return url

    }catch(err){
        
        console.log(err);
    }
}