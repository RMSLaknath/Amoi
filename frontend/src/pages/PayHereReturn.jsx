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
