import { GetObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "./s3-credentials.js"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { Readable } from "stream";


export const getObjects = async (title: string) => {

    try{

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${title}`,
        };

        const command = new GetObjectCommand(params);

        const url = await getSignedUrl(s3Client, command, { expiresIn: 14400})

        if(url) return url

    }catch(err){
        
        console.log(err);
    }
}


export const getObjectUnsigned = async (title: string) => {

    try{

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${title}`,
        };

        const command = new GetObjectCommand(params);

        const response = await s3Client.send(command);

        const stream = response.Body as Readable;

        const chunks = [];

        if(stream){

            for await (const chunk of stream){

                chunks.push(chunk);

            }

        }

        const bodyString = Buffer.concat(chunks).toString('utf-8');

        return bodyString;

    }catch(err){

        console.log(err)

        return null;
    }
}


export const generateSignedPlaylist = async (originalPlaylist: string, path: string) => {

    

    const segments = originalPlaylist.split('\n');

    const signedSegments = await Promise.all(

        segments.map(async (seg) => {

            if(seg && !seg.startsWith('#') && seg.endsWith('.ts')){

                const fullSegment = `${path}/${seg}`;

                //console.log(fullSegment);

                const params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: `${fullSegment}`,
                };

                const command = new GetObjectCommand(params);

                const signedSeg = await getSignedUrl(s3Client, command)

                return signedSeg;

            }else{

                return seg;
            }
        })
    )

    return signedSegments.join('\n');
}