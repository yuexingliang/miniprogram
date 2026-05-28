// pages/index/index.js
const SHICHEN = [
  '子时（23:00-01:00）',
  '丑时（01:00-03:00）',
  '寅时（03:00-05:00）',
  '卯时（05:00-07:00）',
  '辰时（07:00-09:00）',
  '巳时（09:00-11:00）',
  '午时（11:00-13:00）',
  '未时（13:00-15:00）',
  '申时（15:00-17:00）',
  '酉时（17:00-19:00）',
  '戌时（19:00-21:00）',
  '亥时（21:00-23:00）',
  '时辰未知'
]

const TOPIC_LIST = [
  { key: 'parents', label: '父母', icon: '🏯' },
  { key: 'spouse',  label: '夫妻', icon: '🪷' },
  { key: 'children',label: '子女', icon: '🌸' },
  { key: 'family',  label: '家庭', icon: '🏮' },
  { key: 'marriage',label: '姻缘', icon: '💞' },
  { key: 'career',  label: '事业', icon: '⚔️' },
  { key: 'wealth',  label: '财运', icon: '💰' },
  { key: 'health',  label: '健康', icon: '🍃' },
  { key: 'study',   label: '学业', icon: '📜' }
]

Page({
  data: {
    name: '',
    gender: 'male',
    calendar: 'solar',
    birthDate: '',
    shichenIndex: 12,
    shichenList: SHICHEN,
    topics: TOPIC_LIST.map(t => ({ ...t, checked: false }))
  },

  onLoad() {
    // 默认日期为今天往前 25 年
    const d = new Date()
    d.setFullYear(d.getFullYear() - 25)
    const def = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    this.setData({ birthDate: def })
  },

  onName(e) { this.setData({ name: e.detail.value }) },
  onGender(e) { this.setData({ gender: e.currentTarget.dataset.v }) },
  onCalendar(e) { this.setData({ calendar: e.currentTarget.dataset.v }) },
  onDate(e) { this.setData({ birthDate: e.detail.value }) },
  onShichen(e) { this.setData({ shichenIndex: Number(e.detail.value) }) },

  toggleTopic(e) {
    const key = e.currentTarget.dataset.key
    const topics = this.data.topics.map(t =>
      t.key === key ? { ...t, checked: !t.checked } : t
    )
    this.setData({ topics })
  },

  goDivine() {
    const { name, gender, calendar, birthDate, shichenIndex, shichenList, topics } = this.data
    if (!name.trim()) {
      return wx.showToast({ title: '尚未告知名讳', icon: 'none' })
    }
    if (!birthDate) {
      return wx.showToast({ title: '请择降生甲子', icon: 'none' })
    }
    const selected = topics.filter(t => t.checked)
    if (selected.length === 0) {
      return wx.showToast({ title: '请择问命之事', icon: 'none' })
    }

    const payload = {
      name: name.trim(),
      gender,
      calendar,
      birthDate,
      shichen: shichenList[shichenIndex],
      shichenIndex,
      topics: selected.map(t => ({ key: t.key, label: t.label }))
    }

    wx.navigateTo({
      url: '/pages/result/result?p=' + encodeURIComponent(JSON.stringify(payload))
    })
  }
})
