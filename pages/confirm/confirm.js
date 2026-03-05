const { request, confirmGenerate } = require("../../utils/http");

Page({
  data: {
    taskId: "",
    subject: "",
    month: "",
    voucherNo: "",
    confidence: 0,
    fileNamePreview: "",
    loading: false
  },

  onLoad(options) {
    const taskId = options.taskId;
    const subject = options.subject ? decodeURIComponent(options.subject) : "";
    const month = options.month ? decodeURIComponent(options.month) : "";
    const voucherNo = options.voucherNo ? decodeURIComponent(options.voucherNo) : "";
    const confidence = options.confidence;
    const fileNamePreview = options.fileNamePreview ? decodeURIComponent(options.fileNamePreview) : "";
    const confidenceValue = parseFloat(confidence || 0);
    this.setData({
      taskId,
      subject,
      month,
      voucherNo,
      confidence: confidenceValue,
      confidencePercent: (confidenceValue * 100).toFixed(0),
      fileNamePreview
    });
  },

  onSubjectInput(e) {
    this.setData({ subject: e.detail.value });
  },

  onMonthInput(e) {
    this.setData({ month: e.detail.value });
  },

  onVoucherNoInput(e) {
    this.setData({ voucherNo: e.detail.value });
  },

  async onConfirm() {
    const { taskId, subject, month, voucherNo } = this.data;

    if (!subject || !month || !voucherNo) {
      wx.showToast({
        title: "请填写完整信息",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await this.retryWithBackoff(() => confirmGenerate(taskId, { subject, month, voucherNo }), 3);

      if (result.status === "pdf_generated" && result.pdfUrl) {
        // 保留taskId以便后续使用
        wx.showToast({
          title: "PDF生成成功",
          icon: "success"
        });

        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/pdf-preview/pdf-preview?pdfUrl=${encodeURIComponent(result.pdfUrl)}&fileName=${encodeURIComponent(result.fileName || "")}`
          });
        }, 1500);
      } else {
        wx.showToast({
          title: "生成PDF失败",
          icon: "none"
        });
      }
    } catch (error) {
      console.error("确认生成失败:", error);
      wx.showModal({
        title: "生成失败",
        content: error.message || "PDF生成失败，是否重试？",
        confirmText: "重试",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.onConfirm();
          }
        }
      });
    } finally {
      this.setData({ loading: false });
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

  onCancel() {
    wx.navigateBack();
  }
});
