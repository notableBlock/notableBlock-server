const express = require("express");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/", async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, nickname, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      user.googleId = googleId;
      user.nickname = nickname;
      user.picture = picture;
      await user.save();
    } else {
      user = new User({ googleId, email, nickname, picture });
      await user.save();
    }

    res.status(200).json({ message: "사용자 정보 저장 완료", user });
  } catch (err) {
    console.error("사용자 정보 저장 중 오류 발생:", err);
    res.status(500).json({ err: "서버 오류", message: err.message });
  }
});

module.exports = router;
