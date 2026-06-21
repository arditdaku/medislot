import { toast } from 'sonner';

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const info = (message: string) => {
    toast.info(message);
  };

  const warning = (message: string) => {
    toast.warning(message);
  };

  const loading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  };
};