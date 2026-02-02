import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function Homepage() {
  const navigate = useNavigate();

  const boxes = [
    {
      title: 'NEW',
      subtitle: 'Brand new items at unbeatable prices',
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
      link: '/shop?condition=new'
    },
    {
      title: 'PRE-OWNED',
      subtitle: 'Quality secondhand finds',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800',
      link: '/shop?condition=used'
    },
    {
      title: 'ABOUT',
      subtitle: 'Our story and mission',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
      link: '/about'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div 
        onClick={() => navigate('/about')}
        className="mb-12 cursor-pointer hover:opacity-80 transition"
      >
        <img src={logo} alt="The Rack Hack" className="h-80 w-auto" />
      </div>

      {/* Three Boxes */}
      <div className="w-full max-w-4xl space-y-6">
        {boxes.map((box, index) => (
          <div
            key={index}
            onClick={() => navigate(box.link)}
            className="relative h-64 rounded-2xl overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundImage: `url(${box.image})` }}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
              <h2 className="text-5xl font-bold mb-3 tracking-wide">{box.title}</h2>
              <p className="text-xl font-light opacity-90">{box.subtitle}</p>
            </div>

            {/* Hover Arrow */}
            <div className="absolute bottom-8 right-8 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Footer tagline */}
      <p className="mt-12 text-slate-600 text-lg font-light">
        Quality clothing, unbeatable deals
      </p>
    </div>
  );
}

export default Homepage;