# Product Review System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded star rating and lorem ipsum on the product page with a real review system — authenticated users can submit a 1–5 star rating plus a comment, and all reviews are stored in MongoDB and displayed per product.

**Architecture:** A new `reviewModel` in MongoDB stores one review per user per product (upsert on re-submit). A new `reviewController` + `reviewRoute` expose two endpoints: `GET /api/review/:productId` (public, returns reviews + computed avg) and `POST /api/review/add` (auth-required, adds/updates review). The frontend gets two new components — a reusable `StarRating` and a self-contained `ReviewSection` — which are dropped into the existing `Product.jsx`.

**Tech Stack:** MongoDB + Mongoose, Express, React (Vite), JWT auth middleware (existing), Tailwind CSS, axios

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `backend/models/reviewModel.js` | Mongoose schema for reviews |
| Create | `backend/controllers/reviewController.js` | `addReview`, `getProductReviews` |
| Create | `backend/routes/reviewRoute.js` | Express router for review endpoints |
| Modify | `backend/server.js` | Import + mount reviewRouter |
| Create | `frontend/src/components/StarRating.jsx` | Reusable star display / picker |
| Create | `frontend/src/components/ReviewSection.jsx` | Full review list + submit form |
| Modify | `frontend/src/pages/Product.jsx` | Swap hardcoded stars for real data |

---

### Task 1: Review Model

**Files:**
- Create: `backend/models/reviewModel.js`

- [ ] **Step 1: Create the review model**

```js
// backend/models/reviewModel.js
import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  userId:    { type: String, required: true },
  userName:  { type: String, required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, required: true },
  date:      { type: Number, required: true },
})

// One review per user per product — re-submitting updates the existing one
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

const reviewModel =
  mongoose.models.review || mongoose.model('review', reviewSchema)

export default reviewModel
```

- [ ] **Step 2: Verify the file saved cleanly**

Open `backend/models/reviewModel.js` and confirm it has no syntax errors. No test runner is available — visual check is sufficient.

- [ ] **Step 3: Commit**

```bash
git add backend/models/reviewModel.js
git commit -m "feat: add review mongoose model"
```

---

### Task 2: Review Controller

**Files:**
- Create: `backend/controllers/reviewController.js`
- Reference (read-only): `backend/models/reviewModel.js`, `backend/models/orderModel.js`, `backend/models/userModel.js`

Context:
- `authUser` middleware sets `req.body.userId` from the JWT token.
- Order items are stored as an array of objects. Each item has an `_id` field equal to the productId.
- User name is stored in `userModel` as the `name` field.

- [ ] **Step 1: Create the review controller**

```js
// backend/controllers/reviewController.js
import reviewModel from '../models/reviewModel.js'
import orderModel  from '../models/orderModel.js'
import userModel   from '../models/userModel.js'

// POST /api/review/add  (auth required)
const addReview = async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body

    if (!productId || !rating || !comment) {
      return res.json({ success: false, message: 'productId, rating and comment are required' })
    }
    if (rating < 1 || rating > 5) {
      return res.json({ success: false, message: 'Rating must be between 1 and 5' })
    }

    const user = await userModel.findById(userId)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    // Upsert: one review per user per product
    await reviewModel.findOneAndUpdate(
      { productId, userId },
      {
        productId,
        userId,
        userName: user.name,
        rating:   Number(rating),
        comment:  comment.trim(),
        date:     Date.now(),
      },
      { upsert: true, new: true }
    )

    res.json({ success: true, message: 'Review submitted' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// GET /api/review/:productId  (public)
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params

    const reviews = await reviewModel
      .find({ productId })
      .sort({ date: -1 })   // newest first
      .lean()

    const avgRating =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    res.json({
      success: true,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addReview, getProductReviews }
```

- [ ] **Step 2: Verify the file saved cleanly**

Visual check — no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/reviewController.js
git commit -m "feat: add review controller (add + get)"
```

---

### Task 3: Review Route + server.js wiring

**Files:**
- Create: `backend/routes/reviewRoute.js`
- Modify: `backend/server.js`

Context:
- Existing pattern in `backend/server.js`:
  ```js
  import currencyRouter from './routes/currencyRoute.js'
  app.use('/api/currency', currencyRouter)
  ```
- Auth middleware import: `import authUser from '../middleware/auth.js'`

- [ ] **Step 1: Create the review route file**

```js
// backend/routes/reviewRoute.js
import express   from 'express'
import { addReview, getProductReviews } from '../controllers/reviewController.js'
import authUser  from '../middleware/auth.js'

const reviewRouter = express.Router()

reviewRouter.post('/add', authUser, addReview)
reviewRouter.get('/:productId', getProductReviews)

export default reviewRouter
```

- [ ] **Step 2: Mount the router in server.js**

Open `backend/server.js`. Add the import after the existing currency import:

```js
import reviewRouter from './routes/reviewRoute.js'
```

Add the route mount after `app.use('/api/currency', currencyRouter)`:

```js
app.use('/api/review', reviewRouter)
```

The relevant section of `server.js` should look like this after the edit:

```js
import currencyRouter from './routes/currencyRoute.js'
import reviewRouter   from './routes/reviewRoute.js'

// ...

app.use('/api/currency', currencyRouter)
app.use('/api/review',   reviewRouter)
```

- [ ] **Step 3: Start the backend and smoke-test the GET endpoint**

Kill any running node process, then start fresh:

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
cd backend
npm start
```

In a second terminal (or PowerShell tab):

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/review/test-product-id" -Method Get | ConvertTo-Json
```

Expected response:
```json
{
  "success": true,
  "reviews": [],
  "avgRating": 0,
  "totalReviews": 0
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/reviewRoute.js backend/server.js
git commit -m "feat: add review route and mount on /api/review"
```

---

### Task 4: StarRating Component

**Files:**
- Create: `frontend/src/components/StarRating.jsx`

This component has two modes:
1. **Display mode** (`interactive={false}`, default): renders filled/half/empty stars from a decimal rating.
2. **Interactive mode** (`interactive={true}`): renders 5 clickable stars for rating input.

- [ ] **Step 1: Create StarRating.jsx**

```jsx
// frontend/src/components/StarRating.jsx
import React from 'react'

// Display-only star (filled, half, or empty)
const Star = ({ fill }) => {
  // fill: 'full' | 'half' | 'empty'
  if (fill === 'full') {
    return (
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }
  if (fill === 'half') {
    return (
      <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#D1D5DB" />
          </linearGradient>
        </defs>
        <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

// Converts a decimal rating (e.g. 3.7) to an array of 5 fill values
const ratingToFills = (rating) => {
  return [1, 2, 3, 4, 5].map((i) => {
    if (rating >= i)        return 'full'
    if (rating >= i - 0.5) return 'half'
    return 'empty'
  })
}

/**
 * StarRating
 *
 * Props:
 *   rating      {number}   0–5 decimal value shown when interactive=false
 *   interactive {boolean}  when true, renders clickable stars for input
 *   value       {number}   selected value when interactive=true
 *   onChange    {function} called with new rating when interactive=true
 *   size        {string}   'sm' | 'md' (default 'md') — controls star size class
 */
const StarRating = ({ rating = 0, interactive = false, value = 0, onChange, size = 'md' }) => {
  const [hovered, setHovered] = React.useState(0)

  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  if (!interactive) {
    const fills = ratingToFills(rating)
    return (
      <div className="flex items-center gap-0.5">
        {fills.map((fill, i) => <Star key={i} fill={fill} />)}
      </div>
    )
  }

  // Interactive mode — 5 clickable stars
  const display = hovered || value
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <svg
            className={`${sizeClass} transition-colors ${star <= display ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default StarRating
```

- [ ] **Step 2: Verify the file saved cleanly**

Visual check — no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/StarRating.jsx
git commit -m "feat: add reusable StarRating component (display + interactive)"
```

---

### Task 5: ReviewSection Component

**Files:**
- Create: `frontend/src/components/ReviewSection.jsx`
- Reference (read-only): `frontend/src/context/ShopContext.jsx` (for `backendUrl`, `token`)
- Reference (read-only): `frontend/src/components/StarRating.jsx`

Context:
- `ShopContext` exposes: `backendUrl` (string, e.g. `http://localhost:5000`), `token` (string, empty string if not logged in).
- Auth header: `{ headers: { token } }` (this is the existing pattern in the app).
- POST `/api/review/add` body: `{ productId, rating, comment }` — `userId` is injected by the `authUser` middleware from the JWT.
- GET `/api/review/:productId` returns: `{ success, reviews: [{_id, productId, userId, userName, rating, comment, date}], avgRating, totalReviews }`.
- `date` is a Unix timestamp in milliseconds (from `Date.now()`).

- [ ] **Step 1: Create ReviewSection.jsx**

```jsx
// frontend/src/components/ReviewSection.jsx
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import StarRating from './StarRating'

const ReviewSection = ({ productId }) => {
  const { backendUrl, token } = useContext(ShopContext)

  const [reviews, setReviews]         = useState([])
  const [avgRating, setAvgRating]     = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading]         = useState(true)

  // Form state
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/review/${productId}`)
      if (res.data.success) {
        setReviews(res.data.reviews)
        setAvgRating(res.data.avgRating)
        setTotalReviews(res.data.totalReviews)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) fetchReviews()
  }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) {
      toast.error('Please select a star rating')
      return
    }
    if (!comment.trim()) {
      toast.error('Please write a comment')
      return
    }
    try {
      setSubmitting(true)
      const res = await axios.post(
        `${backendUrl}/api/review/add`,
        { productId, rating, comment },
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success('Review submitted!')
        setRating(0)
        setComment('')
        fetchReviews()  // refresh the list
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="mt-6">
      {/* Summary bar */}
      {totalReviews > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl font-semibold">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating rating={avgRating} />
            <p className="text-sm text-gray-500 mt-0.5">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
          </div>
        </div>
      )}

      {/* Submit form — only for logged-in users */}
      {token ? (
        <form onSubmit={handleSubmit} className="border rounded-lg p-5 mb-8 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Your Rating</label>
            <StarRating interactive value={rating} onChange={setRating} />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Your Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this product..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white px-6 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6 border rounded-lg p-4 bg-gray-50">
          <a href="/login" className="underline">Login</a> to write a review.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="flex flex-col gap-5">
          {reviews.map((review) => (
            <div key={review._id} className="border-b pb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{review.userName}</span>
                <span className="text-xs text-gray-400">{formatDate(review.date)}</span>
              </div>
              <StarRating rating={review.rating} size="sm" />
              <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewSection
```

- [ ] **Step 2: Verify the file saved cleanly**

Visual check — no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ReviewSection.jsx
git commit -m "feat: add ReviewSection component with form and review list"
```

---

### Task 6: Update Product.jsx — real reviews

**Files:**
- Modify: `frontend/src/pages/Product.jsx`

Context — the current `Product.jsx` has:
1. Hardcoded stars block (lines with `assets.star_icon` and `assets.star_dull_icon`) — replace with `<StarRating>`.
2. Hardcoded review count `(122)` — replace with live count from `ReviewSection`.
3. A "Description & Review Section" div at the bottom with two tabs ("Description" and "Reviews (122)") and Lorem Ipsum text — replace with real tabs that show the product description and `<ReviewSection>`.

The updated file must:
- Import `StarRating` and `ReviewSection`.
- Fetch the product's avg rating + count from `GET /api/review/:productId` on mount (for the inline star display in the product info panel).
- Show the `ReviewSection` inside the "Reviews" tab.
- Keep the "Description" tab showing `productData.description` (not Lorem Ipsum).

- [ ] **Step 1: Replace Product.jsx with the updated version**

```jsx
// frontend/src/pages/Product.jsx
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import RelatedProducts from '../components/RelatedProducts'
import StarRating from '../components/StarRating'
import ReviewSection from '../components/ReviewSection'
import { toast } from 'react-toastify'
import { useCurrency } from '../context/CurrencyContext'

const Product = () => {
  const { productId } = useParams()
  const { products, addToCart, backendUrl } = useContext(ShopContext)
  const { formatPrice } = useCurrency()

  const [productData, setProductData] = useState(false)
  const [image, setImage]             = useState('')
  const [size, setSize]               = useState('')
  const [activeTab, setActiveTab]     = useState('description')

  // Live review summary for the star display in the product info panel
  const [avgRating, setAvgRating]       = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  const fetchProductData = () => {
    products.forEach((item) => {
      if (item._id === productId) {
        setProductData(item)
        setImage(item.image[0])
      }
    })
  }

  const fetchReviewSummary = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/review/${productId}`)
      if (res.data.success) {
        setAvgRating(res.data.avgRating)
        setTotalReviews(res.data.totalReviews)
      }
    } catch (err) {
      console.error('Failed to load review summary:', err)
    }
  }

  useEffect(() => {
    fetchProductData()
  }, [productId, products])

  useEffect(() => {
    if (productId) fetchReviewSummary()
  }, [productId])

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Product Data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">

        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>

          {/* Live star rating */}
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={avgRating} />
            <p className="text-sm text-gray-500">
              {totalReviews > 0
                ? `${avgRating.toFixed(1)} (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})`
                : 'No reviews yet'}
            </p>
          </div>

          <p className="mt-5 text-3xl font-medium">{formatPrice(productData.price)}</p>
          <p className="mt-5 text-gray-500 md:w-4/5">{productData.description}</p>

          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addToCart(productData._id, size)}
            className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700"
          >
            ADD TO CART
          </button>

          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description & Reviews Tabs */}
      <div className="mt-20">
        <div className="flex">
          <button
            onClick={() => setActiveTab('description')}
            className={`border px-5 py-3 text-sm ${activeTab === 'description' ? 'font-semibold bg-gray-50' : ''}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`border px-5 py-3 text-sm ${activeTab === 'reviews' ? 'font-semibold bg-gray-50' : ''}`}
          >
            Reviews ({totalReviews})
          </button>
        </div>

        <div className="border px-6 py-6 text-sm text-gray-600">
          {activeTab === 'description' ? (
            <p>{productData.description}</p>
          ) : (
            <ReviewSection productId={productId} />
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (
    <div className="opacity-0" />
  )
}

export default Product
```

- [ ] **Step 2: Start the frontend and manually test**

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173` in the browser. Navigate to any product page. Check:

1. The star rating area in the product info panel shows "No reviews yet" (because DB is empty).
2. The "Description" tab shows the real product description text (not Lorem Ipsum).
3. The "Reviews (0)" tab shows the ReviewSection.
4. If not logged in, the review tab shows "Login to write a review."
5. Log in as a user. Navigate to a product. Click "Reviews" tab. A form appears.
6. Select 4 stars, type a comment, click "Submit Review". Toast shows "Review submitted!".
7. The review appears in the list immediately.
8. The star display in the product info panel still shows "No reviews yet" — this is expected until the page is refreshed (the summary is fetched once on mount). After refresh, it shows the real avg.
9. Submit another review from the same account — the old review is replaced (upsert), not duplicated.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Product.jsx
git commit -m "feat: integrate real reviews into Product page with live star rating"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Replace hardcoded stars with real avg rating → Task 6 (Product.jsx star display)
- [x] Store reviews in MongoDB → Task 1 (reviewModel)
- [x] One review per user per product → Task 2 (upsert in addReview)
- [x] Authenticated users can submit reviews → Task 2 + Task 3 (authUser middleware on POST)
- [x] Non-logged-in users see "Login to review" → Task 5 (ReviewSection)
- [x] Reviews list with name, stars, date, comment → Task 5 (ReviewSection)
- [x] Description tab shows real description (not Lorem Ipsum) → Task 6

**Placeholder scan:** No TBDs, no "add appropriate error handling" phrases. All code blocks are complete.

**Type consistency:**
- `reviewModel` fields: `productId`, `userId`, `userName`, `rating`, `comment`, `date` — used consistently across controller, component, and display.
- `avgRating`, `totalReviews` returned by GET endpoint — consumed in both `ReviewSection` and `Product.jsx` correctly.
- Auth header pattern `{ headers: { token } }` — matches existing pattern in `ShopContext.jsx`.
