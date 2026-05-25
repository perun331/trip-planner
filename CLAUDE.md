# CLAUDE.md - 高德地图行程规划

## 项目简介

基于高德地图的移动端行程规划网页工具。帮助用户规划"吃什么、去哪里、住哪里"，生成一份完整行程。纯前端 React 应用，无需后端。

## 规范文档路径

在开始任何开发工作前，务必先阅读对应的规范文档：

| 文档 | 路径 | 内容 |
|------|------|------|
| 需求文档 | [docs/requirements.md](docs/requirements.md) | 用户需求、功能描述 |
| 技术规格 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈、组件树、数据流、API 清单 |
| UI 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 色彩、字体、间距、组件样式 |
| 开发步骤 | [docs/dev-steps.md](docs/dev-steps.md) | 分 Phase 的执行清单 |

## 开发日志

每次开发结束后，更新 [dev-log/](dev-log/) 目录下当天的日志文件（按日期命名，如 `2026-05-25.md`），记录：
- 当天完成了什么
- 待办事项
- 遇到的问题（如有）

## 开发工作流

1. **开始工作前**：阅读 `docs/dev-steps.md`，确认当前 Phase 和待办项
2. **开发中**：遵循 `docs/tech-spec.md` 的技术方案和 `docs/design-spec.md` 的 UI 规范
3. **完成一个 Phase 后**：运行 `npm run dev` 在浏览器中验证效果
4. **每天结束时**：更新 `dev-log/YYYY-MM-DD.md` 记录进度和待办

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
```

## 高德 API Key

需要在 `src/utils/amap.js` 中配置高德 API Key（应用类型：Web端(JS API)）。

Key 会暴露在前端代码中，务必在高德控制台设置**域名白名单**防止盗用。
