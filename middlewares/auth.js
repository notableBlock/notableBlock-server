const axios = require("axios");
const createError = require("http-errors");

const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  const { access_token } = req.cookies;

  if (!access_token) {
    return next(createError(401, "인증 토큰이 없어요."));
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
      return next(createError(404, "사용자를 찾을 수 없어요."));
    }

    req.user = user;
    next();
  } catch (err) {
    next(createError(500, "사용자 인증에 실패했어요."));
  }
};

module.exports = isAuthenticated;
