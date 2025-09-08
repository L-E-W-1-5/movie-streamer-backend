import { S3Client } from "@aws-sdk/client-s3";


if (!process.env.REGION || !process.env.ACCESS_KEY || !process.env.SECRET_KEY) {
  throw new Error('Missing AWS configuration in environment variables');
}

export const s3Client = new S3Client({
    region: process.env.REGION as string,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY as string,
        secretAccessKey: process.env.SECRET_KEY as string
    }
})