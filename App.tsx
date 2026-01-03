
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
  Bell
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from './types';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage } from './services/gemini';
import { requestNotificationPermission, getSafeMessaging, getSafeAnalytics } from './services/firebase';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'saude', name: 'SAÚDE', color: 'text-rose-500', iconName: 'Heart' },
  { id: 'viagem', name: 'VIAGEM', color: 'text-sky-500', iconName: 'Plane' },
  { id: 'casa', name: 'CARRO & C...', color: 'text-amber-600', iconName: 'Car' },
  { id: 'pessoal', name: 'PESSOAL', color: 'text-purple-500', iconName: 'User' },
  { id: 'estudo', name: 'ESTUDO', color: 'text-emerald-500', iconName: 'Book' },
  { id: 'projetos', name: 'PROJETOS', color: 'text-indigo-500', iconName: 'Settings' },
  { id: 'geral', name: 'GERAL', color: 'text-amber-800', iconName: 'Tag' },
];

const INITIAL_TASKS: Task[] = [
  // SAUDE
  { id: 1, text: "Modificar a receita médica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 2, text: "Criar receita para Mounjaro", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 3, text: "Criar receita para Deposteron", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 9, text: "Pedidos médicos de exame de sangue", categoryId: "saude", completed: false, note: "Checar e-mail de dez/2023 (Labormed Maricá)", createdAt: Date.now() },
  { id: 18, text: "Certificados de vacina (Anvisa)", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 19, text: "Traduzir docs TEA e Bariátrica", categoryId: "saude", completed: false, createdAt: Date.now() },
  // VIAGEM
  { id: 4, text: "Criar roteiro para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 5, text: "Pesquisar estadias para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 6, text: "Voo: Johanesburgo p/ Cidade do Cabo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 7, text: "Passagem: RJ p/ São Paulo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 8, text: "Passagem: São Paulo p/ Leme", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 15, text: "Colocar todos os dados da viagem no app", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 16, text: "Colocar as passagens no app", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 17, text: "Procurar seguro de viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  // CASA
  { id: 11, text: "Levar o carro no Davi (Santa Cruz)", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 13, text: "Limpar o carro", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 14, text: "Limpar a casa", categoryId: "casa", completed: false, createdAt: Date.now() },
  // PESSOAL / ESTUDO / PROJETOS
  { id: 12, text: "Edição na foto da minha mãe", categoryId: "pessoal", completed: false, createdAt: Date.now() },
  { id: 20, text: "Estudar inglês", categoryId: "estudo", completed: false, createdAt: Date.now() },
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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [isAnnoyingMode, setIsAnnoyingMode] = useState(true);
  const [nagMessage, setNagMessage] = useState<string>("André, o sucesso exige consistência.");
  const [showNag, setShowNag] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);

  // Notificações e PWA
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
    } catch (e) { console.warn("Audio error"); }
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
    <div className="min-h-screen bg-[#050a18] text-white transition-all duration-300 pb-32">
      {/* Banner de Push Notification */}
      {showPushBanner && (
        <div className="bg-amber-500 text-[#050a18] p-3 text-center text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
          <span>ATIVAR ALERTAS PUSH PARA O COACH TE VIGIAR?</span>
          <button onClick={handleEnablePush} className="bg-[#050a18] text-white px-3 py-1 rounded-lg">ATIVAR</button>
          <button onClick={() => setShowPushBanner(false)} className="opacity-50"><X size={14}/></button>
        </div>
      )}

      {/* Banner de Instalação PWA */}
      {showInstallBanner && (
        <div className="bg-[#3b49df] text-white p-3 text-center text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3">
          <span>INSTALAR O FOCO NA TELA DE INÍCIO?</span>
          <button onClick={handleInstallClick} className="bg-white text-[#3b49df] px-3 py-1 rounded-lg">INSTALAR</button>
          <button onClick={() => setShowInstallBanner(false)} className="opacity-50"><X size={14}/></button>
        </div>
      )}

      {/* Botão de ativação do coach (Som) */}
      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} className="bg-gradient-to-r from-[#1e2a5e] to-[#0a1128] text-white p-3 text-center text-[10px] font-black tracking-widest uppercase cursor-pointer border-b border-white/5">
          CLIQUE AQUI PARA ATIVAR OS ALERTAS DO COACH.
        </div>
      )}

      {/* Card de Meta de André */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-[2rem] p-5 shadow-2xl border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[11px] font-black text-amber-600/60 uppercase tracking-widest">
              Meta de André
            </h2>
            <span className="text-xl font-black text-[#1e2a5e]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-4 bg-amber-50 rounded-full overflow-hidden relative border border-amber-100/50">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        <header className="flex justify-between items-start mb-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-amber-500" size={16} />
              <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.2em]">SISTEMA DE ALTA PERFORMANCE</span>
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-none mb-4">
              FOCO<span className="text-amber-500">.</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[200px]">
              André, o sucesso exige consistência.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleInstallClick}
              className="w-14 h-14 rounded-3xl bg-white text-slate-900 flex items-center justify-center shadow-xl border-2 border-amber-500/20 active:scale-95 transition-all"
            >
              <Download size={22} />
            </button>
            <button 
              onClick={() => setIsAnnoyingMode(!isAnnoyingMode)}
              className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl border-2 active:scale-95 transition-all ${isAnnoyingMode ? 'bg-[#3b49df] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              {isAnnoyingMode ? <BellRing size={22} className="animate-pulse" /> : <BellOff size={22} />}
            </button>
            <button 
              onClick={() => setShowCategoryManager(true)}
              className="w-14 h-14 rounded-3xl bg-white text-slate-900 flex items-center justify-center shadow-xl border-2 border-amber-500/20 active:scale-95 transition-all"
            >
              <Tags size={22} />
            </button>
          </div>
        </header>

        {/* Grade de Categorias (Imagem Fiel) */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          <button 
            onClick={() => setFilterCategoryId(null)}
            className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all border-2 h-20 ${!filterCategoryId ? 'bg-[#3b49df] border-white/10 text-white shadow-xl scale-105' : 'bg-white border-transparent text-slate-900 shadow-md'}`}
          >
            <LayoutGrid size={22} className="mb-1" />
            <span className="text-[9px] font-black tracking-widest">TUDO</span>
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all border-2 h-20 ${filterCategoryId === cat.id ? 'bg-[#3b49df] border-white/10 text-white shadow-xl scale-105' : 'bg-white border-transparent text-slate-900 shadow-md'}`}
            >
              <span className={`${filterCategoryId === cat.id ? 'text-white' : cat.color} mb-1`}>
                {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 22 })}
              </span>
              <span className="text-[9px] font-black tracking-widest truncate w-full text-center px-1">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Input de Tarefa Estilo Cápsula */}
        <div className="mb-10">
          <div className={`bg-white rounded-[2.5rem] transition-all shadow-2xl relative ${isFormExpanded ? 'p-6' : 'p-2 flex items-center'}`}>
            {!isFormExpanded ? (
              <>
                <div onClick={() => setIsFormExpanded(true)} className="flex-1 px-6 py-4 cursor-text">
                  <p className="text-slate-400 text-lg font-medium">Novo compromisso?</p>
                </div>
                <button onClick={() => setIsFormExpanded(true)} className="w-14 h-14 bg-[#050a18] text-white rounded-[1.5rem] flex items-center justify-center shadow-lg active:scale-90 transition-all mr-1">
                  <Plus size={28} />
                </button>
              </>
            ) : (
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adicionar Tarefa</h4>
                  <button type="button" onClick={() => setIsFormExpanded(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                </div>
                <input 
                  autoFocus
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ex: Treino na academia"
                  className="w-full text-xl font-bold text-slate-900 focus:outline-none placeholder:text-slate-200"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-slate-900 text-xs font-bold outline-none"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input 
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-slate-900 text-xs font-bold outline-none"
                  />
                </div>
                <button type="submit" className="w-full bg-[#3b49df] text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
                  AGENDAR AGORA
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Lista de Foco */}
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <ListTodo size={18} className="text-amber-500" />
                LISTA DE FOCO
              </h3>
              <span className="px-3 py-1 bg-[#3b49df] text-white rounded-lg text-[10px] font-black uppercase shadow-lg">
                {pending.length} ATIVAS
              </span>
            </div>
            
            <div className="space-y-4">
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
                <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10">
                  <Sparkles className="mx-auto text-amber-500 mb-4" size={40} />
                  <p className="text-slate-400 font-bold">Tudo limpo, André. Missão cumprida.</p>
                </div>
              )}
            </div>
          </section>

          {completed.length > 0 && (
            <section className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CONCLUÍDO</h3>
                <button 
                  onClick={() => setTasks(prev => prev.filter(t => !t.completed))}
                  className="text-[10px] font-black uppercase text-rose-500 hover:opacity-80 transition-opacity"
                >
                  Limpar Histórico
                </button>
              </div>
              <div className="space-y-3 opacity-60">
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

      {/* Floating Action Button (Coach) */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={async () => {
            setIsLoadingCoach(true);
            const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
            setNagMessage(msg);
            setIsLoadingCoach(false);
            setShowNag(true);
            playNagSound();
            setTimeout(() => setShowNag(false), 5000);
          }}
          className="w-20 h-20 bg-white text-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-[#050a18]"
        >
          <BrainCircuit size={36} className={isLoadingCoach ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Nagging Overlay (Mensagem do Coach) */}
      {showNag && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[100] animate-in zoom-in duration-300">
          <div className="bg-rose-600 p-8 rounded-[3rem] text-center shadow-[0_0_50px_rgba(225,29,72,0.4)] border-4 border-rose-400 shake">
            <X size={20} className="absolute top-6 right-6 opacity-40" onClick={() => setShowNag(false)} />
            <BrainCircuit size={48} className="mx-auto mb-6 text-white animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-70">Coach Vigilante:</p>
            <h2 className="text-2xl font-black italic leading-tight">"{nagMessage}"</h2>
          </div>
        </div>
      )}

      {/* Modal de Categorias */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-[#050a18]/90 backdrop-blur-xl z-[150] p-6 flex items-center justify-center">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 bg-[#3b49df] text-white flex justify-between items-center">
              <h2 className="text-2xl font-black">Categorias</h2>
              <button onClick={() => setShowCategoryManager(false)} className="p-3 bg-white/10 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-4">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-[#3b49df]/20 transition-all">
                  <span className={cat.color}>{React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 20 })}</span>
                  <span className="font-bold text-sm">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
