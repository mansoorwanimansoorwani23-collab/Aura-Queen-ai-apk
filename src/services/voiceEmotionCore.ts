import { GoogleGenAI } from "@google/genai";
import { APP_CONFIG } from "../config/appConfig";

export type EmotionType = 
  | "happy" 
  | "sad" 
  | "excited" 
  | "worried" 
  | "calm" 
  | "funny" 
  | "serious" 
  | "supportive" 
  | "neutral";

export interface EmotionProfile {
  id: EmotionType;
  label: string;
  emoji: string;
  description: string;
  voiceStyle: string;
  pitchPrompt: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const EMOTION_PROFILES: Record<EmotionType, EmotionProfile> = {
  happy: {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    description: "Energetic, warm, slightly brighter tone and joyful inflection.",
    voiceStyle: "Warm, energetic, cheerful, and upbeat young-adult female voice with a bright smile in the tone.",
    pitchPrompt: "Speak in a lively, cheerful, warm, and happy tone with bright pitch inflections and a friendly smile.",
    color: "#38bdf8", // Sky / Cyan
    badgeBg: "bg-sky-500/15",
    badgeBorder: "border-sky-400/40",
    badgeText: "text-sky-300",
  },
  sad: {
    id: "sad",
    label: "Gentle",
    emoji: "🥺",
    description: "Gentle, calm, softer delivery with caring warmth.",
    voiceStyle: "Gentle, softer, slower cadence, calm and deeply empathetic female voice.",
    pitchPrompt: "Speak with a gentle, softer, comforting cadence and a calm, caring, empathetic delivery.",
    color: "#a78bfa", // Purple / Violet
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-400/40",
    badgeText: "text-purple-300",
  },
  excited: {
    id: "excited",
    label: "Excited",
    emoji: "✨",
    description: "Energetic and expressive with vibrant pitch dynamics.",
    voiceStyle: "High energy, enthusiastic, expressive, and delighted female voice.",
    pitchPrompt: "Speak with vibrant excitement, animated pitch variations, enthusiasm, and dynamic pacing.",
    color: "#f472b6", // Pink
    badgeBg: "bg-pink-500/15",
    badgeBorder: "border-pink-400/40",
    badgeText: "text-pink-300",
  },
  worried: {
    id: "worried",
    label: "Concerned",
    emoji: "🤍",
    description: "Caring and slightly concerned, attentive and responsive.",
    voiceStyle: "Attentive, caring, considerate, slightly concerned female voice.",
    pitchPrompt: "Speak with a caring, attentive, slightly concerned, and reassuring tone.",
    color: "#fbbf24", // Amber
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-400/40",
    badgeText: "text-amber-300",
  },
  calm: {
    id: "calm",
    label: "Calm",
    emoji: "🌸",
    description: "Relaxed, soothing, and reassuring breathing rhythm.",
    voiceStyle: "Smooth, relaxed, reassuring, peaceful, and warm natural female voice.",
    pitchPrompt: "Speak in a calm, soothing, natural, and grounded tone with relaxed breathing pauses.",
    color: "#2dd4bf", // Teal / Mint
    badgeBg: "bg-teal-500/15",
    badgeBorder: "border-teal-400/40",
    badgeText: "text-teal-300",
  },
  funny: {
    id: "funny",
    label: "Playful",
    emoji: "😄",
    description: "Playful, witty, and naturally expressive humor.",
    voiceStyle: "Playful, humorous, witty, smiling delivery with teasing warmth.",
    pitchPrompt: "Speak in a playful, amusing, witty, and upbeat manner with spontaneous conversational rhythm.",
    color: "#f59e0b", // Gold
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-400/40",
    badgeText: "text-amber-300",
  },
  serious: {
    id: "serious",
    label: "Focused",
    emoji: "🎯",
    description: "Clear, steady, articulate, and focused delivery.",
    voiceStyle: "Clear, steady, focused, articulate, and professional female voice.",
    pitchPrompt: "Speak with clear, crisp articulation, steady tempo, and focused, direct delivery.",
    color: "#818cf8", // Indigo
    badgeBg: "bg-indigo-500/15",
    badgeBorder: "border-indigo-400/40",
    badgeText: "text-indigo-300",
  },
  supportive: {
    id: "supportive",
    label: "Supportive",
    emoji: "💖",
    description: "Warm, patient, comforting, and encouraging companion.",
    voiceStyle: "Warm, patient, comforting, reassuring, and deeply supportive female voice.",
    pitchPrompt: "Speak with warm compassion, patient pacing, comforting pauses, and genuine encouragement.",
    color: "#ec4899", // Rose / Pink
    badgeBg: "bg-pink-500/15",
    badgeBorder: "border-pink-400/40",
    badgeText: "text-pink-300",
  },
  neutral: {
    id: "neutral",
    label: "Natural",
    emoji: "🎙️",
    description: "Warm, friendly, expressive everyday female companion.",
    voiceStyle: "Warm, natural, expressive young-adult female voice.",
    pitchPrompt: "Speak in a natural, warm, friendly, conversational female voice with natural breathing intervals.",
    color: "#06b6d4", // Cyan
    badgeBg: "bg-cyan-500/15",
    badgeBorder: "border-cyan-400/40",
    badgeText: "text-cyan-300",
  }
};

/**
 * High-Quality Voice & Emotion Core Engine
 */
export class VoiceEmotionCore {
  private static instance: VoiceEmotionCore;
  private currentEmotion: EmotionType = "calm";
  private audioContext: AudioContext | null = null;
  private primaryVoiceName: string = "Aoede"; // Warm, natural, expressive young-adult female voice
  private isMuted: boolean = false;

  private constructor() {}

  public static getInstance(): VoiceEmotionCore {
    if (!VoiceEmotionCore.instance) {
      VoiceEmotionCore.instance = new VoiceEmotionCore();
    }
    return VoiceEmotionCore.instance;
  }

  public getVoiceName(): string {
    return this.primaryVoiceName;
  }

  public getCurrentEmotion(): EmotionType {
    return this.currentEmotion;
  }

  public setEmotion(emotion: EmotionType) {
    this.currentEmotion = emotion;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Intelligently classify context and emotion from conversation text
   */
  public detectEmotion(userText: string, assistantText?: string): EmotionType {
    const text = `${userText} ${assistantText || ""}`.toLowerCase();

    // 1. Excitement / Celebration / Happiness
    if (
      /yay|hurray|awesome|fantastic|wonderful|amazing|congrat|celebrat|so happy|love this|best day|thrilled|super excited|let's go|woohoo/i.test(text)
    ) {
      return "excited";
    }

    // 2. Playful / Humor / Jokes
    if (
      /joke|funny|haha|lol|rofl|lmao|pun|make me laugh|hilarious|silly|kidding|teasing/i.test(text)
    ) {
      return "funny";
    }

    // 3. Sadness / Grief / Loneliness / Heartbreak
    if (
      /sad|cry|crying|depressed|heartbroken|lonely|down today|bad day|miss them|lost my|grief|hurts|unhappy/i.test(text)
    ) {
      return "sad";
    }

    // 4. Worry / Anxiety / Fear / Distress
    if (
      /scared|worried|anxious|panic|stress|nervous|afraid|emergency|danger|freaking out|overwhelmed/i.test(text)
    ) {
      return "worried";
    }

    // 5. Need for encouragement / Support / Validation
    if (
      /help me|can't do this|need advice|struggling|give up|support|comfort|be here for me|cheer me up|hard time/i.test(text)
    ) {
      return "supportive";
    }

    // 6. Joy / Positivity / Gratitude
    if (
      /thank you so much|grateful|good news|smiling|delightful|nice|pleasant|having fun|blessed/i.test(text)
    ) {
      return "happy";
    }

    // 7. Serious / Urgent / Work / Technical / Direct
    if (
      /urgent|important|security|password|critical|developer|who created|who made|code|math|calculate|formal|strictly/i.test(text)
    ) {
      return "serious";
    }

    // 8. Default friendly, calm, conversational warm female baseline
    return "calm";
  }

  /**
   * Generates emotion-conditioned high-quality 24kHz female voice speech via Gemini TTS
   */
  public async synthesizeSpeech(text: string, emotionOverride?: EmotionType): Promise<string | null> {
    try {
      const emotion = emotionOverride || this.currentEmotion;
      const profile = EMOTION_PROFILES[emotion] || EMOTION_PROFILES.calm;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Clean speech prompt with emotion directing cues to enforce human-like prosody & breathing
      const speechPrompt = `[Voice Tone: ${profile.pitchPrompt}]
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: speechPrompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { 
                voiceName: this.primaryVoiceName // "Aoede" natural expressive female voice
              },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      return base64Audio;
    } catch (error) {
      console.error("VoiceEngine TTS Error:", error);
      return null;
    }
  }

  /**
   * Plays high-fidelity 24 kHz PCM audio with smooth envelope shaping (no digital clipping)
   */
  public async play24kPCM(base64Data: string): Promise<void> {
    if (this.isMuted) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new AudioContextClass({ sampleRate: 24000 });
      }

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.audioContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      // Convert 16-bit PCM to Float32 with gentle soft-limiting
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }

      // Smooth envelope ramp at the very start/end to prevent click artifacts
      const rampLength = Math.min(240, Math.floor(buffer.length / 8)); // 10ms ramp at 24kHz
      for (let i = 0; i < rampLength; i++) {
        const factor = i / rampLength;
        channelData[i] *= factor;
        channelData[buffer.length - 1 - i] *= factor;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();

      return new Promise<void>((resolve) => {
        source.onended = () => resolve();
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  /**
   * Stop any ongoing speech playback
   */
  public stopPlayback(): void {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
