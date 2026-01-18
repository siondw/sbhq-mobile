import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import Toast, { type ToastType } from '../../ui/components/Toast';

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'warning',
    visible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'warning') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
};
