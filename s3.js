import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Readable } from "stream"
import dotenv from 'dotenv'

dotenv.config()

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
// const accessKey = process.env.ACCESS_KEY
// const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3Client = new S3Client({
    region: bucketRegion,
});

// Get object url from bucket
export async function getObjectSignedUrl(key) {
    const params = {
        Bucket: bucketName,
        Key: key
    }

    const command = new GetObjectCommand(params)
    const url = await getSignedUrl(s3Client, command)
    return url
}
