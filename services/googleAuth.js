const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET_PASSWORD,
  "postmessage"
);

const getGoogleUser = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const { access_token, refresh_token } = tokens;

  const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return { user: userResponse.data, access_token, refresh_token };
};

module.exports = { oauth2Client, getGoogleUser };
