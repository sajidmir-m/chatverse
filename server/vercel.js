const path = require('path');

const app = require(path.join(__dirname, 'dist/app')).default;

module.exports = app;
