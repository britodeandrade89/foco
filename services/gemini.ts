import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

// FIX: Initialize Gemini client directly using process.env.API_KEY as per guidelines.
// The API key is assumed to be present and valid.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNaggingMessage = async (pendingTasks: Task[]): Promise<string> => {
  if (pendingTasks.length === 0) return "Parabéns, André. Por enquanto você está limpo. Não se acostume.";
  
  // FIX: Removed unnecessary null check for 'ai' as it is now always initialized.
  
  const taskList = pendingTasks.map(t => `- [${t.categoryId}] ${t.text}`).join('\n');
  
  const prompt = `
    Você é o Coach de Produtividade Agressivo do André. 
    Ele tem as seguintes tarefas pendentes:
    ${taskList}

    Sua missão: Escrever UMA frase curta (máximo 15 palavras) que seja irritante, direta e motivadora para o André parar de procrastinar. 
    Use um tom sarcástico ou autoritário, mas focado no André. 
    Fale em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Usando versão preview mais recente conforme guidelines
      contents: prompt,
      config: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text?.trim() || "VAI TRABALHAR, ANDRÉ!";
  } catch (error) {
    console.error("Gemini Error:", error);
    // Mensagens de fallback variadas para não ficar repetitivo se offline
    const fallbacks = [
      "André, pare de olhar para mim e termine essas tarefas!",
      "O tempo está passando, André!",
      "Menos desculpas, mais ação."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export const getTaskInsight = async (task: Task): Promise<string> => {
  // FIX: Removed unnecessary null check for 'ai'.
  
  const prompt = `Dê uma dica rápida ou curiosidade sobre esta tarefa: "${task.text}" da categoria "${task.categoryId}". Seja breve.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text?.trim() || "Foco no objetivo!";
  } catch {
    return "Foco no objetivo!";
  }
};