import { useState, useEffect, useRef, useCallback } from 'react'
import { useTrip } from '../context/TripContext.jsx'
import { amapFetch } from '../utils/amap.js'
import MapView from '../components/MapView.jsx'

const MEAL_TIMES = [
  { value: 'breakfast', label: '早餐 (6:00-10:00)', keyword: '早餐' },
  { value: 'lunch', label: '午餐 (11:00-14:00)', keyword: '' },
  { value: 'afternoon', label: '下午茶 (14:00-17:00)', keyword: '下午茶 甜品 咖啡' },
  { value: 'dinner', label: '晚餐 (17:00-21:00)', keyword: '' },
  { value: 'night', label: '夜宵 (21:00以后)', keyword: '夜宵 烧烤' },
]

const SEARCH_RADIUS = 5000
const PAGE_SIZE = 10

function formatDistance(meters) {
  const m = parseInt(meters, 10)
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`
}

export default function EatStep() {
  const { data, update } = useTrip()
  const { eatForm, restaurants, selectedRestaurants } = data

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [keyError, setKeyError] = useState(false)
  const [focusedId, setFocusedId] = useState(null)
  const [searchPage, setSearchPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showLoadMore, setShowLoadMore] = useState(false)

  const suggestionsRef = useRef(null)
  const debounceTimer = useRef(null)
  const abortRef = useRef(null)
  const listRef = useRef(null)
  const existingIdsRef = useRef(new Set())
  const loadingMoreRef = useRef(false)

  // Close suggestions on outside click
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

  const updateForm = useCallback((field, value) => {
    update({ eatForm: { ...eatForm, [field]: value } })
  }, [eatForm, update])

  // Location input tips via REST API
  const handleLocationInput = useCallback((value) => {
    updateForm('location', value)
    setKeyError(false)
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
      amapFetch(`v3/assistant/inputtips?keywords=${encodeURIComponent(value)}`, { signal: controller.signal })
        .then(data => {
          if (data.status === '1' && data.tips && data.tips.length > 0) {
            const pois = data.tips
              .filter(t => t.location && t.location.includes(','))
              .map((tip, i) => {
                const [lng, lat] = tip.location.split(',').map(Number)
                return { id: `loc-${i}`, name: tip.name,
                  address: tip.district + (tip.address ? ' ' + tip.address : ''), lng, lat }
              })
            setSuggestions(pois)
            setShowSuggestions(pois.length > 0)
          } else if (data.info === 'USERKEY_PLAT_NOMATCH' || data.info === 'INVALID_USER_SCODE') {
            setKeyError(true)
            setSuggestions([])
            setShowSuggestions(false)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') { setSuggestions([]); setShowSuggestions(false) }
        })
    }, 300)
  }, [updateForm])

  const selectLocation = useCallback((poi) => {
    update({
      eatForm: { ...eatForm, location: poi.name, locationLnglat: [poi.lng, poi.lat] }
    })
    setShowSuggestions(false)
  }, [eatForm, update])

  // Shared fetch function — page-based, with meal-time keyword boost
  const fetchRestaurants = useCallback((page, existingIds) => {
    const mealTime = MEAL_TIMES.find(m => m.value === eatForm.mealTime)
    const mealKeyword = mealTime?.keyword || ''
    const parts = [eatForm.cuisine, mealKeyword].filter(Boolean)
    const keyword = parts.length > 0 ? parts.join(' ') : '餐厅'
    const [lng, lat] = eatForm.locationLnglat
    return amapFetch(
      `v3/place/around?location=${lng},${lat}&radius=${SEARCH_RADIUS}&keywords=${encodeURIComponent(keyword)}&types=餐饮服务&offset=${PAGE_SIZE}&extensions=all&page=${page}`
    )
      .then(data => {
        if (data.status === '1' && data.pois && data.pois.length > 0) {
          return data.pois
            .filter(p => !existingIds.has(p.id || p.name))
            .map((poi) => ({
              id: poi.id || `${poi.name}-${poi.location}`,
              name: poi.name,
              address: poi.address || poi.pname + poi.cityname + poi.adname,
              lng: Number(poi.location.split(',')[0]),
              lat: Number(poi.location.split(',')[1]),
              distance: formatDistance(poi.distance),
              tel: poi.tel || '',
              rating: poi.biz_ext?.rating ? `${poi.biz_ext.rating}分` : '',
              cost: poi.biz_ext?.cost ? `${poi.biz_ext.cost}元/人` : '',
            }))
        }
        return []
      })
  }, [eatForm.cuisine, eatForm.locationLnglat, eatForm.mealTime])

  // Initial search
  const searchRestaurants = useCallback(() => {
    if (!eatForm.locationLnglat) {
      alert('请先在"地点"输入框中搜索并选择一个地点')
      return
    }

    setSearching(true)
    setSearched(true)
    setSearchPage(1)
    setShowLoadMore(false)
    setFocusedId(null)
    update({ selectedRestaurants: [] })
    existingIdsRef.current = new Set()

    fetchRestaurants(1, new Set())
      .then(pois => {
        setSearching(false)
        pois.forEach(p => existingIdsRef.current.add(p.id))
        update({ restaurants: pois })
        setHasMore(pois.length >= PAGE_SIZE)
        setShowLoadMore(pois.length >= PAGE_SIZE)
      })
      .catch(() => {
        setSearching(false)
        update({ restaurants: [] })
      })
  }, [eatForm, update, fetchRestaurants])

  // Load more (next page)
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return
    const nextPage = searchPage + 1

    loadingMoreRef.current = true
    setLoadingMore(true)
    fetchRestaurants(nextPage, existingIdsRef.current)
      .then(pois => {
        loadingMoreRef.current = false
        setLoadingMore(false)
        setSearchPage(nextPage)
        if (pois.length === 0) {
          setHasMore(false)
          setShowLoadMore(false)
          return
        }
        pois.forEach(p => existingIdsRef.current.add(p.id))
        update({ restaurants: [...restaurants, ...pois] })
        setHasMore(pois.length >= PAGE_SIZE)
        setShowLoadMore(pois.length >= PAGE_SIZE)
      })
      .catch(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      })
  }, [hasMore, searchPage, restaurants, update, fetchRestaurants])

  // Scroll detection on the list container
  const handleListScroll = useCallback(() => {
    if (!showLoadMore || loadingMoreRef.current) return
    const el = listRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      loadMore()
    }
  }, [showLoadMore, loadMore])

  // Toggle restaurant selection (max 3)
  const toggleRestaurant = useCallback((restaurant) => {
    const isSelected = selectedRestaurants.some(r => r.id === restaurant.id)
    if (isSelected) {
      setFocusedId(null)
      update({ selectedRestaurants: selectedRestaurants.filter(r => r.id !== restaurant.id) })
    } else {
      if (selectedRestaurants.length >= 3) {
        alert('最多选择 3 家餐厅')
        return
      }
      setFocusedId(restaurant.id)
      update({ selectedRestaurants: [...selectedRestaurants, restaurant] })
    }
  }, [selectedRestaurants, update])

  // Filter restaurants by budget
  const minBudget = eatForm.budgetMin ? Number(eatForm.budgetMin) : 0
  const maxBudget = eatForm.budgetMax ? Number(eatForm.budgetMax) : Infinity

  const filteredRestaurants = restaurants.filter(r => {
    if (!eatForm.budgetMin && !eatForm.budgetMax) return true
    const costMatch = r.cost.match(/(\d+)/)
    if (!costMatch) return minBudget === 0  // no cost info: show if min isn't set
    const costNum = Number(costMatch[1])
    return costNum >= minBudget && (maxBudget === Infinity || costNum <= maxBudget)
  })

  // Map viewport
  const focusedRestaurant = focusedId ? filteredRestaurants.find(r => r.id === focusedId) : null
  const mapCenter = focusedRestaurant
    ? [focusedRestaurant.lng, focusedRestaurant.lat]
    : (eatForm.locationLnglat || (filteredRestaurants.length > 0 ? [filteredRestaurants[0].lng, filteredRestaurants[0].lat] : null))
  const mapZoom = focusedRestaurant ? 16 : null
  const mapMarkers = filteredRestaurants.map(r => ({ id: r.id, lng: r.lng, lat: r.lat, name: r.name }))

  return (
    <div className="main-content">
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ width: '45%' }}>
            <label className="form-label">最低预算</label>
            <input type="number" className="form-input" placeholder="¥0"
              value={eatForm.budgetMin} onChange={(e) => updateForm('budgetMin', e.target.value)} />
          </div>
          <div className="form-group" style={{ width: '45%' }}>
            <label className="form-label">最高预算</label>
            <input type="number" className="form-input" placeholder="¥999"
              value={eatForm.budgetMax} onChange={(e) => updateForm('budgetMax', e.target.value)} />
          </div>
        </div>

        <div className="form-group mt-sm">
          <label className="form-label">用餐时段</label>
          <select className="form-select" value={eatForm.mealTime} onChange={(e) => updateForm('mealTime', e.target.value)}>
            {MEAL_TIMES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>

        <div className="form-group mt-sm">
          <label className="form-label">地点</label>
          <div className="search-wrapper" ref={suggestionsRef}>
            <input type="text" className="form-input" placeholder="输入地点名称..."
              value={eatForm.location}
              onChange={(e) => handleLocationInput(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }} />
            {keyError && (
              <div style={{ color: 'var(--fg)', fontSize: 'var(--font-xs)', marginTop: 4 }}>
                地点搜索失败，请检查 Web服务 Key 是否正确配置
              </div>
            )}
            {showSuggestions && (
              <div className="suggestions-dropdown">
                {suggestions.map((poi, i) => (
                  <div key={i} className="suggestion-item" onClick={() => selectLocation(poi)}>
                    <div style={{ fontWeight: 500 }}>{poi.name}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--muted-fg)' }}>{poi.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group mt-sm">
          <label className="form-label">菜系风格（可选）</label>
          <input type="text" className="form-input" placeholder="如：川菜、日料、火锅..."
            value={eatForm.cuisine} onChange={(e) => updateForm('cuisine', e.target.value)} />
        </div>

        <button className="btn btn-primary mt-md" onClick={searchRestaurants}
          disabled={searching} style={searching ? { opacity: 0.6 } : {}}>
          {searching ? '搜索中...' : '搜索餐厅'}
        </button>
      </div>

      {searched && mapCenter && (
        <MapView center={mapCenter} zoom={mapZoom} markers={mapMarkers}
          selectedIds={selectedRestaurants.map(r => r.id)}
          onMarkerClick={toggleRestaurant} />
      )}

      {searched && restaurants.length === 0 && !searching && (
        <div className="empty-state">未找到餐厅，请尝试更换地点或菜系</div>
      )}

      {searched && restaurants.length > 0 && filteredRestaurants.length === 0 && !searching && (
        <div className="empty-state">当前预算范围内没有餐厅，请调整预算</div>
      )}

      {filteredRestaurants.length > 0 && (
        <div className="card-list" ref={listRef} onScroll={handleListScroll}>
          {filteredRestaurants.map((r) => {
            const isSelected = selectedRestaurants.some(s => s.id === r.id)
            return (
              <div key={r.id}
                className={'result-card' + (isSelected ? ' selected' : '')}
                onClick={() => toggleRestaurant(r)}>
                <div className="result-card-check" />
                <div className="result-card-info">
                  <div className="result-card-name">{r.name}</div>
                  <div className="result-card-address">{r.address}</div>
                  <div className="result-card-meta">
                    {r.distance && <span>{r.distance}</span>}
                    {r.rating && <span>{r.rating}</span>}
                    {r.cost && <span>{r.cost}</span>}
                    {r.tel && <span>{r.tel}</span>}
                  </div>
                </div>
              </div>
            )
          })}
          {showLoadMore && (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--muted-fg)', fontSize: 'var(--font-sm)' }}>
              {loadingMore ? '加载中...' : '向下滚动加载更多...'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
