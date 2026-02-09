import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import CompleteCheckout from '../components/CompleteCheckout';
import banner from '../assets/banner.png'; // Make sure path matches your folder structure

function CheckoutPage() {
  const navigate = useNavigate();
  
  // Get cart from localStorage
  const [cart, setCart] = React.useState([]);
  
  React.useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
          setCart(JSON.parse(cartData));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  const handleUpdateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // Calculate cart count for the badge
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- HEADER START --- */}
      <header className="bg-white shadow-sm sticky top-0 z-50 mb-8">
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
            <button className="relative cursor-default">
              <ShoppingCart className="w-6 h-6 text-slate-600" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>
      {/* --- HEADER END --- */}

      {/* The Actual Checkout Form */}
      {cart.length === 0 ? (
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Add some items before checking out.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Browse Shop
          </button>
        </div>
      ) : (
        <CompleteCheckout
          cart={cart}
          onUpdateCart={handleUpdateCart}
        />
      )}
    </div>
  );
}

export default CheckoutPage;