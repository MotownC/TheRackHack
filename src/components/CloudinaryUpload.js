import React, { useState } from 'react';
import { Upload } from 'lucide-react';

// Replace with YOUR Cloudinary cloud name
const CLOUD_NAME = 'dd2zdrc2z';
const UPLOAD_PRESET = 'rack_hack_preset'; // We'll create this in Cloudinary

function CloudinaryUpload({ onUploadSuccess, currentImage }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'rack-hack-products');

    try {
      setProgress(30);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      setProgress(80);
      const data = await response.json();
      
      if (data.secure_url) {
        setProgress(100);
        onUploadSuccess(data.secure_url);
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="space-y-3">
      {currentImage && (
        <div className="flex items-center gap-4">
          <img
            src={currentImage}
            alt="Current"
            className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setFullscreen(true)}
            title="Click to view fullscreen"
          />
          <div className="text-sm text-slate-600">
            Current image
          </div>
        </div>
      )}

      {fullscreen && currentImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={currentImage}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
      
      <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition ${
        uploading 
          ? 'border-blue-400 bg-blue-50 cursor-not-allowed' 
          : 'border-slate-300 bg-slate-50 cursor-pointer hover:border-blue-500'
      }`}>
        <Upload className={`w-5 h-5 ${uploading ? 'text-blue-500 animate-pulse' : 'text-slate-500'}`} />
        <span className="text-sm text-slate-600 font-medium">
          {uploading ? 'Uploading...' : currentImage ? 'Change Image' : 'Upload Image'}
        </span>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      
      {uploading && (
        <div className="space-y-1">
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">{progress}%</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <p className="text-xs text-slate-500">
        Supports JPG, PNG, GIF up to 10MB
      </p>
    </div>
  );
}

export default CloudinaryUpload;