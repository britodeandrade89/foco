
import React, { useState, useEffect, useMemo } from 'react';
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
  Tag
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from './types';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage } from './services/gemini';
import { requestNotificationPermission, getSafeAnalytics } from './services/firebase';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'saude', name: 'SAÚDE', color: 'text-rose-500', iconName: 'Stethoscope' },
  { id: 'viagem', name: 'VIAGEM', color: 'text-sky-500', iconName: 'Plane' },
  { id: 'casa', name: 'CARRO & CASA', color: 'text-amber-600', iconName: 'Car' },
  { id: 'pessoal', name: 'PESSOAL', color: 'text-purple-500', iconName: 'Camera' },
  { id: 'estudo', name: 'ESTUDO', color: 'text-emerald-500', iconName: 'Book' },
  { id: 'projetos', name: 'PROJETOS', color: 'text-indigo-500', iconName: 'Settings' },
  { id: 'geral', name: 'GERAL', color: 'text-amber-800', iconName: 'Tag' },
];

const INITIAL_TASKS: Task[] = [
  // SAÚDE
  { id: 1, text: "Modificar a receita médica", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 2, text: "Criar receita para mounjauro", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 3, text: "Criar receita para deposteron", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 9, text: "Procurar pedidos médicos de exame de sangue", categoryId: "saude", completed: false, note: "Dica: Verifique o e-mail de dez/2023 (Labormed Maricá).", createdAt: Date.now() },
  { id: 18, text: "Procurar certificados de vacina (Anvisa)", categoryId: "saude", completed: false, createdAt: Date.now() },
  { id: 19, text: "Traduzir docs TEA e Bariátrica p/ inglês", categoryId: "saude", completed: false, createdAt: Date.now() },
  // VIAGEM
  { id: 4, text: "Criar roteiro para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 5, text: "Pesquisar estadias para a viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 6, text: "Voo: Johanesburgo p/ Cidade do Cabo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 7, text: "Passagem: RJ p/ São Paulo", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 8, text: "Passagem: São Paulo p/ Leme", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 15, text: "Colocar todos os dados da viagem no app", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 16, text: "Colocar as passagens no app", categoryId: "viagem", completed: false, createdAt: Date.now() },
  { id: 17, text: "Procurar seguro de viagem", categoryId: "viagem", completed: false, createdAt: Date.now() },
  // CASA / CARRO
  { id: 11, text: "Levar o carro no Davi (Santa Cruz)", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 13, text: "Limpar o carro", categoryId: "casa", completed: false, createdAt: Date.now() },
  { id: 14, text: "Limpar a casa", categoryId: "casa", completed: false, createdAt: Date.now() },
  // OUTROS
  { id: 12, text: "Fazer a edição na foto da minha mãe", categoryId: "pessoal", completed: false, createdAt: Date.now() },
  { id: 20, text: "Estudar um pouco de inglês", categoryId: "estudo", completed: false, createdAt: Date.now() },
  { id: 21, text: "Melhorar app translate de viagem", categoryId: "projetos", completed: false, createdAt: Date.now() },
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
  const [nagMessage, setNagMessage] = useState<string>("André, procrastinar é para amadores.");
  const [showNag, setShowNag] = useState(false);

  // Initialize Firebase services on mount
  useEffect(() => {
    const initServices = async () => {
      await requestNotificationPermission();
      await getSafeAnalytics();
    };
    initServices();
  }, []);

  // Use effect to fetch the aggressive coach nagging message
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchNag = async () => {
      if (isAnnoyingMode) {
        const pending = tasks.filter(t => !t.completed);
        const msg = await getNaggingMessage(pending);
        setNagMessage(msg);
        setShowNag(true);
      }
    };
    
    fetchNag();
    interval = setInterval(fetchNag, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAnnoyingMode, tasks]);

  const addTask = () => {
    if (!inputValue.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: inputValue,
      categoryId: selectedCategoryId,
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate || undefined
    };
    setTasks(prev => [...prev, newTask]);
    setInputValue('');
    setDueDate('');
    setIsFormExpanded(false);
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterCategoryId) {
      result = result.filter(t => t.categoryId === filterCategoryId);
    }
    return [...result].sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt);
  }, [tasks, filterCategoryId]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 pb-24 lg:p-12">
      <header className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black tracking-tighter mb-1">
            <BrainCircuit size={20} />
            <span className="text-sm">FOCO.AI // AGGRESSIVE COACH</span>
          </div>
          <h1 className="text-6xl font-black text-[#050a18] tracking-tight">
            André, <span className="text-indigo-600">vambora.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAnnoyingMode(!isAnnoyingMode)}
            className={`p-4 rounded-3xl transition-all ${isAnnoyingMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}
          >
            {isAnnoyingMode ? <BellRing size={24} /> : <BellOff size={24} />}
          </button>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</p>
              <p className="text-2xl font-black text-[#050a18]">{stats.percent}%</p>
            </div>
          </div>
        </div>
      </header>

      {showNag && isAnnoyingMode && (
        <div className="max-w-4xl mx-auto mb-12 animate-in slide-in-from-top duration-500">
          <div className="bg-[#050a18] text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/40">
                <BrainCircuit size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Seu Coach Agressivo diz:</p>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight italic">"{nagMessage}"</h2>
              </div>
              <button onClick={() => setShowNag(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-8 space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <LayoutGrid size={12} /> Categorias
              </h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setFilterCategoryId(null)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${!filterCategoryId ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                >
                  <ListTodo size={18} /> Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategoryId(cat.id)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${filterCategoryId === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                  >
                    <span className={filterCategoryId === cat.id ? 'text-white' : cat.color}>
                      {React.createElement((Icons as any)[cat.iconName] || Tag, { size: 18 })}
                    </span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          <div className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden transition-all duration-500 ${isFormExpanded ? 'ring-2 ring-indigo-500' : ''}`}>
            {!isFormExpanded ? (
              <button 
                onClick={() => setIsFormExpanded(true)}
                className="w-full flex items-center gap-4 p-8 text-slate-400 hover:text-indigo-600 transition-colors group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-all">
                  <Plus size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight">O que você está adiando agora, André?</span>
              </button>
            ) : (
              <div className="p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <input 
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Nome da tarefa..."
                  className="w-full text-3xl font-black placeholder:text-slate-100 outline-none text-[#050a18]"
                />
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categoria</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${selectedCategoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vencimento</p>
                    <input 
                      type="datetime-local" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 outline-none border-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                  <button onClick={() => setIsFormExpanded(false)} className="px-6 py-3 text-slate-400 font-bold text-sm">Cancelar</button>
                  <button 
                    onClick={addTask}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                  >
                    CRIAR TAREFA
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                category={categories.find(c => c.id === task.categoryId)}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <CheckCircle2 size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">Nenhuma tarefa por aqui. Aproveite a folga (enquanto dura).</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#050a18]/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 z-50">
        <Smartphone size={20} className="text-indigo-400" />
        <span className="text-sm font-bold tracking-tight">Instale o FOCO.AI</span>
        <div className="w-px h-4 bg-white/10 mx-2" />
        <Download size={20} className="text-indigo-400" />
      </div>
    </div>
  );
};

export default App;
