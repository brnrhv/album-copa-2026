"use client";

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { Sticker } from "../types";

interface DetectedItem {
  id: string;
  rawCode: string;
  matchedSticker: Sticker | null;
  selected: boolean;
}

function getTeamFlag(teamCode: string): string {
  const flags: Record<string, string> = {
    'BRA': '🇧🇷', 'ARG': '🇦🇷', 'FRA': '🇫🇷', 'GER': '🇩🇪', 'ESP': '🇪🇸', 'ITA': '🇮🇹', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'POR': '🇵🇹',
    'BEL': '🇧🇪', 'NED': '🇳🇱', 'URU': '🇺🇾', 'MEX': '🇲🇽', 'USA': '🇺🇸', 'CAN': '🇨🇦', 'JPN': '🇯🇵', 'KOR': '🇰🇷',
    'SEN': '🇸🇳', 'MAR': '🇲🇦', 'TUN': '🇹🇳', 'CMR': '🇨🇲', 'GHA': '🇬🇭', 'CRO': '🇭🇷', 'SRB': '🇷🇸', 'SUI': '🇨🇭',
    'POL': '🇵🇱', 'DEN': '🇩🇰', 'AUS': '🇦🇺', 'KSA': '🇸🇦', 'QAT': '🇶🇦', 'ECU': '🇪🇨', 'IRN': '🇮🇷', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'CRC': '🇨🇷', 'COL': '🇨🇴', 'ITA2': '🇮🇹', 'SWE': '🇸🇪', 'UKR': '🇺🇦', 'CIV': '🇨🇮', 'NGA': '🇳🇬', 'EGY': '🇪🇬',
    'PAR': '🇵🇾', 'CHI': '🇨🇱', 'PER': '🇵🇪', 'VEN': '🇻🇪', 'BOL': '🇧🇴', 'PAN': '🇵🇦', 'HON': '🇭🇳', 'JAM': '🇯🇲',
    'RSA': '🇿🇦', 'ALG': '🇩🇿', 'NZL': '🇳🇿', 'CHN': '🇨🇳', 'IRQ': '🇮🇶', 'FWC': '🏆', 'CC': '🏟️'
  };
  return flags[teamCode] || '⚽';
}

export default function ScannerPage() {
  const { stickers, updateSticker, isHydrated, user } = useAppContext();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [scanComplete, setScanComplete] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // List of items found
  const [detectedCandidates, setDetectedCandidates] = useState<DetectedItem[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to normalize a raw code string (E.g., BRA 7 -> BRA07)
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

  // Update matching sticker on rawCode change
  const updateItemMatch = (id: string, code: string) => {
    const normalized = normalizeCode(code);
    const found = stickers.find(s => s.id === normalized || s.code === normalized);
    
    setDetectedCandidates(prev => 
      prev.map(item => item.id === id ? { 
        ...item, 
        rawCode: code.toUpperCase(), 
        matchedSticker: found || null,
        // Keep checked if it matched something valid, uncheck if empty
        selected: found ? true : item.selected
      } : item)
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setScanComplete(false);
    setScanError(null);
    setDetectedCandidates([]);
    setAddSuccess(false);
    setOcrStatus("Inicializando Câmera...");

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsScanning(true);

    try {
      setOcrStatus("Carregando foto...");
      const formData = new FormData();
      formData.append("image", file);

      setOcrStatus("Analisando com Gemini Vision...");
      
      const response = await fetch("/api/scan-sticker", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro de conexão com a IA.");
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const rawCodes: string[] = result.codes || [];

      if (rawCodes.length === 0) {
        setOcrStatus("Nenhum código visível detectado.");
        // Allow manual correction row
        setDetectedCandidates([{
          id: Date.now().toString(),
          rawCode: "",
          matchedSticker: null,
          selected: true
        }]);
      } else {
        // Map detection results to candidate items
        const mapped = rawCodes.map((code, index) => {
          const clean = normalizeCode(code);
          const found = stickers.find(s => s.id === clean || s.code === clean);
          return {
            id: `${Date.now()}-${index}`,
            rawCode: clean,
            matchedSticker: found || null,
            selected: !!found // autoselect valid stickers
          };
        });
        setDetectedCandidates(mapped);
      }
      
      setScanComplete(true);

    } catch (err: any) {
      console.error("Failed to scan sticker:", err);
      setScanError(err.message || "Não foi possível concluir o escaneamento.");
      // Set single empty manual input so user is not blocked
      setDetectedCandidates([{
        id: Date.now().toString(),
        rawCode: "",
        matchedSticker: null,
        selected: true
      }]);
      setScanComplete(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleToggleSelect = (id: string) => {
    setDetectedCandidates(prev =>
      prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item)
    );
  };

  const handleRemoveCandidate = (id: string) => {
    setDetectedCandidates(prev => prev.filter(item => item.id !== id));
  };

  const handleAddManualCandidate = () => {
    setDetectedCandidates(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        rawCode: "",
        matchedSticker: null,
        selected: true
      }
    ]);
    setTimeout(() => {
      // Scroll down / focus last input if possible
    }, 50);
  };

  const handleSaveBatch = async () => {
    const validSelection = detectedCandidates.filter(c => c.selected && c.matchedSticker);
    if (validSelection.length === 0) return;

    try {
      setIsAdding(true);
      
      // Save each sticker sequentially or concurrently via updateSticker
      await Promise.all(
        validSelection.map(async (item) => {
          if (!item.matchedSticker) return;
          const currentQty = item.matchedSticker.quantityOwned || 0;
          await updateSticker(item.matchedSticker.id, {
            quantityOwned: currentQty + 1
          });
        })
      );

      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        handleReset(); // smooth reset
      }, 2800);
    } catch (error) {
      console.error("Error saving scanned stickers:", error);
      alert("Ocorreu um erro ao salvar as figurinhas na coleção.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setScanComplete(false);
    setIsScanning(false);
    setScanError(null);
    setDetectedCandidates([]);
    setAddSuccess(false);
  };

  const selectedCount = detectedCandidates.filter(c => c.selected && c.matchedSticker).length;

  if (!isHydrated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-16 px-4">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-md text-display-md font-bold text-on-surface flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-3xl">photo_camera</span>
            </div>
            Scanner IA Gemini
          </h1>
          <p className="text-on-surface-variant font-body-md mt-1">
            Reconhecimento visual multimodal ultra-preciso baseado no Google Gemini Flash.
          </p>
        </div>
        {previewUrl && !isScanning && (
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-surface-container-high border border-outline text-on-surface hover:bg-surface-container font-bold rounded-xl flex items-center gap-2 transition-all text-sm cursor-pointer active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm font-bold">refresh</span>
            Limpar / Novo Scan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Picture & Camera Capture (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
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
              relative w-full aspect-[4/3] md:aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden border-2 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group
              ${!previewUrl 
                ? 'border-dashed border-outline hover:border-secondary hover:bg-secondary/5 bg-surface-container-lowest' 
                : 'border-transparent bg-zinc-950 shadow-2xl'}
            `}
          >
            {!previewUrl ? (
              <div className="text-center p-8 select-none pointer-events-none flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 duration-500 shadow-inner">
                  <span className="material-symbols-outlined text-secondary text-5xl">linked_camera</span>
                </div>
                <h3 className="font-bold text-xl text-on-surface tracking-tight">Fotografar Figurinha</h3>
                <p className="text-sm text-on-surface-variant/80 max-w-xs mt-3 leading-relaxed">
                  Aponte a câmera para uma ou mais figurinhas. O Gemini lerá todos os códigos no topo.
                </p>
                <div className="mt-8 px-6 py-3 bg-secondary text-on-secondary font-bold text-sm rounded-2xl shadow-lg shadow-secondary/30 group-hover:shadow-secondary/50 transition-all">
                  Abrir Câmera / Upload
                </div>
              </div>
            ) : (
              <>
                {/* Photo Image Preview */}
                <img 
                  src={previewUrl} 
                  alt="Foto Escaneada" 
                  className={`w-full h-full object-contain transition-all duration-700 ${isScanning ? 'opacity-50 blur-[3px] scale-[0.98]' : 'scale-100'}`}
                />

                {/* Scanning Layer Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 animate-fade-in">
                    {/* Futuristic Grid Overlay */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    {/* Animated scan line */}
                    <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_20px_4px_rgba(var(--secondary-rgb),0.6)] animate-[scanLine_3s_infinite]"></div>
                    
                    <div className="relative flex flex-col items-center bg-surface-container-lowest/85 backdrop-blur-xl border border-white/10 px-6 py-8 rounded-3xl shadow-2xl max-w-[280px] w-full text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-secondary/20 border-t-secondary animate-spin mb-4"></div>
                      <h4 className="font-mono text-[10px] font-black tracking-[0.25em] text-secondary uppercase mb-2 animate-pulse">Processando IA</h4>
                      <p className="text-sm text-on-surface font-bold">{ocrStatus}</p>
                    </div>
                  </div>
                )}

                {/* Finished Success Checkmark */}
                {scanComplete && !isScanning && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full p-2 shadow-xl border border-emerald-400 animate-[scale-up-down_0.5s_ease-out]">
                    <span className="material-symbols-outlined block text-xl font-bold">verified</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tip banner */}
          <div className="p-4 bg-surface-container border border-outline-variant/40 rounded-2xl flex gap-3">
            <span className="material-symbols-outlined text-secondary mt-0.5">lightbulb</span>
            <div className="text-xs text-on-surface-variant/90 leading-relaxed">
              <strong>A IA do Gemini é inteligente:</strong> Ela lê códigos inclinados, pequenos e com brilho. Você também pode colocar várias figurinhas na mesma foto!
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Check List & Confirmations (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Confirmation Panel Card */}
          <div className={`bg-surface-container rounded-3xl border transition-all duration-500 shadow-xl overflow-hidden ${scanComplete ? 'border-outline border-2 translate-y-0 opacity-100' : 'border-outline-variant opacity-50 pointer-events-none'}`}>
            
            {/* Card Header */}
            <div className="bg-surface-container-high/50 border-b border-outline-variant/50 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-2xl">playlist_add_check</span>
                <div>
                  <h2 className="font-bold text-lg text-on-surface font-title-lg tracking-tight">Confirmar Figurinhas</h2>
                  <p className="text-xs text-on-surface-variant font-body-sm mt-0.5">Valide o que a IA detectou antes de salvar</p>
                </div>
              </div>
              {scanComplete && (
                <span className="bg-secondary/15 text-secondary border border-secondary/20 font-mono font-black text-[10px] px-2.5 py-1 rounded-full tracking-wider">
                  GEMINI 1.5 FLASH
                </span>
              )}
            </div>

            {/* Server API / Key Alert */}
            {scanError && (
              <div className="mx-6 mt-6 p-4 bg-error/10 border border-error/30 text-error font-body-md text-xs rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-base">warning</span>
                <div className="flex-1">
                  <p className="font-bold">Erro de API:</p>
                  <p className="opacity-90 mt-1">{scanError}</p>
                  <p className="mt-2 underline font-semibold text-[10px]">Você ainda pode digitar os códigos manualmente abaixo!</p>
                </div>
              </div>
            )}

            {/* List Content */}
            <div className="p-6 flex flex-col gap-4">
              {detectedCandidates.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-5xl opacity-30 mb-3">photo_library</span>
                  <p className="text-sm font-medium">Nenhuma figurinha escaneada ainda.</p>
                  <p className="text-xs opacity-80 mt-1">Tire uma foto para listar as figurinhas aqui.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {detectedCandidates.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300
                        ${item.selected 
                          ? 'bg-surface-container-highest border-secondary/40 shadow-md' 
                          : 'bg-surface-container-low border-outline-variant opacity-70'}
                      `}
                    >
                      {/* Left checkbox trigger */}
                      <button 
                        onClick={() => handleToggleSelect(item.id)}
                        className="flex-shrink-0 flex items-center cursor-pointer"
                        type="button"
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${item.selected ? 'bg-secondary border-secondary' : 'border-outline hover:border-on-surface'}`}>
                          {item.selected && <span className="material-symbols-outlined text-sm text-on-secondary font-black">check</span>}
                        </div>
                      </button>

                      {/* Editable Code Input Row */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Código Detectado</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={item.rawCode}
                            onChange={(e) => updateItemMatch(item.id, e.target.value)}
                            placeholder="Ex: BRA17"
                            className="w-full font-mono font-black text-lg px-3 py-2 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/15 outline-none rounded-xl text-on-surface tracking-widest uppercase"
                          />
                        </div>
                      </div>

                      {/* Matched Detail Indicator */}
                      <div className="flex-[2] flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Correspondência no Álbum</label>
                        
                        {item.matchedSticker ? (
                          <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/60 px-3 py-1.5 rounded-xl h-[42px]">
                            <span className="text-2xl leading-none select-none" role="img" aria-label="flag">
                              {getTeamFlag(item.matchedSticker.teamCode)}
                            </span>
                            <div className="truncate flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-on-surface truncate leading-tight">
                                {item.matchedSticker.name}
                              </h4>
                              <p className="text-[9px] font-semibold text-on-surface-variant leading-tight mt-0.5 flex items-center gap-1">
                                <span className="text-secondary">{item.matchedSticker.team}</span>
                                • 
                                <span>{item.matchedSticker.quantityOwned > 0 ? `Já Possui: ${item.matchedSticker.quantityOwned}un.` : 'Faltando ❌'}</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-error/10 border border-error/20 px-3 py-1.5 rounded-xl h-[42px]">
                            <span className="material-symbols-outlined text-error text-base">warning</span>
                            <span className="text-error text-xs font-bold uppercase tracking-wide">Inexistente / Digite Código</span>
                          </div>
                        )}
                      </div>

                      {/* Delete row icon */}
                      <button
                        onClick={() => handleRemoveCandidate(item.id)}
                        className="p-2 hover:bg-error/10 hover:text-error text-on-surface-variant/50 rounded-xl transition-colors self-end md:self-center cursor-pointer"
                        title="Remover Linha"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Manual Row Button */}
              {scanComplete && (
                <button
                  onClick={handleAddManualCandidate}
                  className="w-full mt-2 border border-dashed border-outline hover:border-secondary hover:bg-secondary/5 text-on-surface hover:text-secondary font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm bg-transparent"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Adicionar Outra Manualmente
                </button>
              )}
            </div>

            {/* Bottom Save Action Panel */}
            {detectedCandidates.length > 0 && (
              <div className="bg-surface-container-high/40 border-t border-outline-variant/50 px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <span className="text-xs text-on-surface-variant font-medium block">Resumo da Confirmação:</span>
                  <span className="text-sm font-bold text-on-surface">
                    {selectedCount} {selectedCount === 1 ? 'figurinha selecionada' : 'figurinhas selecionadas'} para somar (+1)
                  </span>
                </div>

                {addSuccess ? (
                  <div className="w-full md:w-auto bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 animate-[scale-up-down_0.4s_ease-out]">
                    <span className="material-symbols-outlined font-bold text-xl">task_alt</span>
                    <span>Adicionadas com Sucesso!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveBatch}
                    disabled={selectedCount === 0 || isAdding}
                    className={`
                      w-full md:w-auto px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg cursor-pointer
                      ${selectedCount === 0 || isAdding 
                        ? 'bg-surface-container-highest text-on-surface-variant/40 shadow-none cursor-not-allowed' 
                        : 'bg-secondary text-on-secondary shadow-secondary/20 hover:shadow-secondary/45'}
                    `}
                  >
                    {isAdding ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-on-secondary"></div>
                        <span>Gravando no Álbum...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">save_as</span>
                        <span>Confirmar e Adicionar (+{selectedCount})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>
          
        </div>

      </div>

      {/* Futuristic Scanning Keyframes */}
      <style jsx global>{`
        @keyframes scanLine {
          0% { top: 0%; opacity: 0.2; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.2; }
        }
        @keyframes scale-up-down {
          0% { transform: scale(0.92); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--on-surface-rgb), 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--on-surface-rgb), 0.2);
        }
      `}</style>

    </div>
  );
}
