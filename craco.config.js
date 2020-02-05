const path = require('path');

module.exports = {
  webpack: {
    configure: {
      target: 'electron-renderer',
      path: path.resolve(__dirname, "dist"),
    }
  }
};
