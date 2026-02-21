import React, { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import CloudinaryUpload from './CloudinaryUpload';
import GlamourGenerator from './GlamourGenerator';

function ProductEditor({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    size: product?.size || '',
    price: product?.price || '',
    stock: product?.stock || '',
    category: product?.category || 'Tops',
    gender: product?.gender || 'mens',
    condition: product?.condition || 'new',
    image: product?.image || '',
    image2: product?.image2 || '',
    image3: product?.image3 || ''
  });

  const [glamourSlot, setGlamourSlot] = useState(null);

  const handleImageUpload = (imageUrl, imageNumber) => {
    const imageKey = imageNumber === 1 ? 'image' : `image${imageNumber}`;
    setFormData({ ...formData, [imageKey]: imageUrl });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...product,
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image 1 Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Product Image 1 (Main) *
              </label>
              <button
                type="button"
                onClick={() => setGlamourSlot(1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Generate
              </button>
            </div>
            <CloudinaryUpload
              currentImage={formData.image}
              onUploadSuccess={(url) => handleImageUpload(url, 1)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Or paste an image URL below
            </p>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border rounded-lg mt-2 text-sm"
            />
          </div>

          {/* Image 2 Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Product Image 2 (Optional)
              </label>
              <button
                type="button"
                onClick={() => setGlamourSlot(2)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Generate
              </button>
            </div>
            <CloudinaryUpload
              currentImage={formData.image2}
              onUploadSuccess={(url) => handleImageUpload(url, 2)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Or paste an image URL below
            </p>
            <input
              type="text"
              value={formData.image2}
              onChange={(e) => setFormData({ ...formData, image2: e.target.value })}
              placeholder="https://example.com/image2.jpg"
              className="w-full px-3 py-2 border rounded-lg mt-2 text-sm"
            />
          </div>

          {/* Image 3 Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Product Image 3 (Optional)
              </label>
              <button
                type="button"
                onClick={() => setGlamourSlot(3)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Generate
              </button>
            </div>
            <CloudinaryUpload
              currentImage={formData.image3}
              onUploadSuccess={(url) => handleImageUpload(url, 3)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Or paste an image URL below
            </p>
            <input
              type="text"
              value={formData.image3}
              onChange={(e) => setFormData({ ...formData, image3: e.target.value })}
              placeholder="https://example.com/image3.jpg"
              className="w-full px-3 py-2 border rounded-lg mt-2 text-sm"
            />
          </div>

          {/* Glamour Generator Modal */}
          {glamourSlot && (
            <GlamourGenerator
              currentImage={
                glamourSlot === 1 ? formData.image :
                glamourSlot === 2 ? formData.image2 :
                formData.image3
              }
              onImageGenerated={(url) => handleImageUpload(url, glamourSlot)}
              onClose={() => setGlamourSlot(null)}
            />
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Men's Denim Jacket"
            />
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Describe the item condition, features, brand, etc."
              rows="4"
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional - Add details about the item's condition, brand, style, or any special features
            </p>
          </div>

          {/* Size and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Size *
              </label>
              <input
                type="text"
                required
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., L, M, 32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="29.99"
              />
            </div>
          </div>

          {/* Stock and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Dresses">Dresses</option>
                <option value="Outerwear">Outerwear</option>
              </select>
            </div>
          </div>

          {/* Gender and Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="mens">Men's</option>
                <option value="womens">Women's</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="new">New</option>
                <option value="used">Pre-Owned</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Product
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductEditor;