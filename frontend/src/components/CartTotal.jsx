import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useCurrency } from '../context/CurrencyContext'

const CartTotal = () => {
  const { delivery_fee, getCartAmount } = useContext(ShopContext)
  const { formatPrice } = useCurrency()

  const subtotal = getCartAmount()
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee

  return (
    <div className='w-full'>
      <p className='text-xs tracking-[0.2em] text-gray-400 uppercase mb-5'>Order Summary</p>
      <div className='flex flex-col gap-3 text-sm'>
        <div className='flex justify-between text-gray-500'>
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className='flex justify-between text-gray-500'>
          <span>Shipping</span>
          <span>{subtotal === 0 ? '—' : formatPrice(delivery_fee)}</span>
        </div>
        <div className='border-t border-gray-100 pt-3 flex justify-between text-gray-900'>
          <span className='font-medium'>Total</span>
          <span className='font-semibold'>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}

export default CartTotal
