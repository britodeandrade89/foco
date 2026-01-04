
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
  Download,
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

  // Notifications & PWA Banners
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const init = async () => {
      await getSafeAnalytics();
      const messaging = await getSafeMessaging();
      if (messaging && Notification.permission !== 'granted') {
        setShowPushBanner(true);
      }
    };
    init();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleEnablePush = async () => {
    const success = await requestNotificationPermission();
    if (success) setShowPushBanner(false);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const playNagSound = useCallback(() => {
    if (!isAnnoyingMode || !audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
      gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, audioContextRef.current.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.3);
    } catch (e) {}
  }, [isAnnoyingMode, audioEnabled]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return (tasks.filter(t => t.completed).length / tasks.length) * 100;
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
    setIsFormExpanded(false);
  };

  const filteredTasks = useMemo(() => {
    if (!filterCategoryId) return tasks;
    return tasks.filter(t => t.categoryId === filterCategoryId);
  }, [tasks, filterCategoryId]);

  const pending = filteredTasks.filter(t => !t.completed);
  const completed = filteredTasks.filter(t => t.completed);

  return (
    <div className="min-h-screen bg-[#050a18] text-white transition-all pb-32">
      {/* Push Banner */}
      {showPushBanner && (
        <div className="bg-amber-500 text-[#050a18] p-3 text-center text-[10px] font-black uppercase flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
          <span>ATIVAR ALERTAS PARA O COACH TE VIGIAR?</span>
          <button onClick={handleEnablePush} className="bg-[#050a18] text-white px-3 py-1 rounded-lg">ATIVAR</button>
          <button onClick={() => setShowPushBanner(false)}><X size={14}/></button>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="bg-[#3b49df] text-white p-3 text-center text-[10px] font-black uppercase flex items-center justify-center gap-3">
          <span>INSTALAR O FOCO NA TELA DE INÍCIO?</span>
          <button onClick={handleInstallApp} className="bg-white text-[#3b49df] px-3 py-1 rounded-lg">INSTALAR</button>
          <button onClick={() => setShowInstallBanner(false)}><X size={14}/></button>
        </div>
      )}

      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} className="bg-white/5 p-3 text-center text-[9px] font-black uppercase tracking-widest cursor-pointer">
          CLIQUE PARA ATIVAR OS ALERTAS DO COACH.
        </div>
      )}

      <div className="px-4 py-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Meta de André</h2>
            <span className="text-2xl font-black text-[#050a18]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-4 bg-amber-50 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4">
        <header className="flex justify-between items-start mb-10 mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-amber-500" size={16} />
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">ALTA PERFORMANCE</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter">FOCO<span className="text-amber-500">.</span></h1>
            <p className="text-slate-400 text-sm font-medium mt-2">André, o sucesso exige consistência.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsAnnoyingMode(!isAnnoyingMode)} className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl transition-all ${isAnnoyingMode ? 'bg-[#3b49df] text-white' : 'bg-white text-slate-300'}`}>
              {isAnnoyingMode ? <BellRing size={22} className="animate-pulse" /> : <BellOff size={22} />}
            </button>
            <button onClick={() => setShowCategoryManager(true)} className="w-14 h-14 rounded-3xl bg-white text-slate-900 flex items-center justify-center shadow-xl">
              <Tags size={22} />
            </button>
          </div>
        </header>

        {/* Categories Grid (2x4 style) */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          <button onClick={() => setFilterCategoryId(null)} className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all h-20 border-2 ${!filterCategoryId ? 'bg-[#3b49df] border-transparent' : 'bg-white text-slate-900 border-transparent'}`}>
            <LayoutGrid size={22} className="mb-1" />
            <span className="text-[9px] font-black tracking-widest uppercase">TUDO</span>
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setFilterCategoryId(cat.id)} className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all h-20 border-2 ${filterCategoryId === cat.id ? 'bg-[#3b49df] border-transparent' : 'bg-white text-slate-900 border-transparent'}`}>
              <span className={`${filterCategoryId === cat.id ? 'text-white' : cat.color} mb-1`}>
                {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 22 })}
              </span>
              <span className="text-[9px] font-black tracking-widest uppercase truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="mb-10">
          <div className={`bg-white rounded-[2.5rem] transition-all shadow-2xl ${isFormExpanded ? 'p-6' : 'p-2 flex items-center h-20'}`}>
            {!isFormExpanded ? (
              <>
                <div onClick={() => setIsFormExpanded(true)} className="flex-1 px-6 cursor-text"><p className="text-slate-400 font-medium">Próximo passo, André?</p></div>
                <button onClick={() => setIsFormExpanded(true)} className="w-16 h-16 bg-[#050a18] text-white rounded-[1.8rem] flex items-center justify-center"><Plus size={32}/></button>
              </>
            ) : (
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-300 uppercase">Protocolo André</span><X onClick={() => setIsFormExpanded(false)} className="text-slate-400 cursor-pointer"/></div>
                <input autoFocus type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full text-xl font-bold text-[#050a18] outline-none" placeholder="O que faremos agora?" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold text-xs">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold text-xs" />
                </div>
                <button type="submit" className="w-full bg-[#3b49df] text-white py-5 rounded-[2rem] font-black text-sm">AGENDAR</button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><ListTodo size={16} className="text-amber-500" /> LISTA DE FOCO</h3>
              <span className="bg-[#3b49df] px-3 py-1 rounded-lg text-[9px] font-black uppercase">{pending.length} ATIVAS</span>
            </div>
            <div className="space-y-4">
              {pending.map(task => (
                <TaskCard key={task.id} task={task} category={categories.find(c => c.id === task.categoryId)} onToggle={id => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))} />
              ))}
            </div>
          </section>

          {completed.length > 0 && (
            <section className="opacity-40 grayscale">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">CONCLUÍDAS</h3>
              <div className="space-y-3">
                {completed.map(task => (
                  <TaskCard key={task.id} task={task} category={categories.find(c => c.id === task.categoryId)} onToggle={id => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="fixed bottom-10 right-8 z-50">
        <button 
          onClick={async () => {
            setIsLoadingCoach(true);
            const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
            setNagMessage(msg);
            setIsLoadingCoach(false);
            setShowNag(true);
            playNagSound();
            setTimeout(() => setShowNag(false), 6000);
          }}
          className="w-24 h-24 bg-white text-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-[#050a18] hover:scale-110 active:scale-90 transition-all"
        >
          <BrainCircuit size={40} className={isLoadingCoach ? 'animate-spin' : ''} />
        </button>
      </div>

      {showNag && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#050a18]/80 backdrop-blur-md">
          <div className="bg-rose-600 p-10 rounded-[3.5rem] text-center shadow-2xl border-4 border-rose-400 shake max-w-sm">
            <X onClick={() => setShowNag(false)} className="absolute top-6 right-6 text-white/50 cursor-pointer"/>
            <BrainCircuit size={48} className="mx-auto mb-6 text-white animate-bounce" />
            <h2 className="text-2xl font-black italic text-white leading-tight">"{nagMessage}"</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
