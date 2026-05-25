// Vercel Serverless Function — 高德 API 代理
// 接收 /api/amap/v3/place/around?location=... → 转发到 restapi.amap.com

const AMAP_WEB_KEY = 'f4847e12326126f7de7f75cc8a715db8'

export default async function handler(req, res) {
  try {
    // 从原始 URL 提取 amap 路径和参数
    const url = new URL(req.url, `http://${req.headers.host}`)
    const subPath = url.pathname.replace('/api/amap/', '')
    const amapUrl = new URL(`https://restapi.amap.com/${subPath}`)
    amapUrl.searchParams.set('key', AMAP_WEB_KEY)
    for (const [k, v] of url.searchParams.entries()) {
      amapUrl.searchParams.set(k, v)
    }

    const response = await fetch(amapUrl.toString())
    const data = await response.json()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(data)
  } catch (err) {
    res.status(500).json({ status: '0', info: 'PROXY_ERROR' })
  }
}
