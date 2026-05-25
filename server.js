import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 高德 Web服务 Key — 仅存于服务器，不暴露到前端
const AMAP_WEB_KEY = 'f4847e12326126f7de7f75cc8a715db8'

const app = express()
app.use(cors())

// Proxy: 前端请求 /api/amap/v3/xxx → 转发到 restapi.amap.com/v3/xxx + key
app.get('/api/amap/*', async (req, res) => {
  try {
    const targetPath = req.params[0]
    const url = new URL(`https://restapi.amap.com/${targetPath}`)
    url.searchParams.set('key', AMAP_WEB_KEY)
    // 转发前端传来的其他参数
    for (const [k, v] of Object.entries(req.query)) {
      if (k !== '0') url.searchParams.set(k, v)
    }
    const response = await fetch(url.toString())
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ status: '0', info: 'PROXY_ERROR' })
  }
})

// 生产环境：提供前端静态文件
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
