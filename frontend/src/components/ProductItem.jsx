import React from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'

const ProductItem = ({ id, image, name, price }) => {
  const { formatPrice } = useCurrency()

  return (
    <Link to={`/product/${id}`} className='group block'>
      <div className='overflow-hidden bg-gray-50 aspect-[3/4]'>
        <img
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
          src={image[0]}
          alt={name}
        />
      </div>
      <div className='mt-2'>
        <p className='text-xs tracking-wide text-gray-700 truncate'>{name}</p>
        <p className='text-xs font-medium text-gray-900 mt-0.5'>{formatPrice(price)}</p>
      </div>
    </Link>
  )
}

export default ProductItem
