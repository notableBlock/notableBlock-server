const axios = require("axios");
const createError = require("http-errors");

const User = require("../models/User");

const { oauth2Client } = require("../services/googleAuth");

const isAuthenticated = async (req, res, next) => {
  const { access_token } = req.cookies;

  if (process.env.NODE_ENV === "test" && access_token === "e2e-access-token") {
    try {
      const userId = req.cookies.user_id;
      if (!userId) return next(createError(401, "E2E user_id 쿠키가 없어요."));

      const user = await User.findById(userId);
      if (!user) return next(createError(404, "E2E 유저를 찾을 수 없어요."));

      req.user = user;
      return next();
    } catch (err) {
      console.log(err);
      return next(createError(500, "E2E 인증 처리 중 오류가 발생했어요."));
    }
  }

  try {
    await oauth2Client.getTokenInfo(access_token);
  } catch {
    const isRefreshed = await autoLogin(req, res, next);
    if (isRefreshed) return next();

    return next(createError(401, "자동 로그인에 실패해 재로그인이 필요해요."));
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

const autoLogin = async (req, res, next) => {
  try {
    const userId = req.cookies.user_id;
    const user = await User.findById(userId);
    const refresh_token = user.refresh_token;

    if (!refresh_token) {
      return next(createError(401, "Refresh Token이 없어 재로그인이 필요해요."));
    }

    oauth2Client.setCredentials({ refresh_token: refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();

    oauth2Client.setCredentials(credentials);
    const newAccessToken = credentials.access_token;
    const newRefreshToken = credentials.refresh_token || refresh_token;

    if (credentials.refresh_token) {
      await User.findByIdAndUpdate(userId, { refresh_token: newRefreshToken });
    }

    res.cookie("access_token", newAccessToken, {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.cookie("user_id", user._id, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    req.user = user;

    return true;
  } catch {
    return false;
  }
};

module.exports = isAuthenticated;
