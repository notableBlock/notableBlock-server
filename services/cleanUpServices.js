const fs = require("fs");
const path = require("path");

const clearImage = (imageName) => {
  const imagePath = path.join(__dirname, "..", "public", "uploads", "images", imageName);

  fs.unlink(imagePath, (err) => console.log(err));
};

module.exports = clearImage;
