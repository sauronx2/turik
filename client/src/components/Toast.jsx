import { useState, useEffect } from 'react';

let toastTimeout = null;

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info', details = null) => {
        if (toastTimeout) clearTimeout(toastTimeout);

        setToast({ message, type, details });

        toastTimeout = setTimeout(() => {
            setToast(null);
        }, 10000); // 10 seconds
    };

    const hideToast = () => {
        if (toastTimeout) clearTimeout(toastTimeout);
        setToast(null);
    };

    const showSuccess = (message, details) => showToast(message, 'success', details);
    const showError = (message, details) => showToast(message, 'error', details);
    const showInfo = (message, details) => showToast(message, 'info', details);
    const showWarning = (message, details) => showToast(message, 'warning', details);

    return { toast, showToast, showSuccess, showError, showInfo, showWarning, hideToast };
}

function Toast({ toast, onClose }) {
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
            <div className={`${colors[toast.type]} text-white px-6 py-4 rounded-lg shadow-lg min-w-[300px] max-w-md`}>
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{icons[toast.type]}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium break-words">{toast.message}</p>
                        {toast.details && (
                            <p className="text-sm opacity-90 mt-1 break-words">{toast.details}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-white hover:text-gray-200 transition ml-2 text-xl leading-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Toast;
