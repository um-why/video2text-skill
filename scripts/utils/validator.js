const fs = require("fs");

function isUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function isFilePath(path) {
  try {
    const stats = fs.statSync(path);
    return stats.isFile();
  } catch (_) {
    return false;
  }
}

module.exports = {
  isFilePath,
  isUrl,
};
