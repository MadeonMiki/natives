import { Groq } from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY ?? '';
const baseURL = process.env.GROQ_BASE_URL;

if (!apiKey) {
  console.error('GROQ_API_KEY is not set. Set the environment variable or add it to .env');
}

const groq = new Groq({ apiKey: apiKey || undefined, baseURL });

export const groqServices = {
  name: 'groq',
  async chat(translation: string): Promise<string> {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'eres un asistente de correccion gramatical para oraciones en ingles, si me equivoco, corrigeme y muestrame la version correcta, ademas dame una explicacion los mas breve possible de por que funciona de esa manera.'
          },
          {
            role: 'user',
            content: translation || 'hello'
          }
        ],
        model: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: true,
      });

      let response = '';
      for await (const chunk of chatCompletion) {
        const content = chunk.choices?.[0]?.delta?.content || '';
        response += content;
      }

      return response;
    } catch (err: any) {
      // Improve error message and rethrow so server can return 500 with context
      console.error('groqServices.chat error:', err?.message ?? err);
      // If the error has a response body, include status/code when available
      if (err?.response) {
        console.error('Response from GROQ API:', err.response);
      }
      throw err;
    }
  },
};


