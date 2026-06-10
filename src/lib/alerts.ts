import Swal from "sweetalert2";

const brand = {
  confirm: "#f97316",
  cancel: "#0f172a",
};

/** Radix Dialog marca el resto del DOM como inert; SweetAlert queda bloqueado sin esto. */
function unlockSwalInteraction() {
  const container = Swal.getContainer();
  if (!container) return;
  container.style.zIndex = "999999";
  container.inert = false;
  container.querySelectorAll<HTMLElement>("[inert]").forEach((el) => {
    el.inert = false;
  });
}

const baseConfig = {
  confirmButtonText: "OK",
  returnFocus: false,
  heightAuto: false,
  didOpen: unlockSwalInteraction,
} as const;

export const alerts = {
  success: (title: string, text?: string) =>
    Swal.fire({
      ...baseConfig,
      icon: "success",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  error: (title: string, text?: string) =>
    Swal.fire({
      ...baseConfig,
      icon: "error",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  info: (title: string, text?: string) =>
    Swal.fire({
      ...baseConfig,
      icon: "info",
      title,
      text,
      confirmButtonColor: brand.confirm,
    }),

  warning: (title: string, text?: string) =>
    Swal.fire({
      ...baseConfig,
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
      returnFocus: false,
    }),

  confirm: async (opts: { title: string; text?: string; confirmText?: string; cancelText?: string }) => {
    const result = await Swal.fire({
      ...baseConfig,
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
