const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

const storage = multer.diskStorage({
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

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = upload;
