import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useCurrency } from '../context/CurrencyContext'
import Title from './Title'

const CartTotal = () => {
  const { delivery_fee, getCartAmount } = useContext(ShopContext)
  const { formatPrice } = useCurrency()

  const subtotal = getCartAmount()
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p>Subtotal</p>
          <p>{formatPrice(subtotal)}</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p>Shipping Fee</p>
          <p>{formatPrice(delivery_fee)}</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p>Total</p>
          <b>{formatPrice(total)}</b>
        </div>
      </div>
    </div>
  )
}

export default CartTotal
