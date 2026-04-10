import Groq from 'groq-sdk';

let clientInstance: Groq | null = null;

export function getGroqClient() {
  if (!clientInstance) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GROQ_API_KEY não configurada no arquivo .env');
    }
    clientInstance = new Groq({
      apiKey,
    });
  }
  return clientInstance;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  const client = getGroqClient();
  
  const response = await client.chat.completions.create({
    model: options.model || 'llama-3.3-70b-versatile',
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
    stream: options.stream ?? false,
  });

  return response;
}