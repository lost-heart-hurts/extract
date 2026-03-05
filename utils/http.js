const { BASE_URL } = require("../config");

function request({ url, method = "GET", data, header = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: { "Content-Type": "application/json", ...header },
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
    wx.uploadFile({
      url: `${BASE_URL}/voucher-tasks/${taskId}/pages`,
      filePath,
      name,
      formData: { pageIndex: String(pageIndex) },
      success: (res) => {
        const data = JSON.parse(res.data || "{}");
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
        reject(data || { code: "UPLOAD_ERROR", message: `HTTP ${res.statusCode}` });
      },
      fail: reject,
    });
  });
}

function createTask(userId) {
  return request({
    url: "/voucher-tasks",
    method: "POST",
    data: { userId },
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

module.exports = {
  request,
  uploadPage,
  createTask,
  finishUpload,
  recognize,
  confirmGenerate,
  getTask,
  getTasks
};
