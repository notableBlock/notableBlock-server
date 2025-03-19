const createError = require("http-errors");

const User = require("../models/User");

const { oauth2Client, getGoogleUser } = require("../services/googleAuth");
const { findUser } = require("../services/findUser");

const login = async (req, res, next) => {
  try {
    const { code } = req.body;

    const { user, access_token, refresh_token } = await getGoogleUser(code);
    const { sub: googleId, name, picture, email } = user;

    const savedUser = await findUser({ googleId, name, picture, email, refresh_token });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({
      message: "로그인에 성공했어요.",
      access_token: access_token,
      profile: { name: savedUser.name, picture: savedUser.picture, id: savedUser._id },
    });
  } catch (err) {
    next(createError(500, "로그인에 실패했어요."));
  }
};

const autoLogin = async (req, res, next) => {
  try {
    const access_token = req.cookies.access_token || req.headers["authorization"];

    const verified = await oauth2Client.getTokenInfo(access_token);

    if (verified) {
      return res.status(200).json({
        message: "자동 로그인이 완료되었어요.",
      });
    }
  } catch (err) {
    console.log("Access Token이 만료되었어요. Refresh Token을 이용해 갱신을 시도할게요.");

    try {
      const { refresh_token, _id: userId } = req.user;
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
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      return res.status(200).json({
        message: "자동 로그인이 완료되었어요.",
        access_token: newAccessToken,
      });
    } catch (err) {
      next(createError(401, "자동 로그인에 실패해 재로그인이 필요해요."));
    }
  }
};

const logout = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    await User.findByIdAndUpdate(userId, { refresh_token: "" });

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "로그아웃에 성공했어요." });
  } catch (err) {
    next(createError(500, "로그아웃에 실패했어요."));
  }
};

module.exports = { login, autoLogin, logout };
