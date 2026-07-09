import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { adminService, type AdminUserUpdatePayload } from "@/services/adminService";
import { formatApiError } from "@/lib/isAdmin";
import { alerts } from "@/lib/alerts";
import { Mail, Shield, UserCog } from "lucide-react";

export interface AdminUserRow {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accountStatus: string;
  kycStatus: string;
}

interface Props {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const roleOptions = [
  { value: "user", label: "Usuario", hint: "Acceso estándar a la plataforma." },
  { value: "admin", label: "Administrador", hint: "Acceso al panel de administración." },
] as const;

const accountOptions = [
  { value: "active", label: "Activo", hint: "Puede iniciar sesión y usar la app." },
  { value: "suspended", label: "Suspendido", hint: "Cuenta temporalmente restringida." },
  { value: "blocked", label: "Bloqueado", hint: "Sin acceso hasta revisión manual." },
] as const;

const kycOptions = [
  { value: "pending", label: "Pendiente", hint: "Aún no completa verificación." },
  { value: "in_review", label: "En revisión", hint: "Documentos enviados, pendiente de revisión." },
  { value: "approved", label: "Aprobado", hint: "Identidad verificada." },
  { value: "rejected", label: "Rechazado", hint: "Debe volver a enviar documentación." },
] as const;

function selectClassName() {
  return "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
}

export function AdminEditUserDialog({ user, open, onOpenChange, onSaved }: Props) {
  const [role, setRole] = React.useState<"user" | "admin">("user");
  const [accountStatus, setAccountStatus] = React.useState<"active" | "suspended" | "blocked">("active");
  const [kycStatus, setKycStatus] = React.useState<"pending" | "in_review" | "approved" | "rejected">("pending");
  const [isVerified, setIsVerified] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setRole(user.role === "admin" ? "admin" : "user");
    setAccountStatus(
      user.accountStatus === "suspended" || user.accountStatus === "blocked"
        ? user.accountStatus
        : "active",
    );
    setKycStatus(
      user.kycStatus === "in_review" || user.kycStatus === "approved" || user.kycStatus === "rejected"
        ? user.kycStatus
        : "pending",
    );
    setIsVerified(user.kycStatus === "approved");
  }, [user]);

  React.useEffect(() => {
    if (kycStatus === "approved") setIsVerified(true);
    if (kycStatus === "rejected" || kycStatus === "pending") setIsVerified(false);
  }, [kycStatus]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: AdminUserUpdatePayload = {
        role,
        accountStatus,
        kycStatus,
        isVerified,
      };
      await adminService.updateUser(user.uuid, payload);
      await alerts.success("Usuario actualizado", "Los cambios se guardaron correctamente.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      await alerts.error("No se pudo guardar", formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,100svh)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
            <DialogHeader className="pr-8">
              <DialogTitle className="text-left text-xl font-bold">Editar usuario</DialogTitle>
              <DialogDescription className="text-left">
                Actualiza rol, estado de cuenta y verificación KYC.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">{user.email}</span>
                  </div>
                </div>
              </div>
              <Badge className={`w-fit ${user.role === "admin" ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                {user.role}
              </Badge>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <Label className="flex items-center gap-1.5 text-slate-700">
                  <UserCog className="h-4 w-4 text-slate-400" />
                  Rol
                </Label>
                <select className={selectClassName()} value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")}>
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{roleOptions.find((o) => o.value === role)?.hint}</p>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 text-slate-700">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Estado de cuenta
                </Label>
                <select
                  className={selectClassName()}
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value as "active" | "suspended" | "blocked")}
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{accountOptions.find((o) => o.value === accountStatus)?.hint}</p>
              </div>

              <div>
                <Label className="text-slate-700">Estado KYC</Label>
                <select
                  className={selectClassName()}
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value as typeof kycStatus)}
                >
                  {kycOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{kycOptions.find((o) => o.value === kycStatus)?.hint}</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Identidad verificada</div>
                  <div className="text-xs text-slate-500">
                    Permite alquilar y publicar herramientas. Se activa automáticamente con KYC aprobado.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
