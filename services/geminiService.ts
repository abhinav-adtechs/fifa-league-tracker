import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMatchCommentary = async (
  winnerName: string,
  loserName: string,
  winnerScore: number,
  loserScore: number,
  isDraw: boolean
): Promise<string> => {
  const client = getAiClient();
  if (!client) return "AI Commentary unavailable (Missing API Key).";

  try {
    const prompt = isDraw
      ? `Write a short, witty, 1-sentence commentary for a FIFA match that ended in a ${winnerScore}-${loserScore} draw between ${winnerName} and ${loserName}. Keep it fun and competitive.`
      : `Write a short, witty, 1-sentence commentary for a FIFA match where ${winnerName} destroyed ${loserName} with a score of ${winnerScore}-${loserScore}. Roast the loser slightly but keep it friendly workplace banter.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Match recorded!";
  } catch (error) {
    console.error("Error generating commentary:", error);
    return "Match recorded! (AI commentary failed)";
  }
};
