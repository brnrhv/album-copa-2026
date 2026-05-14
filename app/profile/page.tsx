"use client";
 
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { createClient } from "../lib/supabase/client";
 
export default function ProfilePage() {
  const { profile, user, updateProfile, isHydrated } = useAppContext();
  const supabase = createClient();
 
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || null);
    } else if (user) {
      setFullName(user.email?.split('@')[0] || "");
    }
  }, [profile, user]);
 
  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }
 
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
 
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
 
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
 
    try {
      setIsUploading(true);
      setMessage(null);
 
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
 
      if (uploadError) {
        throw uploadError;
      }
 
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
 
      setAvatarUrl(publicUrl);
      setMessage({ text: "Foto carregada com sucesso! Não esqueça de clicar em salvar.", type: "success" });
    } catch (error: any) {
      console.error("Erro no upload:", error);
      setMessage({ text: "Erro ao enviar a foto: " + (error.message || error), type: "error" });
    } finally {
      setIsUploading(false);
    }
  };
 
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
 
    try {
      setIsSaving(true);
      setMessage(null);
      
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl
      });
 
      setMessage({ text: "Perfil atualizado com sucesso!", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ text: "Falha ao atualizar: " + error.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };
 
  const avatarLetter = fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
 
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-2">Meu Perfil</h1>
        <p className="text-on-surface-variant font-body-md">Configure as informações que serão exibidas para os outros colecionadores na aba Comunidade.</p>
      </div>
 
      <form onSubmit={handleSave} className="glass-card rounded-2xl p-8 relative overflow-hidden">
        {/* Toast Notice */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm border flex items-center gap-3
            ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-error/10 text-error border-error/20'}`}
          >
            <span className="material-symbols-outlined">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{message.text}</span>
          </div>
        )}
 
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            {/* Avatar Container */}
            {avatarUrl ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary glow-blue relative bg-surface-container-high">
                <img src={avatarUrl} alt="Foto de Perfil" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary/20 to-tertiary/20 border-4 border-outline flex items-center justify-center shadow-inner">
                <span className="text-5xl font-bold text-secondary">{avatarLetter}</span>
              </div>
            )}
 
            {/* Upload Hover Overlay */}
            <div className="absolute inset-0 rounded-full bg-surface/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-4 border-secondary duration-200">
              <span className="material-symbols-outlined text-secondary text-3xl">photo_camera</span>
              <span className="text-[11px] font-bold text-on-surface mt-1">ALTERAR</span>
            </div>
 
            {/* Uploading Spinner Overlay */}
            {isUploading && (
              <div className="absolute inset-0 rounded-full bg-surface/80 flex items-center justify-center border-4 border-secondary">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-secondary border-r-transparent"></div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-on-surface-variant mt-3">Clique no círculo para escolher uma foto</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
 
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-label-md text-label-md text-on-surface-variant mb-2">Endereço de E-mail</label>
            <input 
              type="email" 
              id="email" 
              value={user.email || ""} 
              disabled 
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface-variant/60 cursor-not-allowed outline-none"
            />
            <span className="text-xs text-on-surface-variant/60 mt-1 inline-block">O e-mail é usado apenas para login e não pode ser alterado.</span>
          </div>
 
          <div>
            <label htmlFor="fullName" className="block font-label-md text-label-md text-on-surface mb-2">Nome de Exibição</label>
            <input 
              type="text" 
              id="fullName" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Thiago Silva"
              required
              className="w-full bg-surface-container-lowest border border-outline rounded-xl px-4 py-3 text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
            />
          </div>
 
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || isUploading || !fullName.trim()}
              className="px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-on-secondary"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
