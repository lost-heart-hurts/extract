const { getTasks, clearAllTasks } = require("../../utils/http");

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
      // 过滤掉 draft 状态的任务（草稿任务）
      const allTasks = result.items || result || [];
      const validTasks = allTasks.filter(task => task.status !== 'draft');
      this.setData({
        tasks: validTasks,
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
          // 先获取当前显示的任务数量（排除草稿）
          const currentCount = this.data.tasks.length;

          try {
            const userId = wx.getStorageSync("userId");
            await clearAllTasks(userId);
            wx.showToast({
              title: `成功清除 ${currentCount} 条记录`,
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
