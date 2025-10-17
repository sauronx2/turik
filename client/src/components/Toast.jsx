import { useState, useEffect } from 'react';

let toastTimeout = null;

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeout) clearTimeout(toastTimeout);
    
    setToast({ message, type });
    
    toastTimeout = setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const showSuccess = (message) => showToast(message, 'success');
  const showError = (message) => showToast(message, 'error');
  const showInfo = (message) => showToast(message, 'info');
  const showWarning = (message) => showToast(message, 'warning');

  return { toast, showToast, showSuccess, showError, showInfo, showWarning };
}

function Toast({ toast }) {
  if (!toast) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slideInRight">
      <div className={`${colors[toast.type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
        <span className="text-2xl">{icons[toast.type]}</span>
        <span className="flex-1 font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

export default Toast;

