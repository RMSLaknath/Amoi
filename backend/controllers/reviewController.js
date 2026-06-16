// backend/controllers/reviewController.js
import reviewModel from '../models/reviewModel.js'
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

// GET /api/review/:productId?page=1&limit=5  (public)
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 5)
    const skip  = (page - 1) * limit

    const [stats, reviews] = await Promise.all([
      reviewModel.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      reviewModel.find({ productId }).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    ])

    const totalReviews = stats[0]?.count ?? 0
    const avgRating    = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0

    res.json({
      success: true,
      reviews,
      avgRating,
      totalReviews,
      hasMore: skip + reviews.length < totalReviews,
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addReview, getProductReviews }
