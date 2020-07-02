const {defaults} = require('jest-config');
module.exports = {
  // ...
  "moduleNameMapper": {
    "/opt/nodejs/utils": "<rootDir>lambda/opt/nodejs/utils.js"
  }
  // ...
};