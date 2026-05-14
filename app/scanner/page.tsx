"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { Sticker } from "../types";

function getTeamFlag(teamCode: string): string {
  const flags: Record<string, string> = {
    'BRA': '🇧🇷', 'ARG': '🇦🇷', 'FRA': '🇫🇷', 'GER': '🇩🇪', 'ESP': '🇪🇸', 'ITA': '🇮🇹', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'POR': '🇵🇹',
    'BEL': '🇧🇪', 'NED': '🇳🇱', 'URU': '🇺🇾', 'MEX': '🇲🇽', 'USA': '🇺🇸', 'CAN': '🇨🇦', 'JPN': '🇯🇵', 'KOR': '🇰🇷',
    'SEN': '🇸🇳', 'MAR': '🇲🇦', 'CRO': '🇭🇷', 'SUI': '🇨🇭', 'SWE': '🇸🇪', 'DEN': '🇩🇰', 'COL': '🇨🇴', 'CHI': '🇨🇱',
    'ECU': '🇪🇨', 'PER': '🇵🇪', 'PAR': '🇵🇾', 'VEN': '🇻🇪', 'BOL': '🇧🇴', 'AUS': '🇦🇺', 'CMR': '🇨🇲', 'GHA': '🇬🇭',
    'FWC': '🏆'
  };
  return flags[teamCode] || '⚽';
}

export default function ScannerPage() {
  const { stickers, updateSticker, isHydrated, user } = useAppContext();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  
  const [ocrCode, setOcrCode] = useState("");
  const [matchedSticker, setMatchedSticker] = useState<Sticker | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Search logic whenever user types or OCR code changes
  useEffect(() => {
    if (!ocrCode.trim()) {
      setMatchedSticker(null);
      return;
    }

    const normalizeCode = (raw: string): string => {
      let cleaned = raw.replace(/\s+/g, '').toUpperCase();
      const match = cleaned.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        let num = match[2];
        if (num.length === 1) {
          num = '0' + num;
        }
        return prefix + num;
      }
      return cleaned;
    };

    const normalized = normalizeCode(ocrCode);
    const found = stickers.find(s => s.id === normalized || s.code === normalized);
    
    setMatchedSticker(found || null);
  }, [ocrCode, stickers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setScanComplete(false);
    setOcrCode("");
    setMatchedSticker(null);
    setAddSuccess(false);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Simulate AI Scanner Scan
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      // Pre-focus input for confirmation
      document.getElementById("ocrInput")?.focus();
    }, 2200);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAdd = async () => {
    if (!matchedSticker) return;

    try {
      setIsAdding(true);
      const currentQty = matchedSticker.quantityOwned || 0;
      const newQty = currentQty + 1;
      
      await updateSticker(matchedSticker.id, { 
        quantityOwned: newQty 
      });
      
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        // Smoothly reset to scan again if needed, or keep preview
      }, 2500);
    } catch (error) {
      console.error("Failed to add scanned sticker:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setScanComplete(false);
    setIsScanning(false);
    setOcrCode("");
    setMatchedSticker(null);
    setAddSuccess(false);
  };

  if (!isHydrated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-md text-display-md font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-4xl animate-pulse">photo_camera</span>
            Scanner de Figurinhas
          </h1>
          <p className="text-on-surface-variant font-body-md mt-1">
            Tire uma foto da figurinha para a nossa IA identificar o código automaticamente!
          </p>
        </div>
        {previewUrl && !isScanning && (
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container font-semibold rounded-xl flex items-center gap-2 transition-colors text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Limpar / Novo Scan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left: Photo Container (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          <input 
            type="file" 
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <div 
            onClick={!previewUrl || (!isScanning && !scanComplete) ? handleTriggerUpload : undefined}
            className={`
              relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
              ${!previewUrl 
                ? 'border-dashed border-outline hover:border-secondary hover:bg-secondary-container/5 bg-surface-container-lowest' 
                : 'border-transparent bg-black shadow-2xl'}
            `}
          >
            {!previewUrl ? (
              <div className="text-center p-8 select-none pointer-events-none flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-secondary-container/10 flex items-center justify-center mb-4 group-hover:scale-110 duration-300">
                  <span className="material-symbols-outlined text-secondary text-4xl">add_a_photo</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">Fotografar ou Upload</h3>
                <p className="text-xs text-on-surface-variant/80 max-w-xs mt-2">
                  Toque para abrir a câmera ou escolher uma imagem da figurinha da Copa do seu dispositivo.
                </p>
                <div className="mt-6 px-4 py-2 bg-secondary text-on-secondary font-bold text-xs rounded-full shadow-lg shadow-secondary/20 group-hover:shadow-secondary/40">
                  Selecionar Imagem
                </div>
              </div>
            ) : (
              <>
                {/* Captured Photo Preview */}
                <img 
                  src={previewUrl} 
                  alt="Figurinha Capturada" 
                  className={`w-full h-full object-contain transition-all duration-500 ${isScanning ? 'opacity-60 blur-[1px]' : ''}`}
                />

                {/* Sci-Fi Scan Laser Animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                    {/* Glowing Border Pulse */}
                    <div className="absolute inset-0 border-4 border-secondary animate-pulse rounded-3xl"></div>
                    
                    {/* Laser Bar */}
                    <div className="w-full h-1 bg-secondary shadow-[0_0_15px_5px_rgba(var(--secondary-rgb),0.8)] shadow-secondary absolute animate-[scanLine_2.2s_ease-in-out_infinite]"></div>
                    
                    {/* Corner Brackets */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-secondary rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-secondary rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-secondary rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-secondary rounded-br-lg"></div>

                    {/* Central Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                      <div className="px-4 py-2 bg-secondary text-on-secondary font-mono text-xs font-bold tracking-widest uppercase rounded-md flex items-center gap-2 animate-pulse shadow-xl">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        Processando IA...
                      </div>
                    </div>
                  </div>
                )}

                {/* Post-scan finished visual hint */}
                {scanComplete && !isScanning && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full p-1 shadow-lg animate-bounce">
                    <span className="material-symbols-outlined block text-base font-bold">check</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tip Card */}
          <div className="p-4 bg-surface-container-low border border-outline-variant/40 rounded-2xl flex gap-3">
            <span className="material-symbols-outlined text-secondary">info</span>
            <div className="text-xs text-on-surface-variant/90 leading-relaxed">
              <strong>Dica:</strong> Para melhores resultados, certifique-se de que a foto esteja bem iluminada e que o código no canto da figurinha esteja nítido e legível.
            </div>
          </div>
        </div>

        {/* Right: Scanner Detection & Matches (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Manual Input / Confirmation Box */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 ${scanComplete ? 'bg-surface-container border-outline shadow-lg translate-y-0 opacity-100' : 'bg-surface-container-low border-outline-variant opacity-60 select-none cursor-not-allowed'}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">psychology</span>
              <h2 className="font-bold text-base text-on-surface font-title-md">Confirmação da IA</h2>
            </div>

            <label htmlFor="ocrInput" className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
              Código da Figurinha
            </label>
            <div className="relative">
              <input 
                id="ocrInput"
                type="text"
                value={ocrCode}
                onChange={(e) => setOcrCode(e.target.value.toUpperCase())}
                placeholder={scanComplete ? "Digite o código (Ex: BRA17)" : "Aguardando imagem..."}
                disabled={!scanComplete}
                className={`
                  w-full font-mono text-xl font-bold tracking-widest px-4 py-3.5 bg-surface-container-lowest border rounded-2xl text-on-surface focus:outline-none focus:ring-2 transition-all uppercase
                  ${scanComplete 
                    ? 'border-outline focus:border-secondary focus:ring-secondary/20 cursor-text' 
                    : 'border-transparent cursor-not-allowed'}
                `}
              />
              {ocrCode && scanComplete && (
                <button 
                  onClick={() => setOcrCode("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                </button>
              )}
            </div>
            
            <p className="text-[10px] text-on-surface-variant/60 mt-2 italic">
              *(Nesta versão demo, digite manualmente o código detectado na foto para simular a validação do OCR).*
            </p>
          </div>

          {/* Matched Sticker Result Area */}
          {ocrCode.trim() !== "" && scanComplete && (
            <div className={`animate-scale-up-down`}>
              {!matchedSticker ? (
                <div className="p-6 bg-error/10 border-2 border-error/30 text-error rounded-3xl flex flex-col items-center justify-center text-center gap-2">
                  <span className="material-symbols-outlined text-4xl font-bold">warning</span>
                  <h3 className="font-bold text-sm">Código Não Encontrado</h3>
                  <p className="text-xs opacity-80">
                    Verifique se você digitou corretamente (Ex: BRA12, ARG05).
                  </p>
                </div>
              ) : (
                <div className={`p-6 rounded-3xl border-2 border-secondary bg-surface-container-highest shadow-xl relative overflow-hidden group`}>
                  {/* Glossy effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none" role="img" aria-label="flag">
                        {getTeamFlag(matchedSticker.teamCode)}
                      </span>
                      <div>
                        <div className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded font-bold inline-block tracking-wide uppercase">
                          {matchedSticker.team}
                        </div>
                        <h3 className="font-bold text-base text-on-surface mt-0.5">
                          {matchedSticker.name || `Figurinha ${matchedSticker.code}`}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-center flex-col shadow-inner flex-shrink-0">
                      <span className="font-mono font-black text-base text-on-surface leading-none">{matchedSticker.code}</span>
                    </div>
                  </div>

                  {/* Stats Details Row */}
                  <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/50">
                      <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Você Já Possui</span>
                      <span className={`font-title-md text-title-md font-bold block mt-0.5 ${matchedSticker.quantityOwned > 0 ? 'text-emerald-400' : 'text-on-surface/40'}`}>
                        {matchedSticker.quantityOwned} un.
                      </span>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/50">
                      <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Status Atual</span>
                      <span className={`text-xs font-bold block mt-1.5`}>
                        {matchedSticker.quantityOwned > 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                            COLADA
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm font-bold">pending</span>
                            FALTANDO
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Big Action Add Button */}
                  <div className="relative z-10">
                    {addSuccess ? (
                      <div className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 animate-pulse">
                        <span className="material-symbols-outlined font-bold">done_all</span>
                        Adicionada com Sucesso!
                      </div>
                    ) : (
                      <button
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="w-full bg-secondary text-on-secondary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-secondary/20 hover:shadow-secondary/40 cursor-pointer group"
                      >
                        {isAdding ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-on-secondary"></div>
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            <span>Adicionar à Coleção (+1)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Scanner Laser Animation Helper Styles */}
      <style jsx global>{`
        @keyframes scanLine {
          0% { top: 0%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: calc(100% - 4px); opacity: 0.8; }
        }
        @keyframes scale-up-down {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up-down {
          animation: scale-up-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}
