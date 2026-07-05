import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { MessageSquare, X, Send, RefreshCw } from 'lucide-react';

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

export function SupportChatBubble() {
  const { user, accessToken } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isVisible =
    Boolean(accessToken && user) &&
    user?.role !== 'admin' &&
    user?.email !== 'diegoorlando211170@gmail.com';

  // Cargar historial de chat
  const loadMessages = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/support/messages');
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar mensajes de soporte:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Enviar mensaje a soporte
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      const res = await api.post('/support/messages', {
        message: newMessage,
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error al enviar mensaje a soporte:', err);
    }
  };

  // Auto-scroll al final del chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Polling para nuevos mensajes (cada 5 segundos si el chat está abierto)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      loadMessages(messages.length === 0); // Solo loading spinner si es la primera carga
      interval = setInterval(() => {
        loadMessages(false);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="w-[360px] h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <div>
                <h4 className="font-bold text-sm">Soporte Técnico</h4>
                <p className="text-[10px] text-indigo-100">En línea para ayudarte</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-500/60" />
                Cargando conversación...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-6 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-200" />
                <p className="font-medium text-slate-500">¿Tienes alguna duda o inconveniente?</p>
                <p className="text-[11px] text-slate-400">Escribe tu consulta abajo y un administrador te responderá lo antes posible.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = !msg.isAdminSender;
                return (
                  <div 
                    key={msg._id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`p-3 rounded-2xl text-xs ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input de Mensaje */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
            />
            <button
              type="submit"
              disabled={newMessage.trim() === ''}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Botón Globo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-50 group"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-all duration-300 rotate-90" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-all duration-300 group-hover:rotate-6" />
        )}
      </button>
    </div>
  );
}
export default SupportChatBubble;
