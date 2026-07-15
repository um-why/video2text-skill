#!/usr/bin/env node
const clean = require("../utils/clean");
const constants = require("../config/constants");
const helper = require("../utils/helper");
const token = require("../utils/token");
const upload = require("../utils/upload");
const utils = require("../utils/utils");
const validator = require("../utils/validator");
const video = require("../api/video");
const fs = require("fs");
const path = require("path");

async function main() {
  clean.deleteExpire();

  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    utils.printHelp();
    return;
  }

  let filename = args[0];
  if (validator.isUrl(filename)) {
    // 下载网络文件到临时目录
    let filepath = helper.downloadPath();
    try {
      await fs.promises.mkdir(filepath, { recursive: true });
    } catch (error) {
      utils.printError("临时下载目录创建失败: " + error);
      return;
    }

    try {
      const downloadResult = await helper.download(filename, filepath);
      utils.printInfo("网络视频已下载到本地: " + downloadResult?.filePath);
      filename = downloadResult?.filePath;
    } catch (error) {
      utils.printError("下载失败: " + error);
      return;
    }
  } else if (validator.isFilePath(filename)) {
  } else {
    utils.printError("无效的文件路径或URL");
    return;
  }

  if (!fs.existsSync(filename)) {
    utils.printError("文件不存在: " + filename);
    return;
  }

  const tokenValue = token.skillToken(process.env.GUAIKEI_API_TOKEN);
  if (tokenValue === "") return;

  try {
    const presignedUrl = await video.getPresignedUrl(tokenValue, filename);
    if (!presignedUrl || !presignedUrl?.url || presignedUrl.url === "") {
      throw new Error("获取预签名URL失败，请反馈给开发者");
    }

    utils.printInfo("上传文件到OSS...");
    await upload.uploadFileToOss(
      filename,
      presignedUrl.url,
      presignedUrl.headers,
    );
    utils.printInfo("文件上传到OSS成功，创建视频转文案任务");

    const url = presignedUrl.url.substring(0, presignedUrl.url.indexOf("?"));
    console.log(url);
    const task = await video.createTask(tokenValue, url);
    console.log(task);
    utils.printInfo("视频转文案任务创建成功");
  } catch (error) {
    console.log(error);
    return;
  }
}

main().catch((error) => {
  utils.printError(error);
  process.exit(1);
});
