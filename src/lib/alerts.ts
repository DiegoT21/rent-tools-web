import Swal from "sweetalert2";

const brand = {
  confirm: "#f97316", // orange-500
  cancel: "#0f172a", // slate-900
};

export const alerts = {
  success: (title: string, text?: string) =>
    Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  error: (title: string, text?: string) =>
    Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  info: (title: string, text?: string) =>
    Swal.fire({
      icon: "info",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  warning: (title: string, text?: string) =>
    Swal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  toast: (title: string, icon: "success" | "error" | "info" | "warning" = "info") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 2400,
      timerProgressBar: true,
    }),

  confirm: async (opts: { title: string; text?: string; confirmText?: string; cancelText?: string }) => {
    const result = await Swal.fire({
      icon: "question",
      title: opts.title,
      text: opts.text,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? "Continuar",
      cancelButtonText: opts.cancelText ?? "Cancelar",
      confirmButtonColor: brand.confirm,
      cancelButtonColor: brand.cancel,
      reverseButtons: true,
      focusCancel: true,
    });
    return result.isConfirmed;
  },
};
