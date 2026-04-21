import React, { useEffect, useState } from 'react';
import { ShoppingCart, X } from 'lucide-react';

function Toast({ message, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = setTimeout(() => setVisible(true), 10);
    // Begin exit animation
    const hide = setTimeout(() => setVisible(false), 2700);
    // Remove from DOM after exit
    const remove = setTimeout(() => onDismiss(), 3000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <ShoppingCart size={18} className="text-rose-400 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        className="ml-1 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}

let _nextId = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, message }]);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}
