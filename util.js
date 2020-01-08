const URL = require("url").URL;

module.exports = {
  baseUrl: urlString => {
    const url = new URL(urlString);
    const pathDirs = url.pathname.split('/');
    return `${url.origin}${pathDirs.slice(0, pathDirs.length - 1).join('/')}`;
  }
};
