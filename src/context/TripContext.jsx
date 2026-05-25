import { createContext, useContext, useState, useCallback } from 'react'

const initialState = {
  // Step 1: Eat
  eatForm: {
    budgetMin: '',
    budgetMax: '',
    mealTime: 'lunch',
    location: '',
    locationLnglat: null,
    cuisine: '',
  },
  restaurants: [],
  selectedRestaurants: [],

  // Step 2: Go
  destinations: [],

  // Step 3: Stay
  recommendedAreas: [],
  selectedArea: null,
  hotels: [],
  selectedHotel: null,
  transitInfo: [],

  // Step control
  currentStep: 0,
}

const TripContext = createContext(null)

export function TripProvider({ children }) {
  const [data, setData] = useState(initialState)

  const update = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  const goToStep = useCallback((step) => {
    setData(prev => ({ ...prev, currentStep: step }))
  }, [])

  const nextStep = useCallback(() => {
    setData(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 3) }))
  }, [])

  const prevStep = useCallback(() => {
    setData(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }))
  }, [])

  const resetAll = useCallback(() => {
    setData(initialState)
  }, [])

  return (
    <TripContext.Provider value={{ data, update, goToStep, nextStep, prevStep, resetAll }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within TripProvider')
  return ctx
}
