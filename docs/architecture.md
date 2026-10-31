# 记忆服务代码结构

## 定位与进程

本项目是通用的 stdio MCP 记忆服务，由调用方 AI 客户端启动独立子进程。QQ 等平台接入、模型运行、自主活动调度、浏览器和电脑操作属于上层 AI 系统。本服务管理活动产生的来源与经历，不执行外部活动或生成回复；显式配置后可调用 embedding 接口构建检索向量。

AI 客户端 → stdio MCP → 记忆存储 → SQLite。

一个客户端持有一个服务进程，直接管理数据库。没有 Fastify、HTTP API、后台桥接、网络监听、固定端口或 bearer token。客户端负责进程生命周期，访问边界是操作系统账户及文件权限。独立实例应各自配置数据库；不提供多客户端后台协调或多用户 ACL。

## 模块

- src/mcp-main.ts：加载必填配置、打开数据库、连接 stdio；stdin 结束、SIGINT/SIGTERM 或传输关闭时释放存储。
- src/transport/mcp.ts：声明十个工具，直接调用存储；已知错误仅返回代码，未知错误返回 INTERNAL_ERROR。
- src/storage/materials.ts：来源、经历修订、更正、候选可见性、召回封装、删除和幂等事务。
- src/retrieval/index.ts：同库全文与向量派生索引、分片、请求用量、分批构建及过期写回防护。
- src/retrieval/algorithms.ts：中文分析、向量归一化与确定性排名融合。
- src/providers/embedding.ts：有界 OpenAI 兼容 embedding 请求及响应校验。
- src/runtime-config.ts：检查 database、space、character、world 与可选 embedding；拒绝未知字段，包括旧 token。
- src/setup.ts：生成 runtime.json 与使用 Node 绝对路径的 mcp.json；保留合法已有配置。
- src/contracts：JSON Schema 和生成类型，存储入口执行校验。
- src/domain：可注入时钟及按 Unicode code point 定义的来源跨度。

## 启动与配置

Node.js 24。使用 vp install --frozen-lockfile、vp run build、vp run setup；setup 可指定数据目录。活动数据库放仓库之外的本地非同步持久存储。客户端加载生成的 MCP 配置，直接启动 Node；stdout 专用于 MCP，无需另启后台服务。vp run start 与 vp run mcp 均为 stdio 入口，需要传入 runtime.json 路径。

基础配置为 database（绝对路径）、space、character、world，另可提供 embedding 对象。旧 HTTP 配置不兼容，需在新目录生成配置。继续使用既有 v2 数据时，在新配置中显式指定原数据库及原作用域即可；主体仍为 local-client，保留既有幂等语义。不自动删除旧配置或数据，无 token 环境变量回退和无存储诊断模式。

## 存储与语义

schema_version=3；支持 v2 原地升级。升级事务创建派生表并分批读取材料及最新经历回填 FTS，成功后才更新版本；失败回滚。原文、修订、更正、幂等记录、删除标记和空间序号保持原样，升级本身不发起网络请求。v1、未知版本和未标识的其他应用数据库仍被拒绝，不删除旧文件。启用 WAL、FULL 同步和外键。v3 库不能再交给仅支持 v2 的旧程序打开。

材料保留原文、来源类别、speaker 报告、覆盖范围及时间，不代表外部身份与事实已经验证。更正新增材料。经历保留来源、过程、解释、生活线标签、活动状态、未知项和修订历史，由调用方模型提出并标记 model_proposed；引用校验不保证语义真实。

整理以空间提交序号 base_seq 检查依赖，修订还需 expected_revision。operation_id 跨操作检查，持久 HMAC 摘要支持重试；重放重新检查可见性，不缓存已删除正文。

## 检索与治理

非空 query 使用 SQLite FTS5/BM25：NFKC、小写、中文 unigram+bigram、其他文字词线索及 emoji 转为十六进制安全 token，用户输入不直接作为 MATCH 表达式。材料与最新经历的搜索文本分为 1024 code point 片段，重叠 128；经历搜索文本按标题、摘要、过程、解释、未知项顺序以换行连接。

可选语义通道按当前模型配置对应的向量空间做精确余弦检索，默认 min_similarity=0.2，可配置；该阈值未经真实数据质量验收。每个文档在每个通道仅保留最佳片段，先应用范围、时间等过滤，再使用等权 RRF（k=60）融合文档排名；同分按 ID 确定性排序。无查询改写、生成模型、ANN、多跳扩散或自动实体消歧。空 query 仍按提交序号倒序浏览，before_seq 仅用于此模式，不调用 embedding。

MCP 使用异步 recallAsync，在事务外请求查询向量，返回后重新查询当前索引并通过权威记录检查可见性，最终输出基于新的 snapshot_seq。内部同步 recall 只使用词法通道，标明 SYNC_LEXICAL_ONLY。新材料的 FTS 立即可用，向量未完成时仍保留词法路径。FTS 按匹配候选读取正文；向量当前逐片扫描 O(片段数×维度)，候选排名保留 ID 与轻量元数据，最终才保留所选正文；广泛命中时仍会使用较多 CPU 与候选列表内存，不宣称大规模或高并发性能。

支持 kind、organization_status、channel、thread 与时间窗过滤。channel 只匹配材料报告渠道；thread 精确匹配材料或经历标签；这些都不是访问权限。时间窗可选择 received_at 或 authored_at（包含边界）；经历在 received_at 模式使用 recorded_at，authored_at 窗口不猜测经历发生时间。未知撰写时间不补填接收时间。

recall 默认返回原文短片段或明确标记的模型经历片段、命中线索、来源和更正引用，统一标为 historical_background。更正提示检查整个后续链。max_bytes 对完整 recall JSON 作硬预算，必要时退化为 ID 目录；显式 read 展开不受该预算限制。片段附 code point 起止位置：material.text 或上述 episode_search_text；经历片段不冒充原文。诊断返回候选读取（scanned）、过滤后、匹配和返回计数，以及语义实际使用与降级原因、未完成片段数；不持久化查询日志，不宣称知道模型是否使用结果。

memory_status.retrieval 返回当前片段数、当前模型空间已嵌入/待嵌入片段、索引版本、UTC 当日请求次数和已知 token 用量。

memory_status 返回当前材料/经历/修订数、pending/organized 数量、最早未整理序号、最近整理序号及最近材料。organized 按最新经历版本的引用计算，来源在新版被撤下或依赖经历删除后可回到 pending，不代表真实性确认。旧 body 中的静态状态仅为历史字段，读出时重新计算。提交返回受作用域约束的最多 10 条精确文本重复提示，不自动合并事件。

memory_preview_organize 在不写入时展示字段差异、撤下来源和共享证据的其他经历；共享证据不等于语义矛盾。memory_amend 允许追加来源、过程、解释、未知项，以及替换标题、摘要、生活线和活动状态。基于指定旧修订重建完整提案，复用原子写入和幂等校验；dry_run 返回预览。既有条目的移除/重排仍通过完整提案进行。

memory_preview_delete 返回更正闭包、受影响经历和修订数，并对作用域、请求、影响面及序号签发 HMAC preview_token。memory_delete 必须携带该 token，在写事务内重算；空间中任意新写入都会使预览失效。预览令牌不是用户授权证明，上层仍须获得明确删除指令。删除来源会级联更正后续链及依赖经历的全部版本，清空正文，保留最小 tombstone/操作元数据，重放不能恢复。删除在同一事务移除相关全文片段与所有模型空间的向量；经历修订撤下旧版本索引。异步向量写回只接受仍存在的精确片段 key，不能复活删除内容或旧修订。在线删除不等于介质擦除或服务外副本删除，未提供备份恢复入口。

## 验证

vp run check 覆盖契约、Oxlint、Oxfmt、类型、构建和测试。真实 stdio 客户端测试使用临时数据库，验证记忆流程、重启持久化和输入错误，不占用固定端口。Tab 宽度 4，无 ESLint。

## Embedding 配置与生命周期

runtime.json 中可选字段示例（endpoint 为完整接口 URL；数值须匹配所选服务）：

```json
{
	"embedding": {
		"endpoint": "https://your-provider.example/v1/embeddings",
		"model": "your-embedding-model",
		"dimensions": 1536,
		"api_key_env": "MEMORY_EMBEDDING_API_KEY",
		"max_requests_per_day": 100,
		"timeout_ms": 10000,
		"min_similarity": 0.2,
		"request_dimensions": false
	}
}
```

未配置 embedding 时完全本地检索。密钥只从服务进程环境读取；setup 保留既有合法配置，不在文件中保存密钥。允许 HTTPS 或本机 loopback HTTP；拒绝 URL 用户信息、查询参数、重定向。模型名、返回索引、维度、有限数值与非零向量均须匹配；request_dimensions=true 时向服务显式发送 dimensions，false 时只验证默认输出维度。响应 model 必须等于配置名。

memory_index({max_batches:1}) 显式构建待处理片段，每批最多 8 段、单次 1–16 批；重复调用直至 pending_chunks=0，重启后跳过已完成部分。配置该服务表示允许将这些原文/经历片段发往 endpoint。memory_recall 默认 hybrid，有可用向量时发送查询文本；mode=lexical、空查询或没有已完成向量时不发送。无后台自动计费任务、自动重试或查询向量缓存。

向量空间指纹包括 endpoint、model、维度、密钥环境变量名、维度请求模式、分析器和切片版本，不包含密钥值。配置变化后原向量不混用；同名模型被服务方替换时需要使用新的模型标识或不同 endpoint，不能自动检测语义漂移。旧空间向量不会参与新空间检索，相关材料删除时一并清理。

每次请求前在短事务中持久预留额度，网络在事务外执行。失败和崩溃不退还额度，重启不会重置；上限按数据库、UTC 日期共享，不是金额上限。返回 usage.total_tokens 时记录已知用量，缺失时计为未知，不推算成 0 token。索引失败返回 stopped；召回降级词法并返回 EMBEDDING_DISABLED、INDEX_PENDING、EMBEDDING_BUDGET、EMBEDDING_CONFIG、EMBEDDING_UNAVAILABLE 等原因。局部索引会报告 pending_chunks，不声称语义覆盖完整。旧数据库备份的恢复会同时恢复当时的本地用量记录；没有服务外成本账本。

实现依据：[SQLite FTS5](https://www.sqlite.org/fts5.html)、[Embedding 请求与响应格式](https://developers.openai.com/api/reference/typescript/resources/embeddings/methods/create)。算法参数是本项目初始策略，不代表真实模型评测结论。
