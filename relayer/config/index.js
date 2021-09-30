/*
  This top-level configuration library loads all the other config settings.
  Environment variables are used to set different run environments and override
  default values.
*/

const common = require('./env/common');

const env = process.env.RELAY_ENV || 'development';
const config = require(`./env/${env}`);

module.exports = { ...common, ...config };
