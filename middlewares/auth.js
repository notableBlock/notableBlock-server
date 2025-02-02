const axios = require("axios");
const createError = require("http-errors");

const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  const { access_token } = req.cookies;

  if (!access_token) {
    next(createError(401, "인증 토큰이 없습니다."));
  }

  try {
    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { sub } = userResponse.data;
    const user = await User.findOne({ googleId: sub });

    if (!user) {
      next(createError(404, "사용자를 찾을 수 없습니다."));
    }
    req.user = user;
    next();
  } catch (err) {
    next(createError(500, "사용자 인증에 실패했습니다."));
  }
};

module.exports = isAuthenticated;
