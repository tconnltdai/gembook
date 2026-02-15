
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../types';

interface ToastProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastType; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const styles = {
    success: 'bg-white border-l-4 border-emerald-500 text-slate-800 ring-1 ring-slate-900/5',
    error: 'bg-white border-l-4 border-rose-500 text-slate-800 ring-1 ring-slate-900/5',
    info: 'bg-slate-800 border-l-4 border-indigo-500 text-white shadow-xl'
  };

  const icons = {
    success: <CheckCircle size={20} className="text-emerald-500" />,
    error: <AlertCircle size={20} className="text-rose-500" />,
    info: <Info size={20} className="text-indigo-400" />
  };

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded shadow-lg min-w-[300px] max-w-md pointer-events-auto
      transform transition-all duration-300 ease-out translate-y-0 opacity-100
      animate-in slide-in-from-right-8 fade-in
      ${styles[toast.type]}
    `}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 mr-2">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
