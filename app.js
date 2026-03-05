const { createTask } = require("./utils/http");

App({
  onLaunch() {
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    let userId = wx.getStorageSync("userId");
    if (!userId) {
      userId = "wx_user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      wx.setStorageSync("userId", userId);
    }

    // 创建任务获取task_id
    this.createInitialTask(userId);

    wx.login({
      success: res => {
        console.log("微信登录成功，code:", res.code);
      }
    })
  },

  async createInitialTask(userId) {
    try {
      const task = await createTask(userId);
      if (task && task.taskId) {
        this.setCurrentTaskId(task.taskId);
        console.log("初始化任务创建成功，taskId:", task.taskId);
      }
    } catch (error) {
      console.error("初始化任务创建失败:", error);
    }
  },
  globalData: {
    userInfo: null,
    currentTaskId: null
  },

  setCurrentTaskId(taskId) {
    this.globalData.currentTaskId = taskId;
    wx.setStorageSync("currentTaskId", taskId);
  },

  getCurrentTaskId() {
    if (this.globalData.currentTaskId) {
      return this.globalData.currentTaskId;
    }
    return wx.getStorageSync("currentTaskId");
  },

  clearCurrentTaskId() {
    this.globalData.currentTaskId = null;
    wx.removeStorageSync("currentTaskId");
  }
})