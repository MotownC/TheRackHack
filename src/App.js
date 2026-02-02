import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Homepage from './pages/Homepage';
import ShopPage from './pages/ShopPage';
import AboutPage from './pages/AboutPage';
import ClothingStore from './ClothingStore';
import ItemDetail from './pages/ItemDetail';
import Login from './components/Login';
import Signup from './components/Signup';
import CheckoutPage from './pages/CheckoutPage';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <ClothingStore initialView="admin" />
              </ProtectedRoute>
            } 
          />
          <Route path="/cart" element={<ClothingStore initialView="cart" />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;