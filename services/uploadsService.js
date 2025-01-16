const fs = require("fs");
const path = require("path");

const clearImage = (imagePath) => {
  imagePath = path.join(__dirname, "..", "public", "uploads", imagePath);
  fs.unlink(imagePath, (err) => console.log(err));
};

module.exports = clearImage;
