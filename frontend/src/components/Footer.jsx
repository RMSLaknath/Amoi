import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className='border-t border-gray-100 mt-14'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 py-10'>
        <div>
          <img src={assets.logo} alt='Amoi' className='w-24 mb-5' />
          <p className='text-xs text-gray-400 leading-relaxed max-w-xs'>
            Amoi — your destination for modern, curated fashion. Quality pieces designed to last.
          </p>
        </div>

        <div>
          <p className='text-xs tracking-[0.2em] text-gray-900 uppercase mb-5'>Company</p>
          <ul className='flex flex-col gap-3'>
            {[['/', 'Home'], ['/about', 'About Us'], ['/collection', 'Collection'], ['/contact', 'Contact']].map(([path, label]) => (
              <li key={path}>
                <Link to={path} className='text-xs text-gray-400 hover:text-gray-900 tracking-wide'>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className='text-xs tracking-[0.2em] text-gray-900 uppercase mb-5'>Get in Touch</p>
          <ul className='flex flex-col gap-3 text-xs text-gray-400'>
            <li>+94 77 123 4567</li>
            <li>hello@amoi.lk</li>
          </ul>
        </div>
      </div>

      <div className='border-t border-gray-100 py-5'>
        <p className='text-[10px] tracking-widest text-gray-300 text-center uppercase'>
          © 2026 Amoi. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
