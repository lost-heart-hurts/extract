// 任务状态相关工具函数

/**
 * 获取任务状态的中文文本
 * @param {string} status - 任务状态
 * @returns {string} 中文状态文本
 */
function getStatusText(status) {
  const statusMap = {
    draft: "草稿",
    uploaded: "已上传",
    recognized: "已识别",
    confirmed: "已确认",
    pdf_generated: "已完成",
    failed: "失败"
  };
  return statusMap[status] || status;
}

/**
 * 获取任务状态对应的颜色
 * @param {string} status - 任务状态
 * @returns {string} 颜色代码
 */
function getStatusColor(status) {
  const colorMap = {
    draft: "#999",
    uploaded: "#1890ff",
    recognized: "#faad14",
    confirmed: "#722ed1",
    pdf_generated: "#52c41a",
    failed: "#f5222d"
  };
  return colorMap[status] || "#999";
}

module.exports = {
  getStatusText,
  getStatusColor
};