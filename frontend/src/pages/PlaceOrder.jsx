import React, { useContext, useState } from 'react'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PAYHERE_URL = 'https://sandbox.payhere.lk/pay/checkout'

const submitToPayHere = (payhereData) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = PAYHERE_URL
  Object.entries(payhereData).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

const inputClass = 'w-full border-b border-gray-200 bg-transparent text-sm text-gray-900 py-2 outline-none placeholder-gray-300 focus:border-gray-900'

const PlaceOrder = () => {
  const [method, setMethod] = useState('Cash On Delivery')
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', street: '',
    city: '', state: '', zipcode: '', country: '', phone: '',
  })

  const onChangeHandler = e => {
    const { name, value } = e.target
    setFormData(d => ({ ...d, [name]: value }))
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const orderItems = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find(p => p._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItems[items][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      const orderData = { address: formData, items: orderItems, amount: getCartAmount() + delivery_fee }

      switch (method) {
        case 'Cash On Delivery': {
          const res = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (res.data.success) { setCartItems({}); navigate('/orders') }
          else toast.error(res.data.message)
          break
        }
        case 'PayHere': {
          const res = await axios.post(backendUrl + '/api/order/payhere/checkout', orderData, { headers: { token } })
          if (res.data.success) { setCartItems({}); submitToPayHere(res.data.payhereData) }
          else toast.error(res.data.message)
          break
        }
        default: break
      }
    } catch (error) {
      console.log(error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const PaymentOption = ({ id, label, sublabel }) => (
    <div
      onClick={() => setMethod(id)}
      className={`flex items-center justify-between px-4 py-4 border cursor-pointer transition-all ${method === id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
    >
      <div className='flex items-center gap-3'>
        <div className={`w-3 h-3 rounded-full border-2 ${method === id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}></div>
        <span className='text-xs tracking-wider text-gray-700'>{label}</span>
      </div>
      {sublabel && <span className='text-[10px] text-gray-400'>{sublabel}</span>}
    </div>
  )

  return (
    <form onSubmit={onSubmitHandler} className='border-t border-gray-100 pt-10 min-h-[80vh]'>
      <div className='flex flex-col lg:flex-row gap-10 lg:gap-16'>

        {/* Left — Delivery */}
        <div className='flex-1 max-w-lg'>
          <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2'>Step 1</p>
          <h2 className='text-xl font-light text-gray-900 mb-6'>Delivery Information</h2>

          <div className='flex flex-col gap-5'>
            <div className='flex gap-4'>
              <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className={inputClass} type='text' placeholder='First name' />
              <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className={inputClass} type='text' placeholder='Last name' />
            </div>
            <input required onChange={onChangeHandler} name='email' value={formData.email} className={inputClass} type='email' placeholder='Email address' />
            <input required onChange={onChangeHandler} name='street' value={formData.street} className={inputClass} type='text' placeholder='Street address' />
            <div className='flex gap-4'>
              <input required onChange={onChangeHandler} name='city' value={formData.city} className={inputClass} type='text' placeholder='City' />
              <input required onChange={onChangeHandler} name='state' value={formData.state} className={inputClass} type='text' placeholder='State' />
            </div>
            <div className='flex gap-4'>
              <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className={inputClass} type='number' placeholder='Zip code' />
              <input required onChange={onChangeHandler} name='country' value={formData.country} className={inputClass} type='text' placeholder='Country' />
            </div>
            <input required onChange={onChangeHandler} name='phone' value={formData.phone} className={inputClass} type='number' placeholder='Phone number' />
          </div>
        </div>

        {/* Right — Summary + Payment */}
        <div className='w-full lg:w-80'>
          <div className='bg-gray-50 p-5 mb-6'>
            <CartTotal />
          </div>

          <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2'>Step 2</p>
          <h2 className='text-xl font-light text-gray-900 mb-4'>Payment Method</h2>

          <div className='flex flex-col gap-2 mb-6'>
            <PaymentOption id='Cash On Delivery' label='CASH ON DELIVERY' sublabel='Pay on arrival' />
            <PaymentOption id='PayHere' label='PAYHERE' sublabel='Card / Bank' />
          </div>

          <button type='submit' className='w-full bg-gray-900 text-white text-xs tracking-[0.2em] py-4 hover:bg-black'>
            PLACE ORDER
          </button>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
