const { getTasks, clearAllTasks } = require("../../utils/http");
const { getStatusText, getStatusColor } = require("../../utils/status");

Page({
  data: {
    tasks: [],
    loading: false,
    refreshing: false
  },

  async onLoad() {
    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      this.setData({ loading: false });
      return;
    }
    
    this.setData({ loading: true });
    try {
      const result = await getTasks();
      this.setData({ tasks: result.items || result || [], loading: false });
    } catch (error) {
      console.error("获取历史记录失败:", error);
      this.setData({ loading: false });
    }
  },

  onShow() {
    this.loadTasks();
  },

  onPullDownRefresh() {
    this.loadTasks(true);
  },

  async loadTasks(isRefresh = false) {
    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      this.setData({ loading: false, refreshing: false });
      return;
    }
    
    if (isRefresh) {
      this.setData({ refreshing: true });
    } else {
      this.setData({ loading: true });
    }

    try {
      const result = await getTasks();
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

  onClearHistory() {
    wx.showModal({
      title: "确认清除",
      content: "确定要清除所有历史记录吗？此操作不可恢复。",
      confirmText: "确认清除",
      cancelText: "取消",
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await clearAllTasks();
            wx.showToast({
              title: `成功清除 ${result.deletedCount || 0} 条记录`,
              icon: "success"
            });
            // 刷新页面
            this.loadTasks();
          } catch (error) {
            console.error("清除历史记录失败:", error);
            wx.showToast({
              title: error.message || "清除失败",
              icon: "none"
            });
          }
        }
      }
    });
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/home"
    });
  }
});
