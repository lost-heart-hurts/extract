const { createTask, uploadPage, finishUpload, recognize } = require("../../utils/http");

Page({
  data: {
    firstImage: "",
    images: [],
    loading: false,
    loadingText: "",
    userId: "wx_user_" + Date.now(),
    step: 1 // 1: 上传首页, 2: 上传其他页
  },

  async onShow() {
    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      return;
    }
    
    const userId = wx.getStorageSync("userId");
    if (userId) {
      this.setData({ userId });
    }
    
    // 检查是否需要重新创建任务（用户从confirm页面取消返回）
    const recreateTask = wx.getStorageSync("recreateTask");
    if (recreateTask) {
      wx.removeStorageSync("recreateTask");
      // 保持图片等状态，但重新创建任务
      await this.createNewTask();
      return;
    }
    
    // 检查是否需要重置状态（处理完成后返回首页）
    const shouldReset = wx.getStorageSync("shouldResetIndex");
    if (shouldReset) {
      // 清除标记
      wx.removeStorageSync("shouldResetIndex");
      // 重置页面状态
      this.setData({
        firstImage: "",
        images: [],
        step: 1,
        loading: false,
        loadingText: ""
      });
      // 创建新任务
      await this.createNewTask();
    }
    // 否则保持当前状态不变（用户在步骤间切换时不会重置）
  },
  
  async createNewTask() {
    try {
      const app = getApp();
      const task = await createTask();
      if (task && task.taskId) {
        app.setCurrentTaskId(task.taskId);
        this.setData({ taskId: task.taskId });
        console.log("新任务创建成功，taskId:", task.taskId);
      }
    } catch (error) {
      console.error("创建新任务失败:", error);
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

  // 拍摄首页照片（只能拍1张）
  takeFirstPhoto() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          firstImage: tempFilePaths[0]
        });
      }
    });
  },

  // 选择首页图片（只能选1张）
  chooseFirstImage() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          firstImage: tempFilePaths[0]
        });
      }
    });
  },

  // 拍摄其他页照片
  takePhoto() {
    const that = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          images: that.data.images.concat(tempFilePaths)
        });
      }
    });
  },

  // 选择其他页图片
  chooseImages() {
    const that = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          images: that.data.images.concat(tempFilePaths)
        });
      }
    });
  },

  // 进入下一步
  nextStep() {
    this.setData({ step: 2 });
  },

  // 返回上一步
  prevStep() {
    // 只改变步骤状态，不修改图片数组
    // 这样可以处理用户在第二步上传图片后回到第一步的场景
    this.setData({ step: 1 });
  },

  deleteImage(e) {
    const type = e.currentTarget.dataset.type;
    const index = e.currentTarget.dataset.index;

    if (type === "first") {
      // 删除首页图片
      this.setData({
        firstImage: "",
        step: 1
      });
    } else {
      // 删除其他图片
      const images = this.data.images;
      images.splice(index, 1);
      this.setData({ images });
    }
  },

  async startProcess() {
    if (!this.data.firstImage) {
      wx.showToast({
        title: "必须上传首页图片",
        icon: "none"
      });
      return;
    }

    // 检查是否已登录
    const app = getApp();
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: "请先登录",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true, loadingText: "正在准备任务..." });

    try {
      // 每次开始处理都创建新任务，确保任务状态为 draft
      this.setData({ loadingText: "正在创建任务..." });
      const task = await createTask();
      const taskId = task.taskId;
      app.setCurrentTaskId(taskId);
      this.setData({ taskId: taskId });

      this.setData({ loadingText: "正在上传图片..." });

      // 先上传首页图片（pageIndex=0）
      await uploadPage({
        taskId: taskId,
        filePath: this.data.firstImage,
        pageIndex: 0
      });

      // 再上传其他图片（pageIndex从1开始）
      for (let i = 0; i < this.data.images.length; i++) {
        await uploadPage({
          taskId: taskId,
          filePath: this.data.images[i],
          pageIndex: i + 1
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
        title: "处理失败",
        content: error.message || "处理失败，是否重试？",
        confirmText: "重试",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            this.startProcess();
          } else {
            // 用户取消，删除当前任务
            const app = getApp();
            await app.deleteIncompleteTask();
          }
        }
      });
    }
  },

  async goHome() {
    // 如果有未完成的任务，先删除
    const app = getApp();
    await app.deleteIncompleteTask();
    
    wx.reLaunch({
      url: "/pages/home/home"
    });
  }
});
