# PayHere Payment Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PayHere sandbox payment gateway as a second checkout option alongside Cash on Delivery.

**Architecture:** When the user selects PayHere and submits the order form, the frontend calls a backend endpoint that creates the order (payment: false), computes the PayHere MD5 hash, and returns the signed form fields. The frontend then auto-submits a hidden HTML form to PayHere's hosted checkout page. After payment, PayHere calls the backend notify webhook which verifies the hash and marks the order paid. A lightweight `/payhere-return` page handles the browser redirect back from PayHere.

**Tech Stack:** Node.js/Express, MongoDB/Mongoose, React (Vite), axios, Node.js built-in `crypto` (MD5), PayHere sandbox (`https://sandbox.payhere.lk/pay/checkout`)

---

## Prerequisites (read before starting)

### 1. PayHere Sandbox Account
1. Register at https://sandbox.payhere.lk
2. Go to **Settings → Domain & Credentials**
3. Note your **Merchant ID** and **Merchant Secret**

### 2. Public notify URL (ngrok)
PayHere's servers must be able to call your `notify_url`. For local dev use ngrok:
```bash
# Install ngrok then run:
ngrok http 5000
# Copy the https URL, e.g. https://abc123.ngrok.io
# Your notify_url will be: https://abc123.ngrok.io/api/order/payhere/notify
```
You must restart ngrok and update `PAYHERE_NOTIFY_URL` in `.env` each time you restart ngrok.

---

## File Map

| Action | File |
|--------|------|
| Modify | `backend/.env` |
| Modify | `backend/server.js` |
| **Create** | `backend/controllers/payhereController.js` |
| Modify | `backend/routes/orderRoute.js` |
| Modify | `frontend/src/pages/PlaceOrder.jsx` |
| **Create** | `frontend/src/pages/PayHereReturn.jsx` |
| Modify | `frontend/src/App.jsx` |

---

## Task 1: Add PayHere env vars and urlencoded middleware

**Files:**
- Modify: `backend/.env`
- Modify: `backend/server.js`

PayHere's notify webhook posts `application/x-www-form-urlencoded` data (not JSON), so Express needs the urlencoded body parser.

- [ ] **Step 1: Add PayHere credentials to `backend/.env`**

Append these lines to the existing `backend/.env` file (keep all existing content):

```
PAYHERE_MERCHANT_ID=YOUR_SANDBOX_MERCHANT_ID
PAYHERE_MERCHANT_SECRET=YOUR_SANDBOX_MERCHANT_SECRET
PAYHERE_NOTIFY_URL=https://YOUR_NGROK_ID.ngrok.io/api/order/payhere/notify
FRONTEND_URL=http://localhost:5173
```

Replace `YOUR_SANDBOX_MERCHANT_ID`, `YOUR_SANDBOX_MERCHANT_SECRET`, and `YOUR_NGROK_ID` with your actual values.

- [ ] **Step 2: Add `express.urlencoded()` middleware to `backend/server.js`**

In `backend/server.js`, find the existing middleware block:
```js
// Middleware
app.use(express.json());
app.use(cors());
```

Replace it with:
```js
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
```

- [ ] **Step 3: Commit**

```bash
git add backend/.env backend/server.js
git commit -m "feat: add PayHere env vars and urlencoded middleware"
```

---

## Task 2: Create payhereController.js

**Files:**
- Create: `backend/controllers/payhereController.js`

This file contains two functions:
- `placeOrderPayHere` — creates the order, computes the PayHere checkout hash, returns signed form fields to the frontend
- `payhereNotify` — receives PayHere's webhook POST, verifies the hash, updates order payment status

**Hash algorithm (checkout):**
```
hashedSecret = MD5(merchant_secret).toUpperCase()
hash = MD5(merchant_id + order_id + amount_2dp + currency + hashedSecret).toUpperCase()
```

**Hash algorithm (notify verification):**
```
hashedSecret = MD5(merchant_secret).toUpperCase()
local_hash = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret).toUpperCase()
// Compare local_hash with md5sig from POST body
```

**PayHere status codes:** `2` = Success, `0` = Pending, `-1` = Canceled, `-2` = Failed, `-3` = Chargedback

- [ ] **Step 1: Create `backend/controllers/payhereController.js`**

```js
import crypto from 'crypto'
import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex')

const generateCheckoutHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  const hashedSecret = md5(merchantSecret).toUpperCase()
  const raw = merchantId + orderId + amount + currency + hashedSecret
  return md5(raw).toUpperCase()
}

const verifyNotifyHash = (body, merchantSecret) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body
  const hashedSecret = md5(merchantSecret).toUpperCase()
  const raw = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret
  return md5(raw).toUpperCase() === md5sig
}

// POST /api/order/payhere/checkout  (auth required)
const placeOrderPayHere = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body

    const user = await userModel.findById(userId)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    // Create order with payment: false — will be confirmed by notify webhook
    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: 'PayHere',
      payment: false,
      date: Date.now(),
    }
    const newOrder = new orderModel(orderData)
    await newOrder.save()

    // Clear user cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} })

    const orderId = newOrder._id.toString()
    const amountFormatted = amount.toFixed(2)
    const currency = 'LKR'
    const merchantId = process.env.PAYHERE_MERCHANT_ID
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET

    const hash = generateCheckoutHash(merchantId, orderId, amountFormatted, currency, merchantSecret)

    res.json({
      success: true,
      payhereData: {
        sandbox:        true,
        merchant_id:    merchantId,
        return_url:     process.env.FRONTEND_URL + '/payhere-return?status=success',
        cancel_url:     process.env.FRONTEND_URL + '/payhere-return?status=cancel',
        notify_url:     process.env.PAYHERE_NOTIFY_URL,
        order_id:       orderId,
        items:          'Amoi Order #' + orderId.slice(-6),
        currency,
        amount:         amountFormatted,
        first_name:     address.firstName,
        last_name:      address.lastName,
        email:          address.email,
        phone:          address.phone,
        address:        address.street,
        city:           address.city,
        country:        address.country,
        hash,
      },
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// POST /api/order/payhere/notify  (called by PayHere servers — no auth)
const payhereNotify = async (req, res) => {
  try {
    const { order_id, status_code } = req.body

    if (!verifyNotifyHash(req.body, process.env.PAYHERE_MERCHANT_SECRET)) {
      console.log('PayHere notify: hash mismatch for order', order_id)
      return res.sendStatus(400)
    }

    if (status_code === '2') {
      await orderModel.findByIdAndUpdate(order_id, { payment: true })
      console.log('PayHere payment confirmed for order', order_id)
    } else {
      console.log('PayHere notify: status', status_code, 'for order', order_id)
    }

    res.sendStatus(200)
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
}

export { placeOrderPayHere, payhereNotify }
```

- [ ] **Step 2: Verify the file exists**

```bash
ls backend/controllers/payhereController.js
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/payhereController.js
git commit -m "feat: add PayHere checkout and notify controller"
```

---

## Task 3: Wire PayHere routes in orderRoute.js

**Files:**
- Modify: `backend/routes/orderRoute.js`

Current file content for reference:
```js
import express from 'express';
import { placeOrder, allOrders, userOrders, updateStatus } from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.post('/userorders', authUser, userOrders);

export default orderRouter;
```

- [ ] **Step 1: Replace `backend/routes/orderRoute.js` with the updated version**

```js
import express from 'express';
import { placeOrder, allOrders, userOrders, updateStatus } from '../controllers/orderController.js';
import { placeOrderPayHere, payhereNotify } from '../controllers/payhereController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.post('/userorders', authUser, userOrders);

// PayHere routes
orderRouter.post('/payhere/checkout', authUser, placeOrderPayHere);
orderRouter.post('/payhere/notify', payhereNotify);

export default orderRouter;
```

- [ ] **Step 2: Restart backend and verify routes are registered**

```bash
# In backend terminal, restart: npm start
# You should see "Server is running on port : 5000" with no errors
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/orderRoute.js
git commit -m "feat: register PayHere checkout and notify routes"
```

---

## Task 4: Update PlaceOrder.jsx — add PayHere option and payment flow

**Files:**
- Modify: `frontend/src/pages/PlaceOrder.jsx`

The PayHere flow:
1. User selects PayHere and clicks "PLACE ORDER"
2. Frontend calls `POST /api/order/payhere/checkout` → receives `payhereData` object
3. Frontend creates a hidden HTML `<form method="POST" action="https://sandbox.payhere.lk/pay/checkout">` with all fields as hidden inputs, appends it to `document.body`, and submits it
4. The browser navigates to PayHere's hosted checkout page
5. After payment, PayHere redirects to `return_url` or `cancel_url`

- [ ] **Step 1: Replace `frontend/src/pages/PlaceOrder.jsx` with the full updated version**

```jsx
import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useCurrency } from '../context/CurrencyContext'

const PAYHERE_URL = 'https://sandbox.payhere.lk/pay/checkout'

const submitToPayHere = (payhereData) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = PAYHERE_URL
  Object.entries(payhereData).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

const PlaceOrder = () => {
  const [method, setMethod] = useState('Cash On Delivery')
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext)
  const { formatPrice } = useCurrency()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
  })

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setFormData(data => ({ ...data, [name]: value }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      let orderItems = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItems[items][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      }

      switch (method) {
        case 'Cash On Delivery': {
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (response.data.success) {
            setCartItems({})
            navigate('/orders')
          } else {
            toast.error(response.data.message)
          }
          break
        }

        case 'PayHere': {
          const response = await axios.post(backendUrl + '/api/order/payhere/checkout', orderData, { headers: { token } })
          if (response.data.success) {
            setCartItems({})
            submitToPayHere(response.data.payhereData)
          } else {
            toast.error(response.data.message)
          }
          break
        }

        default:
          break
      }
    } catch (error) {
      console.log(error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/* Left Side — Delivery Information */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='text' placeholder='First Name' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Last name' />
        </div>
        <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='email' placeholder='Email Address' />
        <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Street' />
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='text' placeholder='City' />
          <input required onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='text' placeholder='State' />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='number' placeholder='Zip Code' />
          <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='text' placeholder='Country' />
        </div>
        <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type='number' placeholder='Phone' />
      </div>

      {/* Right Side — Cart Total + Payment Method */}
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal />
        </div>

        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          <div className='flex gap-3 flex-col lg:flex-row'>
            {/* Cash On Delivery */}
            <div onClick={() => setMethod('Cash On Delivery')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'Cash On Delivery' ? 'bg-green-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
            </div>
            {/* PayHere */}
            <div onClick={() => setMethod('PayHere')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'PayHere' ? 'bg-green-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>PAYHERE</p>
            </div>
          </div>

          <div className='w-full text-end mt-8'>
            <button type='submit' className='bg-black text-white px-16 py-3'>PLACE ORDER</button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
```

- [ ] **Step 2: Verify in the browser**

Navigate to `/place-order`. You should see two payment options: **CASH ON DELIVERY** and **PAYHERE**. Clicking each should highlight the selection dot green.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PlaceOrder.jsx
git commit -m "feat: add PayHere payment option to PlaceOrder"
```

---

## Task 5: Create PayHereReturn.jsx

**Files:**
- Create: `frontend/src/pages/PayHereReturn.jsx`

This page handles the browser redirect from PayHere after payment. PayHere redirects to `return_url` (success) or `cancel_url` (cancelled). We embed `?status=success` or `?status=cancel` in those URLs so this page knows what to display.

The actual order confirmation happens server-side via the notify webhook. This page just shows a user-friendly message.

- [ ] **Step 1: Create `frontend/src/pages/PayHereReturn.jsx`**

```jsx
import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const PayHereReturn = () => {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')

  if (status === 'cancel') {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center gap-4 border-t pt-14'>
        <div className='text-4xl'>✕</div>
        <h2 className='text-xl font-medium text-gray-800'>Payment Cancelled</h2>
        <p className='text-gray-500 text-sm text-center max-w-sm'>
          Your payment was cancelled. Your order has been saved — you can try again or choose Cash on Delivery.
        </p>
        <div className='flex gap-4 mt-2'>
          <Link to='/orders' className='border px-6 py-2 text-sm text-gray-600 hover:bg-gray-50'>
            My Orders
          </Link>
          <Link to='/cart' className='bg-black text-white px-6 py-2 text-sm hover:bg-gray-800'>
            Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-[60vh] flex flex-col items-center justify-center gap-4 border-t pt-14'>
      <div className='text-4xl'>✓</div>
      <h2 className='text-xl font-medium text-gray-800'>Payment Successful!</h2>
      <p className='text-gray-500 text-sm text-center max-w-sm'>
        Thank you for your purchase. Your payment is being confirmed and your order will be processed shortly.
      </p>
      <Link to='/orders' className='bg-black text-white px-8 py-3 text-sm hover:bg-gray-800 mt-2'>
        VIEW MY ORDERS
      </Link>
    </div>
  )
}

export default PayHereReturn
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PayHereReturn.jsx
git commit -m "feat: add PayHere return/cancel landing page"
```

---

## Task 6: Register PayHereReturn route in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Update `frontend/src/App.jsx`**

Add the import at the top with the other page imports:
```js
import PayHereReturn from './pages/PayHereReturn'
```

Add the route inside `<Routes>` after the existing routes:
```jsx
<Route path='/payhere-return' element={<PayHereReturn />} />
```

The full updated `frontend/src/App.jsx`:
```jsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import PayHereReturn from './pages/PayHereReturn'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'

const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <ToastContainer />
      <Navbar />
      <SearchBar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/collection' element={<Collection />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/product/:productId' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/login' element={<Login />} />
        <Route path='/place-order' element={<PlaceOrder />} />
        <Route path='/orders' element={<Orders />} />
        <Route path='/payhere-return' element={<PayHereReturn />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
```

- [ ] **Step 2: Verify in the browser**

Navigate to `http://localhost:5173/payhere-return?status=success` — should show the success page.
Navigate to `http://localhost:5173/payhere-return?status=cancel` — should show the cancel page.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: register /payhere-return route"
```

---

## End-to-End Test Checklist

Once all tasks are complete, test with PayHere sandbox:

1. **Setup**: Start ngrok (`ngrok http 5000`), update `PAYHERE_NOTIFY_URL` in `backend/.env`, restart backend
2. **Add items to cart** → go to `/place-order`
3. **Fill delivery form**, select **PAYHERE**, click **PLACE ORDER**
4. **PayHere checkout page** should open in the browser
5. **Use PayHere sandbox test card**: `4916217501611292`, expiry: any future date, CVV: any 3 digits
6. **After payment**: browser redirects to `/payhere-return?status=success`
7. **Check backend logs**: should show "PayHere payment confirmed for order XYZ"
8. **Check `/orders` page**: order should show with `paymentMethod: PayHere` and `payment: true` (if admin panel shows payment status)
9. **Test cancel**: repeat, but click Cancel on PayHere → should redirect to `/payhere-return?status=cancel`

### PayHere Sandbox Test Cards
| Card Number | Result |
|-------------|--------|
| 4916217501611292 | Success |
| 4012888888881881 | Failure |

---

## Self-Review Notes

**Spec coverage:**
- ✅ PayHere sandbox checkout (hash-based form POST)
- ✅ notify webhook verification + order update
- ✅ Frontend PayHere option in payment method selector  
- ✅ Return/cancel landing page
- ✅ Cart cleared on order creation (consistent with COD)
- ✅ No existing COD flow broken

**Security:**
- Hash is computed server-side (merchant secret never exposed to client)
- notify webhook verifies PayHere's hash before updating payment status
- `payhereNotify` route has no auth middleware (PayHere servers don't send a token), but hash verification replaces it

**Edge cases handled:**
- Payment cancelled: order exists with `payment: false`, user can see it in /orders
- Notify not received (ngrok down): order stays unpaid; admin can manually update status
