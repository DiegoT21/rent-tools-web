interface AdminUserLike {
  role?: string;
}

export function isAdminUser(user: AdminUserLike | null | undefined): boolean {
  return user?.role === 'admin';
}

export function getAdminAccessMessage(user: AdminUserLike | null | undefined): string | null {
  if (!user) return 'Debes iniciar sesión para acceder al panel de administración.';
  if (user.role !== 'admin') {
    return 'Tu cuenta no tiene rol admin en el servidor. Ejecuta promote-user-to-admin.ts con tu email, cierra sesión y vuelve a entrar.';
  }
  return null;
}

export function formatApiError(err: unknown): string {
  const anyErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = anyErr.response?.status;
  const msg = anyErr.response?.data?.message || anyErr.message || 'Error desconocido';
  if (status === 403) {
    return `${msg} (403 — verifica que tu usuario tenga role: admin en MongoDB)`;
  }
  if (status === 401) return `${msg} (401 — vuelve a iniciar sesión)`;
  return msg;
}
