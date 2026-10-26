# Scythe Discards

[繁體中文](README.md) · 简体中文 · [English](README.en.md)

保留标签页与网址，按明确的闲置时间卸载后台网页。使用 Chrome Manifest V3、TypeScript 和 React，界面遵循 Chrome 设置页风格，数据保存在本机。

[下载 v0.3.3](https://github.com/Lianye-Scythe/scythe-discards/releases) · [问题反馈](https://github.com/Lianye-Scythe/scythe-discards/issues) · [参与开发](CONTRIBUTING.md)

| 小窗口 | 网站规则来源 |
| --- | --- |
| <img src="docs/images/popup.png" width="280" alt="小窗口：自动卸载、当前标签页和网站保护"> | <img src="docs/images/popup-inherited.png" width="280" alt="继承保护：显示规则来源和管理入口"> |

[设置页预览](docs/images/settings.png)。截图使用繁体中文、独立测试配置和示例网站，界面也支持简体中文和英语。

## 功能

v0.3.3 精简 popup 高度和网站范围说明，清晰展示继承规则；长域名可展开查看完整名称，断线时优先显示恢复入口并保留 Undo。

- 普通模式保留固定、正在播放音频以及已停用自动卸载的标签页；严格模式在超时后仍会请求卸载这些标签页。
- 两种模式均保护正在使用的标签页、有效分屏视图、网站白名单和手动保护的标签页。
- 小窗口支持“仅此域名”或“主域名及子域名”，快速添加／移除规则并撤销移除，同时显示上层规则的保护来源。
- 按 hostname 匹配，不按路径、协议或端口区分。主域名通过包含私有后缀的 Public Suffix List 识别。
- 本次会话最多保留最新 200 条记录，每页 50 条，可清除。
- 英语、繁体中文、简体中文跟随 Chrome 界面语言，不支持的语言回退为英语；外观跟随系统或手动选择。
- 无内容脚本、遥测、账户或远程后端；后台服务不加载 React。

默认普通模式、30 分钟、系统外观。切回已卸载的标签页会重新加载，无法保证保留未保存的内容；睡眠、浏览器调度和 API 拒绝可能延迟执行，不保证精确到秒或固定内存上限。

## 安装与更新

从 [Releases](https://github.com/Lianye-Scythe/scythe-discards/releases) 下载扩展安装包 `scythe-discards-0.3.3.zip`，解压到固定目录；同页提供 `SHA256SUMS`。GitHub 自动生成的 Source code 压缩包需要先构建。

在 `chrome://extensions` 开启开发者模式并选择“加载已解压的扩展程序”，指定含 `manifest.json` 的目录。自行构建则加载 `dist/`。

**更新现有未打包安装时保持原目录路径**，覆盖文件后点击“重新加载”。目录可以保留旧名 `chrome-discards`，这样可保留扩展 ID 和网站设置。

重新加载／更新会重置会话计时、手动标签页保护和最近记录；模式、超时时间、主题和网站白名单保留。

## 开发与测试

使用 Node 24.22.1 LTS、npm 12.2.1 和精确锁定的依赖。

```bash
npm ci
npm run check
npm test
npm run build
npm run test:setup
npm run test:locales
npm run package
```

测试会下载官方最新稳定版 Chrome for Testing，使用独立配置文件。单独测试简中：`npm run test:ui -- --locale=zh-CN`。

安装包位于 `artifacts/scythe-discards-0.3.3.zip`，附 `SHA256SUMS`；结果与截图分别位于 `artifacts/`、`.impeccable/review/`。

参阅[验证范围](docs/VALIDATION.md)、[版本说明](docs/RELEASE_NOTES.md)、[隐私政策](PRIVACY.md)、[发布流程](docs/PUBLISHING.md)、[翻译维护](docs/I18N.md)和[更新记录](CHANGELOG.md)。

采用 [MIT 授权](LICENSE)，第三方组件保留各自的授权声明。
