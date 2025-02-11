// pages/api/gen-s3-url.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "ap-south-1",
  endpoint: "https://storage.googleapis.com",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET,
  },
  forcePathStyle: true, // Required for using GCS with S3 client
});

export default async function handler(req, res) {
  console.log('Generate URL API called with method:', req.method);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    console.log('Invalid method attempted:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { alle_ingestion_id, alle_media_key } = req.body;
  console.log('Extracted parameters:', { alle_ingestion_id, alle_media_key });

  if (!alle_ingestion_id || !alle_media_key) {
    console.log('Missing required fields');
    return res.status(400).json({
      error: 'Missing required fields',
      received: { alle_ingestion_id, alle_media_key },
    });
  }

  try {
    const objectKey = `${alle_ingestion_id}/${alle_media_key}`;
    console.log('Generating presigned URL for object:', objectKey);

    const command = new GetObjectCommand({
      Bucket: "alle-search-sandbox-gcs",
      Key: objectKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 86400, // 7 days in seconds
    });

    console.log('Generated presigned URL successfully');
    return res.status(200).json({
      url: presignedUrl
    });
  } catch (error) {
    console.error('Error generating URL:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to generate URL',
      details: error.message,
    });
  }
}