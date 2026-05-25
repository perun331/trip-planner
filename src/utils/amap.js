// 高德地图 JS API Key 配置

// JS API Key（Web端(JS API)类型）：仅用于加载地图脚本，安全级别低
const AMAP_JS_KEY = '286b659c6b93379af70a8185000ebd3a'

// Web服务 Key 仅存于服务器端（vite.config.js / server.js），前端不可见
// 前端所有 REST API 调用通过 /api/amap/ 代理中转

const AMAP_VERSION = '2.0'
const AMAP_PLUGINS = [
  'AMap.PlaceSearch',
  'AMap.AutoComplete',
  'AMap.Transfer',
  'AMap.Geocoder',
]

let loadPromise = null

export function loadAMap() {
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const plugins = AMAP_PLUGINS.join(',')
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_JS_KEY}&plugin=${plugins}`
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        reject(new Error('AMap 加载失败'))
      }
    }
    script.onerror = () => reject(new Error('AMap 脚本加载失败'))
    document.head.appendChild(script)
  })

  return loadPromise
}

// 通过代理调用高德 REST API（Key 自动追加，不暴露到浏览器）
export function amapFetch(pathWithQuery, options = {}) {
  return fetch(`/api/amap/${pathWithQuery}`, options).then(r => r.json())
}
