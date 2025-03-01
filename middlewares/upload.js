const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, "public/uploads/images");
    } else {
      cb(null, "public/uploads");
    }
  },

  filename: (req, file, cb) => {
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
