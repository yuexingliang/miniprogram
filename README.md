# 玄机阁 · 五行运势 / Xuanji Pavilion · Wuxing Fortune

> 一款融合中国传统五行命理文化与 AI 流式推演的微信小程序。
> A WeChat Mini Program that fuses traditional Chinese Wuxing (Five Elements) divination culture with AI-driven streaming reasoning.

---

## 📜 中文介绍

### 项目简介
**玄机阁** 是一个基于微信小程序的命理推演 Demo。用户输入姓名、性别、历法、生辰八字、所问之事后，前端通过 **SSE（Server-Sent Events）** 流式接收云端大模型（DeepSeek）的推演内容，以打字机效果分别呈现「推演心法」（思维链）与「卦象天书」（最终结论）。

整体视觉以东方玄幻为主调：星空 + 五行光环 + 八卦盘旋转动画，配玄黑紫金主色与金/木/水/火/土五色点缀。

### 功能特性
- 🎴 **结构化命理表单**：姓名、阴阳（性别）、公历/农历、降生甲子（日期）、十二时辰、九类问命主题（父母 / 夫妻 / 子女 / 家庭 / 姻缘 / 事业 / 财运 / 健康 / 学业）多选。
- ⚡ **流式推演**：使用 `wx.request` 的 `enableChunked` + `onChunkReceived` 实现 SSE 流式接收，逐字呈现，无需等待整段返回。
- 🧠 **思维链 + 结论分离**：解析后端 `reasoning_content` 与 `content`，分别渲染为「推演心法」与「卦象天书」两张卡片。
- 🛡️ **健壮的字节缓冲**：自实现 UTF-8 解码 + 按 `\n\n` 事件边界拆分，避免中文多字节在分片处被截断乱码。
- 🪶 **节流渲染**：`setData` 间隔 120ms 合并，缓解高频流式更新对小程序性能的冲击。
- 🌌 **全局沉浸式 UI**：星空背景、五行光环、八卦盘动画，太极加载动画。

### 技术栈
| 层 | 技术 |
| --- | --- |
| 前端 | 微信小程序原生（WXML / WXSS / JS） |
| 通信 | HTTPS + SSE（`text/event-stream`） |
| 后端 | 腾讯云 SCF Web 函数（独立仓库） |
| 模型 | DeepSeek（流式 chat completions） |

### 目录结构
```
miniprogram/
├── app.js                         # 全局 App，配置 apiBase
├── app.json                       # 路由 / 顶部栏（玄机阁主题色）
├── app.wxss                       # 全局样式
├── sitemap.json                   # 索引规则
├── project.config.json            # 项目配置（appid: wxf0ac478d322d1888）
└── pages/
    ├── index/                     # 起卦页：表单 + 五行装饰
    │   ├── index.wxml/.wxss/.js/.json
    └── result/                    # 推演页：SSE 流式打字机展示
        └── result.wxml/.wxss/.js/.json
```

### 快速开始
1. **安装微信开发者工具**：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. **导入项目**：选择本目录（`miniprogram/`）作为项目根。
3. **替换 AppID**：`project.config.json` 中的 `appid` 改为你自己的小程序 AppID（默认 `wxf0ac478d322d1888` 仅作占位）。
4. **配置后端地址**：编辑 `app.js`，把 `globalData.apiBase` 改为你部署的云函数 / 网关 HTTPS 地址（接口约定见下）。
5. **配置服务器域名**：在小程序管理后台「开发设置 → 服务器域名」加入上述 HTTPS 域名。
6. **编译运行**：点击开发者工具「编译」即可。

### 后端接口约定
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

### 关键实现细节
- **字节级缓冲**：`_handleChunk` 先合并 `Uint8Array`，再回溯查找最后一个 `\n\n` 作为可解析边界，余下字节留待下一片，**避免中文 UTF-8 序列被截断**。
- **手写 UTF-8 解码**：考虑部分基础库无 `TextDecoder`，使用纯 JS 实现解码，兼容 BMP 外字符。
- **滚动跟随**：每次 flush 自增 `scrollAnchor` 触发 `scroll-into-view`，结果区域自动滚到底。

### 免责声明
本项目仅作技术演示与娱乐用途，命理推演内容由 AI 生成，**不构成任何决策建议**。命由天定，运由己生。

---

## 📜 English Introduction

### Overview
**Xuanji Pavilion (玄机阁)** is a WeChat Mini Program demo that delivers Chinese Five-Element (Wuxing) fortune readings powered by a large language model. After the user fills in their name, gender, calendar type, birth date/hour, and the life topics they want guidance on, the client streams the model's output back over **SSE (Server-Sent Events)** and renders it as a typewriter effect — splitting the model's chain-of-thought ("Reasoning Mantra") from its final answer ("Hexagram Scripture") into two distinct cards.

The visual style draws on Eastern mysticism: a starry backdrop, a rotating Five-Element halo, an Eight-Trigram (Bagua) compass, with deep-violet/black base tones and metallic gold accents.

### Features
- 🎴 **Structured divination form**: name, yin/yang (gender), solar/lunar calendar, birth date, 12 traditional Chinese double-hours (`shichen`), and multi-select topics (parents / spouse / children / family / marriage / career / wealth / health / study).
- ⚡ **Streaming inference**: uses `wx.request` with `enableChunked` + `onChunkReceived` to consume SSE chunks character-by-character — no waiting for a full payload.
- 🧠 **Reasoning vs. answer separation**: parses backend `reasoning_content` and `content` independently and renders them in two separate cards.
- 🛡️ **Byte-safe stream parsing**: hand-rolled byte buffer that defers decoding until the last `\n\n` boundary, preventing UTF-8 multi-byte (Chinese) characters from being split across chunks.
- 🪶 **Throttled rendering**: coalesces `setData` calls every 120 ms to keep the UI thread responsive under high-frequency streaming updates.
- 🌌 **Immersive UI**: starfield, Wuxing halo, rotating Bagua, and a Taiji (yin-yang) loading spinner.

### Tech Stack
| Layer | Technology |
| --- | --- |
| Client | Native WeChat Mini Program (WXML / WXSS / JS) |
| Transport | HTTPS + SSE (`text/event-stream`) |
| Backend | Tencent Cloud SCF Web Function (separate repo) |
| LLM | DeepSeek (streaming chat completions) |

### Project Structure
```
miniprogram/
├── app.js                         # Global App; holds apiBase
├── app.json                       # Routes & themed nav bar
├── app.wxss                       # Global styles
├── sitemap.json                   # Indexing rules
├── project.config.json            # IDE config (appid placeholder)
└── pages/
    ├── index/                     # Divination form + Wuxing decor
    └── result/                    # SSE streaming + typewriter
```

### Quick Start
1. **Install WeChat DevTools**: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. **Import the project**, pointing the root to this `miniprogram/` directory.
3. **Replace the AppID** in `project.config.json` (`wxf0ac478d322d1888` is just a placeholder).
4. **Configure the backend URL**: edit `app.js` and set `globalData.apiBase` to your deployed cloud-function / gateway HTTPS endpoint.
5. **Whitelist the domain** in WeChat MP Console → *Development Settings → Server Domain*.
6. **Compile & run** inside DevTools.

### Backend API Contract
- **Method**: `POST`
- **Headers**: `content-type: application/json`, `accept: text/event-stream`
- **Body**:
  ```json
  {
    "name": "Alice",
    "gender": "male | female",
    "calendar": "solar | lunar",
    "birthDate": "1995-08-12",
    "shichen": "午时（11:00-13:00）",
    "shichenIndex": 6,
    "topics": [{ "key": "career", "label": "Career" }]
  }
  ```
- **Response**: standard SSE frames (`data: {...}\n\n`), each payload mirroring OpenAI's Chat Completion streaming shape:
  ```
  data: {"choices":[{"delta":{"reasoning_content":"…"}}]}
  data: {"choices":[{"delta":{"content":"…"}}]}
  data: {"choices":[{"finish_reason":"stop"}]}
  data: [DONE]
  ```

### Implementation Highlights
- **Byte-level buffering**: `_handleChunk` concatenates incoming `Uint8Array`s, scans backward for the last `\n\n` as a safe parse boundary, and keeps the trailing bytes for the next chunk — guarding against truncated UTF-8 sequences in Chinese text.
- **Hand-written UTF-8 decoder**: avoids depending on `TextDecoder` (not available in some MP runtime versions); supports characters outside the BMP via surrogate pairs.
- **Auto-scroll**: bumps a `scrollAnchor` ID on every flush to trigger `scroll-into-view`, keeping the latest streamed text visible.

### Disclaimer
This project is for **technical demonstration and entertainment only**. Divination outputs are AI-generated and do **not** constitute professional advice of any kind.

---

## 📄 License
MIT — feel free to fork, study, and adapt.

## 🙋 Author
[@yuexingliang](https://github.com/yuexingliang)
