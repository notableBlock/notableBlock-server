const dayjs = require("dayjs");

const getCurrentDate = () => {
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
};

module.exports = getCurrentDate;
