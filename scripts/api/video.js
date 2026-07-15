const constants = require("../config/constants");
const { requestApi } = require("../utils/request");

async function getPresignedUrl(token, filename) {
  const params = {
    _: Date.now(),
    token,
  };
  const data = {
    file: filename,
  };

  const response = await requestApi(
    "POST",
    "/api/video/upload",
    params,
    data,
    constants.CREATE_MAX_ATTEMPTS,
    "预上传",
  );
  if (response.data) {
    return response.data;
  } else {
    return [];
  }
}

async function createTask(token, url) {
  const params = {
    _: Date.now(),
    token,
  };
  const data = { url };

  const response = await requestApi(
    "POST",
    "/api/video/url",
    params,
    data,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
  if (response.data) {
    return response.data;
  } else {
    return [];
  }
}

module.exports = {
  getPresignedUrl,
  createTask,
};
