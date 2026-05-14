"use client";
 
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../lib/supabase/client";
import defaultData from "../../Figurinhas/checklist-copa-2026.json";
import { Sticker } from "../types";
import VirtualAlbumModal from "../components/VirtualAlbumModal";
 
interface CommunityMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  collectedUniqueCount: number;
  totalRepeats: number;
  // Figurinhas cruzadas
  theyHaveINeed: Sticker[];
  iHaveTheyNeed: Sticker[];
  rawStickers: any[];
}
 
export default function CommunityPage() {
  const { user, stickers: myStickers, isHydrated } = useAppContext();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriendForAlbum, setSelectedFriendForAlbum] = useState<CommunityMember | null>(null);
  const supabase = createClient();
 
  const totalAlbumStickers = defaultData.length;
 
  useEffect(() => {
    if (!isHydrated || !user) return;
 
    const fetchCommunityData = async () => {
      try {
        setIsLoading(true);
 
        // 1. Buscar todos os perfis
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('*');
 
        if (profilesErr) throw profilesErr;
 
        // 2. Buscar as figurinhas cadastradas de todos os usuários no banco
        const { data: allStickers, error: stickersErr } = await supabase
          .from('user_stickers')
          .select('*');
 
        if (stickersErr) throw stickersErr;
 
        // Mapeamento de figurinhas padrão por ID para acesso O(1) rápido
        const stickerTemplatesMap: Record<string, any> = {};
        defaultData.forEach((item) => {
          stickerTemplatesMap[item.id] = item;
        });
 
        // 3. Mapear os outros usuários e calcular a inteligência de trocas
        const otherMembers: CommunityMember[] = (profiles || [])
          .filter((profile: any) => profile.id !== user.id && !profile.is_private)
          .map((profile: any) => {
            const friendStickers = (allStickers || []).filter(
              (s: any) => s.user_id === profile.id && s.quantity > 0
            );
 
            const uniqueCount = friendStickers.length;
            const repeatsCount = friendStickers.reduce(
              (acc: number, s: any) => acc + (s.quantity > 1 ? s.quantity - 1 : 0), 0
            );
 
            // Lógica de inteligência de cruzamento:
            const theyHaveINeed: Sticker[] = [];
            const iHaveTheyNeed: Sticker[] = [];
 
            // a) O que ELES têm repetido que EU NÃO tenho
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
 
            // b) O que EU tenho repetido que ELES NÃO têm
            myStickers.forEach((mySticker) => {
              if (mySticker.quantityOwned <= 1) return; // Não tenho repetida
 
              const friendCopy = friendStickers.find((fs: any) => fs.code === mySticker.id);
              const doesFriendNeedIt = !friendCopy || friendCopy.quantity === 0;
 
              if (doesFriendNeedIt) {
                iHaveTheyNeed.push(mySticker);
              }
            });
 
            return {
              id: profile.id,
              full_name: profile.full_name || profile.email?.split('@')[0] || 'Colecionador',
              avatar_url: profile.avatar_url,
              email: profile.email,
              collectedUniqueCount: uniqueCount,
              totalRepeats: repeatsCount,
              theyHaveINeed,
              iHaveTheyNeed,
              rawStickers: friendStickers,
            };
          });
 
        // Ordenar por quem tem mais Matches ativos
        otherMembers.sort((a, b) => {
          const aMatches = a.theyHaveINeed.length + a.iHaveTheyNeed.length;
          const bMatches = b.theyHaveINeed.length + b.iHaveTheyNeed.length;
          return bMatches - aMatches;
        });
 
        setMembers(otherMembers);
      } catch (err) {
        console.error("Erro ao buscar comunidade:", err);
      } finally {
        setIsLoading(false);
      }
    };
 
    fetchCommunityData();
  }, [isHydrated, user, myStickers]);
 
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
          <span className="text-on-surface-variant font-label-md">Buscando colecionadores...</span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-2">Comunidade Pro</h1>
        <p className="text-on-surface-variant font-body-md max-w-3xl">
          Conecte-se com outros colecionadores. O sistema cruza automaticamente as suas repetidas com as faltantes de cada amigo para te sugerir trocas perfeitas!
        </p>
      </div>
 
      {members.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">people_outline</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Nenhum colecionador ainda</h3>
          <p className="text-on-surface-variant text-sm">
            Compartilhe o link do seu aplicativo com os seus amigos para eles cadastrarem suas figurinhas e você conseguir cruzar as trocas!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {members.map((member) => {
            const completionPercent = totalAlbumStickers === 0 ? 0 : ((member.collectedUniqueCount / totalAlbumStickers) * 100).toFixed(1);
            const avatarLetter = member.full_name.charAt(0).toUpperCase();
            const hasMatches = member.theyHaveINeed.length > 0 || member.iHaveTheyNeed.length > 0;
 
            return (
              <div key={member.id} className="glass-card rounded-2xl p-6 border-outline-variant hover:border-secondary/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-6 mb-6">
                  {/* User Profile Summary */}
                  <div className="flex items-center gap-4">
                    {member.avatar_url ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary glow-blue flex-shrink-0 bg-surface-container">
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary/20 to-tertiary/20 border-2 border-outline flex items-center justify-center flex-shrink-0 text-secondary text-2xl font-bold">
                        {avatarLetter}
                      </div>
                    )}
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">{member.full_name}</h3>
                      <span className="text-xs text-on-surface-variant font-medium">{member.email}</span>
                    </div>
                  </div>
 
                  {/* Progress Overview */}
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <div>
                      <span className="block text-xs text-on-surface-variant font-label-sm">PROGRESSO DO ÁLBUM</span>
                      <div className="flex items-center gap-2">
                        <div className="font-title-lg text-title-lg font-bold text-secondary leading-none">{completionPercent}%</div>
                        <div className="text-xs text-on-surface-variant font-medium mt-0.5">({member.collectedUniqueCount}/{totalAlbumStickers})</div>
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <span className="block text-xs text-on-surface-variant font-label-sm">REPETIDAS</span>
                      <span className="font-title-lg text-title-lg font-bold text-tertiary">{member.totalRepeats}</span>
                    </div>
                    <div className="w-full md:w-auto md:ml-auto">
                      <button 
                        onClick={() => setSelectedFriendForAlbum(member)}
                        className="w-full md:w-auto px-5 py-2.5 bg-surface-container-high hover:bg-secondary hover:text-on-secondary border border-outline-variant/50 text-xs text-on-surface font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md hover:shadow-secondary/10 active:shadow-inner"
                      >
                        <span className="material-symbols-outlined text-sm">menu_book</span>
                        Ver Álbum Virtual
                      </button>
                    </div>
                  </div>
                </div>
 
                {/* MATCHMAKING INTELLIGENCE */}
                <div>
                  <h4 className="flex items-center gap-2 font-label-md text-label-md text-on-primary-container mb-4 tracking-wider uppercase">
                    <span className="material-symbols-outlined text-secondary animate-pulse text-lg">handshake</span>
                    Sugestões de Troca
                  </h4>
 
                  {!hasMatches ? (
                    <div className="p-6 bg-surface-container-lowest rounded-xl text-center border border-outline-variant/50 border-dashed">
                      <p className="text-on-surface-variant text-sm">
                        Sem trocas sugeridas no momento. Vocês já possuem as mesmas figurinhas ou ninguém tem o que o outro precisa!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Figurinhas dele que eu preciso */}
                      <div className="bg-secondary-container/5 border border-secondary/10 rounded-xl p-4">
                        <h5 className="font-semibold text-sm text-secondary flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-sm font-bold">call_received</span>
                          Ele tem e você precisa ({member.theyHaveINeed.length})
                        </h5>
                        
                        {member.theyHaveINeed.length === 0 ? (
                          <p className="text-xs text-on-surface-variant/70">Você já tem todas as repetidas dele.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {member.theyHaveINeed.map((sticker) => (
                              <div 
                                key={sticker.id} 
                                className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs font-bold text-on-surface inline-flex items-center gap-1"
                                title={`${sticker.name ? sticker.name + ' - ' : ''}${sticker.team}`}
                              >
                                <span>{sticker.code}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
 
                      {/* Minhas figurinhas que ele precisa */}
                      <div className="bg-tertiary-container/5 border border-tertiary/10 rounded-xl p-4">
                        <h5 className="font-semibold text-sm text-tertiary flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-sm font-bold">call_made</span>
                          Você tem e ele precisa ({member.iHaveTheyNeed.length})
                        </h5>
                        
                        {member.iHaveTheyNeed.length === 0 ? (
                          <p className="text-xs text-on-surface-variant/70">Ele já tem todas as suas repetidas.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {member.iHaveTheyNeed.map((sticker) => (
                              <div 
                                key={sticker.id} 
                                className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs font-bold text-on-surface inline-flex items-center gap-1"
                                title={`${sticker.name ? sticker.name + ' - ' : ''}${sticker.team}`}
                              >
                                <span>{sticker.code}</span>
                              </div>
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

      {/* Virtual Album Modal Trigger */}
      {selectedFriendForAlbum && (
        <VirtualAlbumModal
          isOpen={!!selectedFriendForAlbum}
          onClose={() => setSelectedFriendForAlbum(null)}
          friendName={selectedFriendForAlbum.full_name}
          friendRawStickers={selectedFriendForAlbum.rawStickers}
        />
      )}
    </div>
  );
}
