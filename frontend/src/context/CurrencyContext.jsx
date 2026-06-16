import React, { createContext, useContext, useEffect, useState } from 'react'

export const CurrencyContext = createContext()

const CACHE_KEY = 'currencyRates'
const SELECTED_KEY = 'selectedCurrency'
const TTL_MS = 86400000 // 24 hours

const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem(SELECTED_KEY) || 'LKR'
  )
  const [rates, setRates] = useState({ LKR: 1 })

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { rates: cachedRates, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < TTL_MS) {
        setRates(cachedRates)
        return
      }
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/currency/rates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRates(data.rates)
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rates: data.rates, timestamp: Date.now() })
          )
        }
      })
      .catch((err) => console.error('Failed to load exchange rates:', err))
  }, [])

  const setCurrency = (code) => {
    localStorage.setItem(SELECTED_KEY, code)
    setCurrencyState(code)
  }

  const formatPrice = (lkrAmount) => {
    if (!lkrAmount && lkrAmount !== 0) return ''
    const converted = lkrAmount * (rates[currency] ?? 1)
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted)
    } catch {
      return `${currency} ${converted.toFixed(2)}`
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

export default CurrencyProvider
