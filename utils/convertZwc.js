const { EMPTY_BYTES32 } = require("./constants");

const zeroPad = (num) => "00000000".slice(String(num).length) + num;

const idToBinary = (id) =>
  id
    .split("")
    .map((char) => zeroPad(char.charCodeAt(0).toString(2)))
    .join(" ");

const binaryToZwc = (binary) =>
  binary
    .split("")
    .map((binaryNum) => {
      const num = parseInt(binaryNum, 10);
      if (num === 1) {
        return "​";
      } else if (num === 0) {
        return "‌";
      }
      return "‍";
    })
    .join("");

const convertToZwcId = (dataBaseId) => {
  const binary = idToBinary(dataBaseId);
  const zwcId = binaryToZwc(binary);

  return zwcId;
};

const zwcToBinary = (data) => {
  try {
    return data
      .split("")
      .map((char) => {
        if (char === "​") {
          return "1";
        } else if (char === "‌") {
          return "0";
        }
        return " ";
      })
      .join("");
  } catch {
    return null;
  }
};

const binaryToId = (binary) => {
  try {
    return binary
      .split(" ")
      .map((num) => String.fromCharCode(parseInt(num, 2)))
      .join("");
  } catch {
    return null;
  }
};

const convertToBytesId = (encodedId) => {
  const binary = zwcToBinary(encodedId);
  const bytesId = binaryToId(binary);

  return bytesId?.slice(0, 66) || EMPTY_BYTES32;
};

module.exports = { convertToZwcId, convertToBytesId };
