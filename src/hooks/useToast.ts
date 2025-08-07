"use client";

import toast from 'react-hot-toast';

// =============================================================================
// TYPES
// =============================================================================

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// =============================================================================
// HOOK
// =============================================================================

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
    });
  };

  const showLoading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      position: options?.position || 'top-right',
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
      },
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, {
      position: options?.position || 'top-right',
    });
  };

  return {
    success: showSuccess,
    error: showError,
    loading: showLoading,
    info: showInfo,
    warning: showWarning,
    dismiss,
    promise,
  };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const formatApiError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  return 'An unexpected error occurred';
};

export default useToast;
