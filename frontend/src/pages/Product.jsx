import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import RelatedProducts from '../components/RelatedProducts'
import StarRating from '../components/StarRating'
import ReviewSection from '../components/ReviewSection'
import { useCurrency } from '../context/CurrencyContext'

const Product = () => {
  const { productId } = useParams()
  const { products, addToCart, backendUrl } = useContext(ShopContext)
  const { formatPrice } = useCurrency()

  const [productData, setProductData] = useState(false)
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')
  const [activeTab, setActiveTab] = useState('description')
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  const fetchProductData = () => {
    products.forEach(item => {
      if (item._id === productId) {
        setProductData(item)
        setImage(item.image[0])
      }
    })
  }

  const fetchReviewSummary = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/review/${productId}?page=1&limit=1`)
      if (res.data.success) {
        setAvgRating(res.data.avgRating)
        setTotalReviews(res.data.totalReviews)
      }
    } catch (err) {
      console.error('Failed to load review summary:', err)
    }
  }

  const handleReviewUpdate = (newAvg, newTotal) => {
    setAvgRating(newAvg)
    setTotalReviews(newTotal)
  }

  useEffect(() => { fetchProductData() }, [productId, products])
  useEffect(() => { if (productId) fetchReviewSummary() }, [productId])

  return productData ? (
    <div className='border-t border-gray-100 pt-10'>
      {/* Product */}
      <div className='flex flex-col sm:flex-row gap-10 sm:gap-16'>
        {/* Images */}
        <div className='flex-1 flex flex-col-reverse sm:flex-row gap-3'>
          {/* Thumbnails */}
          <div className='flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] sm:w-20'>
            {productData.image.map((img, i) => (
              <img
                key={i}
                onClick={() => setImage(img)}
                src={img}
                className={`w-16 sm:w-full aspect-square object-cover cursor-pointer shrink-0 ${image === img ? 'ring-1 ring-gray-900' : 'opacity-60 hover:opacity-100'}`}
                alt=''
              />
            ))}
          </div>
          {/* Main Image */}
          <div className='flex-1 bg-gray-50'>
            <img className='w-full h-full object-cover' src={image} alt={productData.name} />
          </div>
        </div>

        {/* Info */}
        <div className='flex-1 max-w-md'>
          <p className='text-xs tracking-[0.2em] text-gray-400 uppercase mb-2'>{productData.category}</p>
          <h1 className='text-2xl font-light text-gray-900 mb-3'>{productData.name}</h1>

          {/* Rating */}
          <div className='flex items-center gap-2 mb-5'>
            <StarRating rating={avgRating} />
            <p className='text-xs text-gray-400'>
              {totalReviews > 0 ? `${avgRating.toFixed(1)} (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})` : 'No reviews yet'}
            </p>
          </div>

          <p className='text-2xl text-gray-900 mb-5'>{formatPrice(productData.price)}</p>
          <p className='text-sm text-gray-500 leading-relaxed mb-5'>{productData.description}</p>

          {/* Size */}
          <div className='mb-5'>
            <p className='text-xs tracking-[0.2em] text-gray-400 uppercase mb-2'>Select Size</p>
            <div className='flex flex-wrap gap-2'>
              {productData.sizes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSize(s)}
                  className={`w-10 h-10 text-xs border transition-all ${s === size ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-900'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addToCart(productData._id, size)}
            className='w-full sm:w-auto bg-gray-900 text-white text-xs tracking-[0.2em] px-12 py-4 hover:bg-black mb-5'
          >
            ADD TO CART
          </button>

          {/* Trust signals */}
          <div className='flex flex-col gap-2 border-t border-gray-100 pt-6'>
            {['100% original product', 'Cash on delivery available', 'Easy return within 7 days'].map(text => (
              <p key={text} className='text-xs text-gray-400 flex items-center gap-2'>
                <span className='w-1 h-1 rounded-full bg-gray-300'></span>
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='mt-12'>
        <div className='flex border-b border-gray-100'>
          {['description', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs tracking-[0.2em] uppercase px-6 py-4 border-b-2 transition-colors ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab === 'reviews' ? `Reviews (${totalReviews})` : 'Description'}
            </button>
          ))}
        </div>

        <div className='py-6'>
          {activeTab === 'description' ? (
            <p className='text-sm text-gray-500 leading-relaxed max-w-2xl'>{productData.description}</p>
          ) : (
            <ReviewSection productId={productId} onStatsUpdate={handleReviewUpdate} />
          )}
        </div>
      </div>

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (
    <div className='opacity-0' />
  )
}

export default Product
