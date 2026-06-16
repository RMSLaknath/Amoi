import React from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'

const ProductItem = ({ id, image, name, price }) => {
  const { formatPrice } = useCurrency()

  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className='overflow-hidden'>
        <img className='hover:scale-110 transition ease-in-out' src={image[0]} alt="" />
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className='text-sm font-medium'>{formatPrice(price)}</p>
    </Link>
  )
}

export default ProductItem
