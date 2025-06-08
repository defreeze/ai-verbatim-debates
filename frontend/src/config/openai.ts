import OpenAI from 'openai';

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  console.warn('OpenAI API key not found in environment variables. Make sure to set REACT_APP_OPENAI_API_KEY in your .env file');
}

// WARNING: This configuration allows browser usage, which means your API key could be exposed.
// In a production environment, you should:
// 1. Create a backend API that makes OpenAI calls
// 2. Use environment variables on the server
// 3. Never expose the API key in the frontend
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only use this in development
});

export async function generateArgument(
  topic: string,
  stance: number,
  rhetoricStyle: string,
  systemPrompt: string,
  previousArguments: Array<{ speaker: string; text: string; summary?: string }>
): Promise<{ text: string; summary: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nYou are participating in a debate. Generate both a detailed argument and a concise summary (max 3 sentences).`
        },
        {
          role: "user",
          content: `Topic: ${topic}\nStance: ${stance}\nStyle: ${rhetoricStyle}\n\nPrevious arguments: ${JSON.stringify(previousArguments)}`
        }
      ],
      functions: [
        {
          name: "generate_debate_response",
          description: "Generate a debate response with both full argument and summary",
          parameters: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The full detailed argument"
              },
              summary: {
                type: "string",
                description: "A concise summary of the argument (max 3 sentences)"
              }
            },
            required: ["text", "summary"]
          }
        }
      ],
      function_call: { name: "generate_debate_response" }
    });

    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error("No function call in response");
    }

    // Sanitize the response by removing control characters
    const sanitizedArgs = functionCall.arguments.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    try {
      const response = JSON.parse(sanitizedArgs);
      return {
        text: response.text,
        summary: response.summary
      };
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      // Attempt a more aggressive cleanup if the first parse fails
      const cleanedArgs = sanitizedArgs
        .replace(/\\([^"\\\/bfnrtu])/g, '$1') // Remove invalid escapes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      const response = JSON.parse(cleanedArgs);
      return {
        text: response.text,
        summary: response.summary
      };
    }
  } catch (error) {
    console.error('Error generating argument:', error);
    return {
      text: "An error occurred while generating the argument.",
      summary: "Error generating response."
    };
  }
}

export default openai; 