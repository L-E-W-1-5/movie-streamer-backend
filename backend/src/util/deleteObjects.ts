import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js"



export const deleteObject = async (fileName: string) => {

    const folderName = fileName.substring(0, fileName.indexOf('/'));

    console.log(folderName, fileName)

  

    try{

        const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileName,
                Prefix: folderName
        };

        const segmentList = await s3Client.send(new ListObjectsV2Command(params))

    
        if(!segmentList.Contents){
        
            throw new Error("no objects to delete")
        }
    
        const deleteList = segmentList.Contents.map(s => ({ Key: s.Key }))
    
        console.log(deleteList)

        const deleteParams = {

            Bucket: process.env.S3_BUCKET_NAME,
            Delete: {

                Objects: deleteList
            }
        };

        const isDeleted = await s3Client.send(new DeleteObjectsCommand(deleteParams))

        console.log(isDeleted);

    }catch(err){

        console.log(err)

        throw new Error("failed to delete folder")
    }

    return "deleted"

    /*
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
    */
}


import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

async function deleteFolder(folderPrefix: string) {
  try {
    const listParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: folderPrefix,
    };

    const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log('No objects found to delete.');
      return;
    }

    const objectsToDelete = listedObjects.Contents.map(obj => ({ Key: obj.Key }));

    // Perform deletion
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Delete: {
        Objects: objectsToDelete,
      },
    };

    const deleteResult = await s3Client.send(new DeleteObjectsCommand(deleteParams));
    console.log(`Deleted objects:`, deleteResult);
  } catch (err) {
    console.error('Error deleting folder:', err);
  }
}