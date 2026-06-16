# Currency Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-currency display switcher to the Amoi MERN e-commerce store with LKR as the base currency, live exchange rates from exchangerate-api.com, and a navbar dropdown for currency selection.

**Architecture:** Backend proxies the exchange rate API (API key stays in `.env`), returns rates to the frontend as `GET /api/currency/rates`. A new `CurrencyContext` wraps the app, caches rates in `localStorage` for 24 hours, and exposes a `formatPrice(lkrAmount)` function used by every price-rendering component.

**Tech Stack:** Node.js/Express (backend proxy), React Context API, `Intl.NumberFormat` (price formatting), `localStorage` (24hr cache), exchangerate-api.com (rate source), Tailwind CSS (dropdown styling)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `backend/.env` | Add `EXCHANGE_RATE_API_KEY` |
| Create | `backend/controllers/currencyController.js` | Fetch rates from exchangerate-api.com |
| Create | `backend/routes/currencyRoute.js` | `GET /api/currency/rates` public route |
| Modify | `backend/server.js` | Register currency route |
| Create | `frontend/src/context/CurrencyContext.jsx` | Currency state, rates cache, `formatPrice` |
| Modify | `frontend/src/main.jsx` | Wrap app with `CurrencyProvider` |
| Modify | `frontend/src/context/ShopContext.jsx` | Remove hardcoded `currency = 'Rs '` |
| Modify | `frontend/src/components/Navbar.jsx` | Add currency switcher dropdown |
| Modify | `frontend/src/components/ProductItem.jsx` | Use `formatPrice` |
| Modify | `frontend/src/components/CartTotal.jsx` | Use `formatPrice` |
| Modify | `frontend/src/pages/Product.jsx` | Use `formatPrice` |
| Modify | `frontend/src/pages/PlaceOrder.jsx` | Use `formatPrice` for display |
| Modify | `admin/src/pages/Add.jsx` | Add LKR label to price input |

---

## Task 1: Backend — Add env var and currency controller

**Files:**
- Modify: `backend/.env`
- Create: `backend/controllers/currencyController.js`

- [ ] **Step 1: Add API key to backend .env**

Open `backend/.env` and add this line:
```
EXCHANGE_RATE_API_KEY=13336cc51865f476ce4c1fa0
```

- [ ] **Step 2: Create currency controller**

Create `backend/controllers/currencyController.js`:
```js
const getRates = async (req, res) => {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`
    )
    const data = await response.json()

    if (data.result !== 'success') {
      return res.status(502).json({ success: false, message: 'Failed to fetch exchange rates' })
    }

    res.json({ success: true, rates: data.conversion_rates })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export { getRates }
```

- [ ] **Step 3: Manually test the controller logic**

In a browser or Postman, open:
`https://v6.exchangerate-api.com/v6/13336cc51865f476ce4c1fa0/latest/LKR`

Expected: JSON with `"result": "success"` and a `conversion_rates` object containing `"LKR": 1`, `"USD": 0.003...`, etc.

---

## Task 2: Backend — Currency route and server registration

**Files:**
- Create: `backend/routes/currencyRoute.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Create currency route**

Create `backend/routes/currencyRoute.js`:
```js
import express from 'express'
import { getRates } from '../controllers/currencyController.js'

const currencyRouter = express.Router()

currencyRouter.get('/rates', getRates)

export default currencyRouter
```

- [ ] **Step 2: Register route in server.js**

In `backend/server.js`, add the import after the existing router imports:
```js
import currencyRouter from './routes/currencyRoute.js'
```

And add the route registration after the existing `app.use` calls:
```js
app.use('/api/currency', currencyRouter)
```

The updated API endpoints section of `server.js` should look like:
```js
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/currency", currencyRouter);
```

- [ ] **Step 3: Start backend and verify the endpoint**

```bash
cd backend
npm start
```

Then open in browser: `http://localhost:5000/api/currency/rates`

Expected response:
```json
{
  "success": true,
  "rates": {
    "LKR": 1,
    "USD": 0.003091,
    "EUR": 0.002845,
    ...
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/.env backend/controllers/currencyController.js backend/routes/currencyRoute.js backend/server.js
git commit -m "feat: add currency rates proxy endpoint"
```

---

## Task 3: Frontend — Create CurrencyContext

**Files:**
- Create: `frontend/src/context/CurrencyContext.jsx`

- [ ] **Step 1: Create CurrencyContext.jsx**

Create `frontend/src/context/CurrencyContext.jsx`:
```jsx
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
```

- [ ] **Step 2: Verify the formatPrice logic manually**

With `rates = { LKR: 1, USD: 0.003091 }` and `currency = 'USD'`:
- `formatPrice(1000)` → `1000 * 0.003091 = 3.091` → `"$3.09"`
- `formatPrice(1000)` with `currency = 'LKR'` → `1000 * 1 = 1000` → `"LKR 1,000.00"` (or `"රු1,000.00"` depending on locale support)

---

## Task 4: Wrap app with CurrencyProvider + clean ShopContext

**Files:**
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/context/ShopContext.jsx`

- [ ] **Step 1: Wrap App with CurrencyProvider in main.jsx**

Replace the contents of `frontend/src/main.jsx` with:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import CurrencyProvider from './context/CurrencyContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <CurrencyProvider>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </CurrencyProvider>
  </BrowserRouter>
)
```

- [ ] **Step 2: Remove hardcoded currency from ShopContext**

In `frontend/src/context/ShopContext.jsx`, remove this line:
```js
const currency = 'Rs ';
```

And remove `currency` from the `value` object:
```js
// Before:
const value = {
  products, currency, delivery_fee, ...
}

// After:
const value = {
  products, delivery_fee, ...
}
```

The full updated `value` object:
```js
const value = {
  products, delivery_fee, search, setSearch, showSearch, setShowSearch,
  cartItems, addToCart, setCartItems, getCartCount, updateQuantity, getCartAmount, navigate, backendUrl,
  setToken, token
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/CurrencyContext.jsx frontend/src/main.jsx frontend/src/context/ShopContext.jsx
git commit -m "feat: add CurrencyContext with formatPrice and localStorage caching"
```

---

## Task 5: Navbar — Currency switcher dropdown

**Files:**
- Modify: `frontend/src/components/Navbar.jsx`

- [ ] **Step 1: Replace Navbar.jsx with the updated version**

Replace the entire contents of `frontend/src/components/Navbar.jsx`:
```jsx
import React, { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { useCurrency } from '../context/CurrencyContext'

const Navbar = () => {
  const [visible, setvisible] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const currencyRef = useRef(null)

  const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext)
  const { currency, setCurrency, rates } = useCurrency()

  const currencyCodes = Object.keys(rates).sort()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
    setToken('')
    setCartItems({})
  }

  return (
    <div className='flex items-center justify-between py-5 font-medium'>

      <Link to='/'><img src={assets.logo} className='w-36' alt="" /></Link>

      <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
        <NavLink to='/' className='flex flex-col items-center gap-1'>
          <p>HOME</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/collection' className='flex flex-col items-center gap-1'>
          <p>COLLECTION</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/about' className='flex flex-col items-center gap-1'>
          <p>ABOUT</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/contact' className='flex flex-col items-center gap-1'>
          <p>CONTACT</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-6'>
        <img onClick={() => setShowSearch(true)} src={assets.search_icon} className='w-5 cursor-pointer' alt='' />

        {/* Currency Switcher */}
        <div ref={currencyRef} className='relative'>
          <button
            onClick={() => setCurrencyOpen((prev) => !prev)}
            className='flex items-center gap-1 text-sm text-gray-700 hover:text-black'
          >
            🌐 {currency} ▾
          </button>
          {currencyOpen && (
            <div className='absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded shadow-lg w-28 max-h-64 overflow-y-auto'>
              {currencyCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => { setCurrency(code); setCurrencyOpen(false) }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${currency === code ? 'font-bold text-black' : 'text-gray-700'}`}
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='group relative'>
          <img onClick={() => token ? null : navigate('/login')} src={assets.profile_icon} alt="" className='w-5 cursor-pointer' />
          {token &&
            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4'>
              <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
                <p className='cursor-pointer hover:text-black'>My Profile</p>
                <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black'>Orders</p>
                <p onClick={logout} className='cursor-pointer hover:text-black'>Logout</p>
              </div>
            </div>}
        </div>

        <Link to='/cart' className="relative">
          <img src={assets.cart_icon} className='w-5 min-w-5' alt="" />
          <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
        </Link>

        <img onClick={() => setvisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden' alt="" />
      </div>

      {/* Sidebar menu for small screen */}
      <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible ? 'w-full' : 'w-0'}`}>
        <div className='flex flex-col text-gray-600'>
          <div onClick={() => setvisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
            <img src={assets.dropdown_icon} alt="" className='h-4 rotate-180' />
            <p>Back</p>
          </div>
          <NavLink onClick={() => setvisible(false)} className='py-2 pl-6 border' to='/'>HOME</NavLink>
          <NavLink onClick={() => setvisible(false)} className='py-2 pl-6 border' to='/collection'>COLLECTION</NavLink>
          <NavLink onClick={() => setvisible(false)} className='py-2 pl-6 border' to='/about'>ABOUT</NavLink>
          <NavLink onClick={() => setvisible(false)} className='py-2 pl-6 border' to='/contact'>CONTACT</NavLink>
        </div>
      </div>
    </div>
  )
}

export default Navbar
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Navbar.jsx
git commit -m "feat: add currency switcher dropdown to navbar"
```

---

## Task 6: Update ProductItem to use formatPrice

**Files:**
- Modify: `frontend/src/components/ProductItem.jsx`

- [ ] **Step 1: Replace ProductItem.jsx**

Replace the entire contents of `frontend/src/components/ProductItem.jsx`:
```jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'

const ProductItem = ({ id, image, name, price }) => {
  const { formatPrice } = useCurrency()

  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className='overflow-hidden'>
        <img className='hover:scale-110 transition ease-in-out' src={image[0]} alt="" />
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className='text-sm font-medium'>{formatPrice(price)}</p>
    </Link>
  )
}

export default ProductItem
```

Note: `BestSeller` and `LatestCollection` both render prices via `ProductItem`, so they are automatically fixed by this change.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ProductItem.jsx
git commit -m "feat: use formatPrice in ProductItem"
```

---

## Task 7: Update CartTotal to use formatPrice

**Files:**
- Modify: `frontend/src/components/CartTotal.jsx`

- [ ] **Step 1: Replace CartTotal.jsx**

Replace the entire contents of `frontend/src/components/CartTotal.jsx`:
```jsx
import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useCurrency } from '../context/CurrencyContext'
import Title from './Title'

const CartTotal = () => {
  const { delivery_fee, getCartAmount } = useContext(ShopContext)
  const { formatPrice } = useCurrency()

  const subtotal = getCartAmount()
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p>Subtotal</p>
          <p>{formatPrice(subtotal)}</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p>Shipping Fee</p>
          <p>{formatPrice(delivery_fee)}</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p>Total</p>
          <b>{formatPrice(total)}</b>
        </div>
      </div>
    </div>
  )
}

export default CartTotal
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CartTotal.jsx
git commit -m "feat: use formatPrice in CartTotal"
```

---

## Task 8: Update Product detail page to use formatPrice

**Files:**
- Modify: `frontend/src/pages/Product.jsx`

- [ ] **Step 1: Update the import and price line in Product.jsx**

In `frontend/src/pages/Product.jsx`:

Change the import from ShopContext:
```jsx
// Before:
const { products, currency, addToCart } = useContext(ShopContext);

// After:
const { products, addToCart } = useContext(ShopContext);
```

Add the useCurrency import at the top of the file (after the existing imports):
```jsx
import { useCurrency } from '../context/CurrencyContext'
```

Inside the component, add:
```jsx
const { formatPrice } = useCurrency()
```

Change the price display line from:
```jsx
<p className='mt-5 text-3xl font-medium ' >{currency}{productData.price}</p>
```
to:
```jsx
<p className='mt-5 text-3xl font-medium'>{formatPrice(productData.price)}</p>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Product.jsx
git commit -m "feat: use formatPrice in Product detail page"
```

---

## Task 9: Update PlaceOrder page to use formatPrice

**Files:**
- Modify: `frontend/src/pages/PlaceOrder.jsx`

- [ ] **Step 1: Update PlaceOrder.jsx**

The order `amount` sent to the backend must stay in LKR (raw number) — only the display uses `formatPrice`. The current code already sends `getCartAmount() + delivery_fee` which is in LKR. No change to order data.

In `frontend/src/pages/PlaceOrder.jsx`, update the ShopContext destructure:
```jsx
// Before:
const {navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);

// After (remove currency if it was there — it was already absent in this file):
const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
```

Add the useCurrency import after existing imports:
```jsx
import { useCurrency } from '../context/CurrencyContext'
```

Inside the component add:
```jsx
const { formatPrice } = useCurrency()
```

`PlaceOrder.jsx` delegates price display to `<CartTotal />` which already uses `formatPrice` after Task 7. No further price display changes are needed in this file.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PlaceOrder.jsx
git commit -m "feat: PlaceOrder uses CurrencyContext (display via CartTotal)"
```

---

## Task 10: Admin — Add LKR label to price input

**Files:**
- Modify: `admin/src/pages/Add.jsx`

- [ ] **Step 1: Update the price input section in Add.jsx**

Find this block in `admin/src/pages/Add.jsx`:
```jsx
<div>
  <p className="mb-2">Product Price</p>
  <input
    onChange={(e) => setPrice(e.target.value)}
    value={price}
    className="w-full px-3 py-2 sm:w-[120px]"
    type="Number"
    placeholder="25"
  />
</div>
```

Replace it with:
```jsx
<div>
  <p className="mb-2">Product Price</p>
  <div className="flex items-center gap-2">
    <input
      onChange={(e) => setPrice(e.target.value)}
      value={price}
      className="w-full px-3 py-2 sm:w-[120px]"
      type="Number"
      placeholder="25"
    />
    <span className="text-sm text-gray-500 whitespace-nowrap">LKR (රු)</span>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/pages/Add.jsx
git commit -m "feat: add LKR label to admin product price input"
```

---

## Task 11: Smoke test — run the full stack

- [ ] **Step 1: Start all three servers**

Terminal 1 — backend:
```bash
cd backend && npm start
```
Expected: `Server is running on port : 5000` and `MongoDB connected`

Terminal 2 — frontend:
```bash
cd frontend && npm run dev
```
Expected: `VITE ready` at `http://localhost:5173`

Terminal 3 — admin:
```bash
cd admin && npm run dev
```
Expected: `VITE ready` at `http://localhost:5174`

- [ ] **Step 2: Verify currency switcher**

1. Open `http://localhost:5173`
2. In the navbar, click `🌐 LKR ▾` — a scrollable dropdown of currency codes should appear
3. Select `USD` — all product prices on the page should update to USD format (e.g. `$3.09`)
4. Refresh the page — `USD` should still be selected (localStorage persisted)
5. Open DevTools → Application → Local Storage:
   - Key `selectedCurrency` = `USD`
   - Key `currencyRates` = `{ rates: {...}, timestamp: <number> }`

- [ ] **Step 3: Verify cart and checkout**

1. Add a product to cart
2. Go to `/cart` — subtotal, shipping, total should all display in the selected currency
3. Go to `/place-order` — cart total displayed in selected currency
4. Place a COD order — should succeed (order amount stored in LKR in MongoDB regardless of display)

- [ ] **Step 4: Verify admin panel**

1. Open `http://localhost:5174`
2. Go to Add Product — the price field should show `LKR (රු)` label next to it

- [ ] **Step 5: Verify 24hr cache**

Open DevTools → Application → Local Storage → find `currencyRates`.
Manually set the `timestamp` to `0` and refresh — the app should fetch fresh rates and update the timestamp.
