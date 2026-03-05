const { BASE_URL } = require("../config");

// 获取存储的 access token
function getAccessToken() {
  return wx.getStorageSync("accessToken");
}

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
    
    wx.uploadFile({
      url: `${BASE_URL}/voucher-tasks/${taskId}/pages`,
      filePath,
      name,
      formData: { pageIndex: String(pageIndex) },
      header,
      success: (res) => {
        const data = JSON.parse(res.data || "{}");
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
        reject(data || { code: "UPLOAD_ERROR", message: `HTTP ${res.statusCode}` });
      },
      fail: reject,
    });
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
  wechatLogin
};
