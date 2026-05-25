import { useTrip } from '../context/TripContext.jsx'

export default function Itinerary() {
  const { data, resetAll } = useTrip()
  const { eatForm, selectedRestaurants, destinations, selectedHotel, selectedArea } = data

  const mealTimeMap = { breakfast: '早餐', lunch: '午餐', afternoon: '下午茶', dinner: '晚餐', night: '夜宵' }

  const handleCopy = () => {
    const lines = ['📋 Plan myself', '']
    if (selectedRestaurants.length > 0) {
      lines.push('🍽 吃')
      selectedRestaurants.forEach((r, i) => {
        lines.push(`  ${i + 1}. ${r.name}`)
        lines.push(`     ${r.address} · ${r.distance}`)
        if (r.cost) lines.push(`     人均 ${r.cost}`)
      })
      lines.push('')
    }
    if (destinations.length > 0) {
      lines.push('📍 去')
      destinations.forEach((d, i) => {
        lines.push(`  ${i + 1}. ${d.name}`)
        lines.push(`     ${d.address}`)
      })
      lines.push('')
    }
    if (selectedHotel) {
      lines.push('🏨 住')
      lines.push(`  ${selectedHotel.name}`)
      lines.push(`  ${selectedHotel.address}`)
      lines.push('')
    }
    if (selectedArea?.summary) {
      lines.push(`🚇 出行: ${selectedArea.summary}`)
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('行程已复制到剪贴板')
    }).catch(() => {})
  }

  return (
    <div className="main-content">
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
          Plan myself
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)' }}>
          {eatForm.location} · {mealTimeMap[eatForm.mealTime] || ''}
        </div>
      </div>

      {/* Eat */}
      {selectedRestaurants.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="form-label" style={{ marginBottom: 'var(--space-sm)' }}>🍽 吃</div>
          {selectedRestaurants.map((r, i) => (
            <div key={r.id} className="itinerary-item" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)' }}>
                {r.address}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)', marginTop: 2 }}>
                {r.distance} · {r.cost}{r.rating ? ` · ${r.rating}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Go */}
      {destinations.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="form-label" style={{ marginBottom: 'var(--space-sm)' }}>📍 去</div>
          {destinations.map((d, i) => (
            <div key={d.id} className="itinerary-item" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)' }}>{d.address}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stay */}
      {selectedHotel && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="form-label" style={{ marginBottom: 'var(--space-sm)' }}>🏨 住</div>
          <div className="itinerary-item">
            <div style={{ fontWeight: 600 }}>{selectedHotel.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)' }}>{selectedHotel.address}</div>
            {selectedHotel.keytag && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)', marginTop: 2 }}>
                {selectedHotel.keytag} · {selectedHotel.rating}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transit */}
      {selectedArea && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="form-label" style={{ marginBottom: 'var(--space-sm)' }}>🚇 出行提示</div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{selectedArea.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-fg)', marginTop: 4 }}>
            {selectedArea.summary}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary" onClick={handleCopy} style={{ flex: 1 }}>
          复制行程
        </button>
        <button className="btn btn-secondary" onClick={resetAll} style={{ flex: 1 }}>
          重新规划
        </button>
      </div>
    </div>
  )
}
