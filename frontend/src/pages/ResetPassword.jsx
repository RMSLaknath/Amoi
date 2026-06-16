import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import { useContext } from 'react'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { backendUrl } = useContext(ShopContext)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  const inputClass = 'w-full border-b border-gray-200 bg-transparent text-sm text-gray-900 py-3 outline-none placeholder-gray-300 focus:border-gray-900'

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    try {
      const res = await axios.post(backendUrl + '/api/user/reset-password', { token, password })
      if (res.data.success) {
        setDone(true)
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-[70vh] border-t border-gray-100'>
      <div className='w-full max-w-sm'>
        <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2 text-center'>Account Recovery</p>
        <h1 className='prata-regular text-3xl text-gray-900 text-center mb-10'>New Password</h1>

        {done ? (
          <div className='text-center'>
            <p className='text-sm text-gray-500 leading-relaxed mb-8'>
              Your password has been updated successfully.
            </p>
            <button
              onClick={() => navigate('/login')}
              className='w-full bg-gray-900 text-white text-xs tracking-[0.2em] py-4 hover:bg-black'
            >
              SIGN IN
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className='flex flex-col gap-6'>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              placeholder='New password'
              minLength={8}
              required
            />
            <input
              type='password'
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={inputClass}
              placeholder='Confirm new password'
              minLength={8}
              required
            />
            <button type='submit' className='w-full mt-2 bg-gray-900 text-white text-xs tracking-[0.2em] py-4 hover:bg-black'>
              UPDATE PASSWORD
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
