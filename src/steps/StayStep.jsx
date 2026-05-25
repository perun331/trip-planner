import { useState, useEffect, useRef, useCallback } from 'react'
import { useTrip } from '../context/TripContext.jsx'
import { amapFetch } from '../utils/amap.js'
import MapView from '../components/MapView.jsx'

const MEAL_HOURS = {
  breakfast: 8, lunch: 12, afternoon: 15, dinner: 19, night: 22,
}

export default function StayStep() {
  const { data, update } = useTrip()
  const { eatForm, selectedRestaurants, destinations, recommendedAreas, selectedArea, hotels, selectedHotel } = data

  const [loading, setLoading] = useState(false)
  const [searchingHotels, setSearchingHotels] = useState(false)
  const [loadingMoreHotels, setLoadingMoreHotels] = useState(false)
  const [hotelPage, setHotelPage] = useState(1)
  const [hasMoreHotels, setHasMoreHotels] = useState(false)
  const [selectedTier, setSelectedTier] = useState('全部')
  const [cityCode, setCityCode] = useState('')
  const hotelListRef = useRef(null)
  const loadingMoreRef = useRef(false)

  // Build sorted waypoints: restaurants + destinations ordered by time
  const buildWaypoints = useCallback(() => {
    const items = [
      ...selectedRestaurants.map(r => ({
        type: 'food', name: r.name, lng: r.lng, lat: r.lat,
        hour: MEAL_HOURS[eatForm.mealTime] || 12,
        label: `🍽 ${r.name}`,
      })),
      ...destinations.map((d, i) => ({
        type: 'dest', name: d.name, lng: d.lng, lat: d.lat,
        hour: (MEAL_HOURS[eatForm.mealTime] || 12) + 1 + i * 0.1,
        label: `📍 ${d.name}`,
      })),
    ]
    items.sort((a, b) => a.hour - b.hour)
    return items
  }, [selectedRestaurants, destinations, eatForm.mealTime])

  const allPoints = [
    ...selectedRestaurants.map(r => ({ lng: r.lng, lat: r.lat })),
    ...destinations.map(d => ({ lng: d.lng, lat: d.lat })),
  ]

  // Geographic center
  const center = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length,
       allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length]
    : null

  // Step 1: Search subway stations + reverse geocode
  useEffect(() => {
    if (!center || allPoints.length === 0) return
    setLoading(true)

    const [clng, clat] = center

    amapFetch(`v3/geocode/regeo?location=${clng},${clat}`)
      .then(d => {
        if (d.regeocode?.addressComponent?.adcode) {
          setCityCode(d.regeocode.addressComponent.adcode)
        }
      })
      .catch(() => {})

    amapFetch(`v3/place/around?location=${clng},${clat}&radius=5000&types=150500&offset=10`)
      .then(d => {
        if (d.status === '1' && d.pois) {
          const stations = d.pois.map((poi) => {
            const [slng, slat] = poi.location.split(',').map(Number)
            return {
              id: `station-${poi.id || poi.name}`,
              name: poi.name, address: poi.address || poi.pname + poi.cityname + poi.adname,
              lng: slng, lat: slat, transfers: null, duration: null, summary: '计算中...',
            }
          })
          update({ recommendedAreas: stations })
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // After stations load OR cityCode changes, calculate transit chains
  useEffect(() => {
    if (!cityCode || recommendedAreas.length === 0) return
    const waypoints = buildWaypoints()
    if (waypoints.length === 0) return
    calculateTransit(recommendedAreas, waypoints, cityCode)
  }, [cityCode, recommendedAreas.length]) // eslint-disable-line

  // Transit calculation: Hotel → WP1 → WP2 → ... → WPN → Hotel
  const calculateTransit = async (stations, waypoints, cc) => {
    // For each station, calculate the full chain
    const updated = await Promise.all(
      stations.map(async (station) => {
        let totalDuration = 0
        let maxTransfers = 0
        const legDetails = []

        // Build the chain: station → wp[0] → wp[1] → ... → wp[n] → station
        const origins = [station, ...waypoints]
        const dests = [...waypoints, station]

        for (let i = 0; i < origins.length; i++) {
          const from = origins[i]
          const to = dests[i]
          try {
            const d = await amapFetch(`v3/direction/transit/integrated?origin=${from.lng},${from.lat}&destination=${to.lng},${to.lat}&city=${cc}&strategy=0`)
            if (d.status === '1' && d.route?.transits?.[0]) {
              const best = d.route.transits[0]
              totalDuration += Number(best.duration || 0)
              const transfers = Math.max(0, (best.segments?.length || 1) - 1)
              maxTransfers = Math.max(maxTransfers, transfers)
              if (best.segments) {
                const lines = best.segments
                  .filter(s => s.bus?.buslines?.length > 0)
                  .map(s => s.bus.buslines[0].name)
                legDetails.push({ from: from.label || from.name, to: to.label || to.name, lines: lines.join(' → '), transfers })
              }
            }
          } catch (e) { /* skip */ }
        }

        const totalMin = Math.round(totalDuration / 60)
        const transferLabel = maxTransfers === 0 ? '无需换乘' : `最多${maxTransfers}次换乘`

        return {
          ...station,
          transfers: maxTransfers,
          duration: totalMin,
          summary: totalMin > 0 ? `${transferLabel} · 全程约${totalMin}分钟` : '无法计算',
          legDetails,
        }
      })
    )

    // Sort: fewer transfers first, then shorter total time
    updated.sort((a, b) => {
      if (a.transfers !== b.transfers) return (a.transfers || 99) - (b.transfers || 99)
      return (a.duration || 999) - (b.duration || 999)
    })

    update({ recommendedAreas: updated })
  }

  const selectArea = useCallback((area) => {
    update({ selectedArea: area, hotels: [], selectedHotel: null })
  }, [update])

  const fetchHotels = useCallback((page) => {
    if (!selectedArea) return Promise.resolve([])
    return amapFetch(
      `v3/place/around?location=${selectedArea.lng},${selectedArea.lat}&radius=3000&keywords=酒店&types=100000&offset=7&extensions=all&page=${page}`
    )
      .then(d => {
        if (d.status === '1' && d.pois) {
          return d.pois.map((poi, i) => {
            const [hlng, hlat] = poi.location.split(',').map(Number)
            const costRaw = poi.biz_ext?.cost
            const costStr = Array.isArray(costRaw) ? '' : (costRaw || '')
            const costMatch = costStr.match(/(\d+)/)
            return {
              id: `hotel-${poi.id || i}`, name: poi.name,
              address: poi.address || poi.pname + poi.cityname + poi.adname,
              lng: hlng, lat: hlat,
              keytag: poi.keytag || '',
              distance: poi.distance ? (parseInt(poi.distance) >= 1000 ? `${(parseInt(poi.distance) / 1000).toFixed(1)}km` : `${poi.distance}m`) : '',
              rating: poi.biz_ext?.rating ? `${poi.biz_ext.rating}分` : '',
              cost: costStr,
              costNum: costMatch ? Number(costMatch[1]) : null,
              tel: poi.tel || '',
            }
          })
        }
        return []
      })
  }, [selectedArea])

  const searchHotels = useCallback(() => {
    if (!selectedArea) return
    setSearchingHotels(true)
    setHotelPage(1)
    setHasMoreHotels(false)
    fetchHotels(1)
      .then(h => {
        setSearchingHotels(false)
        update({ hotels: h })
        setHasMoreHotels(h.length >= 7)
      })
      .catch(() => { setSearchingHotels(false) })
  }, [selectedArea, update, fetchHotels])

  const loadMoreHotels = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreHotels) return
    const nextPage = hotelPage + 1
    loadingMoreRef.current = true
    setLoadingMoreHotels(true)
    fetchHotels(nextPage)
      .then(h => {
        loadingMoreRef.current = false
        setLoadingMoreHotels(false)
        setHotelPage(nextPage)
        if (h.length === 0) { setHasMoreHotels(false); return }
        update({ hotels: [...hotels, ...h] })
        setHasMoreHotels(h.length >= 7)
      })
      .catch(() => { loadingMoreRef.current = false; setLoadingMoreHotels(false) })
  }, [hasMoreHotels, hotelPage, hotels, update, fetchHotels])

  // Scroll detection
  const handleHotelScroll = useCallback(() => {
    if (!hasMoreHotels || loadingMoreRef.current) return
    const el = hotelListRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      loadMoreHotels()
    }
  }, [hasMoreHotels, loadMoreHotels])

  const selectHotel = useCallback((hotel) => {
    update({ selectedHotel: hotel.id === selectedHotel?.id ? null : hotel })
  }, [selectedHotel, update])

  const filteredHotels = hotels.filter(h => {
    if (selectedTier === '全部') return true
    return h.keytag && h.keytag.includes(selectedTier)
  })

  const mapCenter = selectedArea ? [selectedArea.lng, selectedArea.lat] : center

  const refMarkers = [
    ...selectedRestaurants.map(r => ({ id: `ref-${r.id}`, lng: r.lng, lat: r.lat, name: `🍽 ${r.name}`, type: 'food' })),
    ...destinations.map(d => ({ id: `ref-${d.id}`, lng: d.lng, lat: d.lat, name: `📍 ${d.name}`, type: 'dest' })),
  ]

  const mainMarkers = selectedArea
    ? selectedHotel ? [{ id: selectedHotel.id, lng: selectedHotel.lng, lat: selectedHotel.lat, name: selectedHotel.name, type: 'hotel' }]
      : filteredHotels.map(h => ({ id: h.id, lng: h.lng, lat: h.lat, name: h.name, type: 'hotel' }))
    : recommendedAreas.map(s => ({ id: s.id, lng: s.lng, lat: s.lat, name: `🚇 ${s.name}`, type: 'station' }))

  const mapMarkers = [...refMarkers, ...mainMarkers]

  if (allPoints.length === 0) {
    return (
      <div className="main-content">
        <div className="empty-state">请先在「吃」和「去」中至少各选一项，才能推荐住宿区域</div>
      </div>
    )
  }

  return (
    <div className="main-content">
      {!selectedArea && (
        <>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="form-label" style={{ marginBottom: 'var(--space-xs)' }}>推荐住宿区域</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)' }}>
              按「酒店 → 吃 → 玩 → 酒店」完整路线计算最短用时
            </div>
            {loading && (
              <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--muted-fg)', fontSize: 'var(--text-sm)' }}>
                搜索地铁站...
              </div>
            )}
          </div>

          {recommendedAreas.length > 0 && mapCenter && (
            <MapView center={mapCenter} markers={mapMarkers} selectedIds={[]} />
          )}

          {recommendedAreas.map((area) => (
            <div key={area.id} className="area-card" onClick={() => selectArea(area)}>
              <div className="area-card-station">{area.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)', marginTop: 2 }}>
                {area.address}
              </div>
              <div className={'area-card-transfers ' + (area.transfers === 0 ? 'good' : area.transfers > 1 ? 'medium' : '')}>
                {area.summary}
              </div>
            </div>
          ))}
        </>
      )}

      {selectedArea && (
        <>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{selectedArea.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)', marginBottom: 'var(--space-sm)' }}>
              {selectedArea.summary}
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => update({ selectedArea: null, hotels: [], selectedHotel: null })}>
              重新选择区域
            </button>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">酒店档次</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['全部', '经济型', '舒适型', '高档型', '民宿'].map(tier => (
                  <button key={tier}
                    className={'btn btn-sm ' + (selectedTier === tier ? 'btn-primary' : 'btn-secondary')}
                    style={selectedTier === tier ? { width: 'auto', padding: '0 16px', fontSize: 'var(--text-xs)' } : { width: 'auto', padding: '0 16px', fontSize: 'var(--text-xs)' }}
                    onClick={() => setSelectedTier(tier)}>
                    {tier}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary mt-md" onClick={searchHotels} disabled={searchingHotels}
              style={searchingHotels ? { opacity: 0.6 } : {}}>
              {searchingHotels ? '搜索中...' : '搜索酒店'}
            </button>
          </div>

          {hotels.length > 0 && mapCenter && (
            <MapView center={mapCenter} markers={mapMarkers}
              selectedIds={selectedHotel ? [selectedHotel.id] : []} />
          )}

          {hotels.length > 0 && filteredHotels.length === 0 && (
            <div className="empty-state">当前价格范围内没有酒店，请调整价格</div>
          )}

          <div className="card-list" ref={hotelListRef} onScroll={handleHotelScroll}>
            {filteredHotels.map((h) => {
              const isSelected = selectedHotel?.id === h.id
              return (
                <div key={h.id}
                  className={'result-card' + (isSelected ? ' selected' : '')}
                  onClick={() => selectHotel(h)}>
                  <div className="result-card-check" />
                  <div className="result-card-info">
                    <div className="result-card-name">{h.name}</div>
                    <div className="result-card-address">{h.address}</div>
                    <div className="result-card-meta">
                      {h.distance && <span>{h.distance}</span>}
                      {h.keytag && <span>{h.keytag}</span>}
                      {h.rating && <span>{h.rating}</span>}
                      {h.tel && <span>{h.tel}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            {hasMoreHotels && (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--muted-fg)', fontSize: 'var(--font-sm)' }}>
                {loadingMoreHotels ? '加载中...' : '向下滚动加载更多...'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
