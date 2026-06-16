import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import StarRating from './StarRating'

const LIMIT = 5

const ReviewSection = ({ productId, onStatsUpdate }) => {
  const { backendUrl, token } = useContext(ShopContext)

  const [reviews, setReviews]           = useState([])
  const [avgRating, setAvgRating]       = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(false)
  const [page, setPage]                 = useState(1)

  const [rating, setRating]       = useState(0)
  const [comment, setComment]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const res = await axios.get(
        `${backendUrl}/api/review/${productId}?page=${pageNum}&limit=${LIMIT}`
      )
      if (res.data.success) {
        setReviews(prev => append ? [...prev, ...res.data.reviews] : res.data.reviews)
        setAvgRating(res.data.avgRating)
        setTotalReviews(res.data.totalReviews)
        setHasMore(res.data.hasMore)
        setPage(pageNum)
        onStatsUpdate?.(res.data.avgRating, res.data.totalReviews)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) fetchReviews(1)
  }, [productId])

  const handleLoadMore = () => fetchReviews(page + 1, true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) { toast.error('Please select a star rating'); return }
    if (!comment.trim()) { toast.error('Please write a comment'); return }
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
        fetchReviews(1)
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })

  return (
    <div className="mt-6">
      {/* Summary bar */}
      {totalReviews > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl font-semibold">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating rating={avgRating} />
            <p className="text-sm text-gray-500 mt-0.5">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>
      )}

      {/* Submit form */}
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
        <>
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

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-6 w-full border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : `Load More Reviews (${totalReviews - reviews.length} remaining)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default ReviewSection
