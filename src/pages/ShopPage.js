import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ClothingStore from '../ClothingStore';

function ShopPage() {
  const location = useLocation();
  
  // Parse URL parameters to set initial filter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const condition = params.get('condition');
    
    // This will be handled by ClothingStore component
    // We'll pass it as a prop
  }, [location]);

 return <ClothingStore 
  initialView="shop" 
  initialConditionFilter={new URLSearchParams(location.search).get('condition') || 'all'} 
/>;
}

export default ShopPage;