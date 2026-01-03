
import React from 'react';
import { 
  Trash2, 
  Info,
  AlertCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from '../types';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const DynamicIcon = ({ name, className, size = 18 }: { name: string, className?: string, size?: number }) => {
  const IconComponent = (Icons as any)[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, category, onToggle, onDelete }) => {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`
        relative overflow-hidden group transition-all duration-300 transform
        ${task.completed ? 'bg-white/10 border-white/5 opacity-50 scale-[0.98]' : 'bg-white border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1'}
        rounded-[2.2rem] p-5 cursor-pointer border
      `}
      onClick={() => onToggle(task.id)}
    >
      <div className="flex items-center gap-5">
        {/* Toggle Custom Switch */}
        <div className="flex-shrink-0">
          <div 
            className={`
              w-12 h-6 rounded-full p-1 transition-all duration-300
              ${task.completed ? 'bg-emerald-500' : 'bg-slate-200'}
            `}
          >
            <div 
              className={`
                w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300
                ${task.completed ? 'translate-x-6' : 'translate-x-0'}
              `}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className={`flex-shrink-0 ${task.completed ? 'text-emerald-400' : category.color}`}>
                <DynamicIcon name={category.iconName} size={16} />
              </span>
            )}
            <p className={`text-base font-black truncate transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.text}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.dueDate && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-black uppercase ${isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                {isOverdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                {formatTime(task.dueDate)}
              </div>
            )}
            {category && !task.completed && (
              <div className="px-2 py-1 rounded-xl text-[9px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest">
                {category.name}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if(confirm('Apagar esta tarefa?')) onDelete(task.id); 
          }}
          className="p-3 rounded-2xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};
