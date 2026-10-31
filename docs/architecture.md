# 本地记忆试用版代码结构

## 实现范围

TypeScript/Fastify 单实例 headless 服务，模型通过独立 stdio MCP 桥接进程访问。支持原始材料保存、带来源的经历整理提案、修订历史、词法检索、更正关系、在线删除和重启后读取。整理由调用 MCP 的外部模型完成；尚无独立后台模型自动整理、embedding、多用户 ACL、备份恢复或删除账本。

## 模块

| 模块                  | 职责                                                      |
| --------------------- | --------------------------------------------------------- |
| contracts/schemas     | Draft 7 JSON Schema，HTTP 业务校验和 MCP 工具结构共享定义 |
| contracts/generated   | 从 Schema 生成的 TypeScript 类型                          |
| domain                | 时钟和 code point 来源定位                                |
| storage/materials     | SQLite 原子提交、幂等、作用域、经历修订、检索和删除       |
| transport/app         | 公共错误和健康状态                                        |
| transport/daemon      | 本机认证、能力状态、业务路由                              |
| transport/mcp         | 官方 MCP SDK 的工具发现与调用桥接                         |
| runtime-config、setup | 本机配置校验、凭据生成、MCP 配置导出                      |
| tests                 | 来源、事务、隔离、重启、经历闭环、配置及真实 MCP 集成     |

目前存储类负责同一提交边界，后续增加后台模型时再拆应用用例；不可新增绕过版本和删除规则的写入入口。

## 运行和安装结构

Node.js 24；依赖通过 `vp install --frozen-lockfile` 安装。`vp run build` 后 `vp run setup` 在本机数据目录生成 runtime.json 和 mcp.json，避免将密钥或活动数据库放进仓库。再次 setup 保留现有凭据。客户端直接运行 mcp.json 中的 Node 命令，stdout 仅用于 MCP；不要用打印任务日志的包装命令启动 stdio。

服务通过 `vp run start <runtime.json绝对路径>` 启动，也支持 FISH_MEMORY_TOKEN、FISH_MEMORY_DB、FISH_MEMORY_SPACE、FISH_MEMORY_CHARACTER、FISH_MEMORY_WORLD 环境配置。数据库父目录必须存在，活动数据库放本地非同步目录。配置文件内有密钥，应按操作系统账户保护；Windows 上 Node mode 参数不能替代 Windows ACL。

headless 固定监听 127.0.0.1:38471，端口独占保证同一网络命名空间仅一个服务实例。MCP 桥接进程允许多个，它们不拥有后台工作队列。服务仅接受配置的 bearer token，拒绝带 Origin 请求；所有持有此 token 的客户端共享一个主体及绑定作用域。

配置存储后 /health/ready 返回 local-test 就绪；完整能力以 memory_status 为准。没有存储配置则只提供诊断，ready 返回 503。

## 数据和事务

数据库 schema_version=2。用户已选择拒绝 v1 旧库，不做迁移，不删除旧文件。未知版本及未标识的其他应用数据库拒绝初始化。首次建表与版本标记原子提交。WAL、FULL 同步及外键启用；当前组织与材料操作均为短同步事务。

材料保存原文、source_kind、speaker、coverage、authored_at、received_at；输入来源是报告，不代表 speaker 身份或外部事实已被验证。coverage 防止处理两章被包装为读完整本书。corrects 引用既有合法来源；更正新增材料，不改原文。

整理提案保存 title、summary、beats、interpretations、thread、activity_state、unknowns 和 source_ids。结构门检查来源存在、作用域和引用闭合，expressed 解释要求角色声明来源。所有结果标记 model_proposed，不宣称语义已核实。独立语义模型复核尚未实现。

修订需要 id、expected_revision 和 base_seq；base_seq 使用空间提交序号作保守集合依赖，新输入令旧提案过期。旧版本保留，可展开历史。所有 operation_id 在主体+空间内跨操作检查，内容摘要使用数据库持久密钥 HMAC；同键不同操作/正文冲突。重试返回引用并重新检查可见性，不缓存可泄露已删内容的正文。

thread 目前是经历上的生活线标签，配合 activity_state 和原始来源记录进度；尚未建立独立 Thread 实体与状态转换 API。时间口径目前为来源 authored_at 和服务提交时间，尚未支持历史接触视角查询。

## 检索与治理

memory_recall 同时检索原始材料和最新经历版本。中文使用 bigram 线索，拉丁文字用词线索；按确定性词法匹配分数排序。空 query 浏览近期候选。每次最多扫描当前作用域最近 2000 条材料、500 条经历，超过时报告候选覆盖缺口。不能将空结果视为事件未发生，也不宣称支持无词面交集的语义改述。

结果附来源 ID、必要更正和过期提示；来源已被该经历纳入的更正不再误报为遗漏。max_bytes 对序列化 recall JSON 字节数硬限制，放不下则给展开目录和不足标记。单独 memory_read 是显式原文/历史展开，不承诺该 recall 预算。

memory_delete 删除指定来源、其 corrects 后续链和所有依赖经历的完整修订历史。清空原始正文并保留最小 tombstone/操作元数据；旧提交重放和旧提案引用不能复活。无原文摘要缓存或独立向量索引。在线删除不代表数据库介质取证擦除，不保护服务外副本或删除前备份；本版不提供备份恢复入口。

## 验证与协作

`vp run check` 包括契约一致性、Oxlint、Oxfmt、类型、构建和测试。未使用 ESLint，已移除 Biome；原生驱动构建许可锁定在 allowScripts。代码 Tab 缩进，宽度 4。

集成测试暂时使用固定服务端口，因此运行前应正常停止测试服务；测试不会终止其他进程。测试使用临时数据，不修改用户记忆。

main 为主分支，开发在 dev/ 分支完成后合并；ex-doc 维护研究、使用说明和 Skill，不合入 main。代码不能硬编码组织或个人仓库路径；每次 push 仍需用户明确批准。
