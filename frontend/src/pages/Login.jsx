import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {
  const [currentState, setCurrentState] = useState('Login')
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      if (currentState === 'Sign Up') {
        const res = await axios.post(backendUrl + '/api/user/register', { name, email, password })
        if (res.data.success) { setToken(res.data.token); localStorage.setItem('token', res.data.token) }
        else toast.error(res.data.message)
      } else {
        const res = await axios.post(backendUrl + '/api/user/login', { email, password })
        if (res.data.success) { setToken(res.data.token); localStorage.setItem('token', res.data.token) }
        else toast.error(res.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const onForgotSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(backendUrl + '/api/user/forgot-password', { email: forgotEmail })
      if (res.data.success) {
        setForgotSent(true)
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => { if (token) navigate('/') }, [token])

  const inputClass = 'w-full border-b border-gray-200 bg-transparent text-sm text-gray-900 py-3 outline-none placeholder-gray-300 focus:border-gray-900'

  if (currentState === 'Forgot') {
    return (
      <div className='flex items-center justify-center min-h-[70vh] border-t border-gray-100'>
        <div className='w-full max-w-sm'>
          <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2 text-center'>Account Recovery</p>
          <h1 className='prata-regular text-3xl text-gray-900 text-center mb-3'>Forgot Password</h1>

          {forgotSent ? (
            <div className='text-center mt-6'>
              <p className='text-sm text-gray-500 leading-relaxed mb-8'>
                If an account with that email exists, we've sent a reset link.<br />
                Check your inbox — it may take a minute.
              </p>
              <span
                onClick={() => { setCurrentState('Login'); setForgotSent(false); setForgotEmail('') }}
                className='text-xs text-gray-400 cursor-pointer hover:text-gray-900'
              >
                ← Back to Sign In
              </span>
            </div>
          ) : (
            <form onSubmit={onForgotSubmit}>
              <p className='text-sm text-gray-400 text-center mb-8 leading-relaxed'>
                Enter your email and we'll send you a link to reset your password.
              </p>
              <input
                type='email'
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className={inputClass}
                placeholder='Email address'
                required
              />
              <button type='submit' className='w-full mt-8 bg-gray-900 text-white text-xs tracking-[0.2em] py-4 hover:bg-black'>
                SEND RESET LINK
              </button>
              <div className='text-center mt-4'>
                <span
                  onClick={() => setCurrentState('Login')}
                  className='text-xs text-gray-400 cursor-pointer hover:text-gray-900'
                >
                  ← Back to Sign In
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center min-h-[70vh] border-t border-gray-100'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-sm'>
        <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2 text-center'>Welcome</p>
        <h1 className='prata-regular text-3xl text-gray-900 text-center mb-10'>
          {currentState === 'Login' ? 'Sign In' : 'Create Account'}
        </h1>

        <div className='flex flex-col gap-6'>
          {currentState === 'Sign Up' && (
            <input
              onChange={e => setName(e.target.value)}
              value={name}
              type='text'
              className={inputClass}
              placeholder='Full name'
              required
            />
          )}
          <input onChange={e => setEmail(e.target.value)} value={email} type='email' className={inputClass} placeholder='Email address' required />
          <input onChange={e => setPassword(e.target.value)} value={password} type='password' className={inputClass} placeholder='Password' required />
        </div>

        <div className='flex justify-between items-center mt-4 text-xs text-gray-400'>
          {currentState === 'Login'
            ? <span onClick={() => { setCurrentState('Forgot'); setForgotSent(false) }} className='cursor-pointer hover:text-gray-900'>Forgot password?</span>
            : <span />
          }
          {currentState === 'Login'
            ? <span onClick={() => setCurrentState('Sign Up')} className='cursor-pointer hover:text-gray-900'>Create account →</span>
            : <span onClick={() => setCurrentState('Login')} className='cursor-pointer hover:text-gray-900'>Sign in →</span>
          }
        </div>

        <button type='submit' className='w-full mt-8 bg-gray-900 text-white text-xs tracking-[0.2em] py-4 hover:bg-black'>
          {currentState === 'Login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
      </form>
    </div>
  )
}

export default Login
