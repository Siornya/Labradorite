# Labradorite

已有记忆库的用户可以使用对应系统和架构的查看器便携包。解压后，Windows 双击 **Labradorite Viewer.cmd**，浏览器会打开默认记忆库。使用自定义数据目录时，把已有的 runtime.json 拖到该启动器上。关闭启动器终端即可退出。

Linux 或 macOS 解压对应平台的包后，在包目录运行：

```sh
./labradorite-viewer
```

自定义库可传入 runtime.json 路径。无桌面服务器在终端显示访问链接。在自己电脑执行 `ssh -N -L 4317:127.0.0.1:4317 user@server`，再打开该链接。便携包包含 Node.js 运行时。

开发者运行 `vp run package:viewer` 生成当前平台的便携包，产物在 dist/。查看器也可通过 `vp run build` 和 `vp run viewer` 本地开发运行。
