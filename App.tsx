
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
  Eraser
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from './types';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage } from './services/gemini';
import { requestNotificationPermission, initFirebaseMessaging, initAnalytics } from './services/firebase';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'saude', name: 'SAÚDE', color: 'text-rose-500', iconName: 'Stethoscope' },
  { id: 'viagem', name: 'VIAGEM', color: 'text-sky-500', iconName: 'Plane' },
  { id: 'casa', name: 'CARRO & CASA', color: 'text-amber-600', iconName: 'Home' },
  { id: 'pessoal', name: 'PESSOAL', color: 'text-purple-500', iconName: 'User' },
  { id: 'estudo', name: 'ESTUDO', color: 'text-emerald-500', iconName: 'Book' },
  { id: 'projetos', name: 'PROJETOS', color: 'text-indigo-500', iconName: 'Code' },
  { id: 'geral', name: 'GERAL', color: 'text-slate-400', iconName: 'Tag' },
];

const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Modificar a receita médica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 2, text: "Criar receita para Mounjaro", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 3, text: "Criar receita para Deposteron", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 9, text: "Pedidos médicos de exame de sangue", categoryId: "saude", completed: false, note: "Checar e-mail de dez/2023 do Labormed Maricá", createdAt: Date.now() },
  { id: 18, text: "Certificados de vacina (Anvisa)", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 19, text: "Traduzir documentos TEA e Bariátrica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 4, text: "Criar roteiro para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 5, text: "Pesquisar estadias para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 6, text: "Voos Johanesburgo p/ Cidade do Cabo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 7, text: "Passagens RJ p/ São Paulo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 8, text: "Passagens São Paulo p/ Leme", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 11, text: "Levar carro no Davi (Santa Cruz)", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 13, text: "Limpar o carro", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 14, text: "Limpar a casa", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 12, text: "Edição na foto da mãe", categoryId: "pessoal", completed: false, createdAt: Date.now() },
  { id: 20, text: "Estudar inglês", categoryId: "estudo", completed: false, createdAt: Date.now() },
  { id: 21, text: "Melhorar app translate de viagem", categoryId: "projetos", completed: false, createdAt: Date.now() },
];

const AVAILABLE_ICONS = ['Stethoscope', 'Plane', 'Home', 'User', 'Book', 'Code', 'Tag', 'ShoppingBag', 'Briefcase', 'Heart', 'Coffee'];

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
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  const [isAnnoyingMode, setIsAnnoyingMode] = useState(true);
  const [nagMessage, setNagMessage] = useState<string>("Pronto para trabalhar, André?");
  const [showNag, setShowNag] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);

  // Estados de Notificações Push
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);

  // Estados de Instalação PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Firebase Services safely
    initAnalytics();
    initFirebaseMessaging().then((messaging) => {
      if (messaging && 'Notification' in window && Notification.permission === 'granted') {
        setPushEnabled(true);
      } else {
        setShowPushBanner(true);
      }
    });

    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const timer = setTimeout(() => {
      if (!isStandaloneMode) setShowInstallBanner(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleEnablePush = async () => {
    const success = await requestNotificationPermission();
    if (success) {
      setPushEnabled(true);
      setShowPushBanner(false);
      // Feedback imediato
      if ('Notification' in window) {
        new Notification("FOCO Ativado!", {
          body: "André, agora eu posso te perseguir em qualquer lugar.",
          icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
        });
      }
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
    } else if (!isIOS) {
      alert("Para instalar: Toque nos três pontos do navegador e selecione 'Instalar Aplicativo'.");
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
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { console.warn("Interação de áudio necessária"); }
  }, [isAnnoyingMode, audioEnabled]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(t => t.completed).length;
    return (completedCount / tasks.length) * 100;
  }, [tasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
          const due = new Date(task.dueDate);
          const diff = due.getTime() - now.getTime();
          if (Math.abs(diff) < 30000 && !showNag) {
            const msg = `ANDRÉ! ACORDA! "${task.text}" é pra agora!`;
            setNagMessage(msg);
            setShowNag(true);
            playNagSound(1);
            
            // Notificação de Sistema se habilitado
            if (pushEnabled && 'Notification' in window) {
              new Notification("PRAZO ESGOTADO", {
                body: msg,
                icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
              });
            }
            
            setTimeout(() => setShowNag(false), 10000);
          }
        }
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [tasks, showNag, playNagSound, pushEnabled]);

  useEffect(() => {
    const pendingCount = tasks.filter(t => !t.completed).length;
    if (pendingCount === 0) return;

    const nagTimer = setInterval(async () => {
      if (!isAnnoyingMode || showNag) return;
      setIsLoadingCoach(true);
      const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
      setNagMessage(msg);
      setIsLoadingCoach(false);
      setShowNag(true);
      playNagSound();
      
      // Notificação push no intervalo do coach
      if (pushEnabled && isAnnoyingMode && 'Notification' in window) {
        new Notification("COACH VIGILANTE", {
          body: msg,
          icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
        });
      }

      setTimeout(() => setShowNag(false), 6000);
    }, 120000);

    return () => clearInterval(nagTimer);
  }, [tasks, isAnnoyingMode, playNagSound, showNag, pushEnabled]);

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

  const handleSaveCategory = () => {
    if (!newCatName.trim()) return;
    
    if (editingCategoryId) {
      setCategories(prev => prev.map(c => c.id === editingCategoryId ? { ...c, name: newCatName.toUpperCase(), iconName: newCatIcon } : c));
      setEditingCategoryId(null);
    } else {
      const id = newCatName.toLowerCase().replace(/\s+/g, '-');
      setCategories([...categories, {
        id,
        name: newCatName.toUpperCase(),
        color: `text-indigo-500`,
        iconName: newCatIcon
      }]);
    }
    setNewCatName('');
    setNewCatIcon('Tag');
  };

  const handleClearCompleted = () => {
    if(confirm('Apagar todas as tarefas concluídas?')) {
      setTasks(prev => prev.filter(t => !t.completed));
    }
  };

  const startEditingCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.iconName);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterCategoryId) {
      result = result.filter(t => t.categoryId === filterCategoryId);
    }
    return result;
  }, [tasks, filterCategoryId]);

  const pending = filteredTasks.filter(t => !t.completed);
  const completed = filteredTasks.filter(t => t.completed);

  return (
    <div className="min-h-screen transition-all duration-300 pb-32">
      {/* Banner de Push Notification */}
      {showPushBanner && !pushEnabled && (
        <div className="fixed top-4 inset-x-4 z-[110] animate-in slide-in-from-top duration-500">
          <div className="bg-white border-2 border-indigo-500 rounded-[2rem] p-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
              <MessageSquare size={24} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-slate-900 uppercase">Alertas Ativos</h4>
              <p className="text-[10px] text-slate-500">Receba alertas mesmo com o app fechado.</p>
            </div>
            <button 
              onClick={handleEnablePush}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              ATIVAR
            </button>
            <button onClick={() => setShowPushBanner(false)} className="text-slate-300 p-1"><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Banner de Instalação PWA */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed top-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-top duration-500">
          <div className="bg-slate-900 text-white rounded-[2rem] p-5 shadow-2xl border border-white/10 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400">
                <Download size={28} className="text-white animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight">FOCO André</h3>
                <p className="text-xs text-slate-400">Instale agora para o seu coach te vigiar melhor.</p>
              </div>
            </div>
            
            {isIOS ? (
              <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
                <div className="flex items-center gap-4 text-xs font-bold text-indigo-400">
                  <div className="w-8 h-8 rounded-xl bg-indigo-400/20 flex items-center justify-center text-indigo-400">
                    <Share size={16} />
                  </div>
                  <span>1. Toque em "Compartilhar" no Safari</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-indigo-400">
                  <div className="w-8 h-8 rounded-xl bg-indigo-400/20 flex items-center justify-center text-indigo-400">
                    <Plus size={16} />
                  </div>
                  <span>2. Role e escolha "Adicionar à Tela de Início"</span>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 border-b-4 border-indigo-800"
              >
                <Smartphone size={18} />
                INSTALAR NO MEU CELULAR
              </button>
            )}
          </div>
        </div>
      )}

      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} className="bg-rose-600 text-white p-2 text-center text-[10px] font-black tracking-widest uppercase cursor-pointer hover:bg-rose-700 shadow-lg">
          CLIQUE AQUI PARA ATIVAR OS ALERTAS DO COACH.
        </div>
      )}

      <div className="sticky top-0 z-40 bg-white shadow-sm pt-4 pb-2 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              Meta de André
              {pushEnabled && <ShieldCheck size={10} className="text-emerald-500" title="Alertas Ativos" />}
            </h2>
            <span className="text-sm font-black text-indigo-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${progress}%` }}
            />
            {progress === 100 && (
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-8 md:pt-10">
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-indigo-600" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SISTEMA DE ALTA PERFORMANCE</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">FOCO<span className="text-indigo-600">.</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-2">André, o sucesso exige consistência.</p>
          </div>
          
          <div className="flex gap-2">
            {!isStandalone && (
              <button 
                onClick={() => setShowInstallBanner(true)}
                className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm relative overflow-hidden group"
                title="Instalar App"
              >
                <Download size={20} className="group-hover:scale-110 transition-transform" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              </button>
            )}
            <button onClick={() => setIsAnnoyingMode(!isAnnoyingMode)} className={`p-4 rounded-2xl transition-all shadow-sm border-2 ${isAnnoyingMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
              {isAnnoyingMode ? <BellRing size={20} className="animate-pulse" /> : <BellOff size={20} />}
            </button>
            <button onClick={() => setShowCategoryManager(true)} className="p-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
              <Tags size={20} />
            </button>
          </div>
        </header>

        {(showNag || isLoadingCoach) && (
          <div className={`mb-8 p-6 rounded-3xl relative transition-all duration-500 border-4 ${showNag ? 'bg-rose-600 text-white border-rose-400 shadow-2xl scale-100 shake' : 'bg-slate-800 text-white border-slate-700 scale-95 opacity-50'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
                <BrainCircuit size={24} className={isLoadingCoach ? 'animate-spin' : 'animate-bounce'} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Coach diz:</p>
                <p className="text-lg font-extrabold leading-tight">"{isLoadingCoach ? "Avaliando sua preguiça..." : nagMessage}"</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-4 gap-1.5">
          <button 
            onClick={() => setFilterCategoryId(null)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[9px] font-black tracking-tighter transition-all border-2 h-14 ${!filterCategoryId ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-105' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}
          >
            <LayoutGrid size={14} className="mb-1" />
            TUDO
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[9px] font-black tracking-tighter transition-all border-2 h-14 ${filterCategoryId === cat.id ? 'bg-slate-900 border-slate-800 text-white shadow-md scale-105' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}
            >
              <span className={`${filterCategoryId === cat.id ? 'text-white' : cat.color} mb-1`}>
                {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 14 })}
              </span>
              <span className="truncate w-full text-center px-0.5">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className={`mb-10 bg-white rounded-3xl border-2 transition-all shadow-sm ${isFormExpanded ? 'border-indigo-400 p-6' : 'border-slate-200'}`}>
          {!isFormExpanded ? (
            <div onClick={() => setIsFormExpanded(true)} className="flex items-center justify-between p-4 cursor-text">
              <p className="text-slate-400 text-lg font-medium">Novo compromisso?</p>
              <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg hover:rotate-90 transition-transform">
                <Plus size={24} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adicionar Tarefa</h4>
                <button type="button" onClick={() => setIsFormExpanded(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={20} /></button>
              </div>
              <input 
                autoFocus
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ex: Arrumar as passagens no app"
                className="w-full text-xl font-bold focus:outline-none placeholder:text-slate-200"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Categoria</label>
                  <select 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none focus:border-indigo-300 transition-all"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Prazo (Opcional)</label>
                  <input 
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none focus:border-indigo-300 transition-all"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transform active:scale-[0.98] transition-all">
                AGENDAR AGORA
              </button>
            </form>
          )}
        </div>

        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ListTodo size={16} className="text-indigo-600" />
                {filterCategoryId ? categories.find(c => c.id === filterCategoryId)?.name : 'Lista de Foco'}
              </h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[10px] font-black">{pending.length} ATIVAS</span>
            </div>
            <div className="space-y-3">
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
                <div className="text-center py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
                  <Sparkles className="mx-auto text-amber-400 mb-3" size={32} />
                  <p className="text-slate-400 font-bold text-sm">Sem pendências aqui. Vá descansar.</p>
                </div>
              )}
            </div>
          </section>

          {completed.length > 0 && (
            <section className="pt-8 border-t-2 border-slate-200/50">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Concluído</h3>
                <button 
                  onClick={handleClearCompleted}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors shadow-sm"
                >
                  <Eraser size={12} />
                  Limpar Tudo
                </button>
              </div>
              <div className="space-y-2">
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

      {showCategoryManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">Categorias</h2>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Personalização Estrutural</p>
              </div>
              <button onClick={() => { setShowCategoryManager(false); setEditingCategoryId(null); setNewCatName(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4">{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome da Categoria..." 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                  <div className="relative group">
                    <button className="bg-white border-2 border-slate-200 rounded-2xl p-3 flex items-center justify-center min-w-[50px] hover:border-indigo-300 transition-colors">
                      {React.createElement((Icons as any)[newCatIcon] || Icons.Tag, { size: 20 })}
                    </button>
                    <div className="absolute top-full right-0 mt-3 p-3 bg-white rounded-3xl shadow-2xl border-2 border-slate-100 grid grid-cols-4 gap-2 opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all z-20">
                      {AVAILABLE_ICONS.map(ic => (
                        <button key={ic} onClick={() => setNewCatIcon(ic)} className={`p-2.5 rounded-xl hover:bg-slate-50 ${newCatIcon === ic ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                          {React.createElement((Icons as any)[ic], { size: 18 })}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveCategory} className="w-full mt-3 bg-indigo-600 text-white py-3 rounded-2xl font-black text-sm shadow-md">
                  {editingCategoryId ? 'SALVAR ALTERAÇÕES' : 'CRIAR CATEGORIA'}
                </button>
              </div>

              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-white border-2 border-slate-100 p-4 rounded-3xl group">
                    <div className="flex items-center gap-3">
                      <span className={`${cat.color} p-2 bg-slate-50 rounded-xl`}>
                        {React.createElement((Icons as any)[cat.iconName] || Icons.Tag, { size: 20 })}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                    </div>
                    {cat.id !== 'geral' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditingCategory(cat)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                        <button 
                          onClick={() => {
                            setCategories(prev => prev.filter(c => c.id !== cat.id));
                            setTasks(prev => prev.map(t => t.categoryId === cat.id ? { ...t, categoryId: 'geral' } : t));
                          }} 
                          className="p-2 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-center">
        <button 
          onClick={async () => {
            setIsLoadingCoach(true);
            const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
            setNagMessage(msg);
            setIsLoadingCoach(false);
            setShowNag(true);
            playNagSound();
            
            // Teste de notificação forçado no botão do coach
            if (pushEnabled && 'Notification' in window) {
              new Notification("COACH ON-DEMAND", {
                body: msg,
                icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
              });
            }
            
            setTimeout(() => setShowNag(false), 5000);
          }}
          className="w-20 h-20 bg-white border-4 border-slate-900 text-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-indigo-200"
        >
          <BrainCircuit size={32} />
        </button>
      </div>
    </div>
  );
};

export default App;
