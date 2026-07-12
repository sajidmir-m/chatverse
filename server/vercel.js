const path = require('path');
const express = require('express');

let app;

try {
  app = require(path.join(__dirname, 'dist/app')).default;
} catch (loadError) {
  console.error('[vercel] Failed to load app:', loadError);
  app = express();
  app.all('*', (_req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server failed to load',
      error: loadError.message,
    });
  });
}

module.exports = app;
