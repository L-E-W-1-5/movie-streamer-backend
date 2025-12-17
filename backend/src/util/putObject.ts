import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js";
//import { getsignedUrl } from '@aws-sdk/s3-request-presigner'



export const putObject = async(file:Buffer, fileName:string, mimeType:string, isHLS: string | null = null) => {

    if(isHLS) fileName = `${fileName}_hls/${fileName}`

    try{
        
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${fileName}`,
            Body: file,
            ContentType: mimeType
        }

        
        const command = new PutObjectCommand(params);
        
        const data = await s3Client.send(command)

        //const signUrl = await getSignedUrl

        
        if(data.$metadata.httpStatusCode !== 200){

            return;
        }
    
        let url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`

        console.log("putObject 33", url);

        return {url, key:params.Key};

    }catch(err){

        console.log(err);
    }

}