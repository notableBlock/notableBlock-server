const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const fs = require("fs");
const os = require("os");
const createError = require("http-errors");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDirectory = path.join(process.env.TEMP_DIR || os.tmpdir(), "notableBlock-temp");
    fs.mkdirSync(tempDirectory, { recursive: true });

    cb(null, tempDirectory);
    req.tempDirectory = tempDirectory;
  },

  filename: async (req, file, cb) => {
    const decodedName = Buffer.from(file.originalname, "latin1").toString("utf-8");

    cb(null, decodedName);
  },
});

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET,
  key: (req, file, cb) => {
    const decodedName = Buffer.from(file.originalname, "latin1").toString("utf-8");

    cb(null, `${Date.now().toString()}-${decodedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.originalname.endsWith(".md") && file.mimetype === "application/octet-stream") {
    file.mimetype = "text/markdown";
    req.isMdFileExist = true;

    return cb(null, true);
  }

  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "text/markdown" ||
    file.mimetype === "application/x-tar"
  ) {
    return cb(null, true);
  }

  return cb(null, false);
};

const chooseStorage = (req) => (req.query.s3 === "true" ? s3Storage : diskStorage);

const dynamicUpload = (fieldName, type) => {
  return (req, res, next) => {
    const storage = process.env.NODE_ENV === "production" ? chooseStorage(req) : diskStorage;

    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter,
    });

    const uploadSelector = {
      single: upload.single(fieldName),
      array: upload.array(fieldName),
    }[type];

    uploadSelector(req, res, (err) => {
      if (err) {
        console.log(err);
        return next(createError(400), "파일 업로드 도중 오류가 발생했어요.");
      }

      next();
    });
  };
};

module.exports = dynamicUpload;
