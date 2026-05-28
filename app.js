// app.js
App({
  globalData: {
    // 替换为你云函数 HTTP 触发器/网关的地址
    // 例：https://service-xxxxxx-1300000000.gz.apigw.tencentcs.com/release/fortune
    apiBase: 'https://xiaochengxu-d3gnl93vhbab8f35f-1432811665.ap-shanghai.app.tcloudbase.com/fortune'
  },
  onLaunch() {
    // 兼容新基础库：用 wx.getDeviceInfo 替代已弃用的 wx.getSystemInfoSync
    try {
      if (wx.getDeviceInfo) this.globalData.device = wx.getDeviceInfo()
      if (wx.getWindowInfo) this.globalData.window = wx.getWindowInfo()
    } catch (e) {}
  }
})
