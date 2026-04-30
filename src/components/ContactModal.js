import React, { useState } from 'react';
import { X, Mail, Send } from 'lucide-react';
import GlowButton from './GlowButton';

function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: '',
    message: ''
  });
  const [status, setStatus] = useState(''); // 'sending', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Server error');

      setStatus('success');
      setFormData({ from_name: '', from_email: '', message: '' });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('Email error:', error);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-8 h-8 text-rose-700" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Contact Us</h2>
            <p className="text-sm text-slate-600">We typically reply within 24 hours.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.from_name}
              onChange={(e) => setFormData({...formData, from_name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.from_email}
              onChange={(e) => setFormData({...formData, from_email: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message *
            </label>
            <textarea
              required
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 resize-none"
              placeholder="How can we help you?"
            />
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
              ✓ Message sent successfully!
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              Couldn't send your message. Please check your connection and try again.
            </div>
          )}

          {/* Submit Button */}
          <GlowButton
            type="submit"
            label={status === 'sending' ? 'Sending...' : 'Send Message'}
            disabled={status === 'sending'}
            icon={Send}
            showIcon={status !== 'sending'}
            className="glow-btn-full"
          />
        </form>
      </div>
    </div>
  );
}

export default ContactModal;