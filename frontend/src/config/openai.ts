import OpenAI from 'openai';

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateArgument = async (
  topic: string,
  stance: 'for' | 'against' | number,
  rhetoricStyle: string = 'standard',
  systemPrompt: string = '',
  previousArguments: Array<{ speaker: string; text: string }> = []
) => {
  try {
    const stanceText = typeof stance === 'number' 
      ? (stance > 0 ? 'for' : 'against')
      : stance;

    const contextPrompt = previousArguments.length > 0
      ? `\nPrevious arguments in the debate:\n${previousArguments.map(arg => `${arg.speaker}: ${arg.text}`).join('\n')}`
      : '';

    const stylePrompt = rhetoricStyle !== 'standard'
      ? `\nUse a ${rhetoricStyle} rhetoric style in your response.`
      : '';

    const customSystemPrompt = systemPrompt || "You are a skilled debater. Generate a concise, logical argument for the given stance on the topic. Keep responses under 150 words, focus on one strong point, and maintain a formal tone.";

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: customSystemPrompt
        },
        {
          role: "user",
          content: `Generate a ${stanceText} argument for the following topic: ${topic}${stylePrompt}${contextPrompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content || "Could not generate argument";
  } catch (error) {
    console.error('Error generating argument:', error);
    throw new Error('Failed to generate argument');
  }
};

export default openai; 