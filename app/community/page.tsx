"use client";
 
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../lib/supabase/client";
import defaultData from "../../Figurinhas/checklist-copa-2026.json";
import { Sticker } from "../types";
import VirtualAlbumModal from "../components/VirtualAlbumModal";
import ChatPanel from "../components/ChatPanel";
 
interface CommunityMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  username?: string;
  collectedUniqueCount: number;
  totalRepeats: number;
  // Figurinhas cruzadas
  theyHaveINeed: Sticker[];
  iHaveTheyNeed: Sticker[];
  rawStickers: any[];
  hideAlbum: boolean;
  hideTrades: boolean;
  // Relação com amizade
  friendshipId?: string;
  friendshipStatus?: 'pending' | 'accepted';
  isRequestSender?: boolean; // Se eu que enviei
}

type TabType = 'friends' | 'requests' | 'explore';
 
export default function CommunityPage() {
  const { user, stickers: myStickers, isHydrated } = useAppContext();
  const [allMembers, setAllMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedFriendForAlbum, setSelectedFriendForAlbum] = useState<CommunityMember | null>(null);
  const [selectedFriendForChat, setSelectedFriendForChat] = useState<CommunityMember | null>(null);
  
  const supabase = createClient();
  const totalAlbumStickers = defaultData.length;
 
  const fetchCommunityData = async () => {
    if (!isHydrated || !user) return;
    try {
      setIsLoading(true);

      // 1. Buscar todos os perfis e relação de amizades do usuário em paralelo
      const [profilesRes, friendsRes, stickersRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('friends').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('user_stickers').select('*')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (friendsRes.error) throw friendsRes.error;
      if (stickersRes.error) throw stickersRes.error;

      const profiles = profilesRes.data || [];
      const friends = friendsRes.data || [];
      const allStickers = stickersRes.data || [];

      // Mapeamento de figurinhas padrão por ID para acesso O(1) rápido
      const stickerTemplatesMap: Record<string, any> = {};
      defaultData.forEach((item) => {
        stickerTemplatesMap[item.id] = item;
      });

      // 2. Mapear os outros usuários associando os dados de amizades e inteligência de trocas
      const mappedMembers: CommunityMember[] = profiles
        .filter((profile: any) => profile.id !== user.id)
        .map((profile: any) => {
          // Localizar relacionamento de amizade
          const friendship = friends.find(
            (f: any) => (f.sender_id === user.id && f.receiver_id === profile.id) ||
                       (f.sender_id === profile.id && f.receiver_id === user.id)
          );

          const friendStickers = allStickers.filter(
            (s: any) => s.user_id === profile.id && s.quantity > 0
          );

          const uniqueCount = friendStickers.length;
          const repeatsCount = friendStickers.reduce(
            (acc: number, s: any) => acc + (s.quantity > 1 ? s.quantity - 1 : 0), 0
          );

          // Cálculo inteligente de cruzamento (Matches)
          const theyHaveINeed: Sticker[] = [];
          const iHaveTheyNeed: Sticker[] = [];

          // Só calculamos as trocas se forem amigos aceitos e se a pessoa não as ocultou
          const isAcceptedFriend = friendship?.status === 'accepted';
          if (isAcceptedFriend && !profile.hide_trades) {
            // O que eles têm repetido que eu preciso
            friendStickers.forEach((friendSticker: any) => {
              const template = stickerTemplatesMap[friendSticker.code];
              if (!template) return;

              const myCopy = myStickers.find((s) => s.id === friendSticker.code);
              const isFriendRepeated = friendSticker.quantity > 1;
              const doINeedIt = !myCopy || myCopy.quantityOwned === 0;

              if (isFriendRepeated && doINeedIt) {
                theyHaveINeed.push({
                  ...template,
                  quantityOwned: friendSticker.quantity,
                  pasted: friendSticker.pasted,
                  edition: friendSticker.edition || 'normal',
                  notes: friendSticker.notes || ''
                });
              }
            });

            // O que eu tenho repetido que eles precisam
            myStickers.forEach((mySticker) => {
              if (mySticker.quantityOwned <= 1) return;
              const friendCopy = friendStickers.find((fs: any) => fs.code === mySticker.id);
              const doesFriendNeedIt = !friendCopy || friendCopy.quantity === 0;
              if (doesFriendNeedIt) {
                iHaveTheyNeed.push(mySticker);
              }
            });
          }

          return {
            id: profile.id,
            full_name: profile.full_name || profile.username || profile.email?.split('@')[0] || 'Colecionador',
            avatar_url: profile.avatar_url,
            email: profile.email,
            username: profile.username,
            collectedUniqueCount: uniqueCount,
            totalRepeats: repeatsCount,
            theyHaveINeed,
            iHaveTheyNeed,
            rawStickers: friendStickers,
            hideAlbum: !!profile.hide_album,
            hideTrades: !!profile.hide_trades,
            friendshipId: friendship?.id,
            friendshipStatus: friendship?.status,
            isRequestSender: friendship?.sender_id === user.id
          };
        });

      setAllMembers(mappedMembers);
    } catch (err) {
      console.error("Erro ao buscar comunidade:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [isHydrated, user, myStickers]);

  // Handlers de Ação de Amizade
  const handleSendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('friends').insert([
        { sender_id: user.id, receiver_id: receiverId, status: 'pending' }
      ]);
      if (error) throw error;
      await fetchCommunityData();
    } catch (err) {
      console.error("Erro ao enviar convite:", err);
      alert("Falha ao enviar solicitação de amizade.");
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);
      if (error) throw error;
      await fetchCommunityData();
    } catch (err) {
      console.error("Erro ao aceitar amizade:", err);
      alert("Falha ao aceitar solicitação.");
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
      if (error) throw error;
      await fetchCommunityData();
    } catch (err) {
      console.error("Erro ao rejeitar solicitação:", err);
      alert("Falha ao recusar solicitação.");
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Tem certeza que deseja desfazer a amizade com esta pessoa?")) return;
    try {
      const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
      if (error) throw error;
      await fetchCommunityData();
    } catch (err) {
      console.error("Erro ao desfazer amizade:", err);
      alert("Erro ao deletar amigo.");
    }
  };

  // Categorizar Listas filtradas
  const friendsList = allMembers
    .filter(m => m.friendshipStatus === 'accepted')
    .sort((a, b) => {
      const aMatches = a.theyHaveINeed.length + a.iHaveTheyNeed.length;
      const bMatches = b.theyHaveINeed.length + b.iHaveTheyNeed.length;
      return bMatches - aMatches;
    });

  const requestsList = allMembers.filter(
    m => m.friendshipStatus === 'pending'
  );

  const pendingReceived = requestsList.filter(m => !m.isRequestSender);
  const pendingSent = requestsList.filter(m => m.isRequestSender);

  const exploreList = allMembers.filter(
    m => !m.friendshipStatus
  ).filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.full_name.toLowerCase().includes(q) || 
           m.email.toLowerCase().includes(q) ||
           m.username?.toLowerCase().includes(q);
  });

  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
          <span className="text-on-surface-variant font-label-md">Conectando à rede...</span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-2">Comunidade Pro</h1>
        <p className="text-on-surface-variant font-body-md max-w-3xl">
          Adicione seus amigos do mundo real para ver álbuns mútuos, analisar quais repetidas eles têm que você precisa e negociar em tempo real pelo chat!
        </p>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-outline-variant/30 bg-surface-container-low p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'friends'
              ? 'bg-surface text-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">group</span>
          Amigos ({friendsList.length})
        </button>
        
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 relative ${
            activeTab === 'requests'
              ? 'bg-surface text-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">mail</span>
          Convites
          {pendingReceived.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {pendingReceived.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'explore'
              ? 'bg-surface text-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-sm">travel_explore</span>
          Explorar
        </button>
      </div>
 
      {/* CONTENT RENDERING BASED ON ACTIVE TAB */}
      
      {/* 1. TAB MEUS AMIGOS */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {friendsList.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto animate-fade-in">
              <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-40">group_add</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Sem amigos ainda</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                Para ver o álbum deles e liberar sugestões inteligentes de trocas, você precisa adicioná-los primeiro!
              </p>
              <button 
                onClick={() => setActiveTab('explore')}
                className="px-6 py-3 bg-secondary text-on-secondary rounded-xl text-sm font-bold hover:bg-secondary/90 transition-all inline-flex items-center gap-2 shadow-lg shadow-secondary/20 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                Procurar Pessoas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 animate-fade-in">
              {friendsList.map((member) => {
                const completionPercent = totalAlbumStickers === 0 ? 0 : ((member.collectedUniqueCount / totalAlbumStickers) * 100).toFixed(1);
                const avatarLetter = member.full_name.charAt(0).toUpperCase();
                const hasMatches = member.theyHaveINeed.length > 0 || member.iHaveTheyNeed.length > 0;
     
                return (
                  <div key={member.id} className="glass-card rounded-2xl p-6 border-outline-variant hover:border-secondary/30 transition-all duration-300">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-6 mb-6">
                      
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        {member.avatar_url ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary glow-blue flex-shrink-0 bg-surface-container">
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-secondary/10 border-2 border-secondary/40 flex items-center justify-center flex-shrink-0 text-secondary text-2xl font-bold">
                            {avatarLetter}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-bold">{member.full_name}</h3>
                            {member.username && <span className="bg-surface-container text-secondary text-[10px] font-bold px-2 py-0.5 rounded">@{member.username}</span>}
                          </div>
                          <span className="text-xs text-on-surface-variant font-medium">{member.email}</span>
                        </div>
                      </div>
     
                      {/* Progress */}
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div>
                          <span className="block text-[10px] text-on-surface-variant font-label-sm tracking-wider uppercase">Progresso</span>
                          <div className="flex items-center gap-2">
                            <div className="font-title-lg text-title-lg font-bold text-secondary leading-none">{completionPercent}%</div>
                            <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">({member.collectedUniqueCount}/{totalAlbumStickers})</div>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] text-on-surface-variant font-label-sm tracking-wider uppercase">Repetidas</span>
                          <span className="font-title-lg text-title-lg font-bold text-tertiary block leading-none mt-1">{member.totalRepeats}</span>
                        </div>

                        {/* Buttons Grid */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          {member.hideAlbum ? (
                            <div className="px-4 py-2 bg-surface-container-low/40 border border-outline-variant/30 text-xs text-on-surface-variant/60 font-bold rounded-xl flex items-center gap-2 select-none">
                              <span className="material-symbols-outlined text-xs opacity-50">lock</span> Álbum
                            </div>
                          ) : (
                            <button 
                              onClick={() => setSelectedFriendForAlbum(member)}
                              className="px-4 py-2 bg-surface-container border border-outline-variant text-xs text-on-surface font-bold rounded-xl flex items-center gap-2 hover:bg-surface-container-high hover:border-outline transition-all active:scale-95"
                            >
                              <span className="material-symbols-outlined text-sm">menu_book</span> Álbum
                            </button>
                          )}

                          {/* CHAT TRIGGER! */}
                          <button 
                            onClick={() => setSelectedFriendForChat(member)}
                            className="px-5 py-2 bg-secondary text-on-secondary text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all glow-blue"
                          >
                            <span className="material-symbols-outlined text-sm font-bold animate-pulse">chat</span>
                            Chat de Trocas
                          </button>

                          <button 
                            onClick={() => member.friendshipId && handleRemoveFriend(member.friendshipId)}
                            title="Desfazer Amizade"
                            className="w-8 h-8 border border-outline-variant text-on-surface-variant hover:text-error hover:border-error/50 flex items-center justify-center rounded-xl transition-all ml-2 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-sm">person_remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
     
                    {/* Matchmaking suggestions */}
                    <div>
                      <h4 className="flex items-center gap-2 font-label-md text-[11px] text-on-surface-variant font-bold mb-4 tracking-wider uppercase">
                        <span className="material-symbols-outlined text-secondary text-sm">handshake</span>
                        Cruzamento de Troca Inteligente
                      </h4>
     
                      {member.hideTrades ? (
                        <div className="p-4 bg-surface-container-low rounded-xl text-center border border-outline-variant border-dashed flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">visibility_off</span>
                          <p className="text-on-surface-variant text-xs font-medium">Este amigo optou por ocultar o cruzamento de figurinhas.</p>
                        </div>
                      ) : !hasMatches ? (
                        <div className="p-4 bg-surface-container-low rounded-xl text-center border border-outline-variant/40 border-dashed">
                          <p className="text-on-surface-variant text-xs">
                            Sem cruzamentos ativos no momento. Vocês já completaram as mesmas partes ou ninguém tem repetida que o outro necessita!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Dele que eu preciso */}
                          <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-4">
                            <h5 className="font-bold text-xs text-secondary flex items-center gap-2 mb-3">
                              <span className="material-symbols-outlined text-sm font-bold">arrow_downward</span>
                              Ele tem e você precisa ({member.theyHaveINeed.length})
                            </h5>
                            {member.theyHaveINeed.length === 0 ? (
                              <p className="text-[11px] text-on-surface-variant/70">Nenhuma correspondência.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                {member.theyHaveINeed.map((sticker) => (
                                  <span key={sticker.id} className="px-2 py-0.5 bg-surface border border-outline-variant/40 rounded text-[10px] font-bold text-on-surface">{sticker.code}</span>
                                ))}
                              </div>
                            )}
                          </div>
     
                          {/* Meu que ele precisa */}
                          <div className="bg-tertiary/5 border border-tertiary/10 rounded-xl p-4">
                            <h5 className="font-bold text-xs text-tertiary flex items-center gap-2 mb-3">
                              <span className="material-symbols-outlined text-sm font-bold">arrow_upward</span>
                              Você tem e ele precisa ({member.iHaveTheyNeed.length})
                            </h5>
                            {member.iHaveTheyNeed.length === 0 ? (
                              <p className="text-[11px] text-on-surface-variant/70">Nenhuma correspondência.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                {member.iHaveTheyNeed.map((sticker) => (
                                  <span key={sticker.id} className="px-2 py-0.5 bg-surface border border-outline-variant/40 rounded text-[10px] font-bold text-on-surface">{sticker.code}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. TAB CONVITES (REQUESTS) */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Recebidos */}
          <div className="space-y-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-secondary text-lg">mark_email_unread</span>
              Recebidos ({pendingReceived.length})
            </h3>
            {pendingReceived.length === 0 ? (
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-8 text-center text-xs text-on-surface-variant">
                Nenhuma solicitação de amizade pendente.
              </div>
            ) : (
              pendingReceived.map(req => (
                <div key={req.id} className="glass-card p-4 rounded-xl flex items-center justify-between border-outline-variant/40 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                      {req.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{req.full_name}</h4>
                      {req.username && <span className="text-[10px] text-on-surface-variant">@{req.username}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => req.friendshipId && handleRejectFriendRequest(req.friendshipId)}
                      className="w-9 h-9 bg-surface-container text-on-surface-variant hover:bg-error/10 hover:text-error rounded-lg flex items-center justify-center transition-all"
                      title="Recusar"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                    <button
                      onClick={() => req.friendshipId && handleAcceptFriendRequest(req.friendshipId)}
                      className="w-9 h-9 bg-secondary text-on-secondary rounded-lg flex items-center justify-center shadow-md hover:bg-secondary/90 transition-all"
                      title="Aceitar"
                    >
                      <span className="material-symbols-outlined text-lg font-bold">check</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Enviados */}
          <div className="space-y-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">outgoing_mail</span>
              Enviados ({pendingSent.length})
            </h3>
            {pendingSent.length === 0 ? (
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-8 text-center text-xs text-on-surface-variant">
                Nenhuma solicitação pendente de resposta.
              </div>
            ) : (
              pendingSent.map(req => (
                <div key={req.id} className="glass-card p-4 rounded-xl flex items-center justify-between border-outline-variant/40 opacity-75 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-medium">
                      {req.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-on-surface">{req.full_name}</h4>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span> Aguardando aceite
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => req.friendshipId && handleRejectFriendRequest(req.friendshipId)}
                    className="text-xs text-on-surface-variant hover:text-error font-bold px-3 py-1.5 hover:bg-error/5 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. TAB EXPLORAR */}
      {activeTab === 'explore' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search field */}
          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou @usuário..."
              className="w-full pl-11 pr-4 py-3.5 bg-surface-container border border-outline-variant text-on-surface text-sm rounded-xl focus:outline-none focus:border-secondary transition-all shadow-inner"
            />
          </div>

          {/* Explore Grid */}
          {exploreList.length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-12 text-center max-w-md mx-auto">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">search_off</span>
              <p className="text-on-surface-variant text-xs">Nenhum colecionador encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exploreList.map(profile => {
                const avatarLetter = profile.full_name.charAt(0).toUpperCase();
                return (
                  <div key={profile.id} className="glass-card rounded-xl p-4 border-outline-variant/40 hover:border-secondary/20 flex flex-col items-center text-center transition-all">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-14 h-14 rounded-full object-cover border border-outline-variant mb-3" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-secondary/5 border border-outline flex items-center justify-center text-secondary font-bold text-lg mb-3">
                        {avatarLetter}
                      </div>
                    )}
                    
                    <h4 className="font-bold text-sm text-on-surface truncate w-full">{profile.full_name}</h4>
                    {profile.username && <span className="text-[10px] text-secondary font-bold tracking-tight mb-4 bg-secondary/10 px-2 py-0.5 rounded">@{profile.username}</span>}
                    
                    <button
                      onClick={() => handleSendFriendRequest(profile.id)}
                      className="w-full mt-auto py-2 bg-surface-container hover:bg-secondary hover:text-on-secondary text-on-surface border border-outline-variant/60 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Adicionar Amigo
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
 
      {/* Virtual Album Modal Trigger */}
      {selectedFriendForAlbum && (
        <VirtualAlbumModal
          isOpen={!!selectedFriendForAlbum}
          onClose={() => setSelectedFriendForAlbum(null)}
          friendName={selectedFriendForAlbum.full_name}
          friendRawStickers={selectedFriendForAlbum.rawStickers}
        />
      )}

      {/* REALTIME CHAT PANEL SLIDE-OVER! */}
      {selectedFriendForChat && (
        <ChatPanel
          isOpen={!!selectedFriendForChat}
          onClose={() => setSelectedFriendForChat(null)}
          friend={{
            id: selectedFriendForChat.id,
            full_name: selectedFriendForChat.full_name,
            avatar_url: selectedFriendForChat.avatar_url
          }}
        />
      )}
    </div>
  );
}
