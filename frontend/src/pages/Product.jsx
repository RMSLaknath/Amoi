// frontend/src/pages/Product.jsx
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
  const [image, setImage]             = useState('')
  const [size, setSize]               = useState('')
  const [activeTab, setActiveTab]     = useState('description')

  // Live review summary for the star display in the product info panel
  const [avgRating, setAvgRating]       = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  const fetchProductData = () => {
    products.forEach((item) => {
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

  useEffect(() => {
    fetchProductData()
  }, [productId, products])

  useEffect(() => {
    if (productId) fetchReviewSummary()
  }, [productId])

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Product Data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">

        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>

          {/* Live star rating */}
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={avgRating} />
            <p className="text-sm text-gray-500">
              {totalReviews > 0
                ? `${avgRating.toFixed(1)} (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})`
                : 'No reviews yet'}
            </p>
          </div>

          <p className="mt-5 text-3xl font-medium">{formatPrice(productData.price)}</p>
          <p className="mt-5 text-gray-500 md:w-4/5">{productData.description}</p>

          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addToCart(productData._id, size)}
            className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700"
          >
            ADD TO CART
          </button>

          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description & Reviews Tabs */}
      <div className="mt-20">
        <div className="flex">
          <button
            onClick={() => setActiveTab('description')}
            className={`border px-5 py-3 text-sm ${activeTab === 'description' ? 'font-semibold bg-gray-50' : ''}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`border px-5 py-3 text-sm ${activeTab === 'reviews' ? 'font-semibold bg-gray-50' : ''}`}
          >
            Reviews ({totalReviews})
          </button>
        </div>

        <div className="border px-6 py-6 text-sm text-gray-600">
          {activeTab === 'description' ? (
            <p>{productData.description}</p>
          ) : (
            <ReviewSection productId={productId} onStatsUpdate={handleReviewUpdate} />
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (
    <div className="opacity-0" />
  )
}

export default Product
