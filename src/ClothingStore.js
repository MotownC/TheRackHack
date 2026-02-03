import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Package, TrendingUp, Mail, Edit, PlusCircle, LogOut, Lock } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import ContactModal from './components/ContactModal';
import ProductEditor from './components/ProductEditor';
import GlowButton from './components/GlowButton';
import banner from './assets/banner.png';
import logo from './assets/logo.png';
import { 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  getAllOrders,
  addOrder,
  updateOrder,
  getAboutContent,
  saveAboutContent
} from './services/productService';
import { useAuth } from './contexts/AuthContext';

const ClothingStore = ({ initialView = 'shop', initialConditionFilter = 'all' }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { currentUser, logout } = useAuth();
  const [products, setProducts] = useState([]);

  // Initialize cart directly from Local Storage so it's never empty on load
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error parsing cart:', error);
      return [];
    }
  });

  const [view, setView] = useState(initialView);
  const [orders, setOrders] = useState([]);

  // Initial State from Location (First Try)
  const [genderFilter, setGenderFilter] = useState(location.state?.savedGender || 'all');
  const [conditionFilter, setConditionFilter] = useState(location.state?.savedCondition || initialConditionFilter);

  // --- NEW FIX: Force Restore Filters from History ---
  // This ensures that if the component re-mounts, we strictly apply the saved filters
  useEffect(() => {
    if (location.state) {
      console.log("Restoring filters from history:", location.state);
      if (location.state.savedGender) {
        setGenderFilter(location.state.savedGender);
      }
      if (location.state.savedCondition) {
        setConditionFilter(location.state.savedCondition);
      }
      // Ensure we are looking at the shop view
      setView('shop');
    }
  }, [location]); 
  // --------------------------------------------------

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [aboutContent, setAboutContent] = useState({ title: '', content: '' });
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '', email: '', address: '', city: '', state: '', zip: ''
  });

 // Load data from Firebase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load products from Firebase
        const firebaseProducts = await getAllProducts();
        
        // If Firebase is empty, seed it with starter products
        if (firebaseProducts.length === 0) {
          console.log('Firebase empty, seeding with starter products...');
          const starterProducts = [
            { name: "Men's Denim Jacket", size: "L", price: 45.00, stock: 3, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", category: "Outerwear", gender: "mens", condition: "new" },
            { name: "Women's Floral Dress", size: "M", price: 35.00, stock: 5, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", category: "Dresses", gender: "womens", condition: "used" },
            { name: "Men's Graphic Tee", size: "XL", price: 18.00, stock: 8, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", category: "Tops", gender: "mens", condition: "new" },
            { name: "Women's Skinny Jeans", size: "28", price: 32.00, stock: 4, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400", category: "Bottoms", gender: "womens", condition: "used" },
            { name: "Men's Polo Shirt", size: "L", price: 25.00, stock: 6, image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400", category: "Tops", gender: "mens", condition: "new" },
            { name: "Women's Cardigan", size: "S", price: 38.00, stock: 3, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", category: "Outerwear", gender: "womens", condition: "used" },
            { name: "Men's Chino Pants", size: "32", price: 42.00, stock: 5, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400", category: "Bottoms", gender: "mens", condition: "new" },
            { name: "Women's Blouse", size: "M", price: 28.00, stock: 7, image: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400", category: "Tops", gender: "womens", condition: "used" },
            { name: "Men's Hoodie", size: "XL", price: 48.00, stock: 4, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", category: "Outerwear", gender: "mens", condition: "new" },
            { name: "Women's Maxi Skirt", size: "L", price: 33.00, stock: 3, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400", category: "Bottoms", gender: "womens", condition: "used" },
            { name: "Men's Button-Down", size: "M", price: 36.00, stock: 6, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400", category: "Tops", gender: "mens", condition: "new" },
            { name: "Women's Leather Jacket", size: "M", price: 89.00, stock: 2, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", category: "Outerwear", gender: "womens", condition: "used" },
            { name: "Men's Cargo Shorts", size: "L", price: 29.00, stock: 5, image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400", category: "Bottoms", gender: "mens", condition: "new" },
            { name: "Women's Tank Top", size: "S", price: 15.00, stock: 9, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400", category: "Tops", gender: "womens", condition: "used" },
            { name: "Men's Bomber Jacket", size: "L", price: 65.00, stock: 3, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", category: "Outerwear", gender: "mens", condition: "new" },
            { name: "Kids' Striped Tee", size: "10", price: 12.00, stock: 10, image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400", category: "Tops", gender: "kids", condition: "new" },
            { name: "Kids' Denim Jeans", size: "8", price: 22.00, stock: 8, image: "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400", category: "Bottoms", gender: "kids", condition: "used" },
            { name: "Kids' Hoodie", size: "12", price: 28.00, stock: 6, image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400", category: "Outerwear", gender: "kids", condition: "new" }
          ];
          
          for (const product of starterProducts) {
            await addProduct(product);
          }
          
          const seededProducts = await getAllProducts();
          setProducts(seededProducts);
          console.log('✅ Firebase seeded with 18 products');
        } else {
          setProducts(firebaseProducts);
        }
        
        // Load Orders from Firestore
        const firestoreOrders = await getAllOrders();
        setOrders(firestoreOrders);

        // Load About content from Firestore
        const aboutData = await getAboutContent();
        if (aboutData) {
          setAboutContent(aboutData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);          
          
  // Save cart when it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [cart]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const product = products.find(p => p.id === productId);
        if (newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const completeOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    const orderData = {
      date: new Date().toISOString(),
      customer: checkoutForm,
      items: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'Pending Payment'
    };

    try {
      // Save order to Firestore
      const savedOrder = await addOrder(orderData);
      setOrders([...orders, savedOrder]);

      // Update inventory in Firestore
      for (const cartItem of cart) {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
          await updateProduct(product.id, { stock: product.stock - cartItem.quantity });
        }
      }

      // Update local product state
      setProducts(products.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          return { ...product, stock: product.stock - cartItem.quantity };
        }
        return product;
      }));

      setCart([]);
      setCheckoutForm({ name: '', email: '', address: '', city: '', state: '', zip: '' });
      setView('shop');
      alert('Order placed! You will receive payment instructions via email.');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      setLoading(true);
      let updatedProduct;
      
      if (productData.id) {
        // Edit existing product - update in Firebase
        await updateProduct(productData.id, productData);
        updatedProduct = productData;
        setProducts(products.map(p => 
          p.id === productData.id ? productData : p
        ));
      } else {
        // Add new product - add to Firebase
        updatedProduct = await addProduct(productData);
        setProducts([...products, updatedProduct]);
      }
      
      setEditingProduct(null);
      setIsAddingProduct(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Check console for errors.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        await deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Check console for errors.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveAbout = async () => {
    try {
      await saveAboutContent(aboutContent);      
      setIsEditingAbout(false);
      alert('About page updated successfully!');
    } catch (error) {
      console.error('Error saving about content:', error);
      alert('Failed to save about page content.');
    }
  };

  const handleLogout = async () => {
  try {
    await logout();
    navigate('/');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};
      
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItemsSold = orders.reduce((sum, order) => 
    sum + order.items.reduce((s, item) => s + item.quantity, 0), 0
  );

  // Filter products by gender and condition
  const filteredProducts = products.filter(p => {
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchesCondition = conditionFilter === 'all' || p.condition === conditionFilter;
    return matchesGender && matchesCondition;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={banner} alt="The Rack Hack" className="h-24" />
          <nav className="flex gap-6 items-center">
            {view === 'admin' ? (
              // Admin Header
              <>
                <button
                  onClick={() => setView('admin')}
                  className="font-medium text-blue-600"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              // Public Header
              <>
                <button
                  onClick={() => navigate('/')}
                  className="font-medium text-slate-600 hover:text-slate-800"
                >
                  Home
                </button>
                <button
                  onClick={() => setView('shop')}
                  className={`font-medium ${view === 'shop' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Shop
                </button>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1"
                >
                  <Mail className="w-5 h-5" />
                  Contact
                </button>
                <button
                  onClick={() => setView('cart')}
                  className="relative"
                >
                  <ShoppingCart className="w-6 h-6 text-slate-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading overlay for save/delete operations */}
        {loading && products.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-semibold">Saving...</span>
            </div>
          </div>
        )}
        
        {view === 'shop' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Quality Clothing Deals</h2>
            
            {/* Gender Filter Buttons */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">CATEGORY</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'mens', label: "Men's" },
                  { value: 'womens', label: "Women's" },
                  { value: 'kids', label: 'Kids' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setGenderFilter(value)}
                    className={genderFilter === value ? 'glow-btn glow-filter-active' : 'glow-filter'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filter Buttons */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">CONDITION</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'new', label: 'New' },
                  { value: 'used', label: 'Pre-Owned' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setConditionFilter(value)}
                    className={conditionFilter === value ? 'glow-btn glow-filter-active' : 'glow-filter'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Skeleton Loading Cards */}
              {loading && products.length === 0 && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="w-full h-48 bg-slate-200 animate-pulse" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                        <div className="flex justify-between">
                          <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3" />
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
                        </div>
                        <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              )}
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
                  <Link to={`/item/${product.id}`}
      state={{
        savedGender: genderFilter,
        savedCondition: conditionFilter
      }}>
                    <div className="relative overflow-hidden bg-slate-100">
                      <img src={product.image} alt={product.name} className="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      {/* Condition Badge */}
                      <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${
                        product.condition === 'new'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {product.condition === 'new' ? 'New' : 'Pre-Owned'}
                      </span>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/item/${product.id}`}
        state={{
          savedGender: genderFilter,
          savedCondition: conditionFilter
        }}>
                      <h3 className="font-semibold text-slate-800 mb-1 hover:text-blue-600 cursor-pointer">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-slate-600 mb-2">Size: {product.size}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                      <span className="text-sm text-slate-500">
                        {product.stock} in stock
                      </span>
                    </div>
                    <GlowButton
                      label={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      showIcon={product.stock > 0}
                      icon={ShoppingCart}
                      className="glow-btn-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'cart' && (
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Shopping Cart</h2>
            {cart.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">Your cart is empty</p>
                <GlowButton
                  label="Continue Shopping"
                  onClick={() => setView('shop')}
                  className="mt-4"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                      <img src={item.image} alt={item.name} className="w-24 h-24 object-contain rounded bg-slate-100" loading="lazy" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{item.name}</h3>
                        <p className="text-sm text-slate-600">Size: {item.size}</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="bg-slate-200 p-1 rounded hover:bg-slate-300"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="bg-slate-200 p-1 rounded hover:bg-slate-300"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Right Column - Order Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 h-fit">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Order Summary</h3>
                  
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-800">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-right">
                      Shipping & Tax calculated at checkout
                    </p>
                  </div>

                  <GlowButton
                    label="Proceed to Checkout"
                    onClick={() => navigate('/checkout')}
                    className="glow-btn-full"
                  />
                   
                  <div className="mt-4 flex justify-center gap-2 text-slate-400">
                     <span className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> Secure Checkout</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
              <button
                onClick={() => setIsAddingProduct(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add New Product
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
                  </div>
                  <Package className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Items Sold</p>
                    <p className="text-3xl font-bold text-purple-600">{totalItemsSold}</p>
                  </div>
                  <ShoppingCart className="w-12 h-12 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Products Management */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-slate-800">Manage Products</h3>
                <p className="text-sm text-slate-500 mt-1">Scroll right to see all columns →</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <img src={product.image} alt={product.name} className="w-16 h-16 object-contain rounded bg-slate-100" loading="lazy" />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                          <div className="truncate" title={product.description}>
                            {product.description || <span className="text-slate-400 italic">No description</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.size}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.stock}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded hover:bg-red-50 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* About Page Editor */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Edit About Page</h3>
                {!isEditingAbout && (
                  <button
                    onClick={() => setIsEditingAbout(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Content
                  </button>
                )}
              </div>
              <div className="p-6">
                {isEditingAbout ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={aboutContent.title}
                        onChange={(e) => setAboutContent({ ...aboutContent, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Our Story"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                      <textarea
                        value={aboutContent.content}
                        onChange={(e) => setAboutContent({ ...aboutContent, content: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg h-64"
                        placeholder="Tell your story..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveAbout}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditingAbout(false)}
                        className="border border-slate-300 px-6 py-2 rounded-lg hover:bg-slate-50 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-3">{aboutContent.title || 'No title set'}</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{aboutContent.content || 'No content set yet. Click Edit Content to add your story.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-slate-800">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      orders.slice().reverse().map(order => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">#{order.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.customer.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {view !== 'admin' && (
        <footer className="bg-slate-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* About Section */}
              <div>
                <h3 className="text-lg font-bold mb-4">The Rack Hack</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Quality pre-owned and new clothing at unbeatable prices.
                  Find your next favorite outfit without breaking the bank.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => setView('shop')} className="text-slate-300 hover:text-white transition-colors">
                      Shop All
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setView('shop'); setConditionFilter('new'); }} className="text-slate-300 hover:text-white transition-colors">
                      New Items
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setView('shop'); setConditionFilter('used'); }} className="text-slate-300 hover:text-white transition-colors">
                      Pre-Owned
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/about')} className="text-slate-300 hover:text-white transition-colors">
                      About Us
                    </button>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-bold mb-4">Contact Us</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Have questions? We'd love to hear from you.
                </p>
                <GlowButton
                  label="Get in Touch"
                  onClick={() => setIsContactModalOpen(true)}
                  icon={Mail}
                />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
              <p>&copy; {new Date().getFullYear()} The Rack Hack. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Product Editor Modal */}
      {(editingProduct || isAddingProduct) && (
        <ProductEditor
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setEditingProduct(null);
            setIsAddingProduct(false);
          }}
        />
      )}
    </div>
  );
};

export default ClothingStore;