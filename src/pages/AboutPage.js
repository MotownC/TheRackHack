import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Mail, ArrowLeft } from 'lucide-react';
import { getAboutContent } from '../services/productService';
import GlowButton from '../components/GlowButton';
import banner from '../assets/banner.png';

function AboutPage() {
  const navigate = useNavigate();
  const [aboutContent, setAboutContent] = useState({
    title: 'Our Story',
    content: `Welcome to The Rack Hack! We're passionate about making quality clothing accessible to everyone.

Founded with a simple mission: to offer incredible deals on both new and pre-owned clothing. Whether you're looking for brand new items at unbeatable prices or quality secondhand finds, we've got you covered.

Every piece in our collection is carefully selected to ensure you get the best value for your money. We believe great style shouldn't break the bank.

Join us in our mission to make fashion accessible, sustainable, and affordable for all.`
  });

  // Load about content from Firestore
  useEffect(() => {
    const loadAbout = async () => {
      try {
        const data = await getAboutContent();
        if (data && data.content) {
          setAboutContent(data);
        }
      } catch (error) {
        console.error('Error loading about content:', error);
      }
    };
    loadAbout();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={banner} 
            alt="The Rack Hack" 
            className="h-24 cursor-pointer" 
            onClick={() => navigate('/')}
          />
          <nav className="flex gap-6 items-center">
            <button
              onClick={() => navigate('/')}
              className="font-medium text-slate-600 hover:text-slate-800"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="font-medium text-slate-600 hover:text-slate-800"
            >
              Shop
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <Mail className="w-5 h-5" />
              Contact
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative"
            >
              <ShoppingCart className="w-6 h-6 text-slate-600" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">{aboutContent.title}</h1>
          
          <div className="prose prose-lg max-w-none">
            {aboutContent.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-slate-700 leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <GlowButton
              label="Start Shopping"
              onClick={() => navigate('/shop')}
              icon={ShoppingBag}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AboutPage;