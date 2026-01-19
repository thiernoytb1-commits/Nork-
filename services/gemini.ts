
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export async function* sendMessageStream(
  modelName: string,
  history: Message[],
  message: string,
  useSearch: boolean = false,
  attachments?: { mimeType: string; data: string }[]
) {
  const ai = getGeminiClient();
  
  // Format history for the chat
  const contents = history.map(m => ({
    role: m.role,
    parts: m.parts.map(p => {
        if (p.inlineData) return { inlineData: p.inlineData };
        return { text: p.text };
    })
  }));

  // Add current message with attachments if any
  const currentParts: any[] = [{ text: message }];
  if (attachments) {
    attachments.forEach(att => {
      currentParts.push({ inlineData: att });
    });
  }

  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: "You are a helpful, creative, and professional AI assistant. You provide clear, concise, and accurate information.",
      tools: useSearch ? [{ googleSearch: {} }] : undefined,
    },
    // We pass history manually to the create call if needed, 
    // but usually, we just send the message to the active chat object.
  });

  // Since we want full control over the history format for multimodal, 
  // let's use sendMessageStream on the chat instance.
  // We initialize the chat with history.
  const streamResponse = await chat.sendMessageStream({
    message: currentParts
  });

  for await (const chunk of streamResponse) {
    const c = chunk as GenerateContentResponse;
    yield {
        text: c.text,
        grounding: c.candidates?.[0]?.groundingMetadata
    };
  }
}
