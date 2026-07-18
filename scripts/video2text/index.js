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

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const result = {
    filename: "",
    id: "",
    prompt: "",
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--file" || arg === "-F") {
      result.filename = args[i + 1] || "";
      i++;
    } else if (arg === "--id" || arg === "-I") {
      result.id = args[i + 1] || "";
      i++;
    } else if (arg === "--prompt" || arg === "-P") {
      result.prompt = args[i + 1] || "";
      i++;
    } else if (arg === "--help" || arg === "-H") {
      result.help = true;
      i++;
    }
  }

  if (!result.filename) {
    if (args.length === 1) {
      result.filename = args[0];
    } else {
      utils.printError("请指定视频的文件路径或URL");
    }
  }
  return result;
}

async function main() {
  const startTime = Date.now();

  clean.deleteExpire();

  const args = process.argv.slice(2);
  if (args.length === 0) {
    utils.printHelp();
    return;
  }

  const parsedArgs = parseArgs(args);
  let { filename, id, prompt, help } = parsedArgs;
  if (help) {
    utils.printHelp();
    return;
  }

  const tokenValue = token.skillToken(process.env.GUAIKEI_API_TOKEN);
  if (tokenValue === "") return;

  if (id === "") {
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

    // 上传文件到安全空间，技能提供者，承诺视频安全不外泄，用后自动删除
    try {
      const presignedUrl = await video.getPresignedUrl(tokenValue, filename);
      if (!presignedUrl || !presignedUrl?.url || presignedUrl.url === "") {
        throw new Error("获取预签名URL失败，请反馈给开发者");
      }

      utils.printInfo("上传文件到安全空间...");
      await upload.uploadFileToOSS(
        filename,
        presignedUrl.url,
        presignedUrl.headers,
      );
      utils.printInfo("文件上传到安全空间成功，获取视频任务ID");

      const url = presignedUrl.url.substring(0, presignedUrl.url.indexOf("?"));
      console.log(url);
      const task = await video.getVideoId(tokenValue, url);
      console.log(task);
      if (!task || !task?.id || task.id === "") {
        throw new Error("获取视频任务ID失败，请反馈给开发者");
      }
      utils.printInfo(
        "视频任务ID获取成功: " +
          task.id +
          "，该视频任务ID可在一小时内重复使用，以基于不同提示词的视频分析",
      );
      id = task.id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  const text = await video.getVideoText(tokenValue, id, prompt);
  if (!text || !text?.text || text.text === "") {
    throw new Error("获取视频文案失败，请反馈给开发者");
  }
  utils.printInfo("视频文案获取成功，文案内容如下：");
  utils.printInfo(text.text);
}

main().catch((error) => {
  utils.printError(error);
  process.exit(1);
});
