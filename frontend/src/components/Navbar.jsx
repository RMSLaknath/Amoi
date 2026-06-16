import React, { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { useCurrency } from '../context/CurrencyContext'

const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const currencyRef = useRef(null)

  const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext)
  const { currency, setCurrency, rates } = useCurrency()

  const currencyCodes = Object.keys(rates).sort()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
    setToken('')
    setCartItems({})
  }

  return (
    <div className='border-b border-gray-100'>
      <div className='flex items-center justify-between py-4 font-medium'>

        <Link to='/'><img src={assets.logo} className='w-28' alt='Amoi' /></Link>

        {/* Desktop Nav */}
        <ul className='hidden sm:flex gap-8 text-xs tracking-[0.18em] text-gray-500'>
          {[['/', 'HOME'], ['/collection', 'COLLECTION'], ['/about', 'ABOUT'], ['/contact', 'CONTACT']].map(([path, label]) => (
            <NavLink key={path} to={path} className='flex flex-col items-center gap-1 hover:text-gray-900'>
              <p>{label}</p>
              <hr className='w-full border-none h-px bg-gray-900 hidden' />
            </NavLink>
          ))}
        </ul>

        {/* Icons */}
        <div className='flex items-center gap-5'>
          <button onClick={() => setShowSearch(true)} className='text-gray-500 hover:text-gray-900'>
            <img src={assets.search_icon} className='w-4' alt='Search' />
          </button>

          {/* Currency Switcher */}
          <div ref={currencyRef} className='relative'>
            <button
              onClick={() => setCurrencyOpen(prev => !prev)}
              className='flex items-center gap-1 text-xs tracking-wider text-gray-500 hover:text-gray-900'
            >
              🌐 {currency}
            </button>
            {currencyOpen && (
              <div className='absolute right-0 top-7 z-50 bg-white border border-gray-100 shadow-lg w-24 max-h-56 overflow-y-auto'>
                {currencyCodes.map(code => (
                  <button
                    key={code}
                    onClick={() => { setCurrency(code); setCurrencyOpen(false) }}
                    className={`block w-full text-left px-3 py-2 text-xs tracking-wider hover:bg-gray-50 ${currency === code ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className='group relative'>
            <button onClick={() => token ? null : navigate('/login')} className='text-gray-500 hover:text-gray-900'>
              <img src={assets.profile_icon} className='w-4' alt='Profile' />
            </button>
            {token && (
              <div className='group-hover:block hidden absolute right-0 top-6 z-50 pt-2'>
                <div className='bg-white border border-gray-100 shadow-lg py-2 w-36'>
                  <p className='px-4 py-2 text-xs tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-50 cursor-pointer'>MY PROFILE</p>
                  <p onClick={() => navigate('/orders')} className='px-4 py-2 text-xs tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-50 cursor-pointer'>MY ORDERS</p>
                  <hr className='my-1 border-gray-100' />
                  <p onClick={logout} className='px-4 py-2 text-xs tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-50 cursor-pointer'>LOGOUT</p>
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to='/cart' className='relative text-gray-500 hover:text-gray-900'>
            <img src={assets.cart_icon} className='w-4' alt='Cart' />
            {getCartCount() > 0 && (
              <span className='absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 flex items-center justify-center bg-gray-900 text-white text-[8px] rounded-full'>
                {getCartCount()}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setVisible(true)} className='sm:hidden text-gray-500'>
            <img src={assets.menu_icon} className='w-4' alt='Menu' />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className='flex flex-col h-full'>
          <div className='flex items-center justify-between px-6 py-5 border-b border-gray-100'>
            <img src={assets.logo} className='w-24' alt='Amoi' />
            <button onClick={() => setVisible(false)} className='text-gray-400 hover:text-gray-900 text-2xl leading-none'>✕</button>
          </div>
          <nav className='flex flex-col px-6 pt-6 gap-0'>
            {[['/', 'HOME'], ['/collection', 'COLLECTION'], ['/about', 'ABOUT'], ['/contact', 'CONTACT']].map(([path, label]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setVisible(false)}
                className='text-sm tracking-[0.2em] text-gray-500 hover:text-gray-900 border-b border-gray-100 py-3'
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Navbar
