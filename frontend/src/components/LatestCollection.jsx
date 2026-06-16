import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const LatestCollection = () => {
  const { products } = useContext(ShopContext)
  const [latestProducts, setLatestProducts] = useState([])

  useEffect(() => {
    setLatestProducts(products.slice(0, 10))
  }, [products])

  return (
    <section className='py-10 sm:py-14'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-2'>
        <Title text1='NEW IN' text2='Latest Collection' />
        <p className='text-xs text-gray-400 sm:max-w-xs sm:text-right leading-relaxed'>
          Freshly curated pieces added every week — explore what's new.
        </p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6'>
        {latestProducts.map((item, index) => (
          <ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price} />
        ))}
      </div>
    </section>
  )
}

export default LatestCollection
