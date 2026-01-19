
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Plus, 
  BellRing, 
  BellOff, 
  TrendingUp,
  BrainCircuit,
  ListTodo,
  Sparkles,
  LayoutGrid,
  X,
  Tags,
  Trash2,
  Edit2,
  Download,
  Share,
  Monitor,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Eraser,
  Heart,
  Plane,
  Car,
  User,
  Book,
  Settings,
  Tag,
  Stethoscope,
  Camera
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from './types';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage } from './services/gemini';
import { requestNotificationPermission, getSafeMessaging, getSafeAnalytics } from './services/firebase';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'saude', name: 'SAÚDE', color: 'text-rose-500', iconName: 'Stethoscope' },
  { id: 'viagem', name: 'VIAGEM', color: 'text-sky-500', iconName: 'Plane' },
  { id: 'casa', name: 'CARRO & C...', color: 'text-amber-600', iconName: 'Car' },
  { id: 'pessoal', name: 'PESSOAL', color: 'text-purple-500', iconName: 'Camera' },
  { id: 'estudo', name: 'ESTUDO', color: 'text-emerald-500', iconName: 'Book' },
  { id: 'projetos', name: 'PROJETOS', color: 'text-indigo-500', iconName: 'Settings' },
  { id: 'geral', name: 'GERAL', color: 'text-amber-800', iconName: 'Tag' },
];

const INITIAL_TASKS: Task[] = [
  // SAÚDE (6)
  { id: 1, text: "Modificar a receita médica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 2, text: "Criar receita para mounjauro", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 3, text: "Criar receita para deposteron", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 9, text: "Procurar pedidos médicos de exame de sangue", categoryId: "saude", completed: false, note: "Dica: Verifique o e-mail de dez/2023 (Labormed Maricá).", createdAt: Date.now() },
  { id: 18, text: "Procurar certificados de vacina (Anvisa)", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 19, text: "Traduzir docs TEA e Bariátrica p/ inglês", categoryId: "saude", completed: false, createdAt: Date.now() },
  // VIAGEM (8)
  { id: 4, text: "Criar roteiro para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 5, text: "Pesquisar estadias para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 6, text: "Voo: Johanesburgo p/ Cidade do Cabo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 7, text: "Passagem: RJ p/ São Paulo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 8, text: "Passagem: São Paulo p/ Leme", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 15, text: "Colocar todos os dados da viagem no app", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 16, text: "Colocar as passagens no app", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 17, text: "Procurar seguro de viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  // CASA (3)
  { id: 11, text: "Levar o carro no Davi (Santa Cruz)", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 13, text: "Limpar o carro", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 14, text: "Limpar a casa", categoryId: "casa", completed: false, createdAt: Date.now() },
  // PESSOAL / ESTUDO / PROJETOS (3)
  { id: 12, text: "Fazer a edição na foto da minha mãe", categoryId: "pessoal", completed: false, createdAt: Date.now() },
  { id: 20, text: "Estudar um pouco de inglês", categoryId: "estudo", completed: false, createdAt: Date.now() },
  { id: 21, text: "Melhorar app translate de viagem", categoryId: "projetos", completed: false, createdAt: Date.now() },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('geral');
  const [dueDate, setDueDate] = useState('');
  
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isAnnoyingMode, setIsAnnoyingMode] = useState(true);
  const [nagMessage, setNagMessage] = useState<string>("André, o sucesso exige consistência.");
  const [showNag, setShowNag] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);

  // PWA & Push
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const initServices = async () => {
      await getSafeAnalytics();
      const messaging = await getSafeMessaging();
      if (messaging && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          setPushEnabled(true);
        } else {
          setShowPushBanner(true);
        }
      }
    };
    initServices();

    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleEnablePush = async () => {
    const success = await requestNotificationPermission();
    if (success) {
      setPushEnabled(true);
      setShowPushBanner(false);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      }
    }
  };

  const playNagSound = useCallback((urgency = 0) => {
    if (!isAnnoyingMode || !audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = urgency > 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(urgency > 0 ? 1200 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { console.warn("Audio Context error"); }
  }, [isAnnoyingMode, audioEnabled]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(t => t.completed).length;
    return (completedCount / tasks.length) * 100;
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: inputValue,
      categoryId: selectedCategoryId,
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate || undefined
    };
    setTasks(prev => [newTask, ...prev]);
    setInputValue('');
    setDueDate('');
    setIsFormExpanded(false);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterCategoryId) result = result.filter(t => t.categoryId === filterCategoryId);
    return result;
  }, [tasks, filterCategoryId]);

  const pending = filteredTasks.filter(t => !t.completed);
  const completed = filteredTasks.filter(t => t.completed);

  return (
    <div className="min-h-screen bg-[#050a18] text-white transition-all duration-300 pb-32 overflow-x-hidden">
      {/* Overlay de Notificação Push */}
      {showPushBanner && (
        <div className="fixed top-4 inset-x-4 z-[100] animate-in slide-in-from-top duration-500">
          <div className="bg-amber-500 text-[#050a18] p-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border-b-4 border-amber-600">
            <BellRing size={28} className="animate-pulse" />
            <div className="flex-1">
              <h4 className="text-[10px] font-black uppercase tracking-tighter">Coach Vigilante</h4>
              <p className="text-[12px] font-bold leading-tight">Posso te vigiar via notificações push?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleEnablePush} className="bg-[#050a18] text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">SIM</button>
              <button onClick={() => setShowPushBanner(false)} className="bg-amber-600 text-[#050a18] p-1.5 rounded-xl"><X size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Instalação PWA */}
      {showInstallBanner && (
        <div className="fixed bottom-24 inset-x-4 z-[100] animate-in slide-in-from-bottom duration-500">
          <div className="bg-[#3b49df] text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border-b-4 border-blue-800">
            <Download size={28} className="animate-bounce" />
            <div className="flex-1">
              <h4 className="text-[10px] font-black uppercase tracking-tighter">Aplicativo Nativo</h4>
              <p className="text-[12px] font-bold leading-tight">Instale o FOCO na sua tela de início para performance máxima.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleInstallClick} className="bg-white text-[#3b49df] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg">INSTALAR</button>
              <button onClick={() => setShowInstallBanner(false)} className="bg-blue-600 text-white p-1.5 rounded-xl"><X size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {/* Botão para ativar som do coach */}
      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} className="bg-gradient-to-r from-[#1e2a5e] to-[#050a18] text-white p-3 text-center text-[10px] font-black tracking-widest uppercase cursor-pointer border-b border-white/5 shadow-lg relative z-10">
          CLIQUE AQUI PARA ATIVAR OS ALERTAS DO COACH.
        </div>
      )}

      {/* Card de Meta - Estilo Imagem */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[12px] font-black text-amber-600 uppercase tracking-widest">
              Meta de André
            </h2>
            <span className="text-2xl font-black text-[#050a18]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-5 bg-amber-50 rounded-full overflow-hidden relative border border-amber-100/30">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(251,191,36,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        <header className="flex justify-between items-start mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-amber-500" size={16} />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">SISTEMA DE ALTA PERFORMANCE</span>
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-none mb-4">
              FOCO<span className="text-amber-500">.</span>
            </h1>
            <p className="text-slate-400 text-[14px] font-medium leading-relaxed max-w-[220px]">
              André, o sucesso exige consistência.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleInstallClick} className="w-16 h-16 rounded-[1.8rem] bg-white text-slate-900 flex items-center justify-center shadow-2xl border-2 border-amber-500/10 active:scale-90 transition-all">
              <Download size={24} />
            </button>
            <button 
              onClick={() => setIsAnnoyingMode(!isAnnoyingMode)}
              className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl border-2 active:scale-90 transition-all ${isAnnoyingMode ? 'bg-[#3b49df] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              {isAnnoyingMode ? <BellRing size={24} className="animate-pulse" /> : <BellOff size={24} />}
            </button>
            <button onClick={() => setShowCategoryManager(true)} className="w-16 h-16 rounded-[1.8rem] bg-white text-slate-900 flex items-center justify-center shadow-2xl border-2 border-amber-500/10 active:scale-90 transition-all">
              <Tags size={24} />
            </button>
          </div>
        </header>

        {/* Grade de Categorias (Imagem solicitada: 2x4) */}
        <div className="grid grid-cols-4 gap-3 mb-12">
          <button 
            onClick={() => setFilterCategoryId(null)}
            className={`flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all border-2 h-24 ${!filterCategoryId ? 'bg-[#3b49df] border-white/10 text-white shadow-2xl scale-105 z-10' : 'bg-white border-transparent text-slate-900 shadow-xl'}`}
          >
            <LayoutGrid size={26} className="mb-1" />
            <span className="text-[10px] font-black tracking-widest uppercase">TUDO</span>
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all border-2 h-24 ${filterCategoryId === cat.id ? 'bg-[#3b49df] border-white/10 text-white shadow-2xl scale-105 z-10' : 'bg-white border-transparent text-slate-900 shadow-xl'}`}
            >
              <span className={`${filterCategoryId === cat.id ? 'text-white' : cat.color} mb-1`}>
                {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 26 })}
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Input Estilo Cápsula */}
        <div className="mb-12">
          <div className={`bg-white rounded-[3rem] transition-all shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative border border-white/10 ${isFormExpanded ? 'p-8' : 'p-2 flex items-center h-20'}`}>
            {!isFormExpanded ? (
              <>
                <div onClick={() => setIsFormExpanded(true)} className="flex-1 px-8 py-4 cursor-text">
                  <p className="text-slate-400 text-xl font-medium">Novo compromisso?</p>
                </div>
                <button onClick={() => setIsFormExpanded(true)} className="w-16 h-16 bg-[#050a18] text-white rounded-[2rem] flex items-center justify-center shadow-xl active:scale-90 transition-all mr-1">
                  <Plus size={32} />
                </button>
              </>
            ) : (
              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Foco</h4>
                  <button type="button" onClick={() => setIsFormExpanded(false)} className="text-slate-400 p-2"><X size={24} /></button>
                </div>
                <input 
                  autoFocus
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ex: Resolver o seguro de viagem"
                  className="w-full text-2xl font-bold text-[#050a18] focus:outline-none placeholder:text-slate-200"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Contexto</label>
                    <select 
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 text-sm font-bold outline-none"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Deadline</label>
                    <input 
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 text-sm font-bold outline-none"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#3b49df] text-white py-5 rounded-[2.5rem] font-black text-sm shadow-2xl active:scale-[0.98] transition-all border-b-4 border-blue-800">
                  AGENDAR AGORA
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Lista Principal */}
        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.25em] flex items-center gap-3">
                <ListTodo size={20} className="text-amber-500" />
                LISTA DE FOCO
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-4 py-1.5 bg-[#3b49df] text-white rounded-xl text-[11px] font-black uppercase shadow-xl">
                  {pending.length} ATIVAS
                </span>
              </div>
            </div>
            
            <div className="space-y-5">
              {pending.length > 0 ? (
                pending.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    category={categories.find(c => c.id === task.categoryId)}
                    onToggle={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))}
                    onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
                  />
                ))
              ) : (
                <div className="text-center py-24 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 shadow-inner">
                  <Sparkles className="mx-auto text-amber-500 mb-5" size={48} />
                  <p className="text-slate-400 font-bold text-lg">Ambiente limpo, André. Missão cumprida.</p>
                </div>
              )}
            </div>
          </section>

          {completed.length > 0 && (
            <section className="pt-10 border-t border-white/10">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">ARQUIVO DE SUCESSO</h3>
                <button 
                  onClick={() => { if(confirm('Apagar histórico?')) setTasks(prev => prev.filter(t => !t.completed)); }}
                  className="text-[10px] font-black uppercase text-rose-500/60 hover:text-rose-500 transition-colors"
                >
                  Limpar Tudo
                </button>
              </div>
              <div className="space-y-4 opacity-40">
                {completed.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    category={categories.find(c => c.id === task.categoryId)}
                    onToggle={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))}
                    onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Coach Button (Brain) */}
      <div className="fixed bottom-10 right-8 z-50">
        <button 
          onClick={async () => {
            setIsLoadingCoach(true);
            const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
            setNagMessage(msg);
            setIsLoadingCoach(false);
            setShowNag(true);
            playNagSound();
            setTimeout(() => setShowNag(false), 7000);
          }}
          className="w-24 h-24 bg-white text-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-90 transition-all border-4 border-[#050a18] group"
        >
          <BrainCircuit size={40} className={`group-hover:rotate-12 transition-transform ${isLoadingCoach ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overlay Nagging */}
      {showNag && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#050a18]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-rose-600 p-10 rounded-[4rem] text-center shadow-[0_0_80px_rgba(225,29,72,0.6)] border-4 border-rose-400 shake max-w-sm relative">
            <button onClick={() => setShowNag(false)} className="absolute top-8 right-8 text-white/40"><X size={24}/></button>
            <BrainCircuit size={56} className="mx-auto mb-8 text-white animate-bounce" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-4 text-white/70">Relatório de Incompetência:</p>
            <h2 className="text-3xl font-black italic leading-tight text-white">"{nagMessage}"</h2>
          </div>
        </div>
      )}

      {/* Modal Categorias */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-[#050a18]/95 backdrop-blur-2xl z-[150] p-8 flex items-center justify-center animate-in zoom-in duration-300">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-10 bg-[#3b49df] text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black">Categorias</h2>
                <p className="text-[11px] uppercase font-black opacity-60 tracking-widest">Estrutura de André</p>
              </div>
              <button onClick={() => setShowCategoryManager(false)} className="p-4 bg-white/15 rounded-3xl active:scale-90 transition-all"><X size={28} /></button>
            </div>
            <div className="p-10 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-slate-50 p-6 rounded-[2.5rem] flex items-center gap-4 border-2 border-transparent hover:border-[#3b49df]/10 transition-all group">
                    <span className={`${cat.color} p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                      {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 24 })}
                    </span>
                    <span className="font-black text-[12px] uppercase tracking-tighter">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
