import React from 'react';
import { useLocation } from 'react-router-dom';
import ClothingStore from '../ClothingStore';

function ShopPage() {
  const location = useLocation();

 return <ClothingStore
  initialView="shop"
  initialConditionFilter={new URLSearchParams(location.search).get('condition') || 'all'}
/>;
}

export default ShopPage;