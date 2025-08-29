const createError = require("http-errors");

const User = require("../models/User");

const { getGoogleUser } = require("../services/googleAuth");
const findUser = require("../services/userServices");

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

const e2eLogin = async (req, res, next) => {
  if (process.env.E2E_KEY && req.header("e2e-key") !== process.env.E2E_KEY) {
    return next(createError(403, "E2E 키가 올바르지 않아요."));
  }

  const e2eWorkerIndex = Number(req.body.e2eWorkerIndex ?? 0);
  const MOCK_USERS = [
    {
      googleId: "e2e-google-id-0",
      name: "E2E Tester 0",
      picture: "picture",
      email: "e2e0@test.com",
      refresh_token: process.env.E2E_REFRESH_TOKEN,
    },
    {
      googleId: "e2e-google-id-1",
      name: "E2E Tester 1",
      picture: "picture",
      email: "e2e1@test.com",
      refresh_token: process.env.E2E_REFRESH_TOKEN,
    },
  ];
  const mockUser = MOCK_USERS[e2eWorkerIndex];

  try {
    const savedUser = await findUser(mockUser);

    res.cookie("access_token", process.env.E2E_ACCESS_TOKEN, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.cookie("user_id", savedUser._id, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(200).json({
      message: "E2E 로그인에 성공했어요.",
      profile: { name: savedUser.name, picture: savedUser.picture, userId: savedUser._id },
    });
  } catch (err) {
    console.log(err);
    next(createError(500, "E2E 로그인에 실패했어요."));
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

module.exports = { login, e2eLogin, logout };
