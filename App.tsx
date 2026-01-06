
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
  Download,
  Info,
  Settings,
  Tag,
  Stethoscope,
  Plane,
  Car,
  Camera,
  Book
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
  { id: 1, text: "Modificar a receita médica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 2, text: "Criar receita para mounjauro", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 3, text: "Criar receita para deposteron", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 4, text: "Criar roteiro para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 11, text: "Levar o carro no Davi (Santa Cruz)", categoryId: "casa", completed: false, createdAt: Date.now() },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('foco_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
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

  // Push Notifications State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    localStorage.setItem('foco_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const initServices = async () => {
      await getSafeAnalytics();
      await getSafeMessaging();
    };
    initServices();
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
    } else {
      setNotificationPermission('denied');
    }
  };

  const audioContextRef = useRef<AudioContext | null>(null);

  const playNagSound = useCallback(() => {
    if (!isAnnoyingMode || !audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
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
    <div className="min-h-screen bg-[#050a18] text-white transition-all pb-32">
      {/* Banner de Permissão de Notificação */}
      {notificationPermission === 'default' && (
        <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 sticky top-0 z-[100]">
          <div className="flex items-center gap-3">
            <BellRing size={18} className="text-white animate-bounce" />
            <p className="text-[11px] font-black uppercase tracking-tight">Vigiar via Push Notifications?</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRequestPermission}
              className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg"
            >
              Ativar
            </button>
            <button onClick={() => setNotificationPermission('denied')} className="text-white/50 p-1"><X size={16}/></button>
          </div>
        </div>
      )}

      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} className="bg-amber-500 text-[#050a18] p-2 text-center text-[9px] font-black tracking-widest uppercase cursor-pointer">
          CLIQUE PARA ATIVAR ALERTAS SONOROS
        </div>
      )}

      {/* Header / Stats */}
      <div className="px-6 py-8">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meta Diária</h2>
            <span className="text-xl font-black text-[#050a18]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-6">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">FOCO<span className="text-indigo-600">.</span></h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">André's Control Center</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAnnoyingMode(!isAnnoyingMode)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAnnoyingMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/10 text-slate-500'}`}
            >
              {isAnnoyingMode ? <BellRing size={20} /> : <BellOff size={20} />}
            </button>
            <button onClick={() => setShowCategoryManager(true)} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
              <Tags size={20} />
            </button>
          </div>
        </header>

        {/* Categories horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-6 no-scrollbar">
          <button 
            onClick={() => setFilterCategoryId(null)}
            className={`flex-shrink-0 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!filterCategoryId ? 'bg-white text-[#050a18]' : 'bg-white/5 text-slate-500'}`}
          >
            Tudo
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`flex-shrink-0 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${filterCategoryId === cat.id ? 'bg-white text-[#050a18]' : 'bg-white/5 text-slate-500'}`}
            >
              {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 14 })}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Input Add */}
        <div className="mb-10">
          <div className={`bg-white rounded-[2rem] transition-all overflow-hidden ${isFormExpanded ? 'p-6' : 'p-2 flex items-center'}`}>
            {!isFormExpanded ? (
              <>
                <div onClick={() => setIsFormExpanded(true)} className="flex-1 px-4 py-3 cursor-text text-slate-400 font-bold text-sm">Próximo objetivo...</div>
                <button onClick={() => setIsFormExpanded(true)} className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Plus size={24}/></button>
              </>
            ) : (
              <form onSubmit={handleAddTask} className="space-y-4">
                <input 
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="O que você vai esmagar agora?"
                  className="w-full text-lg font-black text-[#050a18] outline-none placeholder:text-slate-200"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={selectedCategoryId} 
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="bg-slate-50 border-none rounded-xl p-3 text-xs font-black text-slate-900"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input 
                    type="datetime-local" 
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-slate-50 border-none rounded-xl p-3 text-xs font-black text-slate-900"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Adicionar</button>
                  <button type="button" onClick={() => setIsFormExpanded(false)} className="px-4 text-slate-400 font-bold uppercase text-[10px]">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {pending.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              category={categories.find(c => c.id === task.categoryId)}
              onToggle={id => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))}
              onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))}
            />
          ))}
          
          {pending.length === 0 && (
            <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5">
              <Sparkles size={40} className="mx-auto text-amber-500 mb-4 opacity-30" />
              <p className="text-slate-500 font-bold text-sm">Nada pendente. Você está voando.</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Brain */}
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
        className="fixed bottom-8 right-8 w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/40 flex items-center justify-center border-4 border-[#050a18] active:scale-90 transition-all z-50"
      >
        <BrainCircuit size={32} className={isLoadingCoach ? 'animate-spin' : ''} />
      </button>

      {/* Nag Overlay */}
      {showNag && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#050a18]/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-rose-600 p-8 rounded-[3rem] text-center shadow-2xl border-2 border-rose-400 shake max-w-xs">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-white/60">ALERTA DE FOCO:</h3>
            <h2 className="text-2xl font-black italic text-white mb-6">"{nagMessage}"</h2>
            <button onClick={() => setShowNag(false)} className="text-white/40 text-[10px] font-black uppercase">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;