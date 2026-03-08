const { BASE_URL } = require("../config");

// 获取存储的 access token
function getAccessToken() {
  return wx.getStorageSync("accessToken");
}

// 检查 token 是否过期（可选：提前 5 分钟认为过期）
function isTokenExpired() {
  const expiresAt = wx.getStorageSync("tokenExpiresAt");
  if (!expiresAt) return false;
  // 提前 5 分钟认为需要刷新
  return Date.now() > (expiresAt - 5 * 60 * 1000);
}

// 微信登录（内部使用）
function wechatLoginInternal(code) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/auth/wechat/login`,
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: { code },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res.data || { code: "LOGIN_FAILED", message: "登录失败" });
        }
      },
      fail: reject,
    });
  });
}

// 重新登录获取新 token
async function refreshToken() {
  const res = await new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject
    });
  });

  const loginResult = await wechatLoginInternal(res.code);

  if (loginResult && loginResult.accessToken) {
    wx.setStorageSync("accessToken", loginResult.accessToken);
    wx.setStorageSync("userId", loginResult.userId);
    // 存储过期时间
    if (loginResult.expiresIn) {
      const expiresAt = Date.now() + loginResult.expiresIn * 1000;
      wx.setStorageSync("tokenExpiresAt", expiresAt);
    }
    return loginResult;
  }
  throw new Error("Token refresh failed");
}

// 带 401 重试的请求封装
function request({ url, method = "GET", data, header = {}, auth = true }) {
  return new Promise((resolve, reject) => {
    const headers = { "Content-Type": "application/json", ...header };

    // 如果需要认证，添加 Authorization header
    if (auth) {
      const token = getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: headers,
      success: (res) => {
        // 401: 尝试重新登录并重试一次
        if (res.statusCode === 401) {
          refreshToken()
            .then(() => {
              // 重试请求
              const newToken = getAccessToken();
              headers["Authorization"] = `Bearer ${newToken}`;
              wx.request({
                url: `${BASE_URL}${url}`,
                method,
                data,
                header: headers,
                success: (retryRes) => {
                  if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
                    resolve(retryRes.data);
                  } else {
                    reject(retryRes.data || { code: "HTTP_ERROR", message: `HTTP ${retryRes.statusCode}` });
                  }
                },
                fail: reject
              });
            })
            .catch((err) => {
              // 刷新 token 失败，清除登录状态
              wx.setStorageSync("loginSuccess", false);
              reject({ code: "TOKEN_EXPIRED", message: "登录已过期，请重新打开小程序" });
            });
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(res.data);
        reject(res.data || { code: "HTTP_ERROR", message: `HTTP ${res.statusCode}` });
      },
      fail: reject,
    });
  });
}

function uploadPage({ taskId, filePath, pageIndex, name = "file" }) {
  return new Promise((resolve, reject) => {
    const token = getAccessToken();
    const header = {};
    if (token) {
      header["Authorization"] = `Bearer ${token}`;
    }

    const doUpload = () => {
      wx.uploadFile({
        url: `${BASE_URL}/voucher-tasks/${taskId}/pages`,
        filePath,
        name,
        formData: { pageIndex: String(pageIndex) },
        header,
        success: (res) => {
          const data = JSON.parse(res.data || "{}");

          // 401: 尝试重新登录并重试一次
          if (res.statusCode === 401) {
            refreshToken()
              .then(() => {
                const newToken = getAccessToken();
                header["Authorization"] = `Bearer ${newToken}`;
                doUpload()
                  .then(resolve)
                  .catch(reject);
              })
              .catch((err) => {
                wx.setStorageSync("loginSuccess", false);
                reject({ code: "TOKEN_EXPIRED", message: "登录已过期，请重新打开小程序" });
              });
            return;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
          reject(data || { code: "UPLOAD_ERROR", message: `HTTP ${res.statusCode}` });
        },
        fail: reject,
      });
    };

    doUpload();
  });
}

function createTask() {
  return request({
    url: "/voucher-tasks",
    method: "POST",
  });
}

function finishUpload(taskId) {
  return request({
    url: `/voucher-tasks/${taskId}/finish-upload`,
    method: "POST",
  });
}

function recognize(taskId) {
  return request({
    url: `/voucher-tasks/${taskId}/recognize`,
    method: "POST",
  });
}

function confirmGenerate(taskId, { subject, month, voucherNo, fileName }) {
  return request({
    url: `/voucher-tasks/${taskId}/confirm-generate`,
    method: "POST",
    data: { subject, month, voucherNo, fileName },
  });
}

function getTask(taskId) {
  return request({
    url: `/voucher-tasks/${taskId}`,
    method: "GET",
  });
}

function getTasks() {
  return request({
    url: "/voucher-tasks",
    method: "GET",
  });
}

function deleteTask(taskId) {
  return request({
    url: `/voucher-tasks/${taskId}`,
    method: "DELETE",
  });
}

function clearAllTasks() {
  return request({
    url: "/voucher-tasks",
    method: "DELETE",
  });
}

// 微信登录
function wechatLogin(code) {
  return request({
    url: "/auth/wechat/login",
    method: "POST",
    data: { code },
    auth: false, // 登录接口不需要认证
  });
}

module.exports = {
  request,
  uploadPage,
  createTask,
  finishUpload,
  recognize,
  confirmGenerate,
  getTask,
  getTasks,
  deleteTask,
  clearAllTasks,
  wechatLogin
};
