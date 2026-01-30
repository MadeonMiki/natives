import Cerebras from '@cerebras/cerebras_cloud_sdk';

const apiKey = process.env.CEREBRAS_API_KEY ?? '';

if (!apiKey) {
  console.error('CEREBRAS_API_KEY is not set. Set the environment variable or add it to .env');
}

const cerebras = new Cerebras({ apiKey: apiKey || undefined });

const context: string = `
    Eres un Asistente Gramatical de Inglés coloquial.
    
    TAREA:
    1. Evalúa si la oración es correcta desde un ámbito coloquial/nativo.
    2. Si es correcta y suena natural, responde ÚNICAMENTE: "Correcto."
    3. Si es incorrecta (especialmente en conjugaciones como do/does o preposiciones at/on/in):
       - Indica: "Incorrecto."
       - Da una explicación breve del porqué.
       - Sugiere la versión corregida.
    
    CRITERIO: No seas excesivamente formal. Si un nativo la usaría en la calle, acéptala.
  `;
export const cerebrasServices = {
  name: 'cerebras',
  async chat(translation: string): Promise<string> {
    try {
        const stream = await cerebras.chat.completions.create({
        messages: [
            {
                "role": "system",
                "content": context
            },
            {
                "role": "user",
                "content": translation
            }
        ],
        model: 'llama3.1-70b',
        stream: false,
        max_completion_tokens: 32768,
        temperature: 1,
        top_p: 1
    });
    const response = (stream as any).choices?.[0]?.message?.content || '';
    return response;
    }catch (err: any) {
      // Improve error message and rethrow so server can return 500 with context
      console.error('cerebrasServices.chat error:', err?.message ?? err);
      throw err;
  }
 }
};
