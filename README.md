# Gauge

查看 Steam 游戏公开数据的桌面和 Android 工具。黑白界面，支持深色模式。

Gauge 是第三方软件，和 Valve / Steam 没有关系。

## 功能

- 搜索游戏，输入纯数字 AppID 直接打开
- 显示当前在线人数、价格、历史低价/高价、销量估算和 AppID
- 收藏游戏，保存浏览记录和使用时间
- 首页显示 Steam 热销和特惠
- 查看社区公告、系统需求、游戏截图
- Android 内置浏览器，桌面版调用系统浏览器
- 设置官方源 / 国内 CDN
- 中文、English、日本語、Deutsch、한국어、العربية
- 跟随系统 / 浅色 / 深色
- 断网时界面、收藏、历史和设置仍可使用

## 仓库

https://github.com/AUQQAhhy89/gauge

## 下载

- Windows：`Gauge.exe`
- Android：`Gauge-Android.apk`
- Releases：https://github.com/AUQQAhhy89/gauge/releases

Android 7.0 及以上。需要允许安装未知来源应用。APK 签名固定，后续版本可以直接覆盖安装。

## 数据说明

Steam 没有公开的历史价格和销量 API。

- 历史低价/高价：本机记录，参考官方当前定价
- 销量：公开评测数 × 30 的估算，不是官方数据
- 在线人数：优先调用 Steam 官方接口，失败时使用 SteamCharts 并标注来源

图片来自 Steam 官方 CDN，不打包进安装包。

## 数据存放

- Windows：运行目录下的 `GaugeData/`
- Android：应用内部存储的 `GaugeData/`

删除 `GaugeData` 会恢复初始状态。图片缓存每次启动都会清理。

## 隐私

不收集数据，没有账号系统，没有统计 SDK。

公益广告只有在首次启动时由用户主动选择「愿意」后才会显示，可在设置里关闭。公益内容通过本地 `/api/public-ads` 读取，不接入商业广告平台。

## 开源

MIT License。允许修改、分发和二次销售；再次发布时请注明原项目 Gauge。

使用的开源组件：

- Android System WebView / Chromium：BSD 3-Clause，内置浏览器内核
- Go：BSD 3-Clause，桌面端本地服务

完整列表在软件内的 设置 → 开源项目。

## 构建

需要 Go 1.22。Android 需要 SDK 34、Build Tools 和 JDK 17。

Windows：

```bash
go build -trimpath -ldflags="-s -w -H=windowsgui" -o dist/Gauge.exe .
```

Android：

```bash
./android/build.sh
```

签名密钥默认放在 `$HOME/.gauge/steamviewer.jks`，不包含在仓库里。

## 免责声明

本软件是第三方工具，与 Steam、Valve 及其关联公司没有关系，也未获得授权。当前版本处于测试阶段，请勿将本软件的缺陷提交给 Steam 或 Valve。

本软件免费提供。如果你为它付过费，请立即向收款方申请退款。本软件不以商业营销为目的，属于公益项目。使用中遇到的问题请反馈给制作者，并附上复现步骤和日志。

全部代码开源，允许修改、二次分发与二次贩卖；再次发布时必须注明原代码出处。
