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
