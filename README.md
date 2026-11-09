# Labradorite

Labradorite 为 AI 角色提供可追溯的长期记忆。AI 通过 **stdio MCP** 保存原始材料、整理经历和检索往事；用户可以在浏览器里查看这些记录、照片和视频，以及每段经历所依据的原文。

例如，角色看了一段视频的前两分钟。上层 AI 可以保存视频、报告实际观看区间，再把自己的理解整理成一条经历。以后问起这件事时，AI 可以找到当时的记录，查看原视频和后续更正。视觉理解与经历整理由上层模型完成，Labradorite 负责保存、关联和检索。

## 从源码接入

准备 Node.js 24 或更高版本、[Vite+](https://viteplus.dev/) 的 `vp` 命令，以及支持 stdio MCP 的客户端。在仓库根目录运行：

```sh
vp install --frozen-lockfile
vp run build
node dist/src/setup.js
```

初始化命令会输出 `runtime.json` 和 `mcp.json` 的绝对路径。要自己指定数据目录，可在首次初始化时运行 `node dist/src/setup.js "/path/to/data"`。请选择本机持久目录，活动数据库应放在同步盘之外。

1. 打开生成的 `mcp.json`，将 `mcpServers` 下的 `fish-memory` 条目加入客户端。若客户端使用其他配置格式，照填其中的 `command` 和 `args`。
2. 重新加载客户端。客户端会按配置启动服务，标准输入和标准输出用于 MCP 通信。
3. 让 AI 调用 `memory_status`。如果能读到当前库的材料数和经历数，接入即已成功。

第一次使用可以进行一个简单的测试，检测能否正确调用服务。

## 浏览记忆库

服务默认启动只读 Web 查看器。桌面环境会尝试打开浏览器，点击“打开当前记忆库”即可浏览。全库搜索可以同时找到经历、材料和照片描述；从经历可以打开原文，从相册里的照片也可以反查引用它的经历。

**无桌面服务器**上，在项目目录以启动服务的同一系统账号运行：

```sh
node dist/src/viewer-url.js
```

它会输出登录链接和与实际端口匹配的 SSH 转发命令。在自己的电脑执行该命令，将 `user@server` 替换为服务器账号和地址，然后在本地浏览器打开登录链接。需要切换记忆库时，网页中浏览的是服务器上的目录。

不需要使用 webview 时，在客户端配置的 `args` 数组末尾加入 `"--no-webview"`，再重启服务。记忆的写入、更正和修订通过 MCP 完成。

## 材料、经历与检索

| 操作       | MCP 工具                                                     | 行为                                                                         |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 保存与展开 | `memory_submit`、`memory_read`                               | 保存原文、来源及覆盖范围，按 ID 展开。原始记录有误时可提交更正并关联旧材料。 |
| 整理与修订 | `memory_preview_organize`、`memory_organize`、`memory_amend` | 把材料组织为有来源依据的经历，预览差异，保留历次修订。                       |
| 查找记忆   | `memory_recall`、`memory_index`                              | 返回简短片段、命中原因和来源 ID，可按时间、渠道或生活线筛选。                |
| 管理相册   | `memory_import_media`、`memory_album`                        | 从入口目录归档照片和受支持的 MP4，按当前空间与世界浏览。                     |
| 检查与删除 | `memory_status`、`memory_preview_delete`、`memory_delete`    | 查看整理进度；删除前先查看受影响的材料、更正链和经历修订。                   |

默认即可使用本地 SQLite 全文检索。有语义检索需求时，可在 `runtime.json` 中配置 OpenAI 兼容的 embedding 接口，再调用 `memory_index` 分批建立向量索引。建索引会把材料片段发送到所配置的服务，混合检索也可能发送查询文本；选择“仅本地全文”可在本机完成查询。配置示例和每日请求预算见[架构与配置说明](docs/architecture.md)。

## 数据、导出与恢复

`runtime.json` 的 `database` 字段指向 SQLite 数据库，保存原文、经历、来源关系、修订和检索索引。将待归档的文件放入 `<数据库路径>.inbox/`；成功导入的原文件保存在 `<数据库路径>.media/`。删除材料后，已有备份和磁盘上的共享媒体仍可能保留。

在项目根目录运行以下命令，把示例路径换成自己的路径。每个输出目录都应是尚未创建的新目录。

```sh
# 导出当前作用域的 Markdown、相册首页及媒体，可用 Obsidian 或任意编辑器打开
node dist/src/library.js markdown /path/to/runtime.json /path/to/new-vault

# 备份整个数据库和仍被引用的媒体
node dist/src/library.js backup /path/to/runtime.json /path/to/new-backup

# 校验并恢复到新的数据目录，再生成客户端配置
node dist/src/library.js restore /path/to/new-backup /path/to/new-data
node dist/src/setup.js /path/to/new-data
```

Markdown 是可读副本，在外部修改它只会改变导出文件。搬迁服务时使用完整备份，并让客户端加载恢复后的 MCP 配置。

## 开发

项目使用 TypeScript、Vite+、pnpm、Oxc 和 Vitest。在根目录运行 `vp run check`，可检查生成契约、格式和类型，并完成构建与测试。
