# MCP 工具参考

本文说明工具的字段含义、调用约定和可观察行为。工具总览见 [README](../README.md#材料经历与检索)，实现分层见[项目结构](architecture.md)。

## 人物档案与回顾

人物由 space、world 和档案 ID 定位，同名档案可用身份线索区分。建档与回顾由上层 AI 提议。整理请求的可选 person_review 与经历在同一事务中写入，也可单独回顾既有经历。每次回顾保存服务记录时间和引用的经历 ID、修订号。有新印象时保存完整判断，只关联经历时沿用当前印象。首次引用的经历同时支撑建档身份。

删除预览中的 person_ids 列出建档依据被删除而须整体移除的档案，person_reviews 列出其他档案中受影响的单次回顾。删除后者会清除正文和该次的全部引用，保留修订序号。如果当前判断被移除，旧判断仍可作为历史读取，当前印象置空，直到角色再次形成判断。

## 检索与索引

memory_index({max_batches:1}) 显式构建待处理片段，每批最多 8 段、单次 1–16 批；重复调用直至 pending_chunks=0，重启后跳过已完成部分。配置该服务表示允许将这些原文/经历片段发往 endpoint。memory_recall 默认 hybrid，有可用向量时发送查询文本；mode=lexical、空查询或没有已完成向量时不发送。无后台自动计费任务、自动重试或查询向量缓存。

支持 kind、review_status、channel、thread 与时间窗过滤。channel 只匹配材料报告渠道；thread 精确匹配材料或经历标签；这些都不是访问权限。时间窗可选择 received_at 或 authored_at（包含边界）；经历在 received_at 模式使用 recorded_at，authored_at 窗口不猜测经历发生时间。未知撰写时间不补填接收时间。

recall 默认返回原文短片段或明确标记的模型经历片段、命中线索、来源和更正引用，统一标为 historical_background。更正提示检查整个后续链。max_bytes 对完整 recall JSON 作硬预算，必要时退化为 ID 目录；显式 read 展开不受该预算限制。片段附 code point 起止位置：material.text 或 episode_search_text（依次以换行连接经历的标题、摘要、过程、解释和未知项）；经历片段不冒充原文。诊断返回候选读取（scanned）、过滤后、匹配和返回计数，以及语义实际使用与降级原因、未完成片段数；不持久化查询日志，不宣称知道模型是否使用结果。

## 状态与修订

memory_status.retrieval 返回当前片段数、当前模型空间已嵌入/待嵌入片段、索引版本、UTC 当日请求次数和已知 token 用量。

memory_status 返回当前材料/经历/修订数、pending/reviewed 数量、最早未整理序号、最近整理序号及最近材料。reviewed 按最新经历版本的引用计算，来源在新版被撤下或依赖经历删除后可回到 pending，不代表真实性确认。旧 body 中的静态状态仅为历史字段，读出时重新计算。提交返回受作用域约束的最多 10 条精确文本重复提示，不自动合并事件。

memory_review 设置 dry_run 为 true 时只预览，展示字段差异、撤下来源和共享证据的其他经历；共享证据不等于语义矛盾。memory_amend 允许追加来源、过程、解释、未知项，以及替换标题、摘要、生活线和活动状态。基于指定旧修订重建完整提案，复用原子写入和幂等校验；dry_run 返回预览。既有条目的移除/重排仍通过完整提案进行。

## 删除

memory_preview_delete 返回更正闭包、受影响经历和修订数，并对作用域、请求、影响面及序号签发 HMAC preview_token。memory_delete 必须携带该 token，在写事务内重算；空间中任意新写入都会使预览失效。预览令牌不是用户授权证明，上层仍须获得明确删除指令。删除来源会级联更正后续链及依赖经历的全部版本，清空正文，保留最小 tombstone/操作元数据，重放不能恢复。在线删除不等于介质擦除或服务外副本删除，MCP 不提供备份恢复入口。

## 媒体导入与相册

上层客户端把 JPEG、PNG、WebP 或 MP4 原件放进 `<数据库路径>.inbox/`。首次部署或更新后运行 `vp run setup <数据目录>` 创建入口目录。通过 stdio 调用 `memory_import_media`，传入入口目录内的单个文件名及常规材料提交参数。可选的 `observed_range_ms: [1000, 2000]` 记录上层报告的视频起止毫秒。文件类型按头部标识识别，观看范围由调用方报告。服务不会解码分析视频。示例：

```json
{
	"filename": "garden.png",
	"material": {
		"operation_id": "garden-1",
		"text": "收到了花园照片",
		"source_kind": "activity_report",
		"speaker": "camera",
		"coverage": "已收到原图，尚无视觉描述"
	}
}
```

调用方用返回的材料 ID 组织或修订经历，`memory_read` 展开描述，`memory_album` 按当前空间及世界浏览（每页最多 50 项，将 next 作为下一次的 before）。媒体文件的存储、去重与删除边界见[项目结构](architecture.md#媒体存储与快照)。
