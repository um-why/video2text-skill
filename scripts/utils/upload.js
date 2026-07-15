const constants = require("../config/constants");
const utils = require("../utils/utils");
const https = require("https");
const fs = require("fs");

async function uploadFileToOss(filename, presignedUrl, headers) {
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
        res.setEncoding("binary");
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

    fileStream.pipe(req).on("error", (error) => {
      utils.printError(`上传读取文件失败: ${error.message}`);
      reject(error);
    });

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
      reject(new Error("上传请求超时"));
    });

    fileStream.pipe(req);
  });
}

module.exports = { uploadFileToOss };
