"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../lib/supabase/client";

interface NotificationItem {
  id: string;
  type: 'friend' | 'chat';
  title: string;
  description: string;
  time: Date;
  read: boolean;
  payload?: any;
}

export default function Header({ onToggleMenu }: { onToggleMenu: () => void }) {
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { signOut, user } = useAppContext();
  const supabase = createClient();

  // Fetch initial pending requests and setup listeners
  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        // 1. Fetch active pending friend requests for this user
        const { data: pendingReqs, error: reqError } = await supabase
          .from('friends')
          .select('*, sender:profiles!friends_sender_id_fkey(full_name)')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        if (reqError) throw reqError;

        const initialNotifications: NotificationItem[] = (pendingReqs || []).map(req => ({
          id: req.id,
          type: 'friend',
          title: 'Convite de Amizade',
          description: `${(req.sender as any)?.full_name || 'Um colecionador'} te enviou uma solicitação.`,
          time: new Date(req.created_at),
          read: false
        }));

        setNotifications(initialNotifications);
      } catch (err) {
        console.error("Error initializing notifications:", err);
      }
    };

    initializeNotifications();

    // 2. Realtime Listeners
    // A) Friends Listener
    const friendsChannel = supabase
      .channel('global_friends_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friends', filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const newReq = payload.new;
          if (newReq.status === 'pending') {
            // Fetch sender name
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newReq.sender_id)
              .single();

            setNotifications(prev => [
              {
                id: newReq.id,
                type: 'friend',
                title: 'Novo Convite',
                description: `${senderProfile?.full_name || 'Um colecionador'} te adicionou!`,
                time: new Date(),
                read: false
              },
              ...prev
            ]);
          }
        }
      )
      .subscribe();

    // B) Messages Listener
    const messagesChannel = supabase
      .channel('global_chat_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const newMsg = payload.new;
          
          // Don't notify if current active route is chat/community (optional, but let's alert anyway)
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single();

          setNotifications(prev => [
            {
              id: newMsg.id,
              type: 'chat',
              title: `Mensagem de ${senderProfile?.full_name || 'Amigo'}`,
              description: newMsg.content.length > 45 ? newMsg.content.substring(0, 45) + "..." : newMsg.content,
              time: new Date(),
              read: false
            },
            ...prev
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  // Handle outside clicks to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const markAllAsRead = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleNotificationClick = () => {
    router.push('/community');
    setShowNotifications(false);
    // Simple cleanup: once user goes to community, clear pending notification visually
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-280px)] z-40 bg-surface/80 dark:bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-4 lg:px-container-padding h-16 transition-all duration-300">
      <div className="flex items-center gap-3 lg:gap-8">
        {/* Hamburger Menu Button for Mobile */}
        <button 
          onClick={onToggleMenu}
          className="lg:hidden p-2 -ml-2 text-on-surface hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h1 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface truncate max-w-[150px] sm:max-w-none">
          <span className="sm:inline hidden">FIFA World Cup 2026™ Album</span>
          <span className="sm:hidden inline">Álbum 2026</span>
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 sm:flex-none justify-end">
        {/* Search */}
        <div className="relative hidden sm:flex items-center bg-surface-container-low px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-outline-variant w-full max-w-[120px] sm:max-w-xs focus-within:max-w-[160px] sm:focus-within:max-w-xs transition-all duration-300 mr-1">
          <span className="material-symbols-outlined text-on-surface-variant text-xs sm:text-sm flex-shrink-0">search</span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Pesquisar..." 
            className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm w-full placeholder-on-primary-container outline-none ml-1.5 sm:ml-2" 
          />
        </div>

        {/* BELL NOTIFICATIONS COMPONENT */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-on-surface hover:bg-surface-container rounded-full transition-all flex items-center justify-center active:scale-95"
            title="Notificações"
          >
            <span className={`material-symbols-outlined text-[22px] ${unreadCount > 0 ? 'text-secondary animate-swing' : 'text-on-surface-variant'}`}>
              {unreadCount > 0 ? 'notifications_active' : 'notifications'}
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-error text-on-error text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown list */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-surface border border-outline-variant/60 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-outline-variant/40 bg-surface-container-low flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wide">Notificações ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-secondary hover:underline font-bold">Limpar</button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center gap-2 text-on-surface-variant/70">
                    <span className="material-symbols-outlined opacity-40">notifications_off</span>
                    <p className="text-xs font-medium">Nenhuma novidade no momento.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={handleNotificationClick}
                      className="px-4 py-3 border-b border-outline-variant/20 hover:bg-surface-container-lowest cursor-pointer transition-all flex gap-3"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'chat' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                      }`}>
                        <span className="material-symbols-outlined text-sm font-bold">
                          {notif.type === 'chat' ? 'chat' : 'person_add'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface leading-tight truncate">{notif.title}</p>
                        <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5 break-words">{notif.description}</p>
                        <span className="block text-[9px] text-on-surface-variant/60 mt-1">
                          {notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-outline-variant/40 bg-surface-container-low text-center">
                <button
                  onClick={handleNotificationClick}
                  className="w-full text-xs font-bold text-secondary hover:text-secondary/80 transition-all"
                >
                  Ver Comunidade
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button 
          onClick={signOut}
          className="flex items-center gap-1 sm:gap-2 px-3.5 py-2 bg-error/10 text-error rounded-full hover:bg-error/20 transition-colors flex-shrink-0 active:scale-95"
          title="Sair"
        >
          <span className="material-symbols-outlined text-xs sm:text-sm">logout</span>
          <span className="font-label-md text-xs sm:text-sm hidden xs:inline sm:inline font-bold">Sair</span>
        </button>
      </div>
    </header>
  );
}

