const createError = require("http-errors");

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
      message: "로그인에 성공했습니다.",
      access_token: access_token,
      profile: { googleId: savedUser.googleId, name: savedUser.name, picture: savedUser.picture },
    });
  } catch (err) {
    next(createError(500, "로그인에 실패했습니다."));
  }
};

const autoLogin = async (req, res, next) => {
  const access_token = req.cookies.access_token || req.headers["authorization"];

  try {
    const verified = await oauth2Client.getTokenInfo(access_token);

    if (verified) {
      return res.status(200).json({
        message: "자동 로그인이 완료되었습니다.",
      });
    } else {
      return res.status(401).json({ message: "재로그인이 필요합니다." });
    }
  } catch (err) {
    next(createError(500, "인증에 실패했습니다."));
  }
};

module.exports = { login, autoLogin };
