import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, 
  BellRing, 
  BellOff, 
  TrendingUp,
  BrainCircuit,
  ListTodo,
  LayoutGrid,
  X,
  Download,
  Smartphone,
  CheckCircle2,
  Stethoscope,
  Plane,
  Car,
  Camera,
  Book,
  Settings,
  Tag,
  Info
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from './types';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage } from './services/gemini';
import { requestNotificationPermission, getSafeAnalytics } from './services/firebase';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'saude', name: 'SAÚDE', color: 'text-rose-500', iconName: 'Stethoscope' },
  { id: 'viagem', name: 'VIAGEM', color: 'text-sky-500', iconName: 'Plane' },
  { id: 'casa', name: 'CASA/CARRO', color: 'text-amber-600', iconName: 'Car' },
  { id: 'pessoal', name: 'PESSOAL', color: 'text-purple-500', iconName: 'Camera' },
  { id: 'estudo', name: 'ESTUDO', color: 'text-emerald-500', iconName: 'Book' },
  { id: 'projetos', name: 'PROJETOS', color: 'text-indigo-500', iconName: 'Settings' },
  { id: 'geral', name: 'GERAL', color: 'text-amber-800', iconName: 'Tag' },
];

const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Modificar a receita médica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 2, text: "Criar receita para mounjauro", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 3, text: "Criar receita para deposteron", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 9, text: "Procurar pedidos médicos de exame de sangue", categoryId: "saude", completed: false, note: "Dica: Verifique o e-mail de dez/2023.", createdAt: Date.now() },
  { id: 18, text: "Procurar certificados de vacina (Anvisa)", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 19, text: "Traduzir docs TEA e Bariátrica p/ inglês", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 4, text: "Criar roteiro para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 5, text: "Pesquisar estadias para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 6, text: "Voo: Johanesburgo p/ Cidade do Cabo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 11, text: "Levar o carro no Davi (Santa Cruz)", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 13, text: "Limpar o carro", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 20, text: "Estudar um pouco de inglês", categoryId: "estudo", completed: false, createdAt: Date.now() },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('geral');
  const [dueDate, setDueDate] = useState('');
  const [isAnnoyingMode, setIsAnnoyingMode] = useState(true);
  const [nagMessage, setNagMessage] = useState<string>("André, vambora. O tempo está passando.");
  const [showNag, setShowNag] = useState(false);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const init = async () => {
      await requestNotificationPermission();
      await getSafeAnalytics();
    };
    init();
  }, []);

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

  const triggerCoach = async () => {
    setIsLoadingCoach(true);
    const pending = tasks.filter(t => !t.completed);
    const msg = await getNaggingMessage(pending);
    setNagMessage(msg);
    setIsLoadingCoach(false);
    setShowNag(true);
    playNagSound();
    setTimeout(() => setShowNag(false), 6000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnnoyingMode && tasks.some(t => !t.completed)) {
        triggerCoach();
      }
    }, 60000); // Nag every minute
    return () => clearInterval(interval);
  }, [isAnnoyingMode, tasks, playNagSound]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percent, total, completed };
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
    let list = filterCategoryId ? tasks.filter(t => t.categoryId === filterCategoryId) : tasks;
    return [...list].sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt);
  }, [tasks, filterCategoryId]);

  return (
    <div className="min-h-screen bg-[#050a18] text-white transition-all pb-32">
      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} className="bg-white/5 p-3 text-center text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-colors border-b border-white/5 flex items-center justify-center gap-2">
          <Info size={12} /> CLIQUE PARA ATIVAR O PROTOCOLO SONORO DO COACH.
        </div>
      )}

      <div className="px-4 py-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Domínio André</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {stats.completed} de {stats.total} tarefas cumpridas
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#050a18] block leading-none">{stats.percent}%</span>
            </div>
          </div>
          <div className="w-full h-4 bg-amber-50 rounded-full overflow-hidden border border-amber-100/50">
            <div className="h-full bg-amber-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: `${stats.percent}%` }} />
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
            <h1 className="text-6xl font-black tracking-tighter leading-none">FOCO<span className="text-amber-500">.</span></h1>
            <p className="text-slate-400 text-sm font-medium mt-3">André, procrastinar é para amadores.</p>
          </div>
          <button 
            onClick={() => { setIsAnnoyingMode(!isAnnoyingMode); if(!audioEnabled) setAudioEnabled(true); }} 
            className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl transition-all ${isAnnoyingMode ? 'bg-[#3b49df] text-white' : 'bg-white text-slate-300'}`}
          >
            {isAnnoyingMode ? <BellRing size={22} className="animate-pulse" /> : <BellOff size={22} />}
          </button>
        </header>

        {/* Categories Grid */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          <button onClick={() => setFilterCategoryId(null)} className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all h-20 border-2 ${!filterCategoryId ? 'bg-[#3b49df] border-transparent shadow-lg shadow-blue-900/40 scale-105' : 'bg-white text-slate-900 border-transparent hover:scale-102'}`}>
            <LayoutGrid size={22} className="mb-1" />
            <span className="text-[9px] font-black tracking-widest uppercase">TUDO</span>
          </button>
          {categories.slice(0, 3).map(cat => (
            <button key={cat.id} onClick={() => setFilterCategoryId(cat.id)} className={`flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all h-20 border-2 ${filterCategoryId === cat.id ? 'bg-[#3b49df] border-transparent shadow-lg shadow-blue-900/40 scale-105' : 'bg-white text-slate-900 border-transparent hover:scale-102'}`}>
              <span className={`${filterCategoryId === cat.id ? 'text-white' : cat.color} mb-1`}>
                {React.createElement((Icons as any)[cat.iconName] || Tag, { size: 22 })}
              </span>
              <span className="text-[9px] font-black tracking-widest uppercase truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Add Task UI */}
        <div className="mb-10">
          <div className={`bg-white rounded-[2.5rem] transition-all shadow-2xl ${isFormExpanded ? 'p-6' : 'p-2 flex items-center h-20'}`}>
            {!isFormExpanded ? (
              <>
                <div onClick={() => setIsFormExpanded(true)} className="flex-1 px-6 cursor-text"><p className="text-slate-400 font-medium">Lembrou de algo, André?</p></div>
                <button onClick={() => setIsFormExpanded(true)} className="w-16 h-16 bg-[#050a18] text-white rounded-[1.8rem] flex items-center justify-center shadow-lg active:scale-95 transition-all"><Plus size={32}/></button>
              </>
            ) : (
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Novo Protocolo</span><X onClick={() => setIsFormExpanded(false)} className="text-slate-400 cursor-pointer p-1 hover:text-rose-500 transition-colors"/></div>
                <input autoFocus type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full text-xl font-bold text-[#050a18] outline-none placeholder:text-slate-200" placeholder="O que faremos agora?" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold text-xs outline-none border-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold text-xs outline-none border-none" />
                </div>
                <button type="submit" className="w-full bg-[#3b49df] text-white py-5 rounded-[2rem] font-black text-sm shadow-[0_10px_30px_rgba(59,73,223,0.4)] active:scale-[0.98] transition-all">EXECUTAR AGORA</button>
              </form>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              category={categories.find(c => c.id === task.categoryId)} 
              onToggle={id => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} 
              onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))} 
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <CheckCircle2 size={48} className="mx-auto mb-4" />
              <p className="font-black text-sm uppercase tracking-widest">Sem pendências. André, você é uma máquina.</p>
            </div>
          )}
        </div>
      </main>

      {/* Coach Trigger Button */}
      <div className="fixed bottom-10 right-8 z-50">
        <button 
          onClick={triggerCoach}
          className="w-20 h-20 bg-white text-slate-900 rounded-[2.2rem] flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-4 border-[#050a18] hover:scale-110 active:scale-90 transition-all group overflow-hidden"
        >
          <BrainCircuit size={32} className={`relative z-10 ${isLoadingCoach ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Nagging Overlay */}
      {showNag && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#050a18]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-rose-600 p-10 rounded-[3.5rem] text-center shadow-[0_0_80px_rgba(225,29,72,0.6)] border-4 border-rose-400 shake max-w-sm relative">
            <button onClick={() => setShowNag(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={24}/></button>
            <BrainCircuit size={48} className="mx-auto mb-6 text-white animate-bounce" />
            <h2 className="text-2xl font-black italic text-white leading-tight">"{nagMessage}"</h2>
          </div>
        </div>
      )}

      {/* PWA Footer Prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#050a18]/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 z-50">
        <Smartphone size={16} className="text-indigo-400" />
        <span className="text-[10px] font-black tracking-widest uppercase">Protocolo André Nativo</span>
      </div>
    </div>
  );
};

export default App;