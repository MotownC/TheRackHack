import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductById } from '../services/productService';
import { ToastContainer, useToast } from '../components/Toast';

function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();

  // 1. Capture the filters passed from the Shop Page
  const navigate = useNavigate();
  const returnState = location.state || {};

  const genderLabels = { mens: "Men's", womens: "Women's", kids: "Kids" };

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const foundProduct = await getProductById(id);
        setProduct(foundProduct);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [id]);

  const images = product ? [product.image, product.image2, product.image3].filter(Boolean) : [];

  const goNext = useCallback(() => setActiveIndex(i => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setActiveIndex(i => (i - 1 + images.length) % images.length), [images.length]);

  const goNextFullscreen = useCallback(() => {
    const next = (fullscreenIndex + 1) % images.length;
    setFullscreenIndex(next);
    setFullscreenImage(images[next]);
  }, [fullscreenIndex, images]);

  const goPrevFullscreen = useCallback(() => {
    const prev = (fullscreenIndex - 1 + images.length) % images.length;
    setFullscreenIndex(prev);
    setFullscreenImage(images[prev]);
  }, [fullscreenIndex, images]);

  useEffect(() => {
    if (!fullscreenImage) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNextFullscreen();
      else if (e.key === 'ArrowLeft') goPrevFullscreen();
      else if (e.key === 'Escape') setFullscreenImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenImage, goNextFullscreen, goPrevFullscreen]);

  useEffect(() => {
    if (fullscreenImage) return;
    const onKey = (e) => {
      if (images.length <= 1) return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenImage, images.length, goNext, goPrev]);

  // --- NEW: Function to handle adding to cart ---
  const handleAddToCart = () => {
    try {
      // 1. Get current cart from Local Storage
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];

      // 2. Check if item is already in cart
      const existingItem = cart.find(item => item.id === product.id);
      let newCart;

      if (existingItem) {
        // Increment quantity if stock allows
        if (existingItem.quantity < product.stock) {
          newCart = cart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          showToast(`You already have all available stock in your cart`);
          return;
        }
      } else {
        // Add new item
        newCart = [...cart, { ...product, quantity: 1 }];
      }

      // 3. Save back to Local Storage
      localStorage.setItem('cart', JSON.stringify(newCart));
      showToast(`${product.name} added to cart`);

    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-700"></div>
          <span className="text-lg font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h2>
            <p className="text-slate-600 mb-6">The item you're looking for doesn't exist.</p>
            <Link 
              to="/shop" 
              state={returnState}
              className="bg-rose-700 text-white px-6 py-2 rounded-lg hover:bg-rose-800 inline-block"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-6 text-slate-500">
          <Link to="/shop" state={returnState} className="hover:text-rose-700 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <button
            onClick={() => navigate('/shop', { state: { savedGender: product.gender, savedCondition: returnState.savedCondition || 'all' } })}
            className="hover:text-rose-700 transition-colors"
          >
            {genderLabels[product.gender] || 'All'}
          </button>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </nav>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Images Carousel — CSS Fadeshow style */}
            <div className="flex flex-col gap-3">
              {images.length > 0 ? (
                <>
                  {/* Fadeshow container: all images stacked, active one fades in */}
                  <div className="relative group bg-slate-100 rounded-xl overflow-hidden aspect-square">
                    {images.map((img, i) => (
                      <img
                        key={img}
                        src={img}
                        alt={`${product.name} - ${i + 1}`}
                        className={`absolute inset-0 w-full h-full object-contain cursor-zoom-in ${
                          i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                        style={{ transition: 'opacity 1s ease' }}
                        loading="lazy"
                        onClick={() => { setFullscreenIndex(activeIndex); setFullscreenImage(images[activeIndex]); }}
                        title="Click to view fullscreen"
                      />
                    ))}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); goPrev(); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); goNext(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
                          aria-label="Next image"
                        >
                          <ChevronRight size={22} />
                        </button>
                        {/* Dot indicator */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                              className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-rose-700 w-4' : 'bg-white/80 hover:bg-white'}`}
                              aria-label={`Go to image ${i + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {images.length > 1 && (
                    <div className="flex gap-2">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIndex(i)}
                          className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-rose-700 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-contain bg-slate-100" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-square bg-slate-200 rounded-xl flex items-center justify-center">
                  <span className="text-slate-400">No image available</span>
                </div>
              )}
            </div>
            
            {/* Product Details Section */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm text-rose-700 font-medium capitalize">{product.category}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  product.condition === 'new'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {product.condition === 'new' ? 'New' : 'Pre-Owned'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-4">{product.name}</h1>
              <p className="text-sm text-slate-600 mb-4">Size: {product.size}</p>
              <p className="text-3xl text-green-600 font-bold mb-6">${product.price.toFixed(2)}</p>
              
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Description</h3>
                  <p className="text-slate-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-slate-600">
                  <span className="font-semibold">Availability:</span>{' '}
                  {product.stock === 0 ? (
                    <span className="text-red-500 font-medium">Out of stock</span>
                  ) : product.stock <= 3 ? (
                    <span className="text-amber-600 font-medium">Only {product.stock} left!</span>
                  ) : (
                    `${product.stock} in stock`
                  )}
                </p>
                <p className="text-slate-600 mt-2">
                  <span className="font-semibold">Condition:</span> {product.condition === 'new' ? 'New' : 'Pre-Owned'}
                </p>
                <p className="text-slate-600 mt-2">
                  <span className="font-semibold">Category:</span> {product.gender === 'mens' ? "Men's" : product.gender === 'womens' ? "Women's" : "Kids'"}
                </p>
              </div>
              
              <button 
                onClick={handleAddToCart} // <--- Added the click handler here
                disabled={product.stock === 0}
                className="bg-rose-700 text-white px-8 py-3 rounded-lg hover:bg-rose-800 transition disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
            </div>
          </div>
        </div>
      </div>
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-zoom-out"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrevFullscreen(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNextFullscreen(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setFullscreenIndex(i); setFullscreenImage(images[i]); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === fullscreenIndex ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default ItemDetail;