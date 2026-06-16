import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext)
  const [showFilter, setShowFilter] = useState(false)
  const [filterProducts, setFilterProducts] = useState([])
  const [category, setCategory] = useState([])
  const [subCategory, setSubCategory] = useState([])
  const [sortType, setSortType] = useState('relavent')

  const toggleCategory = (e) => {
    const val = e.target.value
    setCategory(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])
  }

  const toggleSubCategory = (e) => {
    const val = e.target.value
    setSubCategory(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])
  }

  const applyFilter = () => {
    let copy = products.slice()
    if (showSearch && search) copy = copy.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    if (category.length > 0) copy = copy.filter(i => category.includes(i.category))
    if (subCategory.length > 0) copy = copy.filter(i => subCategory.includes(i.subcategory))
    setFilterProducts(copy)
  }

  const sortProducts = () => {
    let copy = filterProducts.slice()
    if (sortType === 'low-high') setFilterProducts(copy.sort((a, b) => a.price - b.price))
    else if (sortType === 'high-low') setFilterProducts(copy.sort((a, b) => b.price - a.price))
    else applyFilter()
  }

  useEffect(() => { setFilterProducts(products) }, [])
  useEffect(() => { applyFilter() }, [category, subCategory, search, showSearch, products])
  useEffect(() => { sortProducts() }, [sortType])

  const FilterGroup = ({ title, items, onChange }) => (
    <div className='mb-6'>
      <p className='text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-3'>{title}</p>
      <div className='flex flex-col gap-2.5'>
        {items.map(({ value, label }) => (
          <label key={value} className='flex items-center gap-3 cursor-pointer group'>
            <input
              type='checkbox'
              value={value}
              onChange={onChange}
              className='w-3 h-3 accent-black'
            />
            <span className='text-xs tracking-wider text-gray-500 group-hover:text-gray-900'>{label}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className='pt-6 border-t border-gray-100'>
      <div className='flex flex-col sm:flex-row gap-8'>
        {/* Sidebar */}
        <aside className='w-full sm:w-44 shrink-0'>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className='flex items-center gap-2 text-xs tracking-[0.2em] text-gray-900 uppercase mb-5 sm:mb-6'
          >
            Filters
            <img
              className={`w-2.5 sm:hidden transition-transform ${showFilter ? 'rotate-90' : ''}`}
              src={assets.dropdown_icon}
              alt=''
            />
          </button>

          <div className={`${showFilter ? 'block' : 'hidden'} sm:block`}>
            <FilterGroup
              title='Categories'
              items={[{ value: 'Women', label: 'Women' }, { value: 'Kids', label: 'Kids' }]}
              onChange={toggleCategory}
            />
            <FilterGroup
              title='Type'
              items={[
                { value: 'Topwear', label: 'Topwear' },
                { value: 'Bottomwear', label: 'Bottomwear' },
                { value: 'Winterwear', label: 'Winterwear' },
              ]}
              onChange={toggleSubCategory}
            />
          </div>
        </aside>

        {/* Products Grid */}
        <div className='flex-1'>
          <div className='flex items-end justify-between mb-6'>
            <Title text1='ALL' text2='Collection' />
            <select
              onChange={e => setSortType(e.target.value)}
              className='text-xs tracking-wider text-gray-500 border-b border-gray-200 bg-transparent outline-none pb-1 cursor-pointer'
            >
              <option value='relavent'>Relevance</option>
              <option value='low-high'>Price: Low → High</option>
              <option value='high-low'>Price: High → Low</option>
            </select>
          </div>

          {filterProducts.length === 0 ? (
            <p className='text-sm text-gray-400 text-center py-20'>No products found.</p>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6'>
              {filterProducts.map((item, index) => (
                <ProductItem key={index} name={item.name} id={item._id} price={item.price} image={item.image} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Collection
