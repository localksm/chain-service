const config = require("./config/config");
const jwt = require("jsonwebtoken");

async function getKeys(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    throw new Error(e);
  }
}

module.exports = getKeys;
