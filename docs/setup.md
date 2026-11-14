# 配置说明

## 手动配置 embedding

手动填写现有服务后 setup 会向填写的接口发送一条测试短句，自动获取向量维度。
例如，使用默认端口的 Ollama 时填写 `http://127.0.0.1:11434/v1/embeddings` 和实际模型名。

## 非交互式 setup

在 setup 命令后加上数据目录的路径即可指定存储位置。请选择同步盘之外的本机持久目录。已有配置再次运行 setup 时会沿用原选择。更换后端或自动部署时，可用参数指定检索方式。非交互首次运行省略模式时使用全文检索。

```sh
# 内置 llama.cpp，自动下载推荐的 Qwen 模型
vpr setup "/path/to/data" --embedding local

# 内置 llama.cpp，使用自己的 GGUF 模型
vpr setup "/path/to/data" --embedding local --model "/path/to/embedding.gguf"

# 连接已有的 llama.cpp / Ollama / 其他兼容接口（此处以 Ollama 为例）
vpr setup "/path/to/data" --embedding external --endpoint "http://127.0.0.1:11434/v1/embeddings" --model "qwen3-embedding:0.6b"

# 不使用 embedding
vpr setup "/path/to/data" --embedding lexical
```

外部接口需要认证时，加上 `--api-key-env MEMORY_EMBEDDING_API_KEY`，并为 setup 和 MCP 进程设置该环境变量。更换后端后重新加载 MCP 客户端。若客户端使用其他配置格式，照填 `mcp.json` 中的 `command` 和 `args`。

## 旧数据目录迁移

默认数据目录现在名为 `labradorite`。使用旧默认目录 `fish-memory-test` 的用户，先停止 MCP 服务和查看器，再运行 `vpr setup`。setup 会将整个旧目录改名，更新配置中指向目录内的数据库和 GGUF 文件路径，并重新生成 `mcp.json`。目录外的文件路径保持不变，自选数据目录不会自动改名。

迁移完成后，用新生成的 `Labradorite` 条目替换客户端中的旧 MCP 配置，再重新加载客户端。新旧目录同时存在时，setup 会停止并提示处理，不会合并或覆盖数据。迁移中途退出后，可以重新运行 setup 继续完成。

## 运行时配置与旧数据库

基础配置为 database（绝对路径）、space、character、world，另可提供 embedding 对象。旧 HTTP 配置不兼容，需在新目录生成配置。继续使用既有 v2 数据时，在新配置中显式指定原数据库及原作用域即可；主体仍为 local-client，保留既有幂等语义。不自动删除旧配置或数据，无 token 环境变量回退和无存储诊断模式。

## Embedding 配置与请求预算

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

每次请求前在短事务中持久预留额度，网络在事务外执行。失败和崩溃不退还额度，重启不会重置；上限按数据库、UTC 日期共享，不是金额上限。返回 usage.total_tokens 时记录已知用量，缺失时计为未知，不推算成 0 token。索引失败返回 stopped；召回降级词法并返回 EMBEDDING_DISABLED、INDEX_PENDING、EMBEDDING_BUDGET、EMBEDDING_CONFIG、EMBEDDING_UNAVAILABLE 等原因。局部索引会报告 pending_chunks，不声称语义覆盖完整。旧数据库备份的恢复会同时恢复当时的本地用量记录；没有服务外成本账本。
