import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-primary text-primary-foreground px-4 py-2 shadow-lg animate-in fade-in zoom-in">
      {message}
    </div>
  );
};

export { Toast };
