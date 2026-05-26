// 高德地图 API Key 配置

// JS API Key（Web端(JS API)类型）：用于加载地图
const AMAP_JS_KEY = '286b659c6b93379af70a8185000ebd3a'

// Web服务 Key：用于 REST API 调用
const AMAP_WEB_KEY = 'f4847e12326126f7de7f75cc8a715db8'

const AMAP_VERSION = '2.0'
const AMAP_PLUGINS = [
  'AMap.PlaceSearch',
  'AMap.AutoComplete',
  'AMap.Transfer',
  'AMap.Geocoder',
]

let loadPromise = null

export function loadAMap() {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const plugins = AMAP_PLUGINS.join(',')
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_JS_KEY}&plugin=${plugins}`
    script.onload = () => {
      if (window.AMap) resolve(window.AMap)
      else reject(new Error('AMap 加载失败'))
    }
    script.onerror = () => reject(new Error('AMap 脚本加载失败'))
    document.head.appendChild(script)
  })

  return loadPromise
}

// REST API 直接调用（纯静态部署模式）
export function amapFetch(pathWithQuery, options = {}) {
  const sep = pathWithQuery.includes('?') ? '&' : '?'
  return fetch(`https://restapi.amap.com/${pathWithQuery}${sep}key=${AMAP_WEB_KEY}`, options).then(r => r.json())
}
