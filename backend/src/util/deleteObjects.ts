import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js"



export const deleteObject = async (fileName: string) => {


    const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${fileName}`,
    };


    const command = new DeleteObjectCommand(params);

    try{

        const data = await s3Client.send(command);

        console.log(data)

    }catch(err){

        console.error(`failed to delete ${fileName}, err`);

        throw new Error("object could not be deleted");
    }



    console.log(`deleted ${fileName} from bucket`)

    return "deleted"
}