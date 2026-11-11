### 手动配置 embedding

手动填写现有服务后 setup 会向填写的接口发送一条测试短句，自动获取向量维度。
例如，使用默认端口的 Ollama 时填写 `http://127.0.0.1:11434/v1/embeddings` 和实际模型名。

### 非交互式 setup

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

### 旧数据目录迁移

默认数据目录现在名为 `labradorite`。使用旧默认目录 `fish-memory-test` 的用户，先停止 MCP 服务和查看器，再运行 `vpr setup`。setup 会将整个旧目录改名，更新配置中指向目录内的数据库和 GGUF 文件路径，并重新生成 `mcp.json`。目录外的文件路径保持不变，自选数据目录不会自动改名。

迁移完成后，用新生成的 `Labradorite` 条目替换客户端中的旧 MCP 配置，再重新加载客户端。新旧目录同时存在时，setup 会停止并提示处理，不会合并或覆盖数据。迁移中途退出后，可以重新运行 setup 继续完成。
