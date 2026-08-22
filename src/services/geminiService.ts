import { GoogleGenAI } from "@google/genai";
import { APP_CONFIG, isDeveloperQuery } from "../config/appConfig";
import { VoiceEmotionCore, EmotionType } from "./voiceEmotionCore";

let chatSession: any = null;

export function resetAuraSession() {
  chatSession = null;
}
export const resetZoyaSession = resetAuraSession;

export async function getAuraResponse(
  prompt: string,
  history: { sender: "user" | "zoya" | "aura"; text: string }[] = []
): Promise<{ text: string; emotion: EmotionType }> {
  const voiceEngine = VoiceEmotionCore.getInstance();

  // Deterministic guard for developer query
  if (isDeveloperQuery(prompt)) {
    voiceEngine.setEmotion("serious");
    return {
      text: APP_CONFIG.developerStatement,
      emotion: "serious",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep last 20 messages
      const recentHistory = history.slice(-20);

      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction: APP_CONFIG.systemInstruction,
        },
        history: formattedHistory,
      });
    }

    const response = await chatSession.sendMessage({ message: prompt });
    const responseText = response.text || "I'm right here with you.";
    
    // Detect context and emotion
    const detectedEmotion = voiceEngine.detectEmotion(prompt, responseText);
    voiceEngine.setEmotion(detectedEmotion);

    return {
      text: responseText,
      emotion: detectedEmotion,
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    voiceEngine.setEmotion("supportive");
    return {
      text: "I encountered a brief connection issue. Don't worry, please try again!",
      emotion: "supportive",
    };
  }
}
export const getZoyaResponse = getAuraResponse;

export async function getAuraAudio(text: string, emotion?: EmotionType): Promise<string | null> {
  const voiceEngine = VoiceEmotionCore.getInstance();
  return voiceEngine.synthesizeSpeech(text, emotion);
}
export const getZoyaAudio = getAuraAudio;
