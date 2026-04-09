import { useState } from 'react';

interface GenerateImageOptions {
  prompt: string;
  size?: '1024x1024' | '1536x1024' | '1024x1536';
}

interface GenerateImageResult {
  imageUrl: string;
  revisedPrompt?: string;
}

export function useImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (options: GenerateImageOptions): Promise<GenerateImageResult | null> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setError('API key não configurada');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: options.prompt
              }]
            }],
            generationConfig: {
              responseModalities: 'image'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        const base64Image = data.candidates[0].content.parts[0].inlineData.data;
        const revisedPrompt = data.candidates[0]?.content?.parts?.[0]?.text;
        
        return {
          imageUrl: `data:image/png;base64,${base64Image}`,
          revisedPrompt
        };
      }

      throw new Error('Nenhuma imagem retornada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generateImage, loading, error };
}