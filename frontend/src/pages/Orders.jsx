import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'

const statusColors = {
  'Order Placed': 'bg-blue-100 text-blue-600',
  'Packing': 'bg-yellow-100 text-yellow-600',
  'Shipped': 'bg-purple-100 text-purple-600',
  'Out for delivery': 'bg-orange-100 text-orange-600',
  'Delivered': 'bg-green-100 text-green-600',
}

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext)
  const [orderData, setOrderData] = useState([])

  const loadOrderData = async () => {
    try {
      if (!token) return
      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } })
      if (response.data.success) {
        let allOrderItems = []
        response.data.orders.forEach(order => {
          order.items.forEach(item => {
            allOrderItems.push({
              ...item,
              status: order.status,
              payment: order.payment,
              paymentMethod: order.paymentMethod,
              date: order.date,
            })
          })
        })
        setOrderData(allOrderItems.reverse())
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => { loadOrderData() }, [token])

  return (
    <div className='border-t border-gray-100 pt-10 min-h-[70vh]'>
      <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2'>Account</p>
      <h1 className='text-2xl font-light text-gray-900 mb-8'>My Orders</h1>

      {orderData.length === 0 ? (
        <p className='text-sm text-gray-400 text-center py-16'>No orders yet.</p>
      ) : (
        <div className='flex flex-col divide-y divide-gray-100'>
          {orderData.map((item, index) => (
            <div key={index} className='py-4 flex flex-col sm:flex-row sm:items-center gap-4'>
              {/* Product Image */}
              <img
                className='w-16 sm:w-20 aspect-[3/4] object-cover bg-gray-50 shrink-0'
                src={item.image[0]}
                alt={item.name}
              />

              {/* Info */}
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>{item.name}</p>
                <div className='flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400'>
                  <span>{currency}{item.price}</span>
                  <span className='w-px h-3 bg-gray-200'></span>
                  <span>Qty: {item.quantity}</span>
                  <span className='w-px h-3 bg-gray-200'></span>
                  <span>Size: {item.size}</span>
                </div>
                <div className='flex flex-wrap gap-3 mt-2 text-xs text-gray-400'>
                  <span>{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span className='w-px h-3 bg-gray-200 self-center'></span>
                  <span className='capitalize'>{item.paymentMethod}</span>
                </div>
              </div>

              {/* Status + Track */}
              <div className='flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0'>
                <span className={`text-[10px] tracking-wider px-2.5 py-1 rounded-full ${statusColors[item.status] || 'bg-gray-100 text-gray-500'}`}>
                  {item.status}
                </span>
                <button
                  onClick={loadOrderData}
                  className='text-[10px] tracking-[0.15em] text-gray-500 hover:text-gray-900 border-b border-gray-300 hover:border-gray-900 pb-0.5'
                >
                  TRACK ORDER
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
