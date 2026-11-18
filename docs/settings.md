# 运行时设置

打开 Web 查看器，选择记忆库后点击导航栏的“设置”。在此可调整空闲索引时长，以及已配置 embedding 时的每日请求上限。点击“保存设置”，再重启该记忆库的 MCP 服务。

其他参数请打开 setup 输出的 `runtime.json`，修改后重启 MCP 服务。首次接入或切换 embedding 后端的步骤见[安装配置说明](setup.md)。

## 记忆库与作用域

`database` 是记忆库文件的绝对路径。`space`、`character`、`world` 分别指定空间、角色和世界。连接已有记忆库时，使用对应的数据库路径和作用域。调用主体为 `local-client`，幂等记录按该主体保存。

## 空闲索引

启用 embedding 后，从服务启动或最后一个 MCP 工具调用结束时开始计时。默认连续空闲 **120 分钟**后处理待索引片段。要改成半小时，在 `runtime.json` 顶层设置 `"index_idle_minutes": 30`。单位为分钟，可填 1 至 35791 的整数。

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

每次请求前在短事务中持久预留额度，网络在事务外执行。失败和崩溃不退还额度，重启不会重置；上限按数据库、UTC 日期共享，不是金额上限。返回 usage.total_tokens 时记录已知用量，缺失时计为未知，不推算成 0 token。索引失败返回 stopped；召回降级词法并返回 EMBEDDING_DISABLED、INDEX_PENDING、EMBEDDING_BUDGET、EMBEDDING_CONFIG、EMBEDDING_UNAVAILABLE 等原因。局部索引会报告 pending_chunks，不声称语义覆盖完整。恢复数据库备份会同时恢复当时的本地用量记录；没有服务外成本账本。
