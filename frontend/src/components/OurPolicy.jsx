import React from 'react'
import { assets } from '../assets/assets'

const policies = [
  { icon: assets.exchange_icon, title: 'Easy Exchange', desc: 'Hassle-free exchange on all orders.' },
  { icon: assets.quality_icon, title: '7-Day Returns', desc: 'Free returns within 7 days of delivery.' },
  { icon: assets.support_img, title: '24/7 Support', desc: 'Our team is always here to help.' },
]

const OurPolicy = () => {
  return (
    <section className='border-t border-gray-100 py-10'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        {policies.map(({ icon, title, desc }) => (
          <div key={title} className='flex flex-col items-center text-center gap-3'>
            <img src={icon} alt={title} className='w-8 h-8 object-contain opacity-60' />
            <div>
              <p className='text-xs tracking-[0.15em] text-gray-900 uppercase mb-1'>{title}</p>
              <p className='text-xs text-gray-400 leading-relaxed'>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default OurPolicy
