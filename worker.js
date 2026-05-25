// Cloudflare Worker — 完整应用（静态文件 + API 代理）
const AMAP_WEB_KEY = 'f4847e12326126f7de7f75cc8a715db8'

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url)

    // API proxy: /api/amap/* → restapi.amap.com
    if (url.pathname.startsWith('/api/amap/')) {
      const subPath = url.pathname.replace('/api/amap/', '')
      const amapUrl = new URL(`https://restapi.amap.com/${subPath}`)
      amapUrl.searchParams.set('key', AMAP_WEB_KEY)
      for (const [k, v] of url.searchParams.entries()) {
        amapUrl.searchParams.set(k, v)
      }
      const resp = await fetch(amapUrl.toString())
      const data = await resp.json()
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Serve static file from dist/ via ASSETS binding
    return env.ASSETS.fetch(req)
  },
}
