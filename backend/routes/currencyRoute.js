import express from 'express'
import { getRates } from '../controllers/currencyController.js'

const currencyRouter = express.Router()

currencyRouter.get('/rates', getRates)

export default currencyRouter
