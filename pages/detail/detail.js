const { getTask } = require("../../utils/http");
const { getStatusText, getStatusColor } = require("../../utils/status");

Page({
  data: {
    taskId: "",
    task: null,
    loading: false
  },

  onLoad(options) {
    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      return;
    }
    
    const { taskId } = options;
    if (!taskId) {
      wx.showToast({
        title: "参数错误",
        icon: "none"
      });
      wx.navigateBack();
      return;
    }
    this.setData({ taskId });
    this.loadTaskDetail();
  },

  onPullDownRefresh() {
    this.loadTaskDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadTaskDetail() {
    this.setData({ loading: true });

    try {
      const task = await getTask(this.data.taskId);
      const confidencePercent = task.confidence ? (task.confidence * 100).toFixed(0) : "0";
      this.setData({
        task: task,
        confidencePercent: confidencePercent,
        loading: false
      });
    } catch (error) {
      console.error("加载任务详情失败:", error);
      wx.showToast({
        title: error.message || "加载失败",
        icon: "none"
      });
      this.setData({ loading: false });
    }
  },

  onViewPDF() {
    const { task } = this.data;
    if (task && task.status === "pdf_generated" && task.pdfUrl) {
      wx.navigateTo({
        url: `/pages/pdf-preview/pdf-preview?pdfUrl=${encodeURIComponent(task.pdfUrl)}&fileName=${encodeURIComponent(task.fileName || "")}`
      });
    } else {
      wx.showToast({
        title: "PDF尚未生成",
        icon: "none"
      });
    }
  },

  onRetry() {
    const { task } = this.data;
    if (task && task.status === "failed") {
      wx.showModal({
        title: "重试任务",
        content: "确定要重新处理此任务吗？",
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: `/pages/index/index?retryTaskId=${this.data.taskId}`
            });
          }
        }
      });
    }
  },

  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN");
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/home"
    });
  }
});
