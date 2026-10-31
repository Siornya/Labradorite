# 记忆服务代码结构

## 定位与进程

本项目是通用的 stdio MCP 记忆服务，由调用方 AI 客户端启动独立子进程。QQ 等平台接入、模型运行、自主活动调度、浏览器和电脑操作属于上层 AI 系统。本服务管理活动产生的来源与经历，不执行外部活动或调用模型。

AI 客户端 → stdio MCP → 记忆存储 → SQLite。

一个客户端持有一个服务进程，直接管理数据库。没有 Fastify、HTTP API、后台桥接、网络监听、固定端口或 bearer token。客户端负责进程生命周期，访问边界是操作系统账户及文件权限。独立实例应各自配置数据库；不提供多客户端后台协调或多用户 ACL。

## 模块

- src/mcp-main.ts：加载必填配置、打开数据库、连接 stdio；stdin 结束、SIGINT/SIGTERM 或传输关闭时释放存储。
- src/transport/mcp.ts：声明九个工具，直接调用存储；已知错误仅返回代码，未知错误返回 INTERNAL_ERROR。
- src/storage/materials.ts：来源、经历修订、更正、词法检索、删除和幂等事务。
- src/runtime-config.ts：检查 database、space、character、world；拒绝未知字段，包括旧 token。
- src/setup.ts：生成 runtime.json 与使用 Node 绝对路径的 mcp.json；保留合法已有配置。
- src/contracts：JSON Schema 和生成类型，存储入口执行校验。
- src/domain：可注入时钟及按 Unicode code point 定义的来源跨度。

## 启动与配置

Node.js 24。使用 vp install --frozen-lockfile、vp run build、vp run setup；setup 可指定数据目录。活动数据库放仓库之外的本地非同步持久存储。客户端加载生成的 MCP 配置，直接启动 Node；stdout 专用于 MCP，无需另启后台服务。vp run start 与 vp run mcp 均为 stdio 入口，需要传入 runtime.json 路径。

配置仅有 database（绝对路径）、space、character、world。旧 HTTP 配置不兼容，需在新目录生成配置。继续使用既有 v2 数据时，在新配置中显式指定原数据库及原作用域即可；主体仍为 local-client，保留既有幂等语义。不自动删除旧配置或数据，无 token 环境变量回退和无存储诊断模式。

## 存储与语义

schema_version=2；支持现有 v2 数据，拒绝 v1、未知版本及未标识的其他应用数据库，不迁移或删除旧文件。初始化原子提交，启用 WAL、FULL 同步和外键。

材料保留原文、来源类别、speaker 报告、覆盖范围及时间，不代表外部身份与事实已经验证。更正新增材料。经历保留来源、过程、解释、生活线标签、活动状态、未知项和修订历史，由调用方模型提出并标记 model_proposed；引用校验不保证语义真实。

整理以空间提交序号 base_seq 检查依赖，修订还需 expected_revision。operation_id 跨操作检查，持久 HMAC 摘要支持重试；重放重新检查可见性，不缓存已删除正文。

## 检索与治理

中文 bigram 和拉丁词线索检索，迭代扫描作用域内全部存活材料和最新经历版本，仅保留排名靠前的 limit+1 个候选，不再按最近 2000/500 条截断。计算成本随数据量增长，大规模部署需后续索引优化；尚无向量检索。空 query 按提交序号倒序浏览，before_seq 仅用于空 query 的更早记录翻页。

支持 kind、organization_status、channel、thread 与时间窗过滤。channel 只匹配材料报告渠道；thread 精确匹配材料或经历标签；这些都不是访问权限。时间窗可选择 received_at 或 authored_at（包含边界）；经历在 received_at 模式使用 recorded_at，authored_at 窗口不猜测经历发生时间。未知撰写时间不补填接收时间。

recall 默认返回原文短片段或明确标记的模型经历片段、命中线索、来源和更正引用，统一标为 historical_background。更正提示检查整个后续链。max_bytes 对完整 recall JSON 作硬预算，必要时退化为 ID 目录；显式 read 展开不受该预算限制。诊断返回扫描、过滤后、匹配和返回计数；不持久化查询日志，不宣称知道模型是否使用结果。

memory_status 返回当前材料/经历/修订数、pending/organized 数量、最早未整理序号、最近整理序号及最近材料。organized 按最新经历版本的引用计算，来源在新版被撤下或依赖经历删除后可回到 pending，不代表真实性确认。旧 body 中的静态状态仅为历史字段，读出时重新计算。提交返回受作用域约束的最多 10 条精确文本重复提示，不自动合并事件。

memory_preview_organize 在不写入时展示字段差异、撤下来源和共享证据的其他经历；共享证据不等于语义矛盾。memory_amend 允许追加来源、过程、解释、未知项，以及替换标题、摘要、生活线和活动状态。基于指定旧修订重建完整提案，复用原子写入和幂等校验；dry_run 返回预览。既有条目的移除/重排仍通过完整提案进行。

memory_preview_delete 返回更正闭包、受影响经历和修订数，并对作用域、请求、影响面及序号签发 HMAC preview_token。memory_delete 必须携带该 token，在写事务内重算；空间中任意新写入都会使预览失效。预览令牌不是用户授权证明，上层仍须获得明确删除指令。删除来源会级联更正后续链及依赖经历的全部版本，清空正文，保留最小 tombstone/操作元数据，重放不能恢复。在线删除不等于介质擦除或服务外副本删除，未提供备份恢复入口。

## 验证

vp run check 覆盖契约、Oxlint、Oxfmt、类型、构建和测试。真实 stdio 客户端测试使用临时数据库，验证记忆流程、重启持久化和输入错误，不占用固定端口。Tab 宽度 4，无 ESLint。
