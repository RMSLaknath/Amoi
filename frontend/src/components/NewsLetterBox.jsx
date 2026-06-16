import React from 'react'

const NewsLetterBox = () => {
  const onSubmitHandler = e => e.preventDefault()

  return (
    <section className='bg-gray-50 py-12 text-center'>
      <p className='text-xs tracking-[0.25em] text-gray-400 uppercase mb-2'>Exclusive Offers</p>
      <h2 className='prata-regular text-2xl text-gray-900 mb-3'>Get 20% Off</h2>
      <p className='text-sm text-gray-400 max-w-sm mx-auto leading-relaxed mb-6'>
        Subscribe to our newsletter for early access to new collections and member-only discounts.
      </p>
      <form onSubmit={onSubmitHandler} className='flex items-center max-w-sm mx-auto border-b border-gray-300 pb-2'>
        <input
          className='flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300'
          type='email'
          placeholder='Your email address'
          required
        />
        <button type='submit' className='text-xs tracking-[0.15em] text-gray-900 hover:text-black shrink-0 ml-4'>
          SUBSCRIBE →
        </button>
      </form>
    </section>
  )
}

export default NewsLetterBox
