## 备份、导出与恢复

`runtime.json` 的路径由 setup 输出，其中的 `database` 字段指向 SQLite 数据库，保存原文、经历、来源关系、修订和检索索引。将待归档的文件放入 `<数据库路径>.inbox/`；成功导入的原文件保存在 `<数据库路径>.media/`。删除材料后，已有备份和磁盘上的共享媒体仍可能保留。

在项目根目录运行以下命令，把示例路径换成自己的路径。每个输出目录都应是尚未创建的新目录。

```sh
# 导出当前作用域的 Markdown、相册首页及媒体，可用 Obsidian 或任意编辑器打开
vpr library markdown /path/to/runtime.json /path/to/new-vault

# 备份整个数据库和仍被引用的媒体
vpr library backup /path/to/runtime.json /path/to/new-backup

# 校验并恢复到新的数据目录，再生成客户端配置
vpr library restore /path/to/new-backup /path/to/new-data
vpr setup /path/to/new-data
```

Markdown 是可读副本，在外部修改它只会改变导出文件。搬迁服务时使用完整备份，并让客户端加载恢复后的 MCP 配置。
