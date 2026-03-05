Page({
  data: {

  },

  onLoad() {

  },

  goToProcess() {
    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "登录中，请稍后再试",
        icon: "none"
      });
      return;
    }

    wx.navigateTo({
      url: "/pages/index/index"
    });
  },

  goToHistory() {
    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "登录中，请稍后再试",
        icon: "none"
      });
      return;
    }

    wx.navigateTo({
      url: "/pages/history/history"
    });
  }
});
