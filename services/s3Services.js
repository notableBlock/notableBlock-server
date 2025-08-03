const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  waitUntilObjectNotExists,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

const objectId = require("../utils/objectId");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const putS3Object = async (sourceKey, filePath) => {
  try {
    const putPromises = await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: sourceKey,
        Body: fs.createReadStream(filePath),
      })
    );

    return putPromises;
  } catch (err) {
    console.log(err);
    throw new Error("S3 객체 저장에 실패했어요.");
  }
};

const downloadS3Object = async (sourceKey) => {
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: sourceKey,
      })
    );

    const byteArray = await Body.transformToByteArray();
    const s3Buffer = Buffer.from(byteArray);

    return s3Buffer;
  } catch (err) {
    console.log(err);
    throw new Error("S3 객체 저장에 실패했어요.");
  }
};

const copyS3Object = async (sourceKey, fileName) => {
  try {
    const newKey = `${objectId()}-${fileName}`;
    const newImageUrl = `${process.env.ASSETS_URL}/${newKey}`;
    const encodedCopySource = `${process.env.S3_BUCKET}/${encodeURIComponent(sourceKey)}`;
    const copyPromises = await s3.send(
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
  } catch (err) {
    throw new Error("S3 객체 복사에 실패했어요.");
  }
};

const deleteS3Object = async (sourceKey) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: decodeURIComponent(sourceKey),
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
    await waitUntilObjectNotExists({ client: s3 }, params);
  } catch (err) {
    console.log(err);
    throw new Error("S3 객체 삭제에 실패했어요.");
  }
};

const deleteS3Objects = async (sourceKeys) => {
  if (sourceKeys.length === 0) return;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Delete: {
      Objects: sourceKeys.map((key) => ({ Key: key })),
    },
  };

  try {
    await s3.send(new DeleteObjectsCommand(params));

    for (const key of sourceKeys) {
      await waitUntilObjectNotExists(
        {
          client: s3,
        },
        { Bucket: process.env.S3_BUCKET, Key: key }
      );
    }
  } catch (err) {
    console.log(err);
    throw new Error("복수의 S3 객체 삭제에 실패했어요.");
  }
};

module.exports = {
  s3,
  putS3Object,
  downloadS3Object,
  copyS3Object,
  deleteS3Object,
  deleteS3Objects,
};
