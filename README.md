<div align="right">

**English** | [简体中文](./README.zh-CN.md)

</div>

# Xuanji Pavilion · Wuxing Fortune

> A WeChat Mini Program that fuses traditional Chinese **Wuxing (Five Elements)** divination culture with **AI-driven streaming reasoning**.

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-WeChat%20Mini%20Program-07C160" />
  <img alt="language" src="https://img.shields.io/badge/language-JavaScript-F7DF1E" />
  <img alt="backend" src="https://img.shields.io/badge/backend-Tencent%20SCF-006EFF" />
  <img alt="model" src="https://img.shields.io/badge/LLM-DeepSeek-4D6BFE" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-brightgreen" />
</p>

---

## ✨ Overview

**Xuanji Pavilion (玄机阁)** is a WeChat Mini Program demo that delivers Chinese Five-Element (Wuxing) fortune readings powered by a large language model. After the user fills in their name, gender, calendar type, birth date/hour, and the life topics they want guidance on, the client streams the model's output back over **SSE (Server-Sent Events)** and renders it as a typewriter effect — splitting the model's chain-of-thought ("Reasoning Mantra") from its final answer ("Hexagram Scripture") into two distinct cards.

The visual style draws on Eastern mysticism: a starry backdrop, a rotating Five-Element halo, an Eight-Trigram (Bagua) compass, with deep-violet/black base tones and metallic gold accents.

## 🌟 Features

- 🎴 **Structured divination form** — name, yin/yang (gender), solar/lunar calendar, birth date, 12 traditional Chinese double-hours (`shichen`), and multi-select topics: parents / spouse / children / family / marriage / career / wealth / health / study.
- ⚡ **Streaming inference** — uses `wx.request` with `enableChunked` + `onChunkReceived` to consume SSE chunks character-by-character; no waiting for a full payload.
- 🧠 **Reasoning vs. answer separation** — parses backend `reasoning_content` and `content` independently and renders them in two separate cards.
- 🛡️ **Byte-safe stream parsing** — hand-rolled byte buffer that defers decoding until the last `\n\n` boundary, preventing UTF-8 multi-byte (Chinese) characters from being split across chunks.
- 🪶 **Throttled rendering** — coalesces `setData` calls every 120 ms to keep the UI thread responsive under high-frequency streaming updates.
- 🌌 **Immersive UI** — starfield, Wuxing halo, rotating Bagua, and a Taiji (yin-yang) loading spinner.

## 🛠 Tech Stack

| Layer       | Technology                                       |
| ----------- | ------------------------------------------------ |
| Client      | Native WeChat Mini Program (WXML / WXSS / JS)    |
| Transport   | HTTPS + SSE (`text/event-stream`)                |
| Backend     | Tencent Cloud SCF Web Function (separate repo)   |
| LLM         | DeepSeek (streaming chat completions)            |

## 📁 Project Structure

```
miniprogram/
├── app.js                  # Global App; holds apiBase
├── app.json                # Routes & themed nav bar
├── app.wxss                # Global styles
├── sitemap.json            # Indexing rules
├── project.config.json     # IDE config (AppID placeholder)
└── pages/
    ├── index/              # Divination form + Wuxing decor
    │   ├── index.wxml
    │   ├── index.wxss
    │   ├── index.js
    │   └── index.json
    └── result/             # SSE streaming + typewriter
        ├── result.wxml
        ├── result.wxss
        ├── result.js
        └── result.json
```

## 🚀 Quick Start

1. **Install WeChat DevTools** — https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. **Import the project**, pointing the root to this `miniprogram/` directory.
3. **Replace the AppID** in `project.config.json` (`wxf0ac478d322d1888` is just a placeholder).
4. **Configure the backend URL** — edit `app.js` and set `globalData.apiBase` to your deployed cloud-function / gateway HTTPS endpoint.
5. **Whitelist the domain** in WeChat MP Console → *Development Settings → Server Domain*.
6. **Compile & run** inside DevTools.

## 🔌 Backend API Contract

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

## 🔍 Implementation Highlights

- **Byte-level buffering** — `_handleChunk` concatenates incoming `Uint8Array`s, scans backward for the last `\n\n` as a safe parse boundary, and keeps the trailing bytes for the next chunk — guarding against truncated UTF-8 sequences in Chinese text.
- **Hand-written UTF-8 decoder** — avoids depending on `TextDecoder` (not available in some MP runtime versions); supports characters outside the BMP via surrogate pairs.
- **Auto-scroll** — bumps a `scrollAnchor` ID on every flush to trigger `scroll-into-view`, keeping the latest streamed text visible.

## ⚠️ Disclaimer

This project is for **technical demonstration and entertainment only**. Divination outputs are AI-generated and do **not** constitute professional advice of any kind.

## 📄 License

[MIT](./LICENSE) — feel free to fork, study, and adapt.

## 🙋 Author

[@yuexingliang](https://github.com/yuexingliang)
