# MCP 工具参考

本文说明工具的字段含义、调用约定和可观察行为。工具总览见 [README](../README.md#材料经历与检索)，实现分层见[项目结构](architecture.md)。

## 人物档案与回顾

人物由 space、world 和档案 ID 定位，同名档案可用身份线索区分。建档与回顾由上层 AI 提议。整理请求的可选 person_review 与经历在同一事务中写入，也可单独回顾既有经历。每次回顾保存服务记录时间和引用的经历 ID、修订号。有新印象时保存完整判断，只关联经历时沿用当前印象。首次引用的经历同时支撑建档身份。

删除预览中的 person_ids 列出建档依据被删除而须整体移除的档案，person_reviews 列出其他档案中受影响的单次回顾。删除后者会清除正文和该次的全部引用，保留修订序号。如果当前判断被移除，旧判断仍可作为历史读取，当前印象置空，直到角色再次形成判断。

## 检索与索引

启用 embedding 后，memory_review 成功保存经历或人物回顾就会触发后台索引。预览和无效提案不会触发。memory_review({}) 或省略 arguments 表示直接结束回顾并触发当前作用域的索引，不写入经历。最多等待 1 秒，已结束时返回 indexing.state（completed、disabled 或 stopped），停止原因见 indexing.reason。仍在运行时返回 running，后台继续索引；通过 memory_status 的 retrieval.pending_chunks 查看剩余片段数，retrieval.indexing 查看任务状态和原因。MCP 空闲计时从服务启动或最后一个并发工具调用结束时开始，默认 120 分钟，可用 runtime.json 的 index_idle_minutes 调整。空闲任务遇到工具调用会在批次边界暂停，回顾触发的索引持续至完成或遇到错误。索引会将待处理的原文和经历片段发送到配置的 embedding 服务，受每日请求预算约束。memory_recall 默认 hybrid，有可用向量时发送查询文本；mode=lexical、空查询或没有已完成向量时不发送查询文本。

支持 kind、review_status、channel、thread 与时间窗过滤。channel 只匹配材料报告渠道；thread 精确匹配材料或经历标签；这些都不是访问权限。时间窗可选择 received_at、authored_at、review 或 happen（查询边界包含在内）；经历在 received_at 模式使用 review，authored_at 窗口不猜测经历发生时间。review 和 happen 仅选择经历。未知撰写时间不补填接收时间。

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

## 事件发生时间

`memory_review` 和 `memory_amend` 的可选 `happen` 描述经历实际发生的时间，独立于服务生成的 `review`。新建时省略即未知；修订时省略保留原值；显式 `{ "kind": "unknown" }` 清除时间定位。不解析摘要中的日期自动填充。

```json
{
	"kind": "point",
	"start": { "value": "2026-10", "precision": "month" },
	"utc_offset": "+08:00",
	"description": "十月去杭州，具体日期不记得",
	"basis": "stated",
	"source_ids": ["材料ID"]
}
```

- `kind: point` 只提供 `start`，表示在该精度范围内发生，不代表持续整个范围。
- `kind: interval` 提供 `start` 和／或 `end`，表示实际起止；缺少的一端未知，不代表事件仍在持续。完全未知使用 `kind: unknown`，不能携带起止或时区。
- 端点的 `precision` 为 `year`、`month`、`day`、`second` 或 `millisecond`；对应 `value` 为 `YYYY`、`YYYY-MM`、`YYYY-MM-DD`、带时区且无小数的 ISO 时间、带时区且含三位毫秒的 ISO 时间。区间两端可用不同精度。
- 年／月／日必须提供固定 `utc_offset`（`Z` 或 `±HH:MM`，最大 ±14:00）；精确时刻使用值中自带的偏移。需要夏令时变换时，应提供各端点实际偏移的精确时刻。
- 已知或部分已知的时间必须提供 `basis: stated`（来源明确陈述）或 `inferred`（模型推断），以及属于经历 `source_ids` 的时间依据。`description` 保留原始表达；“上个月”等相对时间由调用方根据材料上下文定位，不按整理当天自动解释。

`memory_recall({query: "", time_basis: "happen", from: "2026-10-01T00:00:00+08:00", to: "2026-10-31T23:59:59.999+08:00"})` 查询可能在十月发生的经历。时间窗口与可能范围相交即命中，粗精度或部分未知的命中不保证事件确实发生于窗口内。未知时间不匹配窗口；不设窗口则保留未知条目并排在末尾。空查询按发生时间倒序，有关键词的查询保持相关性排序。返回的 `happen` 保留原始精度和依据，`time` 不伪造精确时刻。极小响应预算退化成 ID 目录时，可通过 `memory_read` 展开。

查看器经历页默认按发生时间浏览，支持切换记录时间、输入带时区的起止时间以及仅查看未知发生时间；分页保留筛选条件。详情和 Markdown 导出同时展示发生时间、整理时间及时间依据。多次提及同一事件应由上层模型找到并修订已有经历；本服务不自动判定事件同一性。
