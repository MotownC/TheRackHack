import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Mail } from 'lucide-react'; // Import icons
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
              onClick={() => navigate('/')}
              className="font-medium text-slate-600 hover:text-slate-800"
            >
              Shop
            </button>
            <button
              onClick={() => navigate('/')}
              className="font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <Mail className="w-5 h-5" />
              Contact
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
      <CompleteCheckout 
        cart={cart} 
        onUpdateCart={handleUpdateCart} 
      />
    </div>
  );
}

export default CheckoutPage;