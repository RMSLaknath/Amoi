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
    const merchantId = process.env.PAYHERE_MERCHANT_ID
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET
    if (!merchantId || !merchantSecret) {
      return res.json({ success: false, message: 'Payment gateway not configured' })
    }

    const { userId, items, amount, address } = req.body

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.json({ success: false, message: 'Invalid amount' })
    }

    const user = await userModel.findById(userId)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    // Create order with payment: false — will be confirmed by notify webhook
    const orderData = {
      userId,
      items,
      address,
      amount: numericAmount,
      paymentMethod: 'PayHere',
      payment: false,
      date: Date.now(),
    }
    const newOrder = new orderModel(orderData)
    await newOrder.save()

    const orderId = newOrder._id.toString()
    const amountFormatted = numericAmount.toFixed(2)
    const currency = 'LKR'

    const hash = generateCheckoutHash(merchantId, orderId, amountFormatted, currency, merchantSecret)

    res.json({
      success: true,
      payhereData: {
        sandbox:        process.env.PAYHERE_SANDBOX === 'true',
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
      const order = await orderModel.findByIdAndUpdate(order_id, { payment: true }, { new: true })
      if (order) {
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} })
      }
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
