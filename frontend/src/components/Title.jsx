import React from 'react'

const Title = ({ text1, text2 }) => {
  return (
    <div className='flex flex-col gap-1 mb-2'>
      <p className='text-xs tracking-[0.25em] text-gray-400 uppercase'>{text1}</p>
      <div className='flex items-center gap-3'>
        <p className='text-2xl font-light text-gray-900 tracking-wide'>{text2}</p>
        <span className='flex-1 max-w-12 h-px bg-gray-300'></span>
      </div>
    </div>
  )
}

export default Title
