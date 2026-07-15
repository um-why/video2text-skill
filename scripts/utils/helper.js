const { Downloader } = require("../utils/download.js");
const path = require("path");

function downloadPath() {
  return path.join(path.dirname(__filename), "..", "..", "tmp");
}

function inlineLog(msg) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(msg);
}

function byteHumanize(byte) {
  if (byte === 0) {
    return "0 b";
  }
  const units = ["b", "kB", "MB", "GB", "TB"];
  const number = Math.floor(Math.log(byte) / Math.log(1024));
  return (
    (byte / Math.pow(1024, Math.floor(number))).toFixed(1) + " " + units[number]
  );
}

function download(url, path) {
  const options = {
    retry: { maxRetries: 3, delay: 3000 },
    override: { skip: true, skipSmaller: true },
    fileName: (filename) => {
      filename = Math.floor(Date.now() / 1000) + "_" + filename;
      return filename;
    },
  };
  let progressLog = "";
  const dl = new Downloader(url, path, options);

  dl.on("end", () => {
    inlineLog(progressLog + " - 下载完成");
  })
    .on("skip", (skipInfo) => {
      inlineLog(`文件${skipInfo.fileName}已存在, 跳过`);
    })
    .on("retry", (attempt, opts) => {
      let count = Math.floor(opts.delay / 1000);
      const retryLog = () => {
        inlineLog(`重试${attempt}/${opts.maxAttempts}次，等待${count}秒`);
        if (count > 0) {
          setTimeout(() => retryLog(), 1000);
        }
        count--;
      };
      retryLog();
    })
    .on("resume", (isResumed) => {
      if (!isResumed) {
        inlineLog("该链接不支持断点续传，文件将从头重新开始加载。");
      }
    })
    .on("progress", (stats) => {
      const progress = stats.progress.toFixed(1);
      const speed = byteHumanize(stats.speed);
      const downloaded = byteHumanize(stats.downloaded);
      const total = byteHumanize(stats.total);
      progressLog = `${stats.name}: ${speed}/s - ${progress}% [${downloaded}/${total}]`;
      inlineLog(progressLog);
    })
    .on("error", (error) => {
      inlineLog("下载失败:" + error.message);
    });

  dl.start().catch((err) => {
    inlineLog("下载失败:" + err.message);
  });
}

module.exports = {
  downloadPath,
  download,
};
