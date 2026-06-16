// backend/routes/reviewRoute.js
import express from 'express'
import { addReview, getProductReviews } from '../controllers/reviewController.js'
import authUser from '../middleware/auth.js'

const reviewRouter = express.Router()

reviewRouter.post('/add', authUser, addReview)
reviewRouter.get('/:productId', getProductReviews)

export default reviewRouter
