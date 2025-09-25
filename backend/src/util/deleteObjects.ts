import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js"



export const deleteObject = async (fileName: string) => {


    const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${fileName}`,
    };


    const command = new DeleteObjectCommand(params);

    const data = await s3Client.send(command);

    console.log(data)

    // if(!data){

    //     throw new Error("object couldnt be deleted");
    // }

    console.log(`deleted ${fileName} from bucket`)

    return "deleted"
}