import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

// Inicialização segura: Se a API Key não estiver no .env (comum em deploys novos),
// usa uma string vazia para não quebrar o construtor, e falha graciosamente na chamada.
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getNaggingMessage = async (pendingTasks: Task[]): Promise<string> => {
  if (pendingTasks.length === 0) return "Parabéns, André. Por enquanto você está limpo. Não se acostume.";
  if (!apiKey) {
    console.warn("API Key do Gemini não configurada.");
    return "André, configure a API Key no Vercel para eu poder te xingar corretamente.";
  }

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
      model: 'gemini-3-flash-preview',
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
    const fallbacks = [
      "André, pare de olhar para mim e termine essas tarefas!",
      "O tempo está passando, André!",
      "Menos desculpas, mais ação."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export const getTaskInsight = async (task: Task): Promise<string> => {
  if (!apiKey) return "Foco no objetivo!";
  
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