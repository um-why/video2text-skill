function printBanner() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║                                            ║");
  console.log("║       📕 视频转文本工具           ║");
  console.log("║                                            ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log("");
}

function printHelp() {
  console.log(`用法: node scripts/video2text/index.js <URL or PATH>
`);
}

function printLog(level, message) {
  const colorMap = {
    INFO: "\x1b[34m",
    SUCCESS: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
  };
  console.log(
    `${colorMap[level] || ""}[${new Date().toLocaleString()}] [${level}] ${message}\x1b[0m`,
  );
}

module.exports = {
  printBanner,
  printHelp,
  printInfo: (msg) => printLog("INFO", msg),
  printSuccess: (msg) => printLog("SUCCESS", msg),
  printError: (msg) => printLog("ERROR", msg),
  printWarn: (msg) => printLog("WARN", msg),
};
