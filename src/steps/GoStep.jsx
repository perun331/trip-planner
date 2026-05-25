import { useState, useEffect, useRef, useCallback } from 'react'
import { useTrip } from '../context/TripContext.jsx'
import { amapFetch } from '../utils/amap.js'
import MapView from '../components/MapView.jsx'

export default function GoStep() {
  const { data, update } = useTrip()
  const { destinations } = data

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestionsRef = useRef(null)
  const debounceTimer = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  const handleInput = useCallback((value) => {
    setQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (abortRef.current) abortRef.current()

    if (value.trim().length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceTimer.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = () => controller.abort()
      amapFetch(
        `v3/assistant/inputtips?keywords=${encodeURIComponent(value)}`,
        { signal: controller.signal }
      )
        .then(data => {
          if (data.status === '1' && data.tips && data.tips.length > 0) {
            const pois = data.tips
              .filter(t => t.location && t.location.includes(','))
              .map((tip, i) => {
                const [lng, lat] = tip.location.split(',').map(Number)
                return { id: `dest-tip-${i}`, name: tip.name,
                  address: tip.district + (tip.address ? ' ' + tip.address : ''), lng, lat }
              })
            setSuggestions(pois)
            setShowSuggestions(pois.length > 0)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') { setSuggestions([]); setShowSuggestions(false) }
        })
    }, 300)
  }, [])

  const addDestination = useCallback((poi) => {
    const exists = destinations.some(d => d.name === poi.name && d.lng === poi.lng)
    if (exists) {
      setQuery('')
      setShowSuggestions(false)
      return
    }
    const newDest = {
      id: `dest-${Date.now()}`,
      name: poi.name,
      address: poi.address,
      lng: poi.lng,
      lat: poi.lat,
    }
    update({ destinations: [...destinations, newDest] })
    setQuery('')
    setShowSuggestions(false)
  }, [destinations, update])

  const removeDestination = useCallback((id) => {
    update({ destinations: destinations.filter(d => d.id !== id) })
  }, [destinations, update])

  const mapCenter = destinations.length > 0
    ? [destinations[0].lng, destinations[0].lat]
    : null

  const mapMarkers = destinations.map(d => ({
    id: d.id, lng: d.lng, lat: d.lat, name: d.name,
  }))

  return (
    <div className="main-content">
      <div className="card">
        <div className="form-group">
          <label className="form-label">目的地</label>
          <div className="search-wrapper" ref={suggestionsRef}>
            <input type="text" className="form-input" placeholder="搜索想去的地方..."
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }} />
            {showSuggestions && (
              <div className="suggestions-dropdown">
                {suggestions.map((poi, i) => (
                  <div key={i} className="suggestion-item" onClick={() => addDestination(poi)}>
                    <div style={{ fontWeight: 500 }}>{poi.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)' }}>{poi.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mapCenter && (
        <MapView center={mapCenter} markers={mapMarkers} selectedIds={[]} />
      )}

      {destinations.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-sm)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, padding: 'var(--space-xs) var(--space-sm)', color: 'var(--muted-fg)' }}>
            已添加 {destinations.length} 个目的地
          </div>
          {destinations.map((d) => (
            <div key={d.id} className="result-card"
              style={{ border: 'none', boxShadow: 'none', borderBottom: '1px solid var(--border-light)', borderRadius: 0, marginBottom: 0 }}>
              <div className="result-card-info">
                <div className="result-card-name">{d.name}</div>
                <div className="result-card-address">{d.address}</div>
              </div>
              <button className="btn btn-danger"
                onClick={() => removeDestination(d.id)}>删除</button>
            </div>
          ))}
        </div>
      )}

      {destinations.length === 0 && (
        <div className="empty-state">搜索并添加你想去的地方</div>
      )}
    </div>
  )
}
