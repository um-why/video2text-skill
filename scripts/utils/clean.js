const constants = require("../config/constants");
const helper = require("../utils/helper");
const utils = require("../utils/utils");
const fs = require("fs");
const path = require("path");

function deleteExpire() {
  const now = Math.floor(Date.now() / 1000);
  const filepath = helper.downloadPath();

  fs.readdir(filepath, (err, files) => {
    if (err) {
      utils.printError("读取临时下载目录失败: " + err);
      return;
    }
    files.forEach((file) => {
      let timestamp = file.split("_")[0];
      timestamp = Number(timestamp);
      if (timestamp < now - constants.EXPIRE_TIME) {
        utils.printInfo(
          "清理技能运行中临时下载的过期文件: " + file + " ，以节省本次磁盘空间",
        );
        fs.unlink(path.join(filepath, file), (err) => {
          if (err) {
            utils.printError("删除过期文件失败: " + err);
          }
        });
      }
    });
  });
}

module.exports = {
  deleteExpire,
};
