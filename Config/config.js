require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is missing please add it.');
}

module.exports = config;
