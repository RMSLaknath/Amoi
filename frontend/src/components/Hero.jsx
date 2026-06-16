import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import p_img1 from '../assets/p_img1.png'
import p_img21 from '../assets/p_img21.png'
import p_img26 from '../assets/p_img26.png'
import p_img5 from '../assets/p_img5.png'

const SLIDES = [
  {
    image: assets.hero_img,
    label: 'New Season 2026',
    heading: ['Latest', 'Arrivals'],
    desc: 'Discover our newest collection — curated styles for every occasion.',
  },
  {
    image: p_img1,
    label: "Women's Essentials",
    heading: ['Effortless', 'Basics'],
    desc: 'Clean lines, quality fabrics. Everyday style, elevated.',
  },
  {
    image: p_img21,
    label: 'Winterwear',
    heading: ['Layer', 'Up'],
    desc: 'Warm, stylish outerwear crafted for the season ahead.',
  },
  {
    image: p_img5,
    label: 'New In',
    heading: ['Fresh', 'Styles'],
    desc: 'New pieces added every week — be first to discover them.',
  },
]

const INTERVAL = 4000

const Hero = () => {
  const [current, setCurrent] = useState(0)
  const [progressKey, setProgressKey] = useState(0)
  const timerRef = useRef(null)

  const startTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length)
      setProgressKey(k => k + 1)
    }, INTERVAL)
  }

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  const go = (i) => {
    const next = (i + SLIDES.length) % SLIDES.length
    setCurrent(next)
    setProgressKey(k => k + 1)
    startTimer()
  }

  const slide = SLIDES[current]

  return (
    <div className='relative flex flex-col sm:flex-row min-h-[55vh] sm:min-h-[65vh] overflow-hidden'>

      {/* Left — Text panel */}
      <div className='w-full sm:w-[45%] flex items-center justify-center py-10 sm:py-0 px-8 sm:px-14 bg-gray-50 relative z-10'>
        <div className='max-w-xs w-full'>

          <p key={`label-${current}`} className='hero-text-enter text-xs tracking-[0.3em] text-gray-400 uppercase mb-3'>
            {slide.label}
          </p>

          <h1 key={`heading-${current}`} className='hero-text-enter prata-regular text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-tight mb-4' style={{ animationDelay: '60ms' }}>
            {slide.heading[0]}<br />{slide.heading[1]}
          </h1>

          <p key={`desc-${current}`} className='hero-text-enter text-sm text-gray-500 leading-relaxed mb-7 max-w-xs' style={{ animationDelay: '120ms' }}>
            {slide.desc}
          </p>

          <Link to='/collection' className='inline-flex items-center gap-3 text-xs tracking-[0.2em] text-gray-900 group mb-10'>
            <span>SHOP NOW</span>
            <span className='w-10 h-px bg-gray-900 group-hover:w-16 transition-all duration-300'></span>
          </Link>

          {/* Dot / line indicators */}
          <div className='flex items-center gap-2'>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-[2px] rounded-none transition-all duration-400 ${i === current ? 'w-8 bg-gray-900' : 'w-4 bg-gray-300 hover:bg-gray-500'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right — Image stack with crossfade */}
      <div className='w-full sm:w-[55%] relative overflow-hidden min-h-[40vw] sm:min-h-0'>
        {SLIDES.map((s, i) => (
          <img
            key={i}
            src={s.image}
            alt={s.label}
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}

        {/* Prev arrow */}
        <button
          onClick={() => go(current - 1)}
          aria-label='Previous slide'
          className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/75 hover:bg-white text-gray-800 text-xl leading-none z-10 backdrop-blur-sm'
        >
          ‹
        </button>

        {/* Next arrow */}
        <button
          onClick={() => go(current + 1)}
          aria-label='Next slide'
          className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/75 hover:bg-white text-gray-800 text-xl leading-none z-10 backdrop-blur-sm'
        >
          ›
        </button>

        {/* Slide counter */}
        <div className='absolute bottom-4 right-5 text-[10px] tracking-[0.15em] text-white drop-shadow z-10 select-none'>
          {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </div>

      {/* Progress bar */}
      <div className='absolute bottom-0 left-0 right-0 h-[2px] bg-gray-200 z-20'>
        <div key={progressKey} className='hero-progress h-full bg-gray-800' />
      </div>
    </div>
  )
}

export default Hero
