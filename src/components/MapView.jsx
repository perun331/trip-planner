import { useEffect, useRef, useCallback } from 'react'
import { loadAMap } from '../utils/amap.js'

export default function MapView({ center, zoom, markers = [], selectedIds = [], onMarkerClick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerMapRef = useRef(new Map())
  const readyRef = useRef(false)

  // Initialize map
  useEffect(() => {
    let cancelled = false
    loadAMap().then((AMap) => {
      if (cancelled || !containerRef.current) return
      const map = new AMap.Map(containerRef.current, {
        zoom: 14,
        center: center || [116.397428, 39.90923], // default: Beijing
        resizeEnable: true,
      })
      mapRef.current = map
      readyRef.current = true
    })
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
      readyRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update center
  useEffect(() => {
    if (!mapRef.current || !center) return
    mapRef.current.setCenter(center)
  }, [center])

  // Update zoom
  useEffect(() => {
    if (!mapRef.current || zoom == null) return
    mapRef.current.setZoom(zoom)
  }, [zoom])

  // Update markers
  const handleClick = useCallback((markerData) => {
    if (onMarkerClick) onMarkerClick(markerData)
  }, [onMarkerClick])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return

    // Clear old markers
    markerMapRef.current.forEach((m) => {
      map.remove(m)
    })
    markerMapRef.current.clear()

    // Add new markers
    const AMap = window.AMap
    if (!AMap) return

    markers.forEach((item) => {
      const isSelected = selectedIds.includes(item.id)
      const t = item.type

      const selectedStyle = `background:#536878;color:#fff;padding:5px 12px;border-radius:16px;font-size:12px;white-space:nowrap;font-family:'Noto Sans SC','PingFang SC',sans-serif;font-weight:600;box-shadow:0 4px 12px rgba(83,104,120,0.25);`
      const defaultStyle = `background:#FBFAF7;color:#2D2D2B;padding:5px 12px;border-radius:16px;font-size:12px;white-space:nowrap;font-family:'Noto Sans SC','PingFang SC',sans-serif;font-weight:500;border:1px solid #E0DCD5;box-shadow:0 2px 4px rgba(45,45,43,0.06);`
      const foodStyle = `background:#F2EBE1;color:#7A5C3E;padding:4px 10px;border-radius:12px;font-size:11px;white-space:nowrap;font-family:'Noto Sans SC','PingFang SC',sans-serif;font-weight:500;border:1px solid #D4C8B8;`
      const destStyle = `background:#E1EAF2;color:#4A6378;padding:4px 10px;border-radius:12px;font-size:11px;white-space:nowrap;font-family:'Noto Sans SC','PingFang SC',sans-serif;font-weight:500;border:1px solid #C4D1DD;`

      let content
      if (t === 'food') content = `<div style="${foodStyle}">${item.name}</div>`
      else if (t === 'dest') content = `<div style="${destStyle}">${item.name}</div>`
      else if (isSelected) content = `<div style="${selectedStyle}">${item.name}</div>`
      else content = `<div style="${defaultStyle}">${item.name}</div>`

      const marker = new AMap.Marker({
        position: [item.lng, item.lat],
        title: item.name,
        content: content,
        offset: new AMap.Pixel(-40, -20),
      })

      marker.on('click', () => handleClick(item))
      map.add(marker)
      markerMapRef.current.set(item.id, marker)
    })
  }, [markers, selectedIds, handleClick])

  return (
    <div className="map-container" ref={containerRef} />
  )
}
