const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const getCurrentDate = () => {
  return dayjs().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
};

module.exports = getCurrentDate;
