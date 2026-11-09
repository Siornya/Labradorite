# Labradorite

启动 stdio MCP 记忆服务时会自动启动只读查看器。桌面会尝试打开浏览器，SSH 环境可在服务的标准错误日志中找到登录链接。只运行记忆服务时，在 MCP 配置的 `args` 数组中加入 `"--no-webview"`，然后重启服务。

已有记忆库的用户可以使用对应系统和架构的查看器便携包。解压后，Windows 双击 **Labradorite Viewer.cmd**，浏览器打开目录选择页。浏览文件夹或输入绝对路径，找到包含 runtime.json 的目录后点“打开此记忆库”。进入后可用“切换记忆库”重新选择。关闭启动器终端即可退出。

Linux 或 macOS 解压对应平台的包后，在包目录运行：

```sh
./labradorite-viewer
```

网页浏览查看器所在机器的目录。无桌面服务器在终端显示访问链接。在自己电脑执行 `ssh -N -L 4317:127.0.0.1:4317 user@server`，再打开该链接。便携包包含 Node.js 运行时。

开发者运行 `vp run package:viewer` 生成当前平台的便携包，产物在 dist/。查看器也可通过 `vp run build` 和 `vp run viewer` 本地开发运行。
