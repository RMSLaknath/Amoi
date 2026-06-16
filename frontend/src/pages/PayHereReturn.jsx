import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const PayHereReturn = () => {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')
  const cancelled = status === 'cancel'

  return (
    <div className='min-h-[70vh] flex flex-col items-center justify-center border-t border-gray-100 px-4'>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${cancelled ? 'bg-gray-100' : 'bg-gray-900'}`}>
        <span className={`text-xl ${cancelled ? 'text-gray-500' : 'text-white'}`}>
          {cancelled ? '✕' : '✓'}
        </span>
      </div>

      <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2'>
        {cancelled ? 'Payment' : 'Order'}
      </p>
      <h1 className='prata-regular text-2xl text-gray-900 mb-4'>
        {cancelled ? 'Payment Cancelled' : 'Payment Successful'}
      </h1>
      <p className='text-sm text-gray-400 text-center max-w-xs leading-relaxed mb-8'>
        {cancelled
          ? 'Your payment was cancelled. No charge was made. You can try again or choose a different payment method.'
          : 'Thank you for your purchase. Your order is being processed and will be on its way soon.'}
      </p>

      <div className='flex gap-3'>
        {cancelled ? (
          <>
            <Link to='/cart' className='text-xs tracking-[0.15em] text-white bg-gray-900 px-6 py-3 hover:bg-black'>
              BACK TO CART
            </Link>
            <Link to='/orders' className='text-xs tracking-[0.15em] text-gray-600 border border-gray-200 px-6 py-3 hover:border-gray-900'>
              MY ORDERS
            </Link>
          </>
        ) : (
          <Link to='/orders' className='text-xs tracking-[0.15em] text-white bg-gray-900 px-8 py-3 hover:bg-black'>
            VIEW MY ORDERS
          </Link>
        )}
      </div>
    </div>
  )
}

export default PayHereReturn
