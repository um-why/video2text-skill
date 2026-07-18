const constants = require("../config/constants");
const utils = require("../utils/utils");
const https = require("https");
const querystring = require("querystring");

async function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { ...options, timeout: constants.REQUEST_TIMEOUT },
      (res) => {
        res.setEncoding("utf-8");
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const jsonBody = JSON.parse(body);
              if (jsonBody.errcode === 0) {
                resolve(jsonBody);
              } else {
                reject(new Error(jsonBody.errmsg || "请求出现未知错误"));
              }
            } catch (error) {
              reject(new Error(`解析响应失败: ${error.message}`));
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            reject(
              new Error(
                "GUAIKEI_API_TOKEN 无效, 请检查环境变量 或 联系微信: 13395823479 获取解决方案",
              ),
            );
          } else {
            reject(new Error(`请求失败 状态码: ${res.statusCode}`));
          }
        });
      },
    );

    req.on("error", (error) => {
      if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
        reject(new Error("请求超时或连接被重置"));
      } else {
        reject(new Error(`网络错误: ${error.message}`));
      }
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`请求超时, ${constants.REQUEST_TIMEOUT}ms`));
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function postJson(path, params, data) {
  if (!path || typeof path !== "string") {
    throw new Error("路径 必须是非空字符串");
  }
  if (!params || typeof params !== "object") {
    throw new Error("参数 必须是对象");
  }
  if (!data || typeof data !== "object") {
    throw new Error("数据 必须是对象");
  }

  const fullPath = `${path}?${querystring.stringify(params)}`;
  const jsonData = JSON.stringify(data);

  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(jsonData),
    },
  };

  return await request(options, jsonData);
}

async function getJson(path, params) {
  if (!path || typeof path !== "string") {
    throw new Error("路径 必须是非空字符串");
  }
  if (!params || typeof params !== "object") {
    throw new Error("参数 必须是对象");
  }

  const fullPath = `${path}?${querystring.stringify(params)}`;
  const options = {
    host: constants.BASE_URL,
    path: fullPath,
    method: "GET",
  };
  return await request(options);
}

function isRetryableError(error) {
  if (error && error.message) {
    return !error.message.includes("GUAIKEI_API_TOKEN 无效");
  }
  return true;
}

async function withRetry(fn, maxAttempts, errorHandler) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error)) {
        throw error;
      }
      if (errorHandler) errorHandler(attempt, error);
      if (attempt < maxAttempts - 1) {
        const delay = Math.pow(2, attempt) * constants.RETRY_INTERVAL;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error(`重试 ${maxAttempts} 次后失败`);
}

/**
 * 支持重试的API请求方法
 */
async function requestApi(method, path, params, data, maxAttempts, actionName) {
  return await withRetry(
    async () => {
      let response;
      if (method === "POST") {
        response = await postJson(path, params, data);
      } else {
        response = await getJson(path, params);
      }
      return response;
    },
    maxAttempts,
    (attempt, error) => {
      utils.printError(
        `【${actionName}重试】${attempt + 1}/${maxAttempts} 次 - ${error.message}`,
      );
    },
  );
}
module.exports = { requestApi };
