const User = require("../models/User");

const findUser = async ({ googleId, name, picture, email, refresh_token }) => {
  let user = await User.findOne({ email });

  if (user) {
    user.googleId = googleId;
    user.name = name;
    user.picture = picture;
    user.refresh_token = refresh_token;
    await user.save();
  } else {
    user = new User({ googleId, name, picture, email, refresh_token });
    await user.save();
  }

  return user;
};

module.exports = { findUser };
