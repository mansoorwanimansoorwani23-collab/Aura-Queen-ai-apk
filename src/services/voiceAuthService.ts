/**
 * VoiceAuthService
 * 
 * Provides client-side speaker verification and Voice Lock capability.
 * Extracts acoustic frequency distribution and spectral centroid/pitch embedding vectors
 * using the Web Audio API without ever storing or transmitting raw audio recordings.
 */

export interface VoiceProfile {
  id: string;
  enrolledAt: number;
  passphrase: string;
  embedding: number[]; // 32-dimensional normalized acoustic feature vector
  sensitivity: "relaxed" | "balanced" | "strict";
  isEnabled: boolean;
}

const STORAGE_KEY = "aura_voice_lock_profile";
const SETTINGS_KEY = "aura_voice_lock_settings";

export class VoiceAuthService {
  private static instance: VoiceAuthService | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  public static getInstance(): VoiceAuthService {
    if (!VoiceAuthService.instance) {
      VoiceAuthService.instance = new VoiceAuthService();
    }
    return VoiceAuthService.instance;
  }

  /**
   * Get the enrolled voice profile from local secure storage.
   */
  public getProfile(): VoiceProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to retrieve voice profile", e);
      return null;
    }
  }

  /**
   * Save or update the voice profile.
   */
  public saveProfile(profile: VoiceProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save voice profile", e);
    }
  }

  /**
   * Delete the voice profile and reset Voice Lock.
   */
  public deleteProfile(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    } catch (e) {
      console.error("Failed to delete voice profile", e);
    }
  }

  /**
   * Check if Voice Lock is configured and currently active.
   */
  public isVoiceLockActive(): boolean {
    const profile = this.getProfile();
    return !!profile && profile.isEnabled;
  }

  /**
   * Toggle Voice Lock on or off.
   */
  public toggleVoiceLock(enabled: boolean): boolean {
    const profile = this.getProfile();
    if (!profile) return false;
    profile.isEnabled = enabled;
    this.saveProfile(profile);
    return true;
  }

  /**
   * Update verification sensitivity.
   */
  public setSensitivity(level: "relaxed" | "balanced" | "strict"): void {
    const profile = this.getProfile();
    if (profile) {
      profile.sensitivity = level;
      this.saveProfile(profile);
    }
  }

  /**
   * Extract acoustic feature embedding from audio frequency data.
   * Compresses 1024-bin FFT into a 32-dimensional normalized vector.
   */
  public extractFeaturesFromFrequency(frequencyData: Uint8Array, timeDomainData?: Uint8Array): number[] {
    const embeddingSize = 32;
    const features = new Array(embeddingSize).fill(0);
    const binCount = frequencyData.length;
    const bandSize = Math.floor(binCount / (embeddingSize - 4));

    // 1. Multi-band frequency energy distribution (first 28 bins)
    for (let i = 0; i < 28; i++) {
      let sum = 0;
      const start = i * bandSize;
      const end = Math.min(start + bandSize, binCount);
      for (let j = start; j < end; j++) {
        sum += frequencyData[j];
      }
      features[i] = (end > start) ? sum / (end - start) : 0;
    }

    // 2. Spectral Centroid (Vocal tract brightness resonance)
    let weightedSum = 0;
    let totalEnergy = 0;
    for (let i = 0; i < binCount; i++) {
      weightedSum += i * frequencyData[i];
      totalEnergy += frequencyData[i];
    }
    const centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
    features[28] = centroid / (binCount / 2);

    // 3. Spectral Rolloff (85% energy frequency cut-off)
    let cumulative = 0;
    const threshold = totalEnergy * 0.85;
    let rolloffIndex = 0;
    for (let i = 0; i < binCount; i++) {
      cumulative += frequencyData[i];
      if (cumulative >= threshold) {
        rolloffIndex = i;
        break;
      }
    }
    features[29] = rolloffIndex / binCount;

    // 4. Zero Crossing Rate from time domain (if provided)
    if (timeDomainData && timeDomainData.length > 1) {
      let zcr = 0;
      for (let i = 1; i < timeDomainData.length; i++) {
        const prev = timeDomainData[i - 1] - 128;
        const curr = timeDomainData[i] - 128;
        if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
          zcr++;
        }
      }
      features[30] = zcr / timeDomainData.length;
    } else {
      features[30] = 0.5;
    }

    // 5. Energy Variance (dynamic vocal variance)
    const avgEnergy = totalEnergy / Math.max(1, binCount);
    let variance = 0;
    for (let i = 0; i < binCount; i++) {
      variance += Math.pow(frequencyData[i] - avgEnergy, 2);
    }
    features[31] = Math.sqrt(variance / Math.max(1, binCount)) / 128;

    // Normalize embedding vector to unit length (L2 norm)
    let norm = 0;
    for (let i = 0; i < embeddingSize; i++) {
      norm += features[i] * features[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < embeddingSize; i++) {
        features[i] /= norm;
      }
    }

    return features;
  }

  /**
   * Compute Cosine Similarity between two voice feature vectors.
   * Returns a score from 0.0 to 1.0.
   */
  public computeSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    const similarity = dotProduct / denominator;
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Verify audio against enrolled voice profile.
   */
  public verifyFeatures(currentEmbedding: number[]): {
    matched: boolean;
    score: number;
    threshold: number;
    confidence: "high" | "medium" | "low" | "unverified";
  } {
    const profile = this.getProfile();
    if (!profile || !profile.isEnabled) {
      return { matched: true, score: 1.0, threshold: 0.7, confidence: "unverified" };
    }

    // Determine threshold based on sensitivity setting
    let threshold = 0.72; // balanced default
    if (profile.sensitivity === "relaxed") threshold = 0.62;
    if (profile.sensitivity === "strict") threshold = 0.82;

    const score = this.computeSimilarity(profile.embedding, currentEmbedding);
    const matched = score >= threshold;

    let confidence: "high" | "medium" | "low" | "unverified" = "low";
    if (score >= threshold + 0.1) confidence = "high";
    else if (score >= threshold) confidence = "medium";

    return { matched, score, threshold, confidence };
  }

  /**
   * Capture and create an enrolled voice profile from a MediaStream.
   * Collects multiple acoustic frames over durationMs and generates an averaged profile.
   */
  public async enrollFromStream(
    stream: MediaStream,
    passphrase: string,
    onProgress: (progress: number, volume: number) => void,
    durationMs: number = 3200
  ): Promise<VoiceProfile> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    const accumulatedFrames: number[][] = [];
    const startTime = Date.now();

    return new Promise<VoiceProfile>((resolve, reject) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));

        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Measure volume to ensure user is speaking
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        const volume = sum / freqData.length;

        onProgress(progress, volume);

        // Only accumulate frames with audible vocal energy
        if (volume > 8) {
          const frameFeatures = this.extractFeaturesFromFrequency(freqData, timeData);
          accumulatedFrames.push(frameFeatures);
        }

        if (elapsed >= durationMs) {
          clearInterval(interval);
          source.disconnect();
          analyser.disconnect();
          audioCtx.close().catch(() => {});

          if (accumulatedFrames.length < 5) {
            reject(new Error("Voice signal was too quiet or short. Please speak clearly into the microphone."));
            return;
          }

          // Average collected acoustic frames into a single robust embedding
          const embeddingSize = 32;
          const averaged = new Array(embeddingSize).fill(0);
          for (const frame of accumulatedFrames) {
            for (let i = 0; i < embeddingSize; i++) {
              averaged[i] += frame[i];
            }
          }

          let norm = 0;
          for (let i = 0; i < embeddingSize; i++) {
            averaged[i] /= accumulatedFrames.length;
            norm += averaged[i] * averaged[i];
          }
          norm = Math.sqrt(norm);
          if (norm > 0) {
            for (let i = 0; i < embeddingSize; i++) {
              averaged[i] /= norm;
            }
          }

          const newProfile: VoiceProfile = {
            id: `vp_${Date.now()}`,
            enrolledAt: Date.now(),
            passphrase,
            embedding: averaged,
            sensitivity: "balanced",
            isEnabled: true,
          };

          this.saveProfile(newProfile);
          resolve(newProfile);
        }
      }, 50);
    });
  }
}
