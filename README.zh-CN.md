<div align="right">

[English](./README.md) | **简体中文**

</div>

# 玄机阁 · 五行运势

> 一款融合中国传统 **五行命理文化** 与 **AI 流式推演** 的微信小程序。

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-微信小程序-07C160" />
  <img alt="language" src="https://img.shields.io/badge/language-JavaScript-F7DF1E" />
  <img alt="backend" src="https://img.shields.io/badge/backend-腾讯云%20SCF-006EFF" />
  <img alt="model" src="https://img.shields.io/badge/LLM-DeepSeek-4D6BFE" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-brightgreen" />
</p>

---

## ✨ 项目简介

**玄机阁** 是一个基于微信小程序的命理推演 Demo。用户输入姓名、性别、历法、生辰八字、所问之事后，前端通过 **SSE（Server-Sent Events）** 流式接收云端大模型（DeepSeek）的推演内容，以打字机效果分别呈现「**推演心法**」（思维链）与「**卦象天书**」（最终结论）。

整体视觉以东方玄幻为主调：星空 + 五行光环 + 八卦盘旋转动画，配玄黑紫金主色与金/木/水/火/土五色点缀。

## 🌟 功能特性

- 🎴 **结构化命理表单** —— 姓名、阴阳（性别）、公历/农历、降生甲子（日期）、十二时辰、九类问命主题（父母 / 夫妻 / 子女 / 家庭 / 姻缘 / 事业 / 财运 / 健康 / 学业）多选。
- ⚡ **流式推演** —— 使用 `wx.request` 的 `enableChunked` + `onChunkReceived` 实现 SSE 流式接收，逐字呈现，无需等待整段返回。
- 🧠 **思维链 + 结论分离** —— 解析后端 `reasoning_content` 与 `content`，分别渲染为「推演心法」与「卦象天书」两张卡片。
- 🛡️ **健壮的字节缓冲** —— 自实现 UTF-8 解码 + 按 `\n\n` 事件边界拆分，避免中文多字节在分片处被截断乱码。
- 🪶 **节流渲染** —— `setData` 间隔 120ms 合并，缓解高频流式更新对小程序性能的冲击。
- 🌌 **全局沉浸式 UI** —— 星空背景、五行光环、八卦盘动画、太极加载动画。

## 🛠 技术栈

| 层      | 技术                                        |
| ------- | ------------------------------------------- |
| 前端    | 微信小程序原生（WXML / WXSS / JS）           |
| 通信    | HTTPS + SSE（`text/event-stream`）          |
| 后端    | 腾讯云 SCF Web 函数（独立仓库）              |
| 模型    | DeepSeek（流式 chat completions）           |

## 📁 目录结构

```
miniprogram/
├── app.js                  # 全局 App，配置 apiBase
├── app.json                # 路由 / 顶部栏（玄机阁主题色）
├── app.wxss                # 全局样式
├── sitemap.json            # 索引规则
├── project.config.json     # 项目配置（AppID 占位）
└── pages/
    ├── index/              # 起卦页：表单 + 五行装饰
    │   ├── index.wxml
    │   ├── index.wxss
    │   ├── index.js
    │   └── index.json
    └── result/             # 推演页：SSE 流式打字机展示
        ├── result.wxml
        ├── result.wxss
        ├── result.js
        └── result.json
```

## 🚀 快速开始

1. **安装微信开发者工具** —— https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. **导入项目**，选择本目录（`miniprogram/`）作为项目根。
3. **替换 AppID** —— `project.config.json` 中的 `appid` 改为你自己的小程序 AppID（默认 `wxf0ac478d322d1888` 仅作占位）。
4. **配置后端地址** —— 编辑 `app.js`，把 `globalData.apiBase` 改为你部署的云函数 / 网关 HTTPS 地址。
5. **配置服务器域名** —— 在小程序管理后台「开发设置 → 服务器域名」加入上述 HTTPS 域名。
6. **编译运行** —— 点击开发者工具「编译」即可。

## 🔌 后端接口约定

- **方法**：`POST`
- **请求头**：`content-type: application/json`，`accept: text/event-stream`
- **请求体**：
  ```json
  {
    "name": "张三",
    "gender": "male | female",
    "calendar": "solar | lunar",
    "birthDate": "1995-08-12",
    "shichen": "午时（11:00-13:00）",
    "shichenIndex": 6,
    "topics": [{ "key": "career", "label": "事业" }]
  }
  ```
- **响应**：标准 SSE 帧（`data: {...}\n\n`），每帧 JSON 兼容 OpenAI Chat Completion 流式结构：
  ```
  data: {"choices":[{"delta":{"reasoning_content":"…"}}]}
  data: {"choices":[{"delta":{"content":"…"}}]}
  data: {"choices":[{"finish_reason":"stop"}]}
  data: [DONE]
  ```

## 🔍 关键实现细节

- **字节级缓冲** —— `_handleChunk` 先合并 `Uint8Array`，再回溯查找最后一个 `\n\n` 作为可解析边界，余下字节留待下一片，**避免中文 UTF-8 序列被截断**。
- **手写 UTF-8 解码** —— 考虑部分基础库无 `TextDecoder`，使用纯 JS 实现解码，兼容 BMP 外字符（surrogate pair）。
- **滚动跟随** —— 每次 flush 自增 `scrollAnchor` 触发 `scroll-into-view`，结果区域自动滚到底。

## ⚠️ 免责声明

本项目仅作 **技术演示与娱乐用途**，命理推演内容由 AI 生成，**不构成任何决策建议**。命由天定，运由己生。

## 📄 开源协议

[MIT](./LICENSE) —— 欢迎 fork、学习与改造。

## 🙋 作者

[@yuexingliang](https://github.com/yuexingliang)
