"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import { useAppContext } from "../context/AppContext";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  friend: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function ChatPanel({ isOpen, onClose, friend }: ChatPanelProps) {
  const { user } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !user || !friend) return;

    // Fetch existing chat messages
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error("Erro ao carregar chat:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Realtime Subscription for ONLY messages related to this friend
    const channel = supabase
      .channel(`chat_${friend.id}_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message;
          // Validate if message belongs to this active conversation to avoid cross-chat leaks
          const isRelated =
            (msg.sender_id === user.id && msg.receiver_id === friend.id) ||
            (msg.sender_id === friend.id && msg.receiver_id === user.id);

          if (isRelated) {
            setMessages((prev) => {
              // Avoid duplicates just in case
              if (prev.some((p) => p.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, friend.id, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !friend) return;

    const textToSend = newMessage.trim();
    setNewMessage("");

    // Optimistic local update for snappy feel
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: friend.id,
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: user.id,
            receiver_id: friend.id,
            content: textToSend,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Replace temp with server data to unify ID
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data as Message) : m))
      );
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      // Revert if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Falha ao enviar mensagem. Tente novamente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:justify-end pointer-events-none">
      {/* Backdrop - Only blocks events when active */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto animate-fade-in md:hidden"
        onClick={onClose}
      />

      {/* Chat panel sliding from right */}
      <div className="w-full md:w-[450px] h-[100dvh] bg-surface border-l border-outline-variant/40 flex flex-col pointer-events-auto shadow-2xl animate-slide-in-right relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="material-symbols-outlined md:hidden text-on-surface mr-1 p-1 hover:bg-surface-container rounded-full"
            >
              arrow_back
            </button>
            {friend.avatar_url ? (
              <img 
                src={friend.avatar_url} 
                alt={friend.full_name} 
                className="w-10 h-10 rounded-full object-cover border border-secondary"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/40 flex items-center justify-center text-secondary font-bold">
                {friend.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-title-md text-on-surface font-bold leading-tight">{friend.full_name}</h3>
              <span className="text-[10px] text-secondary font-medium tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                Online no chat
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="hidden md:flex items-center justify-center w-8 h-8 text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-surface-container-lowest/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-on-surface-variant">Carregando histórico...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/5 flex items-center justify-center border border-dashed border-secondary/20 text-secondary">
                <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
              </div>
              <div>
                <h4 className="font-semibold text-on-surface text-sm mb-1">Inicie a negociação!</h4>
                <p className="text-xs text-on-surface-variant">
                  Diga quais figurinhas você precisa ou combine onde se encontrar para fazer a troca física.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine 
                        ? "bg-secondary text-on-secondary rounded-tr-sm glow-blue" 
                        : "bg-surface-container-high text-on-surface border border-outline-variant/30 rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <span className={`block text-[9px] mt-1 text-right font-medium ${
                      isMine ? "text-on-secondary/70" : "text-on-surface-variant/70"
                    }`}>
                      {time}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input */}
        <form 
          onSubmit={handleSendMessage}
          className="p-4 border-t border-outline-variant/40 bg-surface-container-low flex items-center gap-3"
        >
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-surface-container-highest border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-11 h-11 bg-secondary hover:bg-secondary/90 text-on-secondary disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center rounded-xl shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined font-bold text-lg">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
