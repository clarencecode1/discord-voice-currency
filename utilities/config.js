require("dotenv").config();

module.exports.config = {
  uri: process.env.uri,
  token: process.env.token,
  prefix: process.env.prefix,
  message_life: process.env.message_life,
};
