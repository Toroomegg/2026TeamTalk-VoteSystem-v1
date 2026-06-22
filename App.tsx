import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Candidate, VoteCategory, Souvenir, VoteDetail } from './types';
import { voteService } from './services/voteService';
import Fireworks from './components/Fireworks';

// --- Shared Helper for Image Fallback ---
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&w=800&q=80";
};

// --- Custom Confirmation Dialog ---
const ConfirmModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    isDangerous?: boolean;
    showCancel?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, isDangerous, showCancel = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0b0f24] border-2 border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-white">
                <h3 className={`text-xl font-bold mb-2 ${isDangerous ? 'text-red-500' : 'text-[#73c8ce]'}`}>{title}</h3>
                <p className="text-slate-300 mb-6 whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    {showCancel && (
                        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">取消</button>
                    )}
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg font-bold transition-all active:scale-95 ${isDangerous ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500'}`}>確定</button>
                </div>
            </div>
        </div>
    );
};

// --- Staff Identity Verification Modal ---
const StaffIdModal: React.FC<{
    isOpen: boolean;
    onConfirm: (staffId: string, name: string) => void;
    onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
    const [staffId, setStaffId] = useState('');
    const [name, setName] = useState('');
    const [foundName, setFoundName] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStaffId('');
            setName('');
            setFoundName(null);
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        const trimmed = staffId.trim().toUpperCase();
        if (trimmed.length >= 4) {
            voteService.lookupStaff(trimmed).then(res => {
                if (res.success && res.name) {
                    setName(res.name);
                    setFoundName(res.name);
                } else {
                    setFoundName(null);
                }
            });
        } else {
            setFoundName(null);
        }
    }, [staffId]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const trimmedId = staffId.trim().toUpperCase();
        const trimmedName = name.trim();
        if (!trimmedId) {
            setError('請輸入您的工號');
            return;
        }
        if (!trimmedName) {
            setError('請輸入您的姓名');
            return;
        }
        setError('');
        onConfirm(trimmedId, trimmedName);
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="glass-panel p-8 rounded-[2rem] max-w-sm w-full border-2 border-sky-500/30 shadow-[0_0_50px_rgba(115,200,206,0.3)] text-white">
                <h3 className="text-2xl font-black text-[#73c8ce] text-center mb-2">員工身分驗證</h3>
                <p className="text-slate-400 text-center text-xs mb-6 font-medium">請輸入您的員工工號，系統將自動比對並帶入真實姓名</p>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">工號 (測試可用 QA00001)</label>
                        <input 
                            type="text" 
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            placeholder="請輸入工號"
                            className="w-full bg-slate-900/50 border-2 border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-sky-300 focus:border-[#73c8ce] outline-none transition-all placeholder:text-slate-700"
                            maxLength={8}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">真實姓名</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="輸入工號後自動填寫"
                            className="w-full bg-slate-900/50 border-2 border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-sky-300 focus:border-[#73c8ce] outline-none transition-all placeholder:text-slate-705"
                        />
                    </div>
                    {foundName && (
                        <p className="text-emerald-400 text-center text-xs font-black animate-fade-in">✓ 已自動比對姓名：{foundName}</p>
                    )}
                    {error && <p className="text-red-500 text-center text-xs font-bold animate-pulse">{error}</p>}
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleSubmit} 
                        className="w-full py-4 rounded-xl font-black text-lg bg-gradient-to-r from-sky-500 to-[#202d98] text-white hover:to-sky-600 transition-all shadow-lg active:scale-95"
                    >
                        下一步：選擇紀念品
                    </button>
                    <button onClick={onCancel} className="w-full py-2 text-slate-500 font-bold hover:text-slate-300 text-sm transition-colors">取消</button>
                </div>
            </div>
        </div>
    );
};

// --- Product Souvenir Selection popup page ---
const SouvenirSelectionModal: React.FC<{
    isOpen: boolean;
    souvenirs: Souvenir[];
    onConfirm: (souvenirId: string, souvenirName: string, backupSouvenirId?: string | null, backupSouvenirName?: string | null) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}> = ({ isOpen, souvenirs, onConfirm, onCancel, isSubmitting }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [backupId, setBackupId] = useState<string | null>(null);

    // Reset backup selection whenever the primary choice changes
    useEffect(() => {
        setBackupId(null);
    }, [selectedId]);

    if (!isOpen) return null;

    const selectedSouvenir = souvenirs.find(s => s.id === selectedId);

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="glass-panel p-8 rounded-[2.5rem] max-w-md w-full border-2 border-sky-400/30 shadow-[0_0_50px_rgba(115,200,206,0.2)] text-white max-h-[85vh] overflow-y-auto">
                <h3 className="text-2xl font-black text-center mb-1 text-[#73c8ce]">🎁 恭喜！選擇您的活動紀念品</h3>
                <p className="text-slate-400 text-center text-xs mb-6">每位員工限領一份，送出後即時扣減存量</p>
                
                <div className="space-y-3 mb-6">
                    {souvenirs.map((s) => {
                        const isSelected = selectedId === s.id;
                        const isOutOfStock = s.quantity <= 0;
                        return (
                            <div 
                                key={s.id}
                                onClick={() => !isOutOfStock && setSelectedId(s.id)}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                                    isOutOfStock 
                                      ? 'bg-slate-900/30 border-slate-800 opacity-40 cursor-not-allowed' 
                                      : isSelected 
                                        ? 'bg-sky-500/10 border-[#73c8ce] shadow-[0_0_15px_rgba(115,200,206,0.3)]' 
                                        : 'bg-slate-900/40 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                <div className="flex items-center gap-3 max-w-[70%]">
                                    {s.image ? (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex-shrink-0">
                                            <img 
                                                src={s.image} 
                                                className="w-full h-full object-cover" 
                                                onError={handleImageError}
                                                loading="lazy"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-2xl shrink-0">{isOutOfStock ? '❌' : isSelected ? '🎯' : '🎁'}</span>
                                    )}
                                    <div className="truncate">
                                        <div className={`font-bold text-sm truncate ${isSelected ? 'text-[#73c8ce]' : 'text-white'}`}>{s.name}</div>
                                        <div className="text-[10px] text-slate-400">目前現場限量供應</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {isOutOfStock ? (
                                        <span className="text-xs bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-500/30 font-black">已領取完畢</span>
                                    ) : (
                                        <span className={`text-sm font-black font-mono ${isSelected ? 'text-[#73c8ce]' : 'text-sky-300'}`}>
                                            剩餘 {s.quantity} 份
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Warning and backup option selection if quantity is extremely low (<= 10) */}
                {selectedSouvenir && selectedSouvenir.quantity <= 10 && selectedSouvenir.quantity > 0 && (
                    <div className="bg-amber-950/70 border border-amber-500/40 p-4 rounded-2xl mb-5 text-xs text-amber-300 leading-relaxed shadow-lg">
                        <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                            <span>⚠️</span>
                            <span>現場庫存緊張警示 (剩餘 &le; 10 份)</span>
                        </div>
                        您選擇的「<strong className="text-white">{selectedSouvenir.name}</strong>」目前現場僅剩 <strong className="text-amber-400 font-mono text-sm">{selectedSouvenir.quantity}</strong> 份！
                        在您點擊送出的瞬間，可能因多位同仁併發搶兌而在此刻份數耗盡。
                        <br />
                        <span className="font-bold text-white">建議您預設「第二順位備選紀念品」：</span>
                        
                        <div className="mt-3">
                            <select 
                               value={backupId || ""} 
                               onChange={(e) => setBackupId(e.target.value || null)}
                               className="w-full bg-slate-950 border border-amber-500/30 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-400 font-bold"
                            >
                               <option value="">-- 無（若首選缺貨，則彈出提示另由人工選取）--</option>
                               {souvenirs.filter(s => s.id !== selectedId && s.quantity > 0).map(s => (
                                 <option key={s.id} value={s.id}>
                                   {s.name} (剩餘 {s.quantity} 份)
                                 </option>
                               ))}
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors">修改前台選票</button>
                    <button 
                        disabled={!selectedId || isSubmitting}
                        onClick={() => {
                            if (selectedSouvenir) {
                                const backupSouvenir = souvenirs.find(s => s.id === backupId);
                                onConfirm(selectedId, selectedSouvenir.name, backupId, backupSouvenir?.name);
                            }
                        }}
                        className={`flex-1 py-3.5 rounded-xl font-black transition-all text-center ${
                            selectedId && !isSubmitting
                              ? 'bg-gradient-to-r from-[#73c8ce] to-[#202d98] text-white active:scale-95 shadow-md' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? '正在扣剩餘投遞中...' : '確認送出投票'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Candidate Detail Modal (Product Info) ---
const CandidateDetailModal: React.FC<{
    candidate: Candidate | null;
    categoryTitle: string;
    onClose: () => void;
    onSelect: (id: string) => void;
    isSelected: boolean;
    canVote: boolean;
}> = ({ candidate, categoryTitle, onClose, onSelect, isSelected, canVote }) => {
    if (!candidate) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0b0f24] border-2 border-slate-750 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
                <div className="relative h-72">
                    <img 
                        src={candidate.image || "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&w=800&q=80"} 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        loading="lazy"
                        decoding="async"
                    />
                    <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all">✕</button>
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0b0f24] to-transparent p-6">
                        <span className="bg-[#202d98] text-white px-3 py-1 rounded-full text-[10px] font-bold mb-2 inline-block uppercase tracking-wider">{categoryTitle}</span>
                        <h3 className="text-3xl font-black text-white">{candidate.name}</h3>
                    </div>
                </div>
                <div className="p-6 text-white col-span-3">
                    <div className="mb-6">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">產品類別</p>
                        <p className="text-xl text-[#73c8ce] font-bold">🏷️ {candidate.song}</p>
                    </div>
                    {canVote ? (
                        <button 
                            onClick={() => { onSelect(candidate.id); onClose(); }}
                            className={`w-full py-4 rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 ${isSelected ? 'bg-teal-600 text-white cursor-default' : 'bg-gradient-to-r from-sky-400 to-[#202d98] text-white'}`}
                        >
                            {isSelected ? '✓ 已選擇此產品' : '選擇此款產品'}
                        </button>
                    ) : (
                        <div className="bg-slate-800 text-slate-500 py-4 rounded-2xl font-black text-center text-lg border border-slate-700">
                            投票通道尚未開啟
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Header Dynamic Component ---
const Header: React.FC<{ subtitle?: string; size?: 'small' | 'large' }> = ({ subtitle, size = 'large' }) => {
  const [logo, setLogo] = useState(voteService.logoUrl || '/logo.png');
  const [useText, setUseText] = useState(!voteService.logoUrl && !logo);

  useEffect(() => {
    const update = () => {
      const dbLogo = voteService.logoUrl;
      setLogo(dbLogo || '/logo.png');
      setUseText(!dbLogo && !logo);
    };
    update();
    const unsub = voteService.subscribe(update);
    return () => unsub();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0b0f26]/95 backdrop-blur-md border-b border-[#73c8ce]/25 py-4 px-4 select-none animate-fade-in-down w-full font-sans shadow-[0_10px_30px_rgba(0,0,0,0.65)]">
      <div className={`flex flex-col items-center justify-center ${size === 'large' ? 'mb-4' : 'mb-2'} relative group`}>
          <div className="absolute inset-0 bg-sky-500 blur-3xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
          {!useText ? (
              <img 
                 src={logo} 
                 key={logo}
                 alt="2026 TeamTalk Logo" 
                 onError={() => {
                     if (logo !== '/logo.png') {
                         setLogo('/logo.png');
                     } else {
                         setUseText(true);
                     }
                 }}
                 className={`${size === 'large' ? 'h-32 md:h-44' : 'h-14 md:h-18'} object-contain drop-shadow-[0_0_20px_rgba(115,200,206,0.3)]`} 
              />
          ) : (
              <>
                  <div className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#73c8ce] to-white tracking-widest leading-none ${size === 'large' ? 'text-4xl md:text-6xl' : 'text-xl md:text-3xl'} uppercase drop-shadow-[0_0_30px_rgba(115,200,206,0.3)]`}>
                    2026 TeamTalk
                  </div>
                  <div className={`text-[#73c8ce] tracking-[0.4em] font-black ${size === 'large' ? 'text-xs md:text-sm mt-3' : 'text-[9px] md:text-[11px] mt-1'} uppercase`}>
                    智能產品評核與對獎系統
                  </div>
              </>
          )}
      </div>
      {subtitle && <p className="text-sky-200 mt-1 font-medium tracking-[0.2em] text-xs md:text-sm drop-shadow-md text-center">&mdash; {subtitle} &mdash;</p>}
    </header>
  );
};

// --- Front Page (Votepage) ---
const VotePage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [selections, setSelections] = useState<{[key in VoteCategory]: string | null}>({
      [VoteCategory.SINGING]: null,
      [VoteCategory.POPULARITY]: null,
      [VoteCategory.COSTUME]: null
  });
  
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [isStaffIdModalOpen, setIsStaffIdModalOpen] = useState(false);
  const [isSouvenirModalOpen, setIsSouvenirModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterStaffId, setVoterStaffId] = useState('');
  const [clientIp, setClientIp] = useState("Unknown");
  const [justVoted, setJustVoted] = useState(false);
  const [finalAwardedName, setFinalAwardedName] = useState('');

  const [detailModal, setDetailModal] = useState<{ candidate: Candidate | null, category: VoteCategory | null, categoryTitle: string } | null>(null);

  const sectionRefs = {
      [VoteCategory.SINGING]: useRef<HTMLDivElement>(null),
      [VoteCategory.POPULARITY]: useRef<HTMLDivElement>(null),
      [VoteCategory.COSTUME]: useRef<HTMLDivElement>(null)
  };

  useEffect(() => {
    // Collect client real IP on mount safely
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIp(data.ip || "Unknown"))
      .catch(() => setClientIp("Unknown"));

    voteService.startPolling();
    const sync = () => {
      setCandidates(voteService.getCandidates());
      setSouvenirs(voteService.getSouvenirs());
      setIsVotingOpen(voteService.isVotingOpen);
    };
    sync();
    const unsub = voteService.subscribe(sync);
    return () => {
      voteService.stopPolling();
      unsub();
    };
  }, []);

  const handleSelect = (category: VoteCategory, candidateId: string) => {
      if (!isVotingOpen) return;
      setSelections(prev => ({ ...prev, [category]: candidateId }));
  };

  const isAllSelected = selections.SINGING && selections.POPULARITY && selections.COSTUME;

  const getProductName = (id: string | null) => {
    if (!id) return "未選擇";
    return candidates.find(c => c.id === id)?.name || "未知";
  };

  const scrollToCategory = (cat: VoteCategory) => {
      const ref = sectionRefs[cat];
      if (ref && ref.current) {
          const yOffset = -100;
          const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
      }
  };

  // Step 1: click vote -> open staff ID & name verification
  const handleStartSubmission = () => {
      if (!isAllSelected) return;
      setIsStaffIdModalOpen(true);
  };

  // Step 2: verified staff -> transition to souvenir selection popup page
  const handleIdentityVerified = (staffId: string, name: string) => {
      setVoterStaffId(staffId);
      setVoterName(name);
      setIsStaffIdModalOpen(false);
      setIsSouvenirModalOpen(true);
  };

  // Step 3: submit full payload (vote answers + verified staff info + chosen souvenir) to Firebase 
  const handleConfirmFullSubmission = async (
    souvenirId: string, 
    souvenirName: string,
    backupId?: string | null,
    backupName?: string | null
  ) => {
      setIsSubmitting(true);
      const result = await voteService.submitVoteBatch(
         selections as any,
         voterStaffId,
         voterName,
         souvenirId,
         souvenirName,
         clientIp,
         backupId,
         backupName
      );
      setIsSubmitting(false);

      if (result.success) {
          setIsSouvenirModalOpen(false);
          setFinalAwardedName(result.chosenSouvenirName || souvenirName);
          setJustVoted(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          alert(result.message || "提交失敗，請洽管理員");
      }
  };

  if (justVoted) {
      return (
          <div className="min-h-screen flex items-center justify-center px-4 relative z-10 bg-transparent">
              <Fireworks />
              <div className="glass-panel p-10 rounded-3xl text-center max-w-md border border-sky-400/50 shadow-2xl">
                  <div className="text-7xl mb-6 animate-bounce">🎁</div>
                  <h1 className="text-3xl font-black text-[#73c8ce] mb-4">投票與對獎成功！</h1>
                  <p className="text-slate-300 text-base mb-2">您的紀念品與評選結果已完美上傳及扣除存量。</p>
                  
                  <div className="my-5 bg-sky-500/10 border border-[#73c8ce]/30 text-[#73c8ce] px-5 py-3 rounded-2xl font-bold inline-block text-sm">
                     已鎖定兌換：{finalAwardedName || "選定的紀念品"}
                  </div>

                  <p className="text-xs text-slate-500 mb-8 font-mono">您的來源 IP: {clientIp}</p>
                  
                  <button 
                    onClick={() => { setJustVoted(false); setSelections({SINGING:null, POPULARITY:null, COSTUME:null}); }}
                    className="bg-gradient-to-r from-sky-400 to-[#202d98] hover:to-sky-500 text-white px-8 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg w-full"
                  >
                    返回前台 (測試多筆量)
                  </button>
              </div>
          </div>
      );
  }

  const SECTIONS = [
      { cat: VoteCategory.SINGING, title: "印象最深刻產品", sub: "Most Memorable Product", color: "border-sky-500/30", icon: "💎" },
      { cat: VoteCategory.POPULARITY, title: "最佳人氣產品", sub: "Most Popular Product", color: "border-[#73c8ce]/30", icon: "👑" },
      { cat: VoteCategory.COSTUME, title: "最有前瞻性產品", sub: "Most Forward-Looking Product", color: "border-indigo-500/30", icon: "🚀" }
  ];

  return (
    <div className="min-h-screen pb-64 px-2 md:px-4 relative z-10 pt-[11rem] md:pt-[13.5rem] bg-transparent text-white">
      <Header subtitle={isVotingOpen ? "BU1, BU11, BU15 高科技產品大賞" : "產品大賞目錄預覽"} size="small" />
      
      {!isVotingOpen && (
          <div className="max-w-xl mx-auto mb-6">
              <div className="bg-amber-500/20 border border-amber-500/50 p-4 rounded-2xl flex items-center justify-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <p className="text-amber-200 font-bold text-sm">評選通道尚未開啟，請留意活動現場提示</p>
              </div>
          </div>
      )}

      {/* Staff ID Verification popup */}
      <StaffIdModal 
          isOpen={isStaffIdModalOpen}
          onConfirm={handleIdentityVerified}
          onCancel={() => setIsStaffIdModalOpen(false)}
      />

      {/* Souvenirs Selection popup */}
      <SouvenirSelectionModal
          isOpen={isSouvenirModalOpen}
          souvenirs={souvenirs}
          onConfirm={handleConfirmFullSubmission}
          onCancel={() => {
              setIsSouvenirModalOpen(false);
              setIsStaffIdModalOpen(true); // fall back to staff edit
          }}
          isSubmitting={isSubmitting}
      />

      <CandidateDetailModal 
          candidate={detailModal?.candidate || null}
          categoryTitle={detailModal?.categoryTitle || ""}
          onClose={() => setDetailModal(null)}
          onSelect={(id) => handleSelect(detailModal!.category!, id)}
          isSelected={detailModal ? selections[detailModal.category!] === detailModal.candidate?.id : false}
          canVote={isVotingOpen}
      />

      <div className="max-w-4xl mx-auto space-y-6">
          {SECTIONS.map(section => (
            <div key={section.cat} ref={sectionRefs[section.cat]} className={`p-6 rounded-[2rem] border-2 ${section.color} bg-[#0c1232]/80 backdrop-blur-md shadow-xl`}>
                <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{section.icon}</span>
                        <div>
                            <h2 className="text-lg font-black text-white leading-tight">{section.title}</h2>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{section.sub}</p>
                        </div>
                    </div>
                    {isVotingOpen ? (
                        selections[section.cat] ? (
                            <div className="bg-emerald-600/20 text-[#73c8ce] border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black">✓ 已點選</div>
                        ) : (
                            <div className="bg-slate-800 text-slate-500 border border-slate-750 px-3 py-1 rounded-full text-[10px] font-black uppercase">待評選</div>
                        )
                    ) : (
                        <div className="bg-slate-800/40 text-slate-400 border border-slate-700/50 px-3 py-1 rounded-full text-[10px] font-black uppercase">僅供預覽</div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {candidates.map((c, idx) => {
                        const isSelected = selections[section.cat] === c.id;
                        return (
                            <div 
                                key={c.id} 
                                onClick={() => setDetailModal({ candidate: c, category: section.cat, categoryTitle: section.title })}
                                className="flex flex-col items-center cursor-pointer group"
                            >
                                <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl transition-all duration-300 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}>
                                    <div className={`w-full h-full rounded-2xl overflow-hidden border-2 ${isSelected ? 'border-sky-400 ring-4 ring-sky-400/30 shadow-[0_0_15px_rgba(115,200,206,0.5)]' : 'border-slate-800 bg-slate-900 group-hover:border-[#73c8ce]'} shadow-inner`}>
                                        <img 
                                            src={c.image || "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&w=400&q=80"} 
                                            className="w-full h-full object-cover" 
                                            onError={handleImageError}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                    {isVotingOpen && isSelected && (
                                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-sky-400 rounded-full flex items-center justify-center text-slate-950 text-xs font-black shadow-lg">✓</div>
                                    )}
                                </div>
                                <span className={`text-xs mt-2.5 truncate w-full text-center px-1 font-bold ${isSelected ? 'text-[#73c8ce]' : 'text-slate-300 group-hover:text-white'}`}>
                                    {c.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                    {c.song}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
          ))}
      </div>
      
      {/* Floating Bottom action sheet */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-xl mx-auto mb-4">
              <div className="grid grid-cols-3 gap-2">
                  {SECTIONS.map(s => (
                      <div 
                        key={s.cat}
                        onClick={() => scrollToCategory(s.cat)}
                        className={`p-2 rounded-xl text-center border cursor-pointer transition-all ${selections[s.cat] ? 'border-sky-400/50 bg-sky-500/10' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}>
                          <div className="text-[9px] text-[#73c8ce] font-black mb-0.5 uppercase tracking-tighter">{s.icon} {s.cat === VoteCategory.SINGING ? '最深刻' : s.cat === VoteCategory.POPULARITY ? '最人氣' : '前瞻性'}</div>
                          <div className="text-[11px] font-black text-white truncate">{getProductName(selections[s.cat])}</div>
                      </div>
                  ))}
              </div>
          </div>
          
          {isVotingOpen ? (
              <button 
                  onClick={handleStartSubmission} 
                  disabled={!isAllSelected} 
                  className={`w-full max-w-xl mx-auto block py-4 rounded-2xl font-black text-xl transition-all shadow-2xl ${isAllSelected ? 'bg-gradient-to-r from-sky-400 to-[#202d98] text-white hover:opacity-90 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                  {isAllSelected ? '確認送出三項評選大賞' : '請完成所有組別選擇'}
              </button>
          ) : (
              <div className="w-full max-w-xl mx-auto bg-slate-800 text-slate-400 py-4 rounded-2xl font-black text-center text-xl border border-slate-700 opacity-80">
                  請點擊卡片瀏覽產品照片
              </div>
          )}
      </div>
    </div>
  );
};

// --- Attendance Results Dashboard Page (原開票看板大幅更改) ---
const ResultsPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [staffRoster, setStaffRoster] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab ] = useState<'votes' | 'roster'>('votes');
  const [errorMsg, setErrorMsg] = useState('');
  const [authorizedStaffCount, setAuthorizedStaffCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    voteService.startPolling();
    const updateData = () => {
      setVoteDetails(voteService.getVoteDetails());
      setCandidates(voteService.getCandidates());
      setSouvenirs(voteService.getSouvenirs());
      setAuthorizedStaffCount(voteService.authorizedStaffCount);
      setStaffRoster(voteService.staffRoster);
    };
    updateData();
    const unsub = voteService.subscribe(updateData);
    return () => { voteService.stopPolling(); unsub(); };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin888') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('密碼錯誤，請重新確認！');
    }
  };

  const getProductName = (idToLookUp: string) => {
    return candidates.find(c => c.id === idToLookUp)?.name || "未知隨機產品";
  };

  const filteredDetails = voteDetails.filter(d => 
    d.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.souvenirName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoster = staffRoster.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting helper for ranking categories
  const sortedSinging = [...candidates].sort((a, b) => (b.scoreSinging || 0) - (a.scoreSinging || 0));
  const sortedPopularity = [...candidates].sort((a, b) => (b.scorePopularity || 0) - (a.scorePopularity || 0));
  const sortedCostume = [...candidates].sort((a, b) => (b.scoreCostume || 0) - (a.scoreCostume || 0));

  const totalSingingVotes = candidates.reduce((sum, c) => sum + (c.scoreSinging || 0), 0);
  const totalPopularityVotes = candidates.reduce((sum, c) => sum + (c.scorePopularity || 0), 0);
  const totalCostumeVotes = candidates.reduce((sum, c) => sum + (c.scoreCostume || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4 text-white">
        <form onSubmit={handleLogin} className="glass-panel p-8 rounded-2xl w-full max-w-md border border-slate-700">
          <h2 className="text-2xl font-bold text-center mb-6 text-[#73c8ce] tracking-wider">2026 TeamTalk 評選看板登入</h2>
          {errorMsg && <p className="text-red-500 text-sm text-center mb-4">{errorMsg}</p>}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 mb-6 text-white focus:border-[#73c8ce] outline-none text-center" placeholder="請輸入管理密碼" />
          <button type="submit" className="w-full bg-gradient-to-r from-sky-400 to-[#202d98] text-white font-bold py-4 rounded-lg transition-all active:scale-95 shadow-lg">揭曉投票與得獎名單</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white relative pb-32 flex flex-col items-center p-4 pt-[11rem] md:pt-[13.5rem]">
      <Fireworks />
      <div className="relative z-10 w-full max-w-6xl">
        <Header size="small" subtitle="同仁評選與紀念品領取統計看板" />

        {/* Dynamic Activity/Database Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0b1029]/85 border-l-4 border-sky-400 p-5 rounded-2xl border border-slate-800 text-left flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">👥 雲端匯入工號名單</div>
              <div className="text-2xl font-black text-sky-400 mt-1 font-mono">
                {authorizedStaffCount} <span className="text-sm font-bold text-slate-300">位同仁</span>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              名單已成功啟用，同仁可登入評選
            </div>
          </div>
          
          <div className="bg-[#0b1029]/85 border-l-4 border-pink-500 p-5 rounded-2xl border border-slate-800 text-left flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">🗳️ 目前已成功點選並送出人數</div>
              <div className="text-2xl font-black text-pink-400 mt-1 font-mono">
                {voteDetails.length} <span className="text-sm font-bold text-slate-300">人</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-2">
              系統正在持續動態更新與比對
            </div>
          </div>

          <div className="bg-[#0b1029]/85 border-l-4 border-indigo-500 p-5 rounded-2xl border border-slate-800 text-left flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">🎁 現場紀念品已發放 / 總量</div>
              <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">
                {voteDetails.length} <span className="text-sm font-bold text-slate-500">/ {souvenirs.reduce((sum, s) => sum + (s.quantity || 0), 0) + voteDetails.length} 份</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-2">
              紀念品存量實時扣除與更新
            </div>
          </div>
        </div>

        {/* Real-time Rankings Leaderboard */}
        <div className="mb-8 bg-[#0c1232]/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
          <h2 className="text-lg font-black text-[#73c8ce] mb-1 flex items-center gap-2">
            <span>🏆 2026 評選大賞即時開票榜</span>
            <span className="text-[10px] bg-sky-950 text-sky-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Live standings</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">
            全體同仁投遞狀況之累計即時票數排行榜，各組別獨立計票：
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category A */}
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💎</span>
                <div>
                  <h3 className="text-sm font-black text-white">印象最深刻產品</h3>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total votes: {totalSingingVotes}</p>
                </div>
              </div>
              <div className="space-y-3">
                {sortedSinging.map((c, i) => {
                  const percent = totalSingingVotes > 0 ? ((c.scoreSinging || 0) / totalSingingVotes) * 105 : 0;
                  const displayPercent = totalSingingVotes > 0 ? ((c.scoreSinging || 0) / totalSingingVotes) * 100 : 0;
                  return (
                    <div key={c.id} className="text-xs">
                      <div className="flex justify-between items-center mb-1 text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`font-mono font-black text-[10px] w-5 h-5 rounded-md flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-slate-950' : i === 1 ? 'bg-slate-300 text-slate-950' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {i + 1}
                          </span>
                          <span className="font-bold truncate">{c.name}</span>
                        </div>
                        <span className="font-mono font-bold text-sky-400 text-[11px] shrink-0">{c.scoreSinging || 0} 票 ({displayPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-sky-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent || 1}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category B */}
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👑</span>
                <div>
                  <h3 className="text-sm font-black text-white">最佳人氣產品</h3>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total votes: {totalPopularityVotes}</p>
                </div>
              </div>
              <div className="space-y-3">
                {sortedPopularity.map((c, i) => {
                  const percent = totalPopularityVotes > 0 ? ((c.scorePopularity || 0) / totalPopularityVotes) * 105 : 0;
                  const displayPercent = totalPopularityVotes > 0 ? ((c.scorePopularity || 0) / totalPopularityVotes) * 100 : 0;
                  return (
                    <div key={c.id} className="text-xs">
                      <div className="flex justify-between items-center mb-1 text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`font-mono font-black text-[10px] w-5 h-5 rounded-md flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-slate-950' : i === 1 ? 'bg-slate-300 text-slate-950' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {i + 1}
                          </span>
                          <span className="font-bold truncate">{c.name}</span>
                        </div>
                        <span className="font-mono font-bold text-[#73c8ce] text-[11px] shrink-0">{c.scorePopularity || 0} 票 ({displayPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-[#73c8ce] to-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent || 1}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category C */}
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚀</span>
                <div>
                  <h3 className="text-sm font-black text-white">最有前瞻性產品</h3>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total votes: {totalCostumeVotes}</p>
                </div>
              </div>
              <div className="space-y-3">
                {sortedCostume.map((c, i) => {
                  const percent = totalCostumeVotes > 0 ? ((c.scoreCostume || 0) / totalCostumeVotes) * 105 : 0;
                  const displayPercent = totalCostumeVotes > 0 ? ((c.scoreCostume || 0) / totalCostumeVotes) * 100 : 0;
                  return (
                    <div key={c.id} className="text-xs">
                      <div className="flex justify-between items-center mb-1 text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`font-mono font-black text-[10px] w-5 h-5 rounded-md flex items-center justify-center ${i === 0 ? 'bg-yellow-500 text-slate-950' : i === 1 ? 'bg-slate-300 text-slate-950' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {i + 1}
                          </span>
                          <span className="font-bold truncate">{c.name}</span>
                        </div>
                        <span className="font-mono font-bold text-indigo-400 text-[11px] shrink-0">{c.scoreCostume || 0} 票 ({displayPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent || 1}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Souvenirs inventory summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {souvenirs.map(s => {
             const issued = voteDetails.filter(d => d.souvenirId === s.id).length;
             return (
               <div key={s.id} className="glass-panel p-5 rounded-2xl border border-sky-500/20 text-center">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-1">🎁 {s.name}</div>
                 <div className="text-2xl font-black text-sky-300 font-mono">{s.quantity} <span className="text-xs text-slate-500">份剩餘</span></div>
                 <div className="text-xs text-slate-500 mt-1">現場已成功兌換：{issued} 份</div>
               </div>
             )
          })}
        </div>

        {/* Voting Data table container */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#73c8ce] flex items-center gap-2">
                <span>📋 實時數據查詢與比對系統</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'votes' 
                  ? '目前正在檢視 [同仁投票與領取詳情] 紀錄表 (由 Real-time Database 實時串接)' 
                  : '目前正在檢視 [已匯入之專屬准許投票員工名單] 配置 (共 ' + staffRoster.length + ' 人)'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Tab Selector Buttons */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex shrink-0">
                <button 
                  type="button"
                  onClick={() => setActiveTab('votes')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'votes' ? 'bg-[#73c8ce] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  📥 投票投遞詳情 ({filteredDetails.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('roster')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'roster' ? 'bg-[#73c8ce] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  👥 已匯入名單狀態 ({filteredRoster.length})
                </button>
              </div>

              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋工號、姓名..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-[#73c8ce] outline-none w-full sm:w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl">
            {activeTab === 'votes' ? (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#11193d] text-slate-400 uppercase text-xs">
                  <tr>
                     <th className="px-4 py-3.5">工號</th>
                     <th className="px-4 py-3.5">姓名</th>
                     <th className="px-4 py-3.5">1. 印象最深刻產品</th>
                     <th className="px-4 py-3.5">2. 最佳人氣產品</th>
                     <th className="px-4 py-3.5">3. 最有前瞻性產品</th>
                     <th className="px-4 py-3.5">選定紀念品</th>
                     <th className="px-4 py-3.5">IP 來源位址</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {filteredDetails.map((detail) => (
                    <tr key={detail.id} className="hover:bg-[#121c4b]/30">
                       <td className="px-4 py-3.5 font-bold text-sky-300 font-mono">{detail.staffId}</td>
                       <td className="px-4 py-3.5 font-bold text-white">{detail.name}</td>
                       <td className="px-4 py-3.5 text-xs text-slate-300">{getProductName(detail.singing)}</td>
                       <td className="px-4 py-3.5 text-xs text-slate-300">{getProductName(detail.popularity)}</td>
                       <td className="px-4 py-3.5 text-xs text-slate-300">{getProductName(detail.costume)}</td>
                       <td className="px-4 py-3.5">
                          <span className="bg-sky-950/70 border border-sky-500/30 text-sky-300 px-2 py-1 rounded-md text-xs font-bold">
                             {detail.souvenirName}
                          </span>
                       </td>
                       <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{detail.ip}</td>
                    </tr>
                  ))}
                  {filteredDetails.length === 0 && (
                    <tr>
                       <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                          暫無符合篩選條件的同仁投票數據。可能還沒有同仁完成投票投遞，請至前台提交測試！
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#11193d] text-slate-400 uppercase text-xs">
                  <tr>
                     <th className="px-4 py-3.5">專屬工號</th>
                     <th className="px-4 py-3.5">姓名</th>
                     <th className="px-4 py-3.5">認證權限狀態</th>
                     <th className="px-4 py-3.5">投票/領取狀態</th>
                     <th className="px-4 py-3.5">1. 印象最深刻產品</th>
                     <th className="px-4 py-3.5">2. 最佳人氣產品</th>
                     <th className="px-4 py-3.5">3. 最有前瞻性產品</th>
                     <th className="px-4 py-3.5">選定紀念品</th>
                     <th className="px-4 py-3.5">IP 來源位址</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {filteredRoster.map((member) => {
                    const detail = voteDetails.find(d => d.staffId.trim().toUpperCase() === member.id.trim().toUpperCase());
                    return (
                      <tr key={member.id} className="hover:bg-[#121c4b]/30">
                         <td className="px-4 py-3.5 font-bold text-[#73c8ce] font-mono">{member.id}</td>
                         <td className="px-4 py-3.5 font-bold text-white">{member.name || '（未註明姓名，僅憑此工號登入）'}</td>
                         <td className="px-4 py-3.5">
                            <span className="bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                               ✔️ 允許驗證投票
                            </span>
                         </td>
                         <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                            {member.used ? (
                              <span className="text-pink-400 font-bold bg-pink-950/60 border border-pink-500/30 px-2.5 py-1 rounded-lg">
                                 💖 已經完成投遞 (已鎖定且扣除紀念品)
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                                 ⏳ 尚未參與投遞
                              </span>
                            )}
                         </td>
                         <td className="px-4 py-3.5 text-xs text-slate-300">
                           {detail ? getProductName(detail.singing) : <span className="text-slate-600 font-mono">-</span>}
                         </td>
                         <td className="px-4 py-3.5 text-xs text-slate-300">
                           {detail ? getProductName(detail.popularity) : <span className="text-slate-600 font-mono">-</span>}
                         </td>
                         <td className="px-4 py-3.5 text-xs text-slate-300">
                           {detail ? getProductName(detail.costume) : <span className="text-slate-600 font-mono">-</span>}
                         </td>
                         <td className="px-4 py-3.5">
                           {detail ? (
                             <span className="bg-sky-950/70 border border-sky-500/30 text-sky-300 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                               {detail.souvenirName}
                             </span>
                           ) : (
                             <span className="text-slate-600 font-mono text-xs">-</span>
                           )}
                         </td>
                         <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                           {detail ? detail.ip : <span className="text-slate-600 font-mono">-</span>}
                         </td>
                      </tr>
                    );
                  })}
                  {filteredRoster.length === 0 && (
                    <tr>
                       <td colSpan={9} className="text-center py-10 text-slate-400 italic">
                          暫無符合篩選條件的工號，請至後台管理匯入員工清單。
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin management backend page ("後台管理") ---
const AdminPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>([]);
  
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [staffIdCsv, setStaffIdCsv] = useState('');
  const [authorizedStaffCount, setAuthorizedStaffCount] = useState(0);

  // Seeding/Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [resultModal, setResultModal] = useState({ isOpen: false, msg: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: false });

  // Product CRUD form state
  const [prodForm, setProdForm] = useState({ id: '', name: '', category: '', image: '', mode: 'ADD' });
  const [sForm, setSForm] = useState({ id: '', name: '', quantity: 100, image: '', mode: 'ADD' });

  // Custom Visual Settings
  const [logoInput, setLogoInput] = useState('');
  const [bgInput, setBgInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    voteService.startPolling();
    const update = () => {
        setCandidates(voteService.getCandidates());
        setSouvenirs(voteService.getSouvenirs());
        setVoteDetails(voteService.getVoteDetails());
        setIsVotingOpen(voteService.isVotingOpen);
        setAuthorizedStaffCount(voteService.authorizedStaffCount);
    };
    update();
    const unsub = voteService.subscribe(update);
    setLogoInput(voteService.logoUrl || '');
    setBgInput(voteService.bgUrl || '');
    return () => { voteService.stopPolling(); unsub(); };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin888') {
      setIsAuthenticated(true);
    } else {
      setResultModal({ isOpen: true, msg: '管理員認證失敗，密碼錯誤！' });
    }
  };

  // Product manipulation
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.category.trim()) {
        alert("產品名稱與類別不能為空！");
        return;
    }
    setIsSyncing(true);
    let res;
    if (prodForm.mode === 'ADD') {
        res = await voteService.addProduct(prodForm.name, prodForm.category, prodForm.image);
    } else {
        res = await voteService.saveProduct(prodForm.id, prodForm.name, prodForm.category, prodForm.image);
    }
    setIsSyncing(false);
    setResultModal({ isOpen: true, msg: res.message });
    setProdForm({ id: '', name: '', category: '', image: '', mode: 'ADD' });
  };

  // Souvenir manipulation
  const handleSouvenirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sForm.name.trim()) {
        alert("紀念品品名不能為空！");
        return;
    }
    setIsSyncing(true);
    let res;
    if (sForm.mode === 'ADD') {
        res = await voteService.addSouvenir(sForm.name, sForm.quantity, sForm.image);
    } else {
        res = await voteService.saveSouvenir(sForm.id, sForm.name, sForm.quantity, sForm.image);
    }
    setIsSyncing(false);
    setResultModal({ isOpen: true, msg: res.message });
    setSForm({ id: '', name: '', quantity: 100, image: '', mode: 'ADD' });
  };

  const handleStaffIdUpload = async () => {
      if (!staffIdCsv.trim()) {
          setResultModal({ isOpen: true, msg: "請先貼入工號名單。" });
          return;
      }
      setIsSyncing(true);
      const res = await voteService.uploadStaffIds(staffIdCsv);
      setIsSyncing(false);
      setResultModal({ isOpen: true, msg: res.message });
      setStaffIdCsv('');
  };

  const handlePurgeStaff = async () => {
    setIsSyncing(true);
    const res = await voteService.purgeStaffVerification();
    setIsSyncing(false);
    setResultModal({ isOpen: true, msg: res.message });
  };

  const handleVisualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const res = await voteService.saveVisualSettings(logoInput.trim(), bgInput.trim());
    setIsSyncing(false);
    setResultModal({ isOpen: true, msg: res.message });
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-10 text-white font-sans overflow-x-hidden pb-32">
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} isDangerous={confirmModal.isDangerous} />
      <ConfirmModal isOpen={resultModal.isOpen} title="後台操作訊息" message={resultModal.msg} onConfirm={() => setResultModal({isOpen:false, msg:''})} showCancel={false} />
      
      {!isAuthenticated ? (
         <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
           <form onSubmit={handleLogin} className="glass-panel p-8 rounded-2xl w-full max-w-md border border-slate-700">
             <h2 className="text-2xl font-bold text-center mb-6 text-[#73c8ce] tracking-wider">2026 TeamTalk 系統管理後台</h2>
             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 mb-6 text-white focus:border-[#73c8ce] outline-none text-center" placeholder="請輸入管理密碼" />
             <button type="submit" className="w-full bg-gradient-to-r from-[#202d98] to-sky-500 hover:to-sky-400 text-white font-bold py-4 rounded-lg transition-all active:scale-95">驗證密碼進入</button>
           </form>
         </div>
      ) : (
         <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#73c8ce]">⚙️ TeamTalk 後台維護管理</h1>
                    <p className="text-xs text-slate-400 mt-1.5 font-mono">系統目前版本：v1.3.3 (更新日期: 2026-06-22)</p>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-bold shadow-md transition-colors">登出</button>
            </div>

            {/* Quick Summary Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase">印象最深刻產品 總計得票</div>
                    <div className="text-3xl font-black text-yellow-500 font-mono">{candidates.reduce((sum, c) => sum + (c.scoreSinging || 0), 0)}</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase">最佳人氣產品 總計得票</div>
                    <div className="text-3xl font-black text-pink-500 font-mono">{candidates.reduce((sum, c) => sum + (c.scorePopularity || 0), 0)}</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase">最有前瞻性產品 總計得票</div>
                    <div className="text-3xl font-black text-purple-500 font-mono">{candidates.reduce((sum, c) => sum + (c.scoreCostume || 0), 0)}</div>
                </div>
                <div className="bg-[#202d98]/50 border border-sky-500/30 p-4 rounded-2xl text-center shadow-lg">
                    <div className="text-[10px] font-black text-sky-400 uppercase">活動總投票人次 (同仁)</div>
                    <div className="text-3xl font-black text-white font-mono">{voteDetails.length} 人</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: forms & settings */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Channel controller */}
                    <div className="bg-[#0b1029]/75 border border-slate-800 p-6 rounded-3xl shadow-xl border-l-4 border-sky-400">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">🕹️ 投票通道控制</h2>
                        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                            <span className={`font-black tracking-wider ${isVotingOpen ? 'text-green-400' : 'text-slate-400'}`}>{isVotingOpen ? '前台投票中：開啟' : '前台投票中：關閉'}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isVotingOpen} onChange={() => voteService.setVotingStatus(!isVotingOpen)} />
                                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-400"></div>
                            </label>
                        </div>
                    </div>

                    {/* Visual Settings Form */}
                    <div className="bg-[#0b1029]/75 border border-slate-800 p-6 rounded-3xl shadow-xl border-l-4 border-[#73c8ce]">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#73c8ce]">🖼️ 系統 Logo 與背景圖設定</h2>
                        <form onSubmit={handleVisualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">系統 Logo 圖片 URL (貼上網址)</label>
                                <input 
                                    type="text" 
                                    value={logoInput} 
                                    onChange={e => setLogoInput(e.target.value)} 
                                    placeholder="留空即預設顯示 /logo.png 圖片" 
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs font-mono focus:border-sky-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">系統背景圖片 URL (貼上網址)</label>
                                <input 
                                    type="text" 
                                    value={bgInput} 
                                    onChange={e => setBgInput(e.target.value)} 
                                    placeholder="留空即預設顯示高階漸層宇宙背景" 
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs font-mono focus:border-sky-500 outline-none" 
                                />
                            </div>
                            <button type="submit" disabled={isSyncing} className="w-full py-3 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-black transition-all">
                                儲存視覺設定 (立即生效)
                            </button>
                        </form>
                    </div>

                    {/* Manage Products Form */}
                    <div className="bg-[#0b1029]/75 border border-slate-800 p-6 rounded-3xl shadow-xl">
                        <h2 className="text-lg font-bold mb-4 text-[#73c8ce]">{prodForm.mode === 'ADD' ? '➕ 新增評選產品' : '✏️ 修改評選產品'}</h2>
                        <form onSubmit={handleProductSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">產品名稱</label>
                                <input type="text" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} placeholder="例如：量子解密伺服器" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">產品類別 / 原創小組</label>
                                <input type="text" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})} placeholder="例如：BU1 高階硬體組" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">產品照 URL 地址</label>
                                <input type="text" value={prodForm.image} onChange={e => setProdForm({...prodForm, image: e.target.value})} placeholder="https://unsplash..." className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs font-mono" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={isSyncing} className="flex-1 py-3 bg-[#202d98] hover:opacity-90 rounded-xl text-sm font-black transition-all">
                                    {prodForm.mode === 'ADD' ? '新增此產品' : '儲存產品更新'}
                                </button>
                                {prodForm.mode === 'EDIT' && (
                                    <button type="button" onClick={() => setProdForm({ id: '', name: '', category: '', image: '', mode: 'ADD' })} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm">取消</button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Manage Souvenirs Form */}
                    <div className="bg-[#0b1029]/75 border border-slate-800 p-6 rounded-3xl shadow-xl border-l-4 border-indigo-500">
                        <h2 className="text-lg font-bold mb-4 text-[#73c8ce]">{sForm.mode === 'ADD' ? '➕ 新增紀念品' : '✏️ 修改紀念品與設定剩餘存量'}</h2>
                        <form onSubmit={handleSouvenirSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">紀念品品名</label>
                                <input type="text" value={sForm.name} onChange={e => setSForm({...sForm, name: e.target.value})} placeholder="例如：2026 陶瓷馬克杯" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">紀念品圖片 URL (貼上網址)</label>
                                <input type="text" value={sForm.image || ''} onChange={e => setSForm({...sForm, image: e.target.value})} placeholder="例如：https://unsplash..." className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white text-xs font-mono" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">剩餘存量</label>
                                <input type="number" value={sForm.quantity} onChange={e => setSForm({...sForm, quantity: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white font-mono text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={isSyncing} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-black transition-all">
                                    {sForm.mode === 'ADD' ? '新增此紀念品' : '更新存量與名稱'}
                                </button>
                                {sForm.mode === 'EDIT' && (
                                    <button type="button" onClick={() => setSForm({ id: '', name: '', quantity: 100, image: '', mode: 'ADD' })} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm">取消</button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Staff List management */}
                    <div className="bg-[#0b1029]/75 border border-slate-800 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-base font-bold mb-1">🆔 專屬工號與員工姓名匯入</h3>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                            可以只貼「工號」本身，亦支援貼入「工號,真實姓名」對應名單（可用英文逗號或中文逗號分隔，每行一組）。
                        </p>
                        <div className="space-y-3">
                            <textarea 
                                value={staffIdCsv}
                                onChange={e => setStaffIdCsv(e.target.value)}
                                placeholder="QA00001,王小明&#10;QA00002,陳大同&#10;10605031,無名琛"
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono focus:border-[#73c8ce] outline-none"
                            ></textarea>
                            <button onClick={handleStaffIdUpload} disabled={isSyncing} className="w-full bg-[#73c8ce] text-slate-950 font-black py-3 rounded-xl text-sm hover:opacity-95 transition-all">
                               匯入工號名單 ({authorizedStaffCount} 組已在線)
                            </button>
                            <button onClick={handlePurgeStaff} className="w-full py-2 bg-red-950 border border-red-500/20 text-red-400 hover:bg-red-900/30 rounded-xl text-xs font-bold">
                                🗑️ 徹底清空雲端工號名單
                            </button>
                            <button onClick={() => setConfirmModal({isOpen: true, title: '歸零重置', message: '確定將所有得票數據清空、活動紀念品剩餘存量重設為初始狀態嗎？', isDangerous: true, onConfirm: async () => { setConfirmModal(p=>({...p, isOpen:false})); setIsSyncing(true); await voteService.resetAllRemoteVotes(); setIsSyncing(false); setResultModal({isOpen:true, msg:'所有數據與紀念品存量皆已成功歸零重設！'}); }})} className="w-full bg-slate-950 border border-slate-800 py-3.5 hover:bg-slate-900 rounded-xl font-bold text-xs">
                                归零所有得票分數 (重置活動)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: List of Products & Souvenirs in system */}
                <div className="lg:col-span-7 space-y-8">
                     {/* Products list detail */}
                     <div className="bg-[#0b1029]/75 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl">
                          <h2 className="text-xl font-black mb-6 border-b border-slate-800 pb-3 text-[#73c8ce]">📦 現有評選產品 ({candidates.length} 款)</h2>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                               {candidates.map(c => (
                                   <div key={c.id} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group">
                                       <div className="flex items-center gap-4 truncate">
                                           <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                               <img src={c.image} className="w-full h-full object-cover" onError={handleImageError} />
                                           </div>
                                           <div className="truncate">
                                               <div className="font-bold text-base truncate group-hover:text-[#73c8ce] transition-colors">{c.name}</div>
                                               <div className="text-xs text-slate-400 font-medium">類別: {c.song}</div>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-3">
                                            <button onClick={() => setProdForm({ id: c.id, name: c.name, category: c.song, image: c.image || '', mode: 'EDIT' })} className="text-sky-300 hover:text-white px-2 py-1 text-xs bg-sky-950 border border-sky-500/30 rounded-lg">編輯</button>
                                            <button onClick={() => setConfirmModal({isOpen: true, title: '刪除產品', message: `確定刪除產品 「${c.name}」 嗎？`, isDangerous: true, onConfirm: async () => { setConfirmModal(p=>({...p, isOpen:false})); await voteService.deleteCandidate(c.id); }})} className="text-slate-500 hover:text-red-500 font-mono font-bold text-lg px-2">✕</button>
                                       </div>
                                   </div>
                               ))}
                          </div>
                     </div>

                     {/* Souvenirs list detail */}
                     <div className="bg-[#0b1029]/75 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl">
                          <h2 className="text-xl font-black mb-6 border-b border-slate-800 pb-3 text-indigo-400">🎁 現有現場紀念品 ({souvenirs.length} 種)</h2>
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                               {souvenirs.map(s => (
                                   <div key={s.id} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group">
                                       <div className="flex items-center gap-4">
                                           {s.image ? (
                                               <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                                   <img src={s.image} className="w-full h-full object-cover" onError={handleImageError} />
                                               </div>
                                           ) : (
                                               <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl">🎁</div>
                                           )}
                                           <div>
                                               <div className="font-bold text-base hover:text-indigo-400 transition-colors">{s.name}</div>
                                               <div className="text-xs text-sky-300 font-mono">剩餘剩餘: <span className="font-extrabold text-sm">{s.quantity}</span> 份</div>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-3">
                                            <button onClick={() => setSForm({ id: s.id, name: s.name, quantity: s.quantity, image: s.image || '', mode: 'EDIT' })} className="text-indigo-300 hover:text-white px-2 py-1 text-xs bg-indigo-950 border border-indigo-500/30 rounded-lg">設定</button>
                                            <button onClick={() => setConfirmModal({isOpen: true, title: '刪除紀念品', message: `確定要刪除 「${s.name}」 紀念品配置嗎？`, isDangerous: true, onConfirm: async () => { setConfirmModal(p=>({...p, isOpen:false})); await voteService.deleteSouvenir(s.id); }})} className="text-slate-500 hover:text-red-500 font-mono text-lg px-2">✕</button>
                                       </div>
                                   </div>
                               ))}
                          </div>
                     </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

// --- Custom Dev Navigation Bar ---
const DevNav: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    if (!isOpen) return <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-[120] w-14 h-14 bg-slate-800/90 backdrop-blur-md text-white rounded-full border border-slate-700 shadow-2xl flex items-center justify-center text-2xl opacity-80 hover:opacity-100 hover:scale-105 transition-all">⚙️</button>;
    return (
        <div className="fixed bottom-6 right-6 z-[120] bg-[#0c122e]/95 backdrop-blur-xl border border-slate-700 p-4 rounded-3xl flex flex-col gap-3 shadow-2xl animate-scale-up min-w-[170px]">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">系統快速巡覽</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <Link to="/" onClick={() => setIsOpen(false)} className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-white text-center">🗳️ 前台評選</Link>
            <Link to="/results" onClick={() => setIsOpen(false)} className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-[#73c8ce] text-center">📊 實時開票看板</Link>
            <Link to="/admin" onClick={() => setIsOpen(false)} className="px-4 py-2.5 bg-gradient-to-r from-[#202d98] to-sky-600 rounded-xl text-xs font-black text-white text-center shadow-lg">⚙️ 後台管理</Link>
        </div>
    );
};

// --- App Layout with dynamic background support ---
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bgUrl, setBgUrl] = useState(voteService.bgUrl || "");

  useEffect(() => {
    // Enable polling to fetch settings instantly
    voteService.startPolling();
    const update = () => {
      setBgUrl(voteService.bgUrl || "");
      
      // Dynamically update the website tab's favicon icon to match the custom logo
      const currentLogo = voteService.logoUrl || "/logo.png";
      const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = currentLogo;
      }
    };
    update();
    const unsub = voteService.subscribe(update);
    return () => unsub();
  }, []);

  const bgStyle = bgUrl 
    ? {
        backgroundImage: `radial-gradient(circle at 50% -20%, rgba(115, 200, 206, 0.2) 0%, transparent 60%), linear-gradient(to bottom, rgba(11, 15, 38, 0.7) 0%, rgba(11, 15, 38, 0.2) 100%), url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      } 
    : {
        backgroundImage: `radial-gradient(circle at 50% -20%, rgba(115, 200, 206, 0.15) 0%, transparent 60%), linear-gradient(to bottom, rgba(11, 15, 38, 0.7) 0%, rgba(11, 15, 38, 0.2) 100%), linear-gradient(135deg, #0b0f26 0%, #171d46 40%, #202d98 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      };

  return (
    <div className="min-h-screen transition-all duration-1000" style={bgStyle}>
      {children}
    </div>
  );
};

// --- Main Router wrapper component ---
const App: React.FC = () => (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<VotePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <DevNav />
      </AppLayout>
    </HashRouter>
);

export default App;
