// pages/result/result.js
const app = getApp()

const LOADING_PHRASES = [
  '掐指推演 · 借问青天…',
  '观星望气 · 卜算阴阳…',
  '五行流转 · 金木水火土…',
  '调动罡气 · 沟通天机…',
  '卦象渐显 · 静候片刻…'
]

const FLUSH_INTERVAL = 120 // ms，setData 节流间隔

Page({
  data: {
    form: {},
    topicsLabel: '',
    subtitle: '凝神静气 · 五行交感',
    loading: true,
    loadingText: LOADING_PHRASES[0],
    thinking: '',
    answer: '',
    error: '',
    done: false,
    scrollAnchor: 'sa-0'
  },

  // —— 私有状态（不进 data，避免 setData 噪声）——
  _task: null,
  _phaseTimer: null,
  _flushTimer: null,
  _byteBuf: null,            // Uint8Array：累积所有原始字节
  _strBuf: '',               // 已解码但未拆完整事件的字符串
  _pendingThinking: '',
  _pendingAnswer: '',
  _scrollTick: 0,

  onLoad(query) {
    let form = {}
    try {
      form = JSON.parse(decodeURIComponent(query.p || '{}'))
    } catch (e) {
      this.setData({ error: '入参解析失败', loading: false, done: true })
      return
    }
    const topicsLabel = (form.topics || []).map(t => t.label).join(' · ')
    this._byteBuf = new Uint8Array(0)
    this.setData({ form, topicsLabel })
    this._startPhaseAnim()
    this._callRemote(form)
  },

  onUnload() {
    this._aborted = true
    if (this._task && typeof this._task.abort === 'function') {
      try { this._task.abort() } catch (e) {}
    }
    if (this._phaseTimer) clearInterval(this._phaseTimer)
    if (this._flushTimer) clearTimeout(this._flushTimer)
  },

  _startPhaseAnim() {
    let i = 0
    this._phaseTimer = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length
      this.setData({ loadingText: LOADING_PHRASES[i] })
    }, 1800)
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  goCopy() {
    const txt = this.data.answer || this.data.thinking
    wx.setClipboardData({
      data: txt,
      success: () => wx.showToast({ title: '已抄录至剪贴板', icon: 'none' })
    })
  },

  // ========== 网络 ==========
  _callRemote(form) {
    const url = app.globalData.apiBase
    if (!url || /your-scf-domain/.test(url)) {
      this.setData({
        loading: false,
        done: true,
        error: '尚未配置 apiBase，请在 app.js 中填入云函数访问地址'
      })
      return
    }

    const task = wx.request({
      url,
      method: 'POST',
      enableChunked: true,
      responseType: 'arraybuffer', // 确保拿到原始字节
      timeout: 180000,
      header: {
        'content-type': 'application/json',
        'accept': 'text/event-stream'
      },
      data: form,
      success: (res) => {
        // chunk 模式下走完才会调用，做兜底
        if (!this.data.thinking && !this.data.answer && !this.data.error) {
          this.setData({
            loading: false,
            done: true,
            error: '未收到天机回响（HTTP ' + (res && res.statusCode) + '）'
          })
        } else {
          this._finish()
        }
      },
      fail: (err) => {
        if (this._aborted) return
        this.setData({
          loading: false,
          done: true,
          error: '请求受阻：' + (err && err.errMsg ? err.errMsg : '未知错误')
        })
      }
    })
    this._task = task

    if (task && task.onChunkReceived) {
      task.onChunkReceived((chunk) => {
        try { this._handleChunk(chunk.data) } catch (e) { console.error('chunk', e) }
      })
    }
    if (task && task.onHeadersReceived) {
      task.onHeadersReceived((res) => {
        if (this.data.loading) this.setData({ loading: false })
        const status = res && res.statusCode
        if (status && status !== 200) {
          // 非 200 多半是后端报错，但 chunk 仍可能带 body
          console.warn('upstream status', status)
        }
      })
    }
  },

  // ========== chunk 处理：先合并字节，再按 \n\n 拆事件 ==========
  _handleChunk(buf) {
    if (!buf) return
    const incoming = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf)
    // 合并到字节缓冲
    const merged = new Uint8Array(this._byteBuf.length + incoming.length)
    merged.set(this._byteBuf, 0)
    merged.set(incoming, this._byteBuf.length)
    this._byteBuf = merged

    // 找最后一个 \n\n（双换行）作为可解析边界，避免中文 utf-8 跨界
    let lastBoundary = -1
    for (let i = this._byteBuf.length - 1; i >= 1; i--) {
      if (this._byteBuf[i] === 0x0a && this._byteBuf[i - 1] === 0x0a) {
        lastBoundary = i
        break
      }
    }
    if (lastBoundary === -1) return // 还不够一个完整事件

    const decodable = this._byteBuf.subarray(0, lastBoundary + 1)
    this._byteBuf = this._byteBuf.subarray(lastBoundary + 1)

    const text = utf8Decode(decodable)
    this._strBuf += text

    // 按 \n\n 拆事件
    let idx
    while ((idx = this._strBuf.indexOf('\n\n')) !== -1) {
      const evt = this._strBuf.slice(0, idx)
      this._strBuf = this._strBuf.slice(idx + 2)
      this._handleEvent(evt)
    }
  },

  _handleEvent(evt) {
    if (!evt || !evt.trim()) return
    const lines = evt.split('\n')
    let dataStr = ''
    for (const ln of lines) {
      if (ln.startsWith('data:')) dataStr += ln.slice(5).replace(/^\s/, '')
      else if (ln.startsWith('data: ')) dataStr += ln.slice(6)
    }
    if (!dataStr) return
    if (dataStr === '[DONE]') return this._finish()

    let json
    try { json = JSON.parse(dataStr) } catch (e) { return }

    // 后端返回的错误结构
    if (json.error) {
      this.setData({ error: typeof json.error === 'string' ? json.error : JSON.stringify(json.error) })
      return
    }

    const choice = (json.choices && json.choices[0]) || {}
    const delta = choice.delta || choice.message || {}
    const reason = delta.reasoning_content
    const content = delta.content
    if (reason)  this._pendingThinking += reason
    if (content) this._pendingAnswer   += content
    this._scheduleFlush()

    if (choice.finish_reason) this._finish()
  },

  // ========== 节流 setData ==========
  _scheduleFlush() {
    if (this._flushTimer) return
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null
      this._flush()
    }, FLUSH_INTERVAL)
  },

  _flush(immediate) {
    const patch = {}
    if (this._pendingThinking) {
      patch.thinking = this.data.thinking + this._pendingThinking
      this._pendingThinking = ''
    }
    if (this._pendingAnswer) {
      patch.answer = this.data.answer + this._pendingAnswer
      this._pendingAnswer = ''
    }
    if (Object.keys(patch).length === 0) return
    if (this.data.loading) patch.loading = false
    // 更新滚动锚点（每次 flush 都换 id 触发 scroll-into-view）
    this._scrollTick++
    patch.scrollAnchor = 'sa-' + this._scrollTick
    this.setData(patch)
  },

  _finish() {
    if (this.data.done) return
    // flush 残余
    if (this._flushTimer) { clearTimeout(this._flushTimer); this._flushTimer = null }
    this._flush(true)
    this.setData({ done: true, loading: false })
    if (this._phaseTimer) {
      clearInterval(this._phaseTimer)
      this._phaseTimer = null
    }
  }
})

// =====================================================
// 手写 UTF-8 解码（避免依赖 TextDecoder，部分基础库可能没有）
// =====================================================
function utf8Decode(bytes) {
  let result = ''
  let i = 0
  const len = bytes.length
  while (i < len) {
    const b = bytes[i]
    if (b < 0x80) {
      result += String.fromCharCode(b); i++
    } else if (b < 0xc0) {
      i++ // 异常单字节，跳过
    } else if (b < 0xe0) {
      if (i + 1 >= len) break
      result += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2
    } else if (b < 0xf0) {
      if (i + 2 >= len) break
      result += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      ); i += 3
    } else {
      if (i + 3 >= len) break
      const code = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) |
                   ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)
      const sub = code - 0x10000
      result += String.fromCharCode(0xd800 + (sub >> 10), 0xdc00 + (sub & 0x3ff))
      i += 4
    }
  }
  return result
}
