import { useEffect } from 'react';

export interface ToastProps {
  show: boolean;
  message: string | null;
  title?: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  show,
  message,
  title = 'Success',
  type = 'success',
  onClose,
  duration = 3500,
}: ToastProps) {
  useEffect(() => {
    if (!show || !message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [show, message, duration, onClose]);

  if (!show || !message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div
        className={`p-4 rounded-xl bg-[#1a1b20]/95 backdrop-blur-xl border shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex items-start gap-3 ${
          isSuccess
            ? 'border-[#4edea3]/50 shadow-[0_8px_30px_rgba(78,222,163,0.18)]'
            : isError
            ? 'border-[#ff5449]/50 shadow-[0_8px_30px_rgba(255,84,73,0.18)]'
            : 'border-[#ffb4a3]/50 shadow-[0_8px_30px_rgba(255,180,163,0.18)]'
        }`}
      >
        {/* Status Icon with glow */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
            isSuccess
              ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30 shadow-[0_0_12px_rgba(78,222,163,0.25)]'
              : isError
              ? 'bg-[#ff5449]/10 text-[#ff5449] border-[#ff5449]/30 shadow-[0_0_12px_rgba(255,84,73,0.25)]'
              : 'bg-[#ffb4a3]/10 text-[#ffb4a3] border-[#ffb4a3]/30 shadow-[0_0_12px_rgba(255,180,163,0.25)]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSuccess ? 'check_circle' : isError ? 'error' : 'info'}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="font-space font-bold text-xs text-[#e3e2e8] tracking-wide">
            {title}
          </h4>
          <p className="text-xs text-[#cbc3d7] font-sans mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="text-[#958ea0] hover:text-[#e3e2e8] hover:bg-[#292a2e] p-1 rounded-md transition-colors cursor-pointer shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
