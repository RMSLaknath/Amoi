# Currency Switcher Design

**Date:** 2026-06-15
**Status:** Approved
**Scope:** Multi-currency display with LKR base, live exchange rates, navbar switcher, admin LKR labelling

---

## Overview

Add a currency switcher to the Amoi e-commerce frontend that allows users to view all prices in their preferred currency. LKR is the base currency — all product prices are stored in LKR in MongoDB. Exchange rates are fetched from exchangerate-api.com via a backend proxy and cached in browser localStorage for 24 hours.

---

## Architecture

### Approach
Backend proxy + localStorage cache (Option B). The API key lives in the backend `.env`. The frontend calls the own backend endpoint, not the third-party API directly. The frontend caches rates in `localStorage` with a 24-hour TTL.

---

## Section 1: Backend

### New env variable
```
EXCHANGE_RATE_API_KEY=13336cc51865f476ce4c1fa0
```
Added to `backend/.env`.

### New files

**`backend/controllers/currencyController.js`**
- Fetches `https://v6.exchangerate-api.com/v6/{EXCHANGE_RATE_API_KEY}/latest/LKR`
- Returns the full `conversion_rates` object to the client
- On fetch failure, returns a 500 with an error message

**`backend/routes/currencyRoute.js`**
- Single route: `GET /api/currency/rates`
- No authentication required (public endpoint)
- Calls `currencyController.getRates`

### Modified files

**`backend/server.js`**
- Register `currencyRoute` under `/api/currency`

---

## Section 2: Frontend Context & Caching

### New file: `frontend/src/context/CurrencyContext.jsx`

**State:**
- `currency` — currently selected currency code (string, e.g. `"USD"`). Default: `"LKR"`. Persisted in `localStorage` key `selectedCurrency`.
- `rates` — object of all conversion rates from LKR base (e.g. `{ USD: 0.0031, EUR: 0.0028, LKR: 1, ... }`). Loaded from cache or fetched fresh.

**localStorage caching:**
- Key: `currencyRates` — stores `{ rates: {...}, timestamp: <ms> }`
- On app load: if cached data exists and `Date.now() - timestamp < 86400000` (24hrs), use cached rates. Otherwise fetch `/api/currency/rates`, save fresh data + new timestamp to localStorage.

**`formatPrice(lkrAmount)` helper:**
- Input: a price in LKR (number)
- Output: formatted string in selected currency (e.g. `"$12.50"`, `"€11.20"`, `"රු 4,000.00"`)
- Logic: `converted = lkrAmount * rates[currency]`, then formatted with `Intl.NumberFormat` using the selected currency code

**Modified: `frontend/src/main.jsx`**
- Wrap `<App />` inside `<CurrencyProvider>`

---

## Section 3: Navbar Currency Switcher

### Modified: `frontend/src/components/Navbar.jsx`

**UI:**
- Added to the right side of the navbar, next to search and cart icons
- Shows: globe icon + selected currency code + dropdown arrow (e.g. `🌐 USD ▼`)
- On click: scrollable dropdown listing all currency codes from `rates`
- On select: calls `setCurrency(code)`, saves to `localStorage` key `selectedCurrency`, closes dropdown
- Styled with existing Tailwind classes (black/white, minimal)

**Behaviour:**
- Selected currency persists on page refresh via `localStorage`
- Dropdown closes when clicking outside (click-away handler)

---

## Section 4: Admin Panel — LKR Label

### Modified: `admin/src/pages/Add.jsx`

- Price input field gets a `"LKR (රු)"` label/suffix
- No logic change — price stored as a plain number in LKR
- Admin always works in LKR; no currency conversion in admin panel

---

## Data Flow

```
User selects currency in navbar
        ↓
setCurrency("USD") → saved to localStorage["selectedCurrency"]
        ↓
formatPrice(product.price) called in ProductItem, CartTotal, PlaceOrder, etc.
        ↓
converted = price * rates["USD"]  (rates already loaded from cache or API)
        ↓
Displayed as "$12.50"
```

```
App loads (first time or cache expired)
        ↓
CurrencyContext fetches GET /api/currency/rates
        ↓
Backend calls exchangerate-api.com with LKR base
        ↓
Rates returned → stored in localStorage with timestamp
        ↓
formatPrice works for all currencies
```

---

## Components That Need formatPrice

All places that render a price amount must use `formatPrice(lkrAmount)`:

- `frontend/src/components/ProductItem.jsx` — product card price
- `frontend/src/components/CartTotal.jsx` — subtotal, delivery fee, total
- `frontend/src/components/BestSeller.jsx` — best seller prices (if shown)
- `frontend/src/components/LatestCollection.jsx` — collection prices (if shown)
- `frontend/src/pages/Product.jsx` — product detail price
- `frontend/src/pages/PlaceOrder.jsx` — order total

---

## Constraints & Assumptions

- All product prices in MongoDB are in LKR. No migration needed.
- exchangerate-api.com free tier: 1,500 requests/month. With localStorage 24hr cache, a single user triggers at most 1 request/day per browser. This is well within limits.
- Currency selection applies to display only — PayHere payment (future) will always charge in LKR regardless of display currency.
- No server-side caching — frontend localStorage is the only cache layer.
