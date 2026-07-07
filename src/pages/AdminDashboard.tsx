import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  History,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldAlert,
  User as UserIcon,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { AdminCatalogTab } from '@/components/admin/AdminCatalogTab';
import { AdminListingsTab } from '@/components/admin/AdminListingsTab';


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

interface AuditLogItem {
  _id: string;
  user?: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  targetModel?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
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
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'users') as 'users' | 'audit' | 'chat' | 'catalog' | 'listings';

  // Tab 1: Users
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  // Tab 2: Audit
  const [auditList, setAuditList] = useState<AuditLogItem[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Tab 3: Chats
  const [chatsList, setChatsList] = useState<ActiveChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<ActiveChat['user'] | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // Check role
  if (!user || (user.role !== 'admin' && user.email !== 'diegoorlando211170@gmail.com')) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-8 bg-white border border-red-100 rounded-2xl shadow-xl text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500">Esta sección es de uso exclusivo para administradores del sistema.</p>
      </div>
    );
  }

  // Load registered users
  const loadUsers = async (page = 1) => {
    setUsersLoading(true);
    try {
      const res = await api.get(`/users/admin/list?page=${page}&limit=10`);
      if (res.data.success) {
        setUsersList(res.data.data.items);
        setUsersTotalPages(res.data.data.pagination.totalPages);
        setUsersPage(page);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load audit logs
  const loadAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const res = await api.get(`/users/admin/audit?page=${page}&limit=15`);
      if (res.data.success) {
        setAuditList(res.data.data.items);
        setAuditTotalPages(res.data.data.pagination.totalPages);
        setAuditPage(page);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Load support chats list
  const loadActiveChats = async () => {
    setChatsLoading(true);
    try {
      const res = await api.get('/support/admin/chats');
      if (res.data.success) {
        setChatsList(res.data.data);
      }
    } catch (err) {
      console.error("Error loading support chats:", err);
    } finally {
      setChatsLoading(false);
    }
  };

  // Load support chat messages for selected user
  const loadChatMessages = async (userUuid: string, showLoader = false) => {
    if (showLoader) setChatLoading(true);
    try {
      const res = await api.get(`/support/admin/chats/${userUuid}`);
      if (res.data.success) {
        setChatMessages(res.data.data);
      }
    } catch (err) {
      console.error("Error loading messages for user:", err);
    } finally {
      if (showLoader) setChatLoading(false);
    }
  };

  // Send admin response message
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

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Initial tab loading
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers(1);
    } else if (activeTab === 'audit') {
      loadAuditLogs(1);
    } else if (activeTab === 'chat') {
      loadActiveChats();
    }
  }, [activeTab]);

  // Support chat auto polling (every 5 seconds when chat tab & a conversation is active)
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
  }, [activeTab, selectedChatUser]);

  return (
    <div className="mx-auto max-w-7xl px-2 pb-8 sm:px-4 sm:pb-12">
      <div className="mb-6 flex flex-col items-start justify-between border-b border-slate-100 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight sm:text-3xl">Panel de Administración</h1>
          <p className="text-slate-500 mt-1">Supervisión general, registros de auditoría y soporte de usuarios.</p>
        </div>
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <Card className="shadow-lg border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">Usuarios Registrados</CardTitle>
            <button
              onClick={() => loadUsers(usersPage)}
              className="text-slate-500 hover:text-slate-800 transition-colors p-1"
            >
              <RefreshCw className={`w-5 h-5 ${usersLoading ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mr-3 text-slate-300" />
                Cargando listado de usuarios...
              </div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                No hay usuarios registrados en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-4 px-4">Usuario</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Rol</th>
                      <th className="py-4 px-4">Estado Cuenta</th>
                      <th className="py-4 px-4">Estado KYC</th>
                      <th className="py-4 px-4">Registro</th>
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
            {auditLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mr-3 text-slate-300" />
                Cargando logs de auditoría...
              </div>
            ) : auditList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                No hay registros de auditoría registrados en la base de datos.
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                        <th className="py-4 px-4 w-10"></th>
                        <th className="py-4 px-4">Usuario</th>
                        <th className="py-4 px-4">Acción</th>
                        <th className="py-4 px-4">Modelo</th>
                        <th className="py-4 px-4">IP / Agente</th>
                        <th className="py-4 px-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditList.map((log) => {
                        const isExpanded = expandedLogId === log._id;
                        return (
                          <React.Fragment key={log._id}>
                            <tr
                              className={`border-b border-slate-100 hover:bg-slate-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/50' : ''
                                }`}
                              onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            >
                              <td className="py-4 px-4 text-center">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {log.user ? (
                                  <div>
                                    <div className="font-semibold text-slate-700">
                                      {log.user.firstName} {log.user.lastName}
                                    </div>
                                    <div className="text-xs text-slate-400">{log.user.email}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Invitado / Anon</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {log.targetModel ? (
                                  <Badge className="bg-purple-50 text-purple-600 border-purple-100 font-semibold" variant={undefined}>
                                    {log.targetModel}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-400">
                                <div>IP: {log.ip || 'N/D'}</div>
                                <div className="truncate max-w-[150px]">{log.userAgent || 'N/D'}</div>
                              </td>
                              <td className="py-4 px-4 text-slate-500 text-sm">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={6} className="py-4 px-8 border-b border-slate-100">
                                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-inner max-w-full overflow-x-auto">
                                    <div className="text-xs text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
                                      Detalles de la Petición
                                    </div>
                                    <pre className="font-mono text-[11px] leading-relaxed text-green-400">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {auditTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      disabled={auditPage <= 1}
                      onClick={() => loadAuditLogs(auditPage - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-sm"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-500 px-2">
                      Página {auditPage} de {auditTotalPages}
                    </span>
                    <button
                      disabled={auditPage >= auditTotalPages}
                      onClick={() => loadAuditLogs(auditPage + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-sm"
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
