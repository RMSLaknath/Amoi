import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import CartTotal from '../components/CartTotal'

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate } = useContext(ShopContext)
  const [cartData, setCartData] = useState([])

  useEffect(() => {
    if (products.length > 0) {
      const tempData = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({ _id: items, size: item, quantity: cartItems[items][item] })
          }
        }
      }
      setCartData(tempData)
    }
  }, [cartItems, products])

  return (
    <div className='border-t border-gray-100 pt-10 min-h-[70vh]'>
      <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2'>Shopping</p>
      <h1 className='text-2xl font-light text-gray-900 mb-8'>Your Cart</h1>

      {cartData.length === 0 ? (
        <div className='text-center py-16'>
          <p className='text-sm text-gray-400 mb-6'>Your cart is empty.</p>
          <button onClick={() => navigate('/collection')} className='text-xs tracking-[0.2em] text-gray-900 underline underline-offset-4'>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className='hidden sm:grid grid-cols-[3fr_1fr_1fr_0.5fr] text-[10px] tracking-[0.2em] text-gray-400 uppercase border-b border-gray-100 pb-3 mb-2'>
            <span>Product</span>
            <span className='text-center'>Size</span>
            <span className='text-center'>Qty</span>
            <span></span>
          </div>

          {/* Items */}
          <div className='flex flex-col divide-y divide-gray-100'>
            {cartData.map((item, index) => {
              const productData = products.find(p => p._id === item._id)
              if (!productData) return null

              return (
                <div key={index} className='py-5 grid grid-cols-[3fr_1fr_1fr_0.5fr] items-center gap-4'>
                  {/* Product */}
                  <div className='flex items-center gap-4'>
                    <img className='w-16 sm:w-20 aspect-[3/4] object-cover bg-gray-50' src={productData.image?.[0]} alt={productData.name} />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>{productData.name}</p>
                      <p className='text-xs text-gray-400 mt-1'>{currency}{productData.price}</p>
                    </div>
                  </div>

                  {/* Size */}
                  <p className='text-xs text-gray-500 text-center tracking-wider'>{item.size}</p>

                  {/* Quantity */}
                  <input
                    type='number'
                    min={1}
                    defaultValue={item.quantity}
                    onChange={e => e.target.value !== '' && e.target.value !== '0' && updateQuantity(item._id, item.size, Number(e.target.value))}
                    className='w-12 mx-auto text-center text-sm border-b border-gray-200 bg-transparent outline-none py-1'
                  />

                  {/* Delete */}
                  <button onClick={() => updateQuantity(item._id, item.size, 0)} className='flex justify-center text-gray-300 hover:text-gray-900'>
                    <img src={assets.bin_icon} className='w-4' alt='Remove' />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className='flex justify-end mt-10'>
            <div className='w-full sm:w-96'>
              <CartTotal />
              <button
                onClick={() => navigate('/place-order')}
                className='w-full mt-5 bg-gray-900 text-white text-xs tracking-[0.2em] py-4 hover:bg-black'
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
