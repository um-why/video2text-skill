const constants = require("../config/constants");
const utils = require("../utils/utils");
const https = require("https");
const fs = require("fs");

/**
 * 上传文件到安全空间，技能开发者、服务提供方，承诺上传后的视频，不外泄、不转存、不另作他用、仅用于视频转文案服务，且在视频转文案完成后自动删除
 */
async function uploadFileToOSS(filename, presignedUrl, headers) {
  const url = new URL(presignedUrl);
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filename);

    const options = {
      host: url.hostname,
      path: url.pathname + url.search,
      method: "PUT",
      headers: headers,
    };
    const req = https.request(
      { ...options, timeout: constants.REQUEST_TIMEOUT },
      (res) => {
        // res.setEncoding("binary");
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(body);
          } else {
            reject(new Error(`文件上传失败, 请求状态码: ${res.statusCode}`));
          }
        });
      },
    );

    fileStream.on("error", (error) => {
      utils.printError(`上传读取文件失败: ${error.message}`);
      reject(error);
    });

    req.on("error", (error) => {
      utils.printError(`上传请求失败: ${error.message}`);
      reject(error);
    });

    req.on("timeout", () => {
      utils.printError(`上传请求超时: ${constants.REQUEST_TIMEOUT}ms`);
      req.destroy();
      reject(new Error("上传请求超时"));
    });

    fileStream.pipe(req);
  });
}

module.exports = { uploadFileToOSS };
