
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
        ${task.completed ? 'bg-emerald-50/50 border-emerald-200 shadow-sm translate-y-0.5' : 'bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 border-slate-200'}
        ${isOverdue ? 'border-l-4 border-l-rose-500' : 'border'}
        rounded-2xl p-4 cursor-pointer
      `}
      onClick={() => onToggle(task.id)}
    >
      <div className="flex items-center gap-4">
        {/* Liga/Desliga Toggle Switch */}
        <div className="flex-shrink-0">
          <div 
            className={`
              w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out
              ${task.completed ? 'bg-emerald-500' : 'bg-slate-200'}
            `}
          >
            <div 
              className={`
                w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out
                ${task.completed ? 'translate-x-6' : 'translate-x-0'}
              `}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {category && (
              <span className={`flex-shrink-0 ${task.completed ? 'text-emerald-600' : category.color}`}>
                <DynamicIcon name={category.iconName} size={14} />
              </span>
            )}
            <p className={`text-sm font-bold truncate transition-all ${task.completed ? 'text-emerald-800' : 'text-slate-800'}`}>
              {task.text}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.dueDate && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${isOverdue ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                {isOverdue ? <AlertCircle size={8} /> : <Clock size={8} />}
                {formatTime(task.dueDate)}
              </div>
            )}
            {category && !task.completed && (
              <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tighter">
                {category.name}
              </div>
            )}
          </div>
          
          {!task.completed && task.note && (
            <div className="mt-2 flex items-start gap-2 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/30">
              <Info size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-indigo-600 italic leading-snug">
                {task.note}
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className={`p-2 rounded-full transition-colors ${task.completed ? 'text-emerald-300 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
