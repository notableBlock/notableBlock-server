const { S3Client, CopyObjectCommand } = require("@aws-sdk/client-s3");

const objectId = require("../utils/objectId");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const copyS3Object = (sourceKey, fileName) => {
  const newKey = `${objectId()}-${fileName}`;
  const newImageUrl = `${process.env.ASSETS_URL}/${newKey}`;
  const encodedCopySource = `${process.env.S3_BUCKET}/${encodeURIComponent(sourceKey)}`;

  const copyPromises = s3.send(
    new CopyObjectCommand({
      CopySource: encodedCopySource,
      Bucket: process.env.S3_BUCKET,
      Key: newKey,
    })
  );

  return {
    copyPromises,
    newImageUrl,
  };
};

module.exports = { s3, copyS3Object };
