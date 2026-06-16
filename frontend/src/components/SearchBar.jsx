import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import { useLocation } from 'react-router-dom'

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext)
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setVisible(location.pathname.includes('collection'))
  }, [location])

  return showSearch && visible ? (
    <div className='border-b border-gray-100 bg-white py-4 px-4 sm:px-[5vw]'>
      <div className='flex items-center gap-3 max-w-lg mx-auto'>
        <img className='w-4 text-gray-400' src={assets.search_icon} alt='' />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          className='flex-1 text-sm text-gray-900 outline-none placeholder-gray-300 bg-transparent'
          type='text'
          placeholder='Search products...'
        />
        <button onClick={() => setShowSearch(false)} className='text-gray-300 hover:text-gray-900 text-lg leading-none'>✕</button>
      </div>
    </div>
  ) : null
}

export default SearchBar
