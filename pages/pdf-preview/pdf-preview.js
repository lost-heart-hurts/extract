const BASE_URL = "http://127.0.0.1:8000";

Page({
  data: {
    pdfUrl: "",
    fileName: "",
    tempFilePath: ""
  },

  onLoad(options) {
    const pdfUrl = decodeURIComponent(options.pdfUrl || "");
    const fileName = decodeURIComponent(options.fileName || "");
    
    this.setData({
      pdfUrl: pdfUrl,
      fileName: fileName
    });
    
    this.openPDF();
  },

  openPDF() {
    wx.showLoading({
      title: "正在加载PDF...",
    });

    const fullPdfUrl = this.data.pdfUrl.startsWith("http") 
      ? this.data.pdfUrl 
      : `${BASE_URL}${this.data.pdfUrl}`;

    wx.downloadFile({
      url: fullPdfUrl,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          this.setData({
            tempFilePath: res.tempFilePath
          });
          
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: "pdf",
            success: function(res) {
              console.log("PDF打开成功");
              wx.showToast({
                title: "PDF已打开，可在查看中保存",
                icon: "none",
                duration: 3000
              });
            },
            fail: function(err) {
              console.error("打开PDF失败:", err);
              wx.showToast({
                title: "打开PDF失败",
                icon: "none"
              });
            }
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("下载PDF失败:", err);
        wx.showToast({
          title: "下载PDF失败",
          icon: "none"
        });
      }
    });
  },

  sharePDF() {
    if (!this.data.tempFilePath) {
      wx.showLoading({
        title: "正在准备PDF...",
      });

      const fullPdfUrl = this.data.pdfUrl.startsWith("http") 
        ? this.data.pdfUrl 
        : `${BASE_URL}${this.data.pdfUrl}`;

      wx.downloadFile({
        url: fullPdfUrl,
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200) {
            this.setData({
              tempFilePath: res.tempFilePath
            });
            this.performShare(res.tempFilePath);
          }
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: "准备PDF失败",
            icon: "none"
          });
        }
      });
    } else {
      this.performShare(this.data.tempFilePath);
    }
  },

  performShare(filePath) {
    wx.shareFileMessage({
      filePath: filePath,
      success: function(res) {
        console.log("分享成功");
      },
      fail: function(err) {
        console.error("分享失败:", err);
        wx.showToast({
          title: "分享失败",
          icon: "none"
        });
      }
    });
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/index/index"
    });
  },

  goHistory() {
    wx.redirectTo({
      url: "/pages/history/history"
    });
  }
});