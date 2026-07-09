import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { DisputeThread } from '../components/rentals/DisputeThread';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldAlert,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { AdminCatalogTab } from '@/components/admin/AdminCatalogTab';
import { AdminListingsTab } from '@/components/admin/AdminListingsTab';
import { AdminEditUserDialog } from '@/components/admin/AdminEditUserDialog';
import { isAdminUser, getAdminAccessMessage, formatApiError } from '@/lib/isAdmin';
import { adminService } from '@/services/adminService';
import Swal from 'sweetalert2';
import { Pencil, Trash2 } from 'lucide-react';


interface UserItem {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accountStatus: string;
  kycStatus: string;
  createdAt: string;
}

interface AuditAction {
  _id: string;
  action: string;
  targetModel?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditGroup {
  user?: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  actions: AuditAction[];
  lastActivity: string;
  totalActions: number;
}

interface ActiveChat {
  latestMessage: string;
  latestMessageAt: string;
  user: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SupportMessage {
  _id: string;
  user: string;
  sender: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  isAdminSender: boolean;
  message: string;
  createdAt: string;
}

export function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'users') as 'users' | 'audit' | 'chat' | 'disputes' | 'catalog' | 'listings';
  const [apiError, setApiError] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  // Tab 1: Users
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersAccountStatus, setUsersAccountStatus] = useState('');
  const [usersKycStatus, setUsersKycStatus] = useState('');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Tab 2: Audit search
  const [auditSearch, setAuditSearch] = useState('');

  // Tab 2: Audit
  const [auditList, setAuditList] = useState<AuditGroup[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedUserKey, setExpandedUserKey] = useState<string | null>(null);

  // Tab 3: Chats
  const [chatsList, setChatsList] = useState<ActiveChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<ActiveChat['user'] | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Tab 4: Disputes
  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [disputesPage, setDisputesPage] = useState(1);
  const [disputesTotalPages, setDisputesTotalPages] = useState(1);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesSearch, setDisputesSearch] = useState('');
  const [disputesStatus, setDisputesStatus] = useState('');
  const [expandedDisputeUuid, setExpandedDisputeUuid] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState<{ uuid: string; status: string; resolution: string } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [disputeDetails, setDisputeDetails] = useState<Record<string, any>>({});
  const [disputeDetailsLoading, setDisputeDetailsLoading] = useState<Record<string, boolean>>({});
  const [disputesError, setDisputesError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const loadUsers = async (page = 1, overrides?: { search?: string; role?: string; accountStatus?: string; kycStatus?: string }) => {
    setUsersLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      const search = overrides?.search ?? usersSearch;
      const role = overrides?.role ?? usersRole;
      const accountStatus = overrides?.accountStatus ?? usersAccountStatus;
      const kycStatus = overrides?.kycStatus ?? usersKycStatus;
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (accountStatus) params.set('accountStatus', accountStatus);
      if (kycStatus) params.set('kycStatus', kycStatus);
      const res = await api.get(`/users/admin/list?${params}`);
      if (res.data.success) {
        setUsersList(res.data.data.items ?? []);
        setUsersTotalPages(res.data.data.pagination.totalPages);
        setUsersPage(page);
      }
    } catch (err) {
      setApiError(formatApiError(err));
      setUsersList([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAuditLogs = async (page = 1, overrideSearch?: string) => {
    setAuditLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      const search = overrideSearch ?? auditSearch;
      if (search) params.set('search', search);
      const res = await api.get(`/users/admin/audit?${params}`);
      if (res.data.success) {
        setAuditList(res.data.data.items ?? []);
        setAuditTotalPages(res.data.data.pagination.totalPages);
        setAuditPage(page);
      }
    } catch (err) {
      setApiError(formatApiError(err));
      setAuditList([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadDisputes = async (page = 1, overrides?: { search?: string; status?: string }) => {
    setDisputesLoading(true);
    setDisputesError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      const search = overrides?.search ?? disputesSearch;
      const status = overrides?.status ?? disputesStatus;
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api.get(`/disputes/admin/list?${params}`);
      if (res.data.success) {
        setDisputesList(res.data.data?.items ?? []);
        setDisputesTotalPages(res.data.data?.pagination?.totalPages ?? 1);
        setDisputesPage(page);
      } else {
        setDisputesList([]);
        setDisputesError('No se pudo cargar el listado de disputas.');
      }
    } catch (err) {
      setDisputesList([]);
      setDisputesError(formatApiError(err));
    } finally {
      setDisputesLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!resolveForm) return;
    setResolving(true);
    try {
      await api.patch(`/disputes/admin/${resolveForm.uuid}`, {
        status: resolveForm.status,
        resolution: resolveForm.resolution || undefined,
      });
      setResolveForm(null);
      loadDisputes(disputesPage);
    } catch (err) {
      console.error('Error resolving dispute:', err);
    } finally {
      setResolving(false);
    }
  };

  const loadDisputeDetail = async (disputeUuid: string) => {
    if (disputeDetails[disputeUuid] || disputeDetailsLoading[disputeUuid]) return;
    setDisputeDetailsLoading((prev) => ({ ...prev, [disputeUuid]: true }));
    try {
      const res = await api.get(`/disputes/admin/detail/${disputeUuid}`);
      if (res.data.success) {
        setDisputeDetails((prev) => ({ ...prev, [disputeUuid]: res.data.data }));
      }
    } catch (err) {
      console.error('Error loading dispute detail:', err);
    } finally {
      setDisputeDetailsLoading((prev) => ({ ...prev, [disputeUuid]: false }));
    }
  };


  const loadActiveChats = async () => {
    setChatsLoading(true);
    setApiError(null);
    try {
      const res = await api.get('/support/admin/chats');
      if (res.data.success) {
        setChatsList(res.data.data ?? []);
      }
    } catch (err) {
      setApiError(formatApiError(err));
      setChatsList([]);
    } finally {
      setChatsLoading(false);
    }
  };

  const loadChatMessages = async (userUuid: string, showLoader = false) => {
    if (showLoader) setChatLoading(true);
    try {
      const res = await api.get(`/support/admin/chats/${userUuid}`);
      if (res.data.success) {
        setChatMessages(res.data.data);
      }
    } catch (err) {
      setApiError(formatApiError(err));
    } finally {
      if (showLoader) setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile().finally(() => setProfileReady(true));
  }, [fetchProfile]);

  useEffect(() => {
    if (!profileReady || !isAdminUser(user)) return;
    if (activeTab === 'users') loadUsers(1);
    else if (activeTab === 'audit') loadAuditLogs(1);
    else if (activeTab === 'chat') loadActiveChats();
    else if (activeTab === 'disputes') loadDisputes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profileReady, user?.role]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'chat' && selectedChatUser) {
      interval = setInterval(() => {
        loadChatMessages(selectedChatUser.uuid, false);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedChatUser]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const accessMessage = getAdminAccessMessage(user);

  if (!profileReady) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
        Verificando permisos de administrador...
      </div>
    );
  }

  if (!user || !isAdminUser(user)) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-8 bg-white border border-red-100 rounded-2xl shadow-xl text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500">{accessMessage ?? 'Esta sección es de uso exclusivo para administradores del sistema.'}</p>
      </div>
    );
  }

  const handleEditUser = (usr: UserItem) => {
    setEditingUser(usr);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = async (usr: UserItem) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar usuario',
      html: `¿Eliminar <strong>${usr.email}</strong>? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Eliminar',
    });
    if (!isConfirmed) return;
    try {
      await adminService.deleteUser(usr.uuid);
      await Swal.fire('Eliminado', 'Usuario eliminado.', 'success');
      loadUsers(usersPage);
    } catch (err) {
      await Swal.fire('Error', formatApiError(err), 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatUser || newMessage.trim() === '') return;

    try {
      const res = await api.post(`/support/admin/chats/${selectedChatUser.uuid}`, {
        message: newMessage,
      });
      if (res.data.success) {
        setChatMessages((prev) => [...prev, res.data.data]);
        setNewMessage('');
        loadActiveChats(); // Reload list to update latest message status
      }
    } catch (err) {
      console.error("Error sending response message:", err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-8 sm:pb-12">
      {apiError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}
      <div className="mb-4 flex flex-col items-start justify-between border-b border-slate-100 pb-4 sm:mb-6 sm:flex-row sm:items-center sm:pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight sm:text-3xl">Panel de Administración</h1>
          <p className="text-slate-500 mt-1">Supervisión general, registros de auditoría y soporte de usuarios.</p>
        </div>
      </div>

      <AdminEditUserDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSaved={() => loadUsers(usersPage)}
      />

{/* Tab: Users */}
      {activeTab === 'users' && (
        <Card className="shadow-lg border-slate-100 overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800">Usuarios Registrados</CardTitle>
            <button
              onClick={() => loadUsers(usersPage)}
              className="text-slate-500 hover:text-slate-800 transition-colors p-1"
            >
              <RefreshCw className={`w-5 h-5 ${usersLoading ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:flex-wrap">
              <input
                type="text"
                value={usersSearch}
                placeholder="Buscar por nombre o email..."
                onChange={(e) => setUsersSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                className="w-full min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 sm:flex-1 sm:min-w-[200px]"
              />
              <select
                value={usersRole}
                onChange={(e) => { setUsersRole(e.target.value); loadUsers(1, { role: e.target.value }); }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-600 sm:w-auto"
              >
                <option value="">Todos los roles</option>
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={usersAccountStatus}
                onChange={(e) => { setUsersAccountStatus(e.target.value); loadUsers(1, { accountStatus: e.target.value }); }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-600 sm:w-auto"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
                <option value="blocked">Bloqueado</option>
              </select>
              <select
                value={usersKycStatus}
                onChange={(e) => { setUsersKycStatus(e.target.value); loadUsers(1, { kycStatus: e.target.value }); }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-600 sm:w-auto"
              >
                <option value="">Todos los KYC</option>
                <option value="pending">Pendiente</option>
                <option value="in_review">En revisión</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
              <button
                onClick={() => loadUsers(1)}
                className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors sm:w-auto"
              >
                Buscar
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mr-3 text-slate-300" />
                Cargando listado de usuarios...
              </div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                {apiError ? 'Error al cargar usuarios. Revisa el mensaje arriba.' : 'No hay usuarios registrados en el sistema.'}
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {usersList.map((usr) => (
                    <div key={usr.uuid} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800">{usr.firstName} {usr.lastName}</div>
                          <div className="mt-1 break-all text-sm text-slate-500">{usr.email}</div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditUser(usr)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(usr)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={usr.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'} variant={undefined}>
                          {usr.role.toUpperCase()}
                        </Badge>
                        <Badge className={usr.accountStatus === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'} variant={undefined}>
                          {usr.accountStatus.toUpperCase()}
                        </Badge>
                        <Badge className={usr.kycStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                          usr.kycStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'} variant={undefined}>
                          KYC {usr.kycStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400">
                        Registro: {new Date(usr.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-4 px-4">Usuario</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Rol</th>
                      <th className="py-4 px-4">Estado Cuenta</th>
                      <th className="py-4 px-4">Estado KYC</th>
                      <th className="py-4 px-4">Registro</th>
                      <th className="py-4 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr) => (
                      <tr key={usr.uuid} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-700">
                          {usr.firstName} {usr.lastName}
                        </td>
                        <td className="py-4 px-4 text-slate-500">{usr.email}</td>
                        <td className="py-4 px-4">
                          <Badge className={usr.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'} variant={undefined}>
                            {usr.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={usr.accountStatus === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'} variant={undefined}>
                            {usr.accountStatus.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={usr.kycStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                            usr.kycStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'} variant={undefined}>
                            {usr.kycStatus.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-sm">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditUser(usr)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(usr)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {usersTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      disabled={usersPage <= 1}
                      onClick={() => loadUsers(usersPage - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-sm"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-500 px-2">
                      Página {usersPage} de {usersTotalPages}
                    </span>
                    <button
                      disabled={usersPage >= usersTotalPages}
                      onClick={() => loadUsers(usersPage + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
                </div>

                {usersTotalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2 md:hidden">
                    <button
                      disabled={usersPage <= 1}
                      onClick={() => loadUsers(usersPage - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-500 px-2">
                      Página {usersPage} de {usersTotalPages}
                    </span>
                    <button
                      disabled={usersPage >= usersTotalPages}
                      onClick={() => loadUsers(usersPage + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <Card className="shadow-lg border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">Registros de Auditoría</CardTitle>
            <button
              onClick={() => loadAuditLogs(auditPage)}
              className="text-slate-500 hover:text-slate-800 transition-colors p-1"
            >
              <RefreshCw className={`w-5 h-5 ${auditLoading ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                value={auditSearch}
                placeholder="Buscar usuario por nombre o email..."
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs(1)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              <button
                onClick={() => loadAuditLogs(1)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Buscar
              </button>
            </div>

            {auditLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mr-3 text-slate-300" />
                Cargando registros...
              </div>
            ) : auditList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                No hay registros de auditoría en la base de datos.
              </div>
            ) : (
              <div className="space-y-3">
                {auditList.map((group, idx) => {
                  const key = group.user?.uuid ?? `anon-${idx}`;
                  const isExpanded = expandedUserKey === key;
                  return (
                    <div key={key} className="border border-slate-100 rounded-xl overflow-hidden">
                      {/* User row — click to expand */}
                      <button
                        onClick={() => setExpandedUserKey(isExpanded ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                            {group.user
                              ? `${group.user.firstName[0]}${group.user.lastName[0]}`.toUpperCase()
                              : '?'}
                          </div>
                          <div>
                            {group.user ? (
                              <>
                                <div className="font-semibold text-slate-800 text-sm">
                                  {group.user.firstName} {group.user.lastName}
                                  {group.user.role === 'admin' && (
                                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">ADMIN</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">{group.user.email}</div>
                              </>
                            ) : (
                              <div className="font-semibold text-slate-500 text-sm italic">Sistema / Anónimo</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">
                              {group.totalActions} {group.totalActions === 1 ? 'acción' : 'acciones'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Última: {new Date(group.lastActivity).toLocaleString()}
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </div>
                      </button>

                      {/* Actions list */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/40 divide-y divide-slate-100">
                          {group.actions.map((action) => (
                            <div key={action._id} className="px-5 py-3 flex flex-wrap items-start gap-3">
                              <span className="font-mono text-xs px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                                {action.action}
                              </span>
                              {action.targetModel && (
                                <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[10px]" variant={undefined}>
                                  {action.targetModel}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-400 whitespace-nowrap ml-auto">
                                {action.ip && `IP: ${action.ip} · `}{new Date(action.createdAt).toLocaleString()}
                              </span>
                              {action.details && Object.keys(action.details).length > 0 && (
                                <div className="w-full mt-1">
                                  <pre className="bg-slate-900 text-green-400 text-[10px] font-mono rounded-lg p-3 overflow-x-auto">
                                    {JSON.stringify(action.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination */}
                {auditTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      disabled={auditPage <= 1}
                      onClick={() => loadAuditLogs(auditPage - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-500 px-2">
                      Página {auditPage} de {auditTotalPages}
                    </span>
                    <button
                      disabled={auditPage >= auditTotalPages}
                      onClick={() => loadAuditLogs(auditPage + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Disputes */}
      {activeTab === 'disputes' && (
        <Card className="shadow-lg border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">Gestión de Disputas</CardTitle>
            <button onClick={() => loadDisputes(disputesPage)} className="text-slate-500 hover:text-slate-800 p-1">
              <RefreshCw className={`w-5 h-5 ${disputesLoading ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <input
                type="text"
                value={disputesSearch}
                placeholder="Buscar por usuario..."
                onChange={(e) => setDisputesSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDisputes(1)}
                className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              <select
                value={disputesStatus}
                onChange={(e) => { setDisputesStatus(e.target.value); loadDisputes(1, { status: e.target.value }); }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-white text-slate-600"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierta</option>
                <option value="under_review">En revisión</option>
                <option value="closed">Cerrada</option>
              </select>
              <button onClick={() => loadDisputes(1)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Buscar
              </button>
            </div>

            {disputesError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{disputesError}</span>
              </div>
            )}

            {disputesLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mr-3 text-slate-300" />Cargando disputas...
              </div>
            ) : disputesList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                {disputesError ? 'No se pudieron cargar las disputas.' : 'No hay disputas registradas.'}
              </div>
            ) : (
              <div className="space-y-3">
                {disputesList.map((d: any) => {
                  const isExpanded = expandedDisputeUuid === d.uuid;
                  const statusColors: Record<string, string> = {
                    open: 'bg-amber-50 text-amber-600 border-amber-100',
                    under_review: 'bg-blue-50 text-blue-600 border-blue-100',
                    closed: 'bg-green-50 text-green-700 border-green-100',
                  };
                  const statusLabels: Record<string, string> = {
                    open: 'Abierta', under_review: 'En revisión', closed: 'Cerrada',
                  };
                  return (
                    <div key={d.uuid} className="border border-slate-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          const next = isExpanded ? null : d.uuid;
                          setExpandedDisputeUuid(next);
                          if (next) loadDisputeDetail(next);
                        }}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">
                              {d.reportedBy?.firstName} {d.reportedBy?.lastName}
                              <span className="text-slate-400 font-normal mx-1">vs</span>
                              {d.against?.firstName} {d.against?.lastName}
                            </div>
                            <div className="text-xs text-slate-400 capitalize">{d.reason?.replace(/_/g, ' ')} · {new Date(d.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`text-xs ${statusColors[d.status] ?? 'bg-slate-100 text-slate-500'}`} variant={undefined}>
                            {statusLabels[d.status] ?? d.status}
                          </Badge>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-5">
                          {/* Resumen caso cerrado */}
                          {d.status === 'closed' && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Caso cerrado</span>
                                {d.resolvedAt && <span className="text-xs text-green-500">· {new Date(d.resolvedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                              </div>
                              {d.resolution && <p className="text-sm text-green-900">{d.resolution}</p>}
                              {d.resolvedBy && (
                                <div className="text-xs text-green-600">
                                  Gestionado por {d.resolvedBy.firstName} {d.resolvedBy.lastName}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-sm text-slate-700">{d.description}</p>

                          {/* Chat de disputa */}
                          <DisputeThread
                            disputeUuid={d.uuid}
                            title="Conversación de disputa"
                            subtitle="Habla con las partes y adjunta fotos desde aquí."
                            compact
                          />

                          {/* Evidence comparison */}
                          {disputeDetailsLoading[d.uuid] ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando evidencias...
                            </div>
                          ) : disputeDetails[d.uuid] ? (() => {
                            const detail = disputeDetails[d.uuid];
                            const deliveryEvs: any[] = detail.evidences?.delivery ?? [];
                            const returnEvs: any[] = detail.evidences?.return ?? [];
                            const disputePhotos: string[] = detail.disputePhotos ?? [];
                            return (
                              <div className="space-y-4">
                                {/* Fotos adjuntas al abrir la disputa */}
                                {disputePhotos.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Fotos de la Disputa</div>
                                    <div className="bg-white border border-rose-100 rounded-xl p-4">
                                      <div className="text-xs font-semibold text-rose-700 mb-3">Evidencias adjuntadas al reportar</div>
                                      <div className="grid grid-cols-3 gap-1.5">
                                        {disputePhotos.map((url: string, i: number) => (
                                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                            <img
                                              src={url}
                                              alt={`Evidencia disputa ${i + 1}`}
                                              className="w-full aspect-square object-cover rounded-lg border border-slate-100 hover:opacity-90 transition-opacity"
                                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Comparación entrega vs devolución */}
                                <div>
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Comparación de Evidencias</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                      { label: 'Evidencias de Entrega', list: deliveryEvs, color: 'blue' },
                                      { label: 'Evidencias de Devolución', list: returnEvs, color: 'amber' },
                                    ].map(({ label, list, color }) => (
                                      <div key={label} className={`bg-white border border-${color}-100 rounded-xl p-4`}>
                                        <div className={`text-xs font-semibold text-${color}-700 mb-3`}>{label}</div>
                                        {list.length === 0 ? (
                                          <p className="text-xs text-slate-400">Sin evidencias registradas.</p>
                                        ) : list.map((ev: any) => (
                                          <div key={ev.uuid} className="space-y-2 mb-3">
                                            <div className="grid grid-cols-3 gap-1.5">
                                              {ev.urls.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                  <img
                                                    src={url}
                                                    alt={`Foto ${i + 1}`}
                                                    className="w-full aspect-square object-cover rounded-lg border border-slate-100 hover:opacity-90 transition-opacity"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                  />
                                                </a>
                                              ))}
                                            </div>
                                            {ev.capturedAt && (
                                              <div className="text-[10px] text-slate-400">
                                                {new Date(ev.capturedAt).toLocaleString()}
                                                {ev.latitude != null && ` · GPS: ${ev.latitude?.toFixed(4)}, ${ev.longitude?.toFixed(4)}`}
                                                {ev.notes && <span> · {ev.notes}</span>}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })() : null}

                          {/* Gestión de disputa */}
                          {d.status === 'closed' ? null : resolveForm?.uuid === d.uuid ? (() => {
                            const rf = resolveForm!;
                            return (
                            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
                              <div className="text-sm font-semibold text-slate-700">Gestionar disputa</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setResolveForm((prev) => prev ? { ...prev, status: 'under_review' } : prev)}
                                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${rf.status === 'under_review' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                  En revisión
                                </button>
                                <button
                                  onClick={() => setResolveForm((prev) => prev ? { ...prev, status: 'closed' } : prev)}
                                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${rf.status === 'closed' ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                  Cerrar caso
                                </button>
                              </div>
                              {rf.status === 'closed' && (
                                <textarea
                                  value={rf.resolution}
                                  onChange={(e) => setResolveForm((prev) => prev ? { ...prev, resolution: e.target.value } : prev)}
                                  placeholder="Resumen de la resolución (mínimo 10 caracteres, quedará visible en el caso)..."
                                  rows={3}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                                />
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={handleResolveDispute}
                                  disabled={resolving || (rf.status === 'closed' && rf.resolution.trim().length < 10)}
                                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                  {resolving ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={() => setResolveForm(null)}
                                  className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                            );
                          })() : (
                            <button
                              onClick={() => setResolveForm({ uuid: d.uuid, status: d.status === 'open' ? 'under_review' : d.status, resolution: d.resolution ?? '' })}
                              className="px-4 py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              Gestionar disputa
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {disputesTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button disabled={disputesPage <= 1} onClick={() => loadDisputes(disputesPage - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm">Anterior</button>
                    <span className="text-sm text-slate-500 px-2">Página {disputesPage} de {disputesTotalPages}</span>
                    <button disabled={disputesPage >= disputesTotalPages} onClick={() => loadDisputes(disputesPage + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm">Siguiente</button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Support Chat */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)] min-h-[500px]">
          {/* Active Chats Sidebar */}
          <div className="lg:col-span-4 flex flex-col bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Conversaciones Activas
              </h2>
              <button
                onClick={loadActiveChats}
                className="text-slate-500 hover:text-slate-800 transition-colors p-1"
              >
                <RefreshCw className={`w-4 h-4 ${chatsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chatsLoading && chatsList.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Cargando chats...
                </div>
              ) : chatsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No hay chats de soporte activos.
                </div>
              ) : (
                chatsList.map((chat) => (
                  <button
                    key={chat.user.uuid}
                    onClick={() => {
                      setSelectedChatUser(chat.user);
                      loadChatMessages(chat.user.uuid, true);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-start gap-3 border ${selectedChatUser?.uuid === chat.user.uuid
                        ? 'bg-indigo-50/60 border-indigo-100'
                        : 'border-transparent hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                      {chat.user.firstName[0].toUpperCase()}
                      {chat.user.lastName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm truncate">
                          {chat.user.firstName} {chat.user.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(chat.latestMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{chat.latestMessage}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Active Chat Conversation Area */}
          <div className="lg:col-span-8 flex flex-col bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden">
            {selectedChatUser ? (
              <>
                {/* Chat Partner Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {selectedChatUser.firstName[0].toUpperCase()}
                      {selectedChatUser.lastName[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {selectedChatUser.firstName} {selectedChatUser.lastName}
                      </h3>
                      <p className="text-xs text-slate-400">{selectedChatUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadChatMessages(selectedChatUser.uuid, false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title="Actualizar chat"
                  >
                    <RefreshCw className={`w-4.5 h-4.5 ${chatLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Messages List Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                  {chatLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      Cargando mensajes...
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Comienza la conversación con {selectedChatUser.firstName}.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.isAdminSender;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`p-3 rounded-2xl text-sm ${isMe
                                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                                }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Send Reply Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Responder a ${selectedChatUser.firstName}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={newMessage.trim() === ''}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <MessageSquare className="w-16 h-16 text-slate-200 mb-3 animate-pulse" />
                <h3 className="font-bold text-slate-700 mb-1">Sin Conversación Seleccionada</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Selecciona una conversación del panel lateral para ver el historial y chatear con el usuario.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'catalog' && <AdminCatalogTab />}

      {activeTab === 'listings' && <AdminListingsTab />}
    </div>
  );
}
export default AdminDashboard;
