import { VoiceEmotionCore } from "../services/voiceEmotionCore";

export async function playPCM(base64Data: string): Promise<void> {
  const voiceEngine = VoiceEmotionCore.getInstance();
  return voiceEngine.play24kPCM(base64Data);
}

export function stopPCM(): void {
  const voiceEngine = VoiceEmotionCore.getInstance();
  voiceEngine.stopPlayback();
}
