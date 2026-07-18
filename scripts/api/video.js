const constants = require("../config/constants");
const { requestApi } = require("../utils/request");

async function getPresignedUrl(token, filename) {
  const params = {
    _: Date.now(),
    token,
  };
  const data = { file: filename };

  const response = await requestApi(
    "POST",
    "/api/video/presign",
    params,
    data,
    constants.CREATE_MAX_ATTEMPTS,
    "预上传",
  );
  if (response.data) {
    return response.data;
  } else {
    return null;
  }
}

async function getVideoId(token, url) {
  const params = {
    _: Date.now(),
    token,
  };
  const data = { url };

  const response = await requestApi(
    "POST",
    "/api/video/id",
    params,
    data,
    constants.CREATE_MAX_ATTEMPTS,
    "视频ID",
  );
  if (response.data) {
    return response.data;
  } else {
    return null;
  }
}

async function getVideoText(token, id, prompt = "") {
  const params = {
    _: Date.now(),
    token,
  };
  const data = { id, prompt };

  const response = await requestApi(
    "POST",
    "/api/video/text",
    params,
    data,
    constants.QUERY_MAX_ATTEMPTS,
    "视频文案",
  );
  if (response.data) {
    return response.data;
  } else {
    return null;
  }
}

module.exports = {
  getPresignedUrl,
  getVideoId,
  getVideoText,
};