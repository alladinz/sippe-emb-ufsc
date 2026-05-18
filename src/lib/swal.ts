import Swal, { SweetAlertOptions } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export const MySwal = withReactContent(Swal);

// Color from tailwind.config.ts brand-blue
const BRAND_BLUE = '#023E8A';

export const swalConfig: SweetAlertOptions = {
  confirmButtonColor: BRAND_BLUE,
  cancelButtonColor: '#6b7280',
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

// Success toast (top-end, auto-dismiss, no interaction needed)
export const toastSuccess = (message: string) =>
  MySwal.fire({
    ...swalConfig,
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

// Error toast
export const toastError = (message: string) =>
  MySwal.fire({
    ...swalConfig,
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });

// Warning toast
export const toastWarning = (message: string) =>
  MySwal.fire({
    ...swalConfig,
    toast: true,
    position: 'top-end',
    icon: 'warning',
    title: message,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  });

// Info toast
export const toastInfo = (message: string) =>
  MySwal.fire({
    ...swalConfig,
    toast: true,
    position: 'top-end',
    icon: 'info',
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
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
