"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        ${type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
          : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }
      `}>
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
        <p className="font-medium">{message}</p>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="ml-4 h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}