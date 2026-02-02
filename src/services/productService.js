import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection references
const productsCollection = collection(db, 'products');
const ordersCollection = collection(db, 'orders');
const aboutCollection = collection(db, 'about');

// PRODUCTS
export const getAllProducts = async () => {
  try {
    const snapshot = await getDocs(productsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(productsCollection, {
      ...productData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: new Date().toISOString()
    });
    return { id: productId, ...productData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// ORDERS
export const getAllOrders = async () => {
  try {
    const snapshot = await getDocs(ordersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
};

export const addOrder = async (orderData) => {
  try {
    const docRef = await addDoc(ordersCollection, orderData);
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

// ABOUT PAGE
export const getAboutContent = async () => {
  try {
    const snapshot = await getDocs(aboutCollection);
    if (snapshot.empty) {
      return { 
        title: 'Our Story', 
        content: 'Welcome to The Rack Hack!' 
      };
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting about content:', error);
    return { title: '', content: '' };
  }
};

export const saveAboutContent = async (aboutData) => {
  try {
    const aboutDocRef = doc(db, 'about', 'main');
    await setDoc(aboutDocRef, aboutData);
    return aboutData;
  } catch (error) {
    console.error('Error saving about content:', error);
    throw error;
  }
};