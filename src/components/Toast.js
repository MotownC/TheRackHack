import React, { useEffect, useState } from 'react';
import { ShoppingCart, X } from 'lucide-react';

function Toast({ message, action, duration = 3000, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => setVisible(false), duration - 300);
    const remove = setTimeout(() => onDismiss(), duration);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [onDismiss, duration]);

  const dismiss = () => { setVisible(false); setTimeout(onDismiss, 300); };

  return (
    <div
      className={`flex items-center gap-3 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <ShoppingCart size={18} className="text-rose-400 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); dismiss(); }}
          className="ml-1 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-colors"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={dismiss}
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
          <Toast message={t.message} action={t.action} duration={t.duration} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}

let _nextId = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, options = {}) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, message, ...options }]);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}
