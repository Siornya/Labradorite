# 记忆服务代码结构

## 定位与进程

本项目是通用的 stdio MCP 记忆服务，由调用方 AI 客户端启动独立子进程。QQ 等平台接入、对话模型运行、自主活动调度、浏览器和电脑操作属于上层 AI 系统。本服务管理活动产生的来源与经历，可使用本地或外部 embedding 服务构建检索向量。

AI 客户端 → stdio MCP → 记忆存储 → SQLite。

一个客户端持有一个服务进程，直接管理数据库。记忆工具直接使用 stdio。默认随服务启动的只读查看器另行监听本机回环地址。客户端负责进程生命周期，访问边界是操作系统账户及文件权限。独立实例应各自配置数据库；不提供多客户端后台协调或多用户 ACL。

## 模块

- src/mcp-main.ts：加载必填配置、打开数据库、连接 stdio；stdin 结束、SIGINT/SIGTERM 或传输关闭时释放存储。
- src/transport/mcp.ts 声明 MCP 工具并调用存储。已知错误返回错误代码，未知错误返回 INTERNAL_ERROR。
- src/storage/profiles.ts 定义人物档案、回顾历史和经历版本引用，供服务、查看器与导出共用。
- src/storage/materials.ts：来源、经历修订、更正、候选可见性、召回封装、删除和幂等事务。
- src/retrieval/index.ts：同库全文与向量派生索引、分片、请求用量、分批构建及过期写回防护。
- src/retrieval/algorithms.ts：中文分析、向量归一化与确定性排名融合。
- src/providers/embedding.ts：有界 OpenAI 兼容 embedding 请求及响应校验。
- src/runtime-config.ts：检查 database、space、character、world、embedding 和内置模式的 local_model。
- scripts/setup-embedding.ts 与 src/providers/llama-install.ts：选择检索方式，安装并验证内置引擎与模型。
- src/providers/local-embedding.ts：启动或复用本地 llama-server，为建索引和检索生成向量。
- scripts/setup.ts：生成 runtime.json 与使用 Node 绝对路径的 mcp.json；保留合法已有配置。
- src/contracts：JSON Schema 和生成类型，存储入口执行校验。
- src/domain：可注入时钟及按 Unicode code point 定义的来源跨度。

## 启动与配置

Node.js >=24，由 vp 按 engines.node 选择运行时，构建目标为 Node.js 24。使用 vp install --frozen-lockfile、vp run build、vp run setup；setup 可指定数据目录。活动数据库放仓库之外的本地非同步持久存储。客户端加载生成的 MCP 配置，直接启动 Node；stdout 专用于 MCP，无需另启后台服务。vp run start 与 vp run mcp 均为 stdio 入口，需要传入 runtime.json 路径。

基础配置为 database（绝对路径）、space、character、world，另可提供 embedding 对象。旧 HTTP 配置不兼容，需在新目录生成配置。继续使用既有 v2 数据时，在新配置中显式指定原数据库及原作用域即可；主体仍为 local-client，保留既有幂等语义。不自动删除旧配置或数据，无 token 环境变量回退和无存储诊断模式。

## 存储与语义

当前数据库版本为 v4。服务打开 v2 库时先建检索索引并回填可见记录，打开 v3 库时在事务中创建空的人物档案表并更新版本。原文、修订、更正、幂等记录、删除标记和空间序号均保留。升级使用本地数据库。服务拒绝 v1、未知版本和未标识的其他应用数据库。启用 WAL、FULL 同步和外键。

人物由 space、world 和档案 ID 定位，同名档案可用身份线索区分。建档与回顾由上层 AI 提议。整理请求的可选 person_review 与经历在同一事务中写入，也可单独回顾既有经历。每次回顾保存服务记录时间和引用的经历 ID、修订号。有新印象时保存完整判断，只关联经历时沿用当前印象。首次引用的经历同时支撑建档身份。

删除预览中的 person_ids 列出建档依据被删除而须整体移除的档案，person_reviews 列出其他档案中受影响的单次回顾。删除后者会清除正文和该次的全部引用，保留修订序号。如果当前判断被移除，旧判断仍可作为历史读取，当前印象置空，直到角色再次形成判断。

材料保留原文、来源类别、speaker 报告、覆盖范围及时间，不代表外部身份与事实已经验证。更正新增材料。经历保留来源、过程、解释、生活线标签、活动状态、未知项和修订历史，由调用方模型提出并标记 model_proposed；引用校验不保证语义真实。

整理以空间提交序号 base_seq 检查依赖，修订还需 expected_revision。operation_id 跨操作检查，持久 HMAC 摘要支持重试；重放重新检查可见性，不缓存已删除正文。

## 检索与治理

非空 query 使用 SQLite FTS5/BM25：NFKC、小写、中文 unigram+bigram、其他文字词线索及 emoji 转为十六进制安全 token，用户输入不直接作为 MATCH 表达式。材料与最新经历的搜索文本分为 1024 code point 片段，重叠 128；经历搜索文本按标题、摘要、过程、解释、未知项顺序以换行连接。

可选语义通道按当前模型配置对应的向量空间做精确余弦检索，默认 min_similarity=0.2，可配置；该阈值未经真实数据质量验收。每个文档在每个通道仅保留最佳片段，先应用范围、时间等过滤，再使用等权 RRF（k=60）融合文档排名；同分按 ID 确定性排序。无查询改写、生成模型、ANN、多跳扩散或自动实体消歧。空 query 仍按提交序号倒序浏览，before_seq 仅用于此模式，不调用 embedding。

MCP 使用异步 recallAsync，在事务外请求查询向量，返回后重新查询当前索引并通过权威记录检查可见性，最终输出基于新的 snapshot_seq。内部同步 recall 只使用词法通道，标明 SYNC_LEXICAL_ONLY。新材料的 FTS 立即可用，向量未完成时仍保留词法路径。FTS 按匹配候选读取正文；向量当前逐片扫描 O(片段数×维度)，候选排名保留 ID 与轻量元数据，最终才保留所选正文；广泛命中时仍会使用较多 CPU 与候选列表内存，不宣称大规模或高并发性能。

支持 kind、review_status、channel、thread 与时间窗过滤。channel 只匹配材料报告渠道；thread 精确匹配材料或经历标签；这些都不是访问权限。时间窗可选择 received_at 或 authored_at（包含边界）；经历在 received_at 模式使用 recorded_at，authored_at 窗口不猜测经历发生时间。未知撰写时间不补填接收时间。

recall 默认返回原文短片段或明确标记的模型经历片段、命中线索、来源和更正引用，统一标为 historical_background。更正提示检查整个后续链。max_bytes 对完整 recall JSON 作硬预算，必要时退化为 ID 目录；显式 read 展开不受该预算限制。片段附 code point 起止位置：material.text 或上述 episode_search_text；经历片段不冒充原文。诊断返回候选读取（scanned）、过滤后、匹配和返回计数，以及语义实际使用与降级原因、未完成片段数；不持久化查询日志，不宣称知道模型是否使用结果。

memory_status.retrieval 返回当前片段数、当前模型空间已嵌入/待嵌入片段、索引版本、UTC 当日请求次数和已知 token 用量。

memory_status 返回当前材料/经历/修订数、pending/reviewed 数量、最早未整理序号、最近整理序号及最近材料。reviewed 按最新经历版本的引用计算，来源在新版被撤下或依赖经历删除后可回到 pending，不代表真实性确认。旧 body 中的静态状态仅为历史字段，读出时重新计算。提交返回受作用域约束的最多 10 条精确文本重复提示，不自动合并事件。

memory_review 设置 dry_run 为 true 时只预览，展示字段差异、撤下来源和共享证据的其他经历；共享证据不等于语义矛盾。memory_amend 允许追加来源、过程、解释、未知项，以及替换标题、摘要、生活线和活动状态。基于指定旧修订重建完整提案，复用原子写入和幂等校验；dry_run 返回预览。既有条目的移除/重排仍通过完整提案进行。

memory_preview_delete 返回更正闭包、受影响经历和修订数，并对作用域、请求、影响面及序号签发 HMAC preview_token。memory_delete 必须携带该 token，在写事务内重算；空间中任意新写入都会使预览失效。预览令牌不是用户授权证明，上层仍须获得明确删除指令。删除来源会级联更正后续链及依赖经历的全部版本，清空正文，保留最小 tombstone/操作元数据，重放不能恢复。删除在同一事务移除相关全文片段与所有模型空间的向量；经历修订撤下旧版本索引。异步向量写回只接受仍存在的精确片段 key，不能复活删除内容或旧修订。在线删除不等于介质擦除或服务外副本删除，未提供备份恢复入口。

## 验证

vp run build 使用 vp pack 打包 Node ESM 服务和 setup 入口，生成源码映射；运行时依赖由 Node 加载。vp run test 先构建再运行 Vitest；直接使用 vp test 时需先执行 vp run build。测试仅发现 tests/ 下的测试，避免扫描备份目录和构建产物。vp run check 覆盖契约、Oxlint、Oxfmt、类型、构建和测试。真实 stdio 客户端测试使用临时数据库，验证记忆流程、重启持久化和输入错误，不占用固定端口。Tab 宽度 4，无 ESLint。

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

外部接口的向量空间指纹包括 endpoint、model、维度、密钥环境变量名、维度请求模式、分析器和切片版本。同名模型被服务方替换时需要使用新的模型标识或不同 endpoint。旧空间向量随相关材料删除。

内置模式由 setup 验证引擎和 GGUF，并将模型绝对路径及 SHA-256 保存到 `local_model`。MCP 和查看器有语义请求时复用本机端口上提供该模型的进程，或校验文件后启动 llama-server。运行包在用户缓存中，配置文件只指定模型。内置索引根据模型内容、引擎版本及输入处理方式识别；端口变化可以复用索引。推荐模型为 Qwen3-Embedding-0.6B Q8_0。内置模式将每个检索片段整体编码。选择自定义 GGUF 时，模型的上下文应能容纳项目最长 1024 个码点的片段。

每次请求前在短事务中持久预留额度，网络在事务外执行。失败和崩溃不退还额度，重启不会重置；上限按数据库、UTC 日期共享，不是金额上限。返回 usage.total_tokens 时记录已知用量，缺失时计为未知，不推算成 0 token。索引失败返回 stopped；召回降级词法并返回 EMBEDDING_DISABLED、INDEX_PENDING、EMBEDDING_BUDGET、EMBEDDING_CONFIG、EMBEDDING_UNAVAILABLE 等原因。局部索引会报告 pending_chunks，不声称语义覆盖完整。旧数据库备份的恢复会同时恢复当时的本地用量记录；没有服务外成本账本。

实现依据：[SQLite FTS5](https://www.sqlite.org/fts5.html)、[Embedding 请求与响应格式](https://developers.openai.com/api/reference/typescript/resources/embeddings/methods/create)。算法参数是本项目初始策略，不代表真实模型评测结论。

## 媒体材料、相册与搬迁

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

媒体字节按 SHA-256 和格式存入同文件系统的 `<数据库路径>.media/`。SQLite 的材料记录保存媒体引用、原文件名、大小及文字。相同内容复用文件，不同观察可以分别登记。调用方用返回的材料 ID 组织或修订经历，`memory_read` 展开描述，`memory_album` 按当前空间及世界浏览（每页最多 50 项，将 next 作为下一次的 before）。入口文件由提供者管理。删除材料后，相册和新导出不再包含已删除记录。媒体文件可能被其他记录共享，现有在线删除仅解除引用，原始字节和既有备份仍可能存在。导入过程中若进程意外终止，也可能留下无引用文件。

本地管理入口：

```sh
vp run library markdown /path/to/runtime.json /path/to/new-vault
vp run library backup /path/to/runtime.json /path/to/new-backup
vp run library restore /path/to/new-backup /path/to/new-data
```

三个命令都要求输出目录尚未存在。Markdown 导出当前作用域的材料、经历各修订、人物档案及印象依据、相对来源链接、媒体副本和可打开的 Album.md。可读副本由 SQLite 快照生成。完整备份覆盖数据库内所有空间，包含 SQLite 快照、快照中仍有引用的媒体和校验清单。恢复核验数据库及媒体文件，在新目录重建 runtime.json；重新执行 setup 生成 MCP 配置，如需 embedding 则补上服务配置。备份保留索引及幂等状态；恢复旧快照也会恢复备份时仍存在的记忆。服务外文件、入口目录和 API 凭据不在备份内。

## 只读 Web 查看器

MCP 服务默认启动并管理查看器子进程，标准错误输出登录链接，stdout 专用于协议。优先使用 4317 端口，若已占用则使用系统分配的端口，以登录链接为准。服务退出后关闭所启动的查看器。传入 `--no-webview` 可关闭自动启动，例如 `node dist/src/mcp-main.js /path/to/runtime.json --no-webview`。

在浏览器打开终端输出的完整登录链接，点“打开当前记忆库”使用服务实际传入的配置路径；也可展开“选择其他目录”浏览运行查看器的机器。选中的库按浏览器会话独立管理。在无桌面服务器上启动 MCP 服务后，可在自己的电脑上建立 SSH 隧道（将两个 4317 替换为服务日志中的实际端口）：

```sh
ssh -N -L 4317:127.0.0.1:4317 user@server
```

保持隧道连接，在本机浏览器打开服务器输出的链接。每次启动生成新的随机访问凭证，请仅在受信任的终端查看链接。关闭查看器进程即结束访问。上层 AI 仍由 stdio MCP 接入。

查看器以只读 SQLite 连接访问配置指定的空间、角色与世界。材料、经历、人物档案与相册支持分页和文字匹配；经历详情提供修订历史和原始材料链接，材料详情显示更正、覆盖范围与归档媒体。视频支持 HTTP Range。服务只绑定 127.0.0.1，页面无外部资源，受保护的媒体路由按材料 ID 重新核验可见性。

全库搜索通过 MaterialStore.recallAsync 排序，覆盖材料（包括媒体描述）与当前经历。每次查询最多展示 20 条材料和经历，可打开权威记录；命中旧来源时显示更正提示。纯全文查询使用只读连接，混合查询使用现有向量索引并预留数据库共享的请求预算。只有配置 embedding 且已有可用向量时才会发送查询，失败会降级并显示实际策略。查看器的搜索连接接受已有 v3、v4 库，不执行初始化或升级。v4 全库搜索还按姓名和身份线索展示最多 50 份人物档案。分类页另有当前列表的文字筛选。

材料反向关联取自当前作用域内最新经历修订的来源引用。相册列表按需将照片转为最大 480×320 的 WebP，短描述取自已保存的材料正文；最多在进程内缓存 64 张。媒体请求会重新验证来源可见，详情仍可查看原文件。

无桌面实例在用户目录 ~/.labradorite/viewers/ 记录当前进程的访问地址。登录链接是一项本机账户凭据。Unix 目录权限为 0700，记录为 0600；Windows 依赖账户目录 ACL。同一账号运行 vpr viewer:url 可重新取得正在监听的实例地址及对应 SSH 转发命令。命令探测本机实例，不依赖服务日志；服务退出后旧链接失效。
