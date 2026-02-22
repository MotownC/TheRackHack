import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getProductById } from '../services/productService';

function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();

  // 1. Capture the filters passed from the Shop Page
  const returnState = location.state || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);

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
          alert(`Sorry, you already have all available stock in your cart!`);
          return;
        }
      } else {
        // Add new item
        newCart = [...cart, { ...product, quantity: 1 }];
      }

      // 3. Save back to Local Storage
      localStorage.setItem('cart', JSON.stringify(newCart));
      alert(`${product.name} added to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = [
    product.image,
    product.image2,
    product.image3
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4">
        {/* Back button with memory */}
        <Link 
          to="/shop" 
          state={returnState}
          className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block"
        >
          ← Back to Shop
        </Link>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Images Section */}
            <div>
              <div className="space-y-4">
                {images.length > 0 ? (
                  images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      loading="lazy"
                      onClick={() => setFullscreenImage(img)}
                      title="Click to view fullscreen"
                    />
                  ))
                ) : (
                  <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400">No image available</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Product Details Section */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm text-blue-600 font-medium capitalize">{product.category}</span>
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
                  <span className="font-semibold">Availability:</span> {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
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
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
            </div>
          </div>
        </div>
      </div>
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}

export default ItemDetail;