import Swal, { SweetAlertOptions } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export const MySwal = withReactContent(Swal);

// Color from tailwind.config.ts brand-blue
const BRAND_BLUE = '#023E8A';

export const swalConfig: SweetAlertOptions = {
  confirmButtonColor: BRAND_BLUE,
  cancelButtonColor: '#64748b',
  buttonsStyling: true,
  heightAuto: false, // Prevents body jump and potential interaction issues
  customClass: {
    popup:         'swal-popup',
    title:         'swal-title',
    htmlContainer: 'swal-html',
    confirmButton: 'swal-btn-confirm',
    cancelButton:  'swal-btn-cancel',
    denyButton:    'swal-btn-deny',
  },
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp animate__faster'
  }
};

export const swalToastConfig: SweetAlertOptions = {
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timerProgressBar: false,
  heightAuto: false,
  customClass: {
    popup: 'swal-toast-popup',
    title: 'swal-toast-title',
  },
};

// Success toast (top-end, auto-dismiss, no interaction needed)
export const toastSuccess = (message: string) =>
  MySwal.fire({
    ...swalToastConfig,
    icon: 'success',
    title: message,
    timer: 3000,
  });

// Error toast
export const toastError = (message: string) =>
  MySwal.fire({
    ...swalToastConfig,
    icon: 'error',
    title: message,
    timer: 4500,
  });

// Warning toast
export const toastWarning = (message: string) =>
  MySwal.fire({
    ...swalToastConfig,
    icon: 'warning',
    title: message,
    timer: 3500,
  });

// Info toast
export const toastInfo = (message: string) =>
  MySwal.fire({
    ...swalToastConfig,
    icon: 'info',
    title: message,
    timer: 3000,
  });

// Confirmation dialog — returns true if confirmed, false if cancelled
export const confirmDialog = async (
  title: string,
  text: string,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDangerous = false
): Promise<boolean> => {
  const result = await MySwal.fire({
    ...swalConfig,
    title,
    text,
    icon: isDangerous ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    confirmButtonColor: isDangerous ? '#dc2626' : BRAND_BLUE,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

// Prompt dialog — text input with validation
export const promptDialog = async (
  title: string,
  text: string,
  placeholder = 'Digite aqui...',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDangerous = false
): Promise<string | null> => {
  const result = await MySwal.fire({
    ...swalConfig,
    title,
    text,
    input: 'textarea',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    confirmButtonColor: isDangerous ? '#dc2626' : BRAND_BLUE,
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'Este campo é obrigatório.';
      }
      return null;
    },
  });

  if (result.isConfirmed && typeof result.value === 'string') {
    return result.value.trim();
  }
  return null;
};

// Loading dialog — call swalLoading() to show, MySwal.close() to hide
export const swalLoading = (message = 'Aguarde...') =>
  MySwal.fire({
    ...swalConfig,
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => MySwal.showLoading(),
  });

export default MySwal;
