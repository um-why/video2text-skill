#!/usr/bin/env node
const clean = require("../utils/clean");
const constants = require("../config/constants");
const helper = require("../utils/helper");
const utils = require("../utils/utils");
const validator = require("../utils/validator");
const fs = require("fs");
const path = require("path");

async function main() {
  clean.deleteExpire();
  return;
  const startTime = Date.now();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    utils.printHelp();
    return;
  }

  let filename = args[0];
  if (validator.isUrl(filename)) {
    let filepath = helper.downloadPath();
    try {
      await fs.promises.mkdir(filepath, { recursive: true });
    } catch (error) {
      utils.printError("临时下载目录创建失败: " + error);
      return;
    }
    helper.download(filename, filepath);
  } else if (validator.isFilePath(filename)) {
    filepath = filename;
  } else {
    utils.printError("无效的文件路径或URL");
    return;
  }
  console.log("asdf");
  console.log(filename);
}

main().catch((error) => {
  utils.printError(error);
  process.exit(1);
});
