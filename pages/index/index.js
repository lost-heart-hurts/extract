const { createTask, uploadPage, finishUpload, recognize } = require("../../utils/http");

Page({
  data: {
    images: [],
    loading: false,
    loadingText: "",
    userId: "wx_user_" + Date.now()
  },

  onShow() {
    const userId = wx.getStorageSync("userId");
    if (userId) {
      this.setData({ userId });
    }
  },

  async retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },

  takePhoto() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["camera"],
      success: function(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          images: that.data.images.concat(tempFilePaths)
        });
      }
    });
  },

  chooseImages() {
    const that = this;
    wx.chooseImage({
      count: 9,
      sizeType: ["compressed"],
      sourceType: ["album"],
      success: function(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          images: that.data.images.concat(tempFilePaths)
        });
      }
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({
      images: images
    });
  },

  async startProcess() {
    if (this.data.images.length === 0) {
      wx.showToast({
        title: "请先选择图片",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true, loadingText: "正在准备任务..." });

    try {
      const app = getApp();
      let taskId = app.getCurrentTaskId();

      if (!taskId) {
        this.setData({ loadingText: "正在创建任务..." });
        const task = await createTask(this.data.userId);
        taskId = task.taskId;
        app.setCurrentTaskId(taskId);
      }

      this.setData({ loadingText: "正在上传图片..." });

      for (let i = 0; i < this.data.images.length; i++) {
        await uploadPage({
          taskId: taskId,
          filePath: this.data.images[i],
          pageIndex: i
        });
      }

      this.setData({ loadingText: "正在完成上传..." });

      await finishUpload(taskId);

      this.setData({ loadingText: "正在识别..." });

      const recognized = await this.retryWithBackoff(() => recognize(taskId), 3);

      this.setData({ loading: false });

      wx.navigateTo({
        url: `/pages/confirm/confirm?taskId=${taskId}&subject=${encodeURIComponent(recognized.subject || "")}&month=${encodeURIComponent(recognized.month || "")}&voucherNo=${encodeURIComponent(recognized.voucherNo || "")}&confidence=${recognized.confidence || 0}&fileNamePreview=${encodeURIComponent(recognized.fileNamePreview || "")}`
      });

    } catch (error) {
      console.error("处理失败:", error);
      this.setData({ loading: false });
      wx.showModal({
        title: "识别失败",
        content: error.message || "OCR识别失败，是否重试？",
        confirmText: "重试",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.startProcess();
          }
        }
      });
    }
  }
});