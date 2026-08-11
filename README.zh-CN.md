# Codex 任务控制塔

[English](README.md)

一个小型、本地优先的 Codex 插件，用于根据真实证据汇总任务状态，并生成可续接、已脱敏的任务交接。

这是从实际工作方法中提炼出的通用开源工具。仓库不包含生产凭据、私人任务历史、公司数据或用户专属配置。

## 功能

- **任务控制塔**：只根据文件、命令、测试、提交、运行日志等证据，把任务标记为 `completed`、`in_progress`、`blocked` 或 `unverified`。
- **停滞识别**：不把界面里的运行状态当作进度证据，并使用明确的 20 分钟与 30 分钟阈值。
- **脱敏交接**：保留目标、已验证成果、边界、阻塞和下一步，不复制整段聊天记录。
- **公开发布扫描**：检查疑似密钥、令牌、Cookie、个人邮箱、绝对路径、会话式标识、公网地址和非 UTF-8 文件。

插件默认只读。没有用户单独授权时，不会给其他任务发消息、停止进程、修改文件或调整优先级。

## 安装

克隆或下载本仓库，然后在 Codex 插件界面中从仓库根目录安装。插件清单位于 `.codex-plugin/plugin.json`。

本地验证：

```bash
git clone <repository-url>
cd codex-task-control-tower
npm test
npm run validate:public
```

验证脚本和测试需要 Node.js 18 或更高版本；技能本身没有运行时依赖。

## 使用

可以直接告诉 Codex：

```text
使用 task-control-tower，只根据真实证据汇总这些任务。
```

```text
使用 task-handoff，生成一份简洁、脱敏、可直接续接的任务交接。
```

通用模板位于 `templates/`。

## 隐私边界

- 不包含网络服务、MCP 服务、钩子、遥测或 API 密钥。
- 扫描器不会打印命中的敏感原文，只报告文件、行号和规则。
- 仓库中唯一类似凭据的内容是专门用于测试扫描器的合成样例，并已精确列入测试白名单。
- 禁止提交真实凭据、私人资料、原始聊天、内部地址和非必要标识。

## 开发验证

```bash
npm test
npm run validate:public
```

更多信息见 [贡献指南](CONTRIBUTING.md)、[安全政策](SECURITY.md) 和 [公开发布检查表](docs/public-release-checklist.md)。

## 许可证

MIT
