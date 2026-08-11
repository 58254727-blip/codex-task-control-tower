# Codex 任务控制塔

[![CI](https://github.com/58254727-blip/codex-task-control-tower/actions/workflows/ci.yml/badge.svg)](https://github.com/58254727-blip/codex-task-control-tower/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/58254727-blip/codex-task-control-tower)](https://github.com/58254727-blip/codex-task-control-tower/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English](README.md)

一个本地优先的 Codex 开发编排插件：接收一个边界明确的软件目标，自动拆解为最小充分任务图，为就绪任务选择当前可用的 Skill，按证据推进执行并完成最终验收，同时保留任务监控和脱敏交接能力。

这是从实际工作方法中提炼出的通用开源工具。仓库不包含生产凭据、私人任务历史、公司数据或用户专属配置。

## 60 秒演示

```bash
git clone https://github.com/58254727-blip/codex-task-control-tower.git
cd codex-task-control-tower
npm ci
npm test
npm run validate:public
```

然后从 Codex 插件界面安装仓库根目录，并输入：

```text
使用 execution-controller，把这个边界明确的软件目标从规划推进到验证完成。
```

完整过程见[合成端到端演示](docs/demo.md)。它展示规划、路由、执行、验证、
状态和交接产物，全部使用合成内容，不包含私人任务历史。

## 功能

- **开发任务规划**：生成最小充分任务图，明确依赖、写入范围、成功标准、验证方式和停止条件。
- **Skill 路由**：每个任务只选择一个当前可用的主要 Skill；没有合适 Skill 时明确记录保守回退，不虚构调用。
- **执行控制**：通过一个入口推进依赖已满足的任务、记录证据，并在同类失败两次后安全停止该路径。
- **验证门槛**：验证目标行为、针对性测试、相关回归，以及适用的隐私和发布检查。
- **任务控制塔**：只根据文件、命令、测试、提交、运行日志等证据，把任务标记为 `completed`、`in_progress`、`blocked` 或 `unverified`。
- **停滞识别**：不把界面里的运行状态当作进度证据，并使用明确的 20 分钟与 30 分钟阈值。
- **脱敏交接**：保留目标、已验证成果、边界、阻塞和下一步，不复制整段聊天记录。
- **公开发布扫描**：检查疑似密钥、令牌、Cookie、个人邮箱、绝对路径、会话式标识、公网地址和非 UTF-8 文件。

它不是后台守护进程，只在当前 Codex 任务中、依据当前可用工具、Skill、权限和用户指令运行。它不会安装缺失 Skill，也不会自动获得部署、发布、生产数据、凭据或破坏性操作权限。`task-control-tower` 仍然默认只读，除非用户另行授权干预。

## 安装

克隆或下载本仓库，然后在 Codex 插件界面中从仓库根目录安装。插件清单位于 `.codex-plugin/plugin.json`。

本地验证：

```bash
git clone https://github.com/58254727-blip/codex-task-control-tower.git
cd codex-task-control-tower
npm test
npm run validate:public
```

验证脚本和测试需要 Node.js 18 或更高版本；技能本身没有运行时依赖。

## 使用

可以直接告诉 Codex：

```text
使用 execution-controller，把这个边界明确的软件目标从规划推进到验证完成。
```

这个入口会依次应用任务规划、Skill 路由、执行控制和验证门槛，不需要用户为每个阶段重复下命令。

```text
使用 task-control-tower，只根据真实证据汇总这些任务。
```

```text
使用 task-handoff，生成一份简洁、脱敏、可直接续接的任务交接。
```

通用模板位于 `templates/`。

插件包含六个 Skill：

- `execution-controller`
- `development-planner`
- `skill-router`
- `verification-gate`
- `task-control-tower`
- `task-handoff`

## 隐私边界

- 不包含网络服务、MCP 服务、钩子、遥测或 API 密钥。
- 规划和路由不会产生任何外部操作授权。
- 扫描器不会打印命中的敏感原文，只报告文件、行号和规则。
- 仓库中唯一类似凭据的内容是专门用于测试扫描器的合成样例，并已精确列入测试白名单。
- 禁止提交真实凭据、私人资料、原始聊天、内部地址和非必要标识。

## 开发验证

```bash
npm test
npm run validate:public
```

更多信息见 [贡献指南](CONTRIBUTING.md)、[路线图](ROADMAP.md)、
[安全政策](SECURITY.md)、[变更记录](CHANGELOG.md)和
[公开发布检查表](docs/public-release-checklist.md)。

## 许可证

MIT
