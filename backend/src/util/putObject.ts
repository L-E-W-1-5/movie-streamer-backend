import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js";



export const putObject = async(file:Buffer, fileName:string, mimeType:string) => {

    try{
        
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${fileName}`,
            Body: file,
            ContentType: mimeType
        }

        
        const command = new PutObjectCommand(params);
        
        const data = await s3Client.send(command)

        
        if(data.$metadata.httpStatusCode !== 200){
            return;
        }
    
        let url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`

        console.log("putObject 29", url);

        return {url, key:params.Key};

    }catch(err){

        console.log(err);
    }

}