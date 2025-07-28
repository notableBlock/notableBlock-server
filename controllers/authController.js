const createError = require("http-errors");

const User = require("../models/User");

const { getGoogleUser } = require("../services/googleAuth");
const { findUser } = require("../services/findUser");

const login = async (req, res, next) => {
  try {
    const { authCode } = req.body;

    const { user, access_token, refresh_token } = await getGoogleUser(authCode);
    const { sub: googleId, name, picture, email } = user;

    const savedUser = await findUser({ googleId, name, picture, email, refresh_token });

    res.cookie("access_token", access_token, {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.cookie("user_id", savedUser._id, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({
      message: "로그인에 성공했어요.",
      profile: { name: savedUser.name, picture: savedUser.picture, userId: savedUser._id },
    });
  } catch (err) {
    next(createError(500, "로그인에 실패했어요."));
  }
};

const logout = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    await User.findByIdAndUpdate(userId, { refresh_token: "" });

    res.clearCookie("access_token", {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "로그아웃에 성공했어요." });
  } catch (err) {
    next(createError(500, "로그아웃에 실패했어요."));
  }
};

module.exports = { login, logout };
