const { wechatLogin } = require("./utils/http");

App({
  onLaunch() {
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    // 设置标记，表示这是新启动的应用，index页面需要重置状态
    wx.setStorageSync("shouldResetIndex", true);

    // 微信登录并获取 access token
    this.doWechatLogin();
  },

  async doWechatLogin() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      console.log("微信登录成功，code:", res.code);

      // 调用后端登录接口获取 access token
      const loginResult = await wechatLogin(res.code);

      if (loginResult && loginResult.accessToken) {
        // 存储 access token
        wx.setStorageSync("accessToken", loginResult.accessToken);
        wx.setStorageSync("userId", loginResult.userId);
        wx.setStorageSync("loginSuccess", true);
        console.log("登录成功，userId:", loginResult.userId);
        return true;
      } else {
        throw new Error("登录失败：未获取到 accessToken");
      }
    } catch (error) {
      console.error("登录失败:", error);
      wx.setStorageSync("loginSuccess", false);
      wx.showToast({
        title: "登录失败，请重新打开小程序",
        icon: "none",
        duration: 3000
      });
      return false;
    }
  },

  // 检查是否已登录
  isLoggedIn() {
    return wx.getStorageSync("loginSuccess") === true && 
           wx.getStorageSync("accessToken");
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