"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Map our size prop to max-width classes
  const sizeClasses = {
    'sm': 'sm:max-w-sm',
    'md': 'sm:max-w-lg',
    'lg': 'sm:max-w-2xl',
    'xl': 'sm:max-w-4xl',
    '2xl': 'sm:max-w-6xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}