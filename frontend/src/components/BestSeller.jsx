import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const BestSeller = () => {
  const { products } = useContext(ShopContext)
  const [bestseller, setBestSeller] = useState([])

  useEffect(() => {
    const bestProduct = products.filter(item => item.bestseller)
    setBestSeller(bestProduct.slice(0, 5))
  }, [products])

  return (
    <section className='py-10 sm:py-14 border-t border-gray-100'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-2'>
        <Title text1='TRENDING' text2='Best Sellers' />
        <p className='text-xs text-gray-400 sm:max-w-xs sm:text-right leading-relaxed'>
          Our most-loved styles — chosen by customers like you.
        </p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6'>
        {bestseller.map((item, index) => (
          <ProductItem key={index} id={item._id} name={item.name} image={item.image} price={item.price} />
        ))}
      </div>
    </section>
  )
}

export default BestSeller
