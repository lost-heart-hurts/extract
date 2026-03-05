const { getTasks } = require("../../utils/http");

Page({
  data: {
    tasks: [],
    loading: false,
    refreshing: false
  },

  onLoad() {
    this.loadTasks();
  },

  onShow() {
    this.loadTasks();
  },

  onPullDownRefresh() {
    this.loadTasks(true);
  },

  async loadTasks(isRefresh = false) {
    if (isRefresh) {
      this.setData({ refreshing: true });
    } else {
      this.setData({ loading: true });
    }

    try {
      const userId = wx.getStorageSync("userId");
      const result = await getTasks(userId);
      this.setData({
        tasks: result.items || result || [],
        loading: false,
        refreshing: false
      });
    } catch (error) {
      console.error("加载历史记录失败:", error);
      wx.showToast({
        title: error.message || "加载失败",
        icon: "none"
      });
      this.setData({
        loading: false,
        refreshing: false
      });
    } finally {
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  onTaskTap(e) {
    const task = e.currentTarget.dataset.task;
    wx.navigateTo({
      url: `/pages/detail/detail?taskId=${task.taskId}`
    });
  },

  getStatusText(status) {
    const statusMap = {
      draft: "草稿",
      uploaded: "已上传",
      recognized: "已识别",
      confirmed: "已确认",
      pdf_generated: "已完成",
      failed: "失败"
    };
    return statusMap[status] || status;
  },

  getStatusColor(status) {
    const colorMap = {
      draft: "#999",
      uploaded: "#1890ff",
      recognized: "#faad14",
      confirmed: "#722ed1",
      pdf_generated: "#52c41a",
      failed: "#f5222d"
    };
    return colorMap[status] || "#999";
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/home"
    });
  }
});
