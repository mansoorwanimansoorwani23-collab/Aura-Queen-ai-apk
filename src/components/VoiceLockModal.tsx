import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Mic, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Trash2, 
  X, 
  AlertCircle, 
  Sparkles, 
  Sliders, 
  Activity,
  CheckCircle2
} from "lucide-react";
import { VoiceAuthService, VoiceProfile } from "../services/voiceAuthService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: VoiceProfile | null) => void;
}

const DEFAULT_PASSPHRASE = "Aura, authorize and verify my voice for secure voice commands";

export default function VoiceLockModal({ isOpen, onClose, onProfileUpdated }: Props) {
  const voiceAuth = VoiceAuthService.getInstance();
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Test voice match state
  const [isTesting, setIsTesting] = useState(false);
  const [testScore, setTestScore] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ matched: boolean; confidence: string } | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const testIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const p = voiceAuth.getProfile();
      setProfile(p);
      setErrorMessage(null);
      setSuccessMessage(null);
      setTestScore(null);
      setTestResult(null);
    } else {
      cleanupMedia();
    }
  }, [isOpen]);

  const cleanupMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setIsRecording(false);
    setIsTesting(false);
  };

  const handleStartEnrollment = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsRecording(true);
      setRecordProgress(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);

      const collectedEmbeddings: number[][] = [];
      let startTime = Date.now();
      const TOTAL_DURATION = 3500; // 3.5 seconds calibration

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.round((elapsed / TOTAL_DURATION) * 100));
        setRecordProgress(pct);

        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        let vol = 0;
        for (let i = 0; i < freqData.length; i++) vol += freqData[i];
        vol /= freqData.length;
        setAudioVolume(vol);

        if (vol > 5) {
          const emb = voiceAuth.extractFeaturesFromFrequency(freqData, timeData);
          collectedEmbeddings.push(emb);
        }

        if (elapsed >= TOTAL_DURATION) {
          clearInterval(interval);
          cleanupMedia();
          audioCtx.close().catch(() => {});

          if (collectedEmbeddings.length < 5) {
            setErrorMessage("Audio too quiet or no voice detected. Please speak clearly and try again.");
            return;
          }

          // Average embeddings
          const dim = collectedEmbeddings[0].length;
          const avgEmbedding = new Array(dim).fill(0);
          for (const emb of collectedEmbeddings) {
            for (let i = 0; i < dim; i++) {
              avgEmbedding[i] += emb[i];
            }
          }
          for (let i = 0; i < dim; i++) {
            avgEmbedding[i] /= collectedEmbeddings.length;
          }

          const newProfile: VoiceProfile = {
            id: `vp_${Date.now()}`,
            enrolledAt: Date.now(),
            embedding: avgEmbedding,
            passphrase: DEFAULT_PASSPHRASE,
            sensitivity: "balanced",
            isEnabled: true,
          };

          voiceAuth.saveProfile(newProfile);
          setProfile(newProfile);
          setSuccessMessage("Voice enrolled successfully! Voice Lock is now active.");
          if (onProfileUpdated) onProfileUpdated(newProfile);
        }
      }, 100);
    } catch (e: any) {
      console.error("Enrollment error:", e);
      setErrorMessage("Could not access microphone. Please allow microphone permissions.");
      cleanupMedia();
    }
  };

  const handleToggleVoiceLock = (enabled: boolean) => {
    voiceAuth.toggleVoiceLock(enabled);
    const updated = voiceAuth.getProfile();
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSensitivityChange = (level: "relaxed" | "balanced" | "strict") => {
    voiceAuth.setSensitivity(level);
    const updated = voiceAuth.getProfile();
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleDeleteProfile = () => {
    if (confirm("Are you sure you want to delete your Voice Lock biometric profile?")) {
      voiceAuth.deleteProfile();
      setProfile(null);
      setSuccessMessage("Voice profile deleted.");
      if (onProfileUpdated) onProfileUpdated(null);
    }
  };

  const handleTestVoice = async () => {
    try {
      setIsTesting(true);
      setTestScore(null);
      setTestResult(null);
      setErrorMessage(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);

      let samplesCollected = 0;
      let maxScore = 0;
      let evalResult = { matched: false, score: 0, confidence: "low" };

      testIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        let vol = 0;
        for (let i = 0; i < freqData.length; i++) vol += freqData[i];
        vol /= freqData.length;

        if (vol > 8) {
          const emb = voiceAuth.extractFeaturesFromFrequency(freqData, timeData);
          const res = voiceAuth.verifyFeatures(emb);
          if (res.score > maxScore) {
            maxScore = res.score;
            evalResult = res;
            setTestScore(Math.round(maxScore * 100));
          }
          samplesCollected++;

          if (samplesCollected >= 12) {
            clearInterval(testIntervalRef.current);
            cleanupMedia();
            audioCtx.close().catch(() => {});

            setTestResult({
              matched: evalResult.matched,
              confidence: evalResult.confidence,
            });
          }
        }
      }, 80);
    } catch (e: any) {
      console.error("Test voice error:", e);
      setErrorMessage("Could not test voice with microphone.");
      cleanupMedia();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg liquid-glass rounded-[32px] p-6 sm:p-8 relative text-white my-8 overflow-hidden glass-specular shadow-2xl"
      >
        {/* Subtle Top Specular Sheen */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        
        {/* Close Button */}
        <button
          onClick={() => {
            cleanupMedia();
            onClose();
          }}
          className="absolute top-5 right-5 p-2.5 rounded-full liquid-glass-interactive text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl liquid-glass-pill flex items-center justify-center text-cyan-300 shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              Voice Lock
              {profile?.isEnabled && (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PROTECTED
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300/80">
              Speaker recognition &amp; biometric voice authorization
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ENROLLMENT SECTION */}
        {!profile ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl liquid-glass-subtle text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Sparkles size={14} /> Zero-Storage Acoustic Verification
              </p>
              Aura extracts a mathematical one-way frequency embedding of your voice on your device. 
              <strong> Raw audio recordings are never stored or transmitted.</strong>
            </div>

            <div className="p-5 rounded-2xl liquid-glass text-center border-cyan-500/20">
              <p className="text-xs uppercase tracking-wider text-cyan-300/80 font-mono mb-2">
                Displayed Passphrase
              </p>
              <p className="text-base sm:text-lg font-medium text-white italic px-2 py-1 leading-snug">
                "{DEFAULT_PASSPHRASE}"
              </p>
            </div>

            {/* Recording Progress Visualizer */}
            {isRecording && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-cyan-300">
                  <span className="flex items-center gap-1">
                    <Activity size={14} className="animate-spin text-cyan-400" /> Analyzing acoustic frequencies...
                  </span>
                  <span>{recordProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 transition-all duration-75"
                    style={{ width: `${recordProgress}%` }}
                  />
                </div>
                {/* Live Mic Audio Volume Bars */}
                <div className="flex items-center justify-center gap-1 h-8 pt-1">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-cyan-400/80 transition-all duration-75"
                      style={{
                        height: `${Math.min(32, Math.max(4, (audioVolume / 2) * Math.sin((i / 16) * Math.PI)))}px`,
                        opacity: audioVolume > 5 ? 0.9 : 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                id="start-voice-enroll-btn"
                onClick={handleStartEnrollment}
                disabled={isRecording}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl liquid-glass-primary text-white font-semibold text-sm disabled:opacity-50 cursor-pointer"
              >
                <Mic size={18} className={isRecording ? "animate-pulse text-cyan-200" : ""} />
                <span>{isRecording ? "Listening & Calibrating..." : "Speak Passphrase & Set Up Voice"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* PROFILE ENROLLED & SETTINGS SECTION */
          <div className="space-y-5">
            {/* Status Card */}
            <div className="p-4 rounded-2xl liquid-glass-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${profile.isEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-slate-400"}`}>
                  {profile.isEnabled ? <Lock size={18} /> : <Unlock size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">
                    {profile.isEnabled ? "Voice Lock Active" : "Voice Lock Disabled"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Enrolled {new Date(profile.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleVoiceLock(!profile.isEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${profile.isEnabled ? "bg-cyan-500 shadow-lg shadow-cyan-500/30" : "bg-white/20"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile.isEnabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {/* Sensitivity Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders size={14} className="text-cyan-400" /> Verification Sensitivity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["relaxed", "balanced", "strict"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleSensitivityChange(level)}
                    className={`py-2 px-3 rounded-2xl text-xs font-medium capitalize border transition-all cursor-pointer ${
                      profile.sensitivity === level
                        ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20"
                        : "liquid-glass-subtle text-slate-300 hover:text-white"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Voice Match Section */}
            <div className="p-4 rounded-2xl liquid-glass space-y-3 border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                  <Activity size={15} /> Test Live Speaker Match
                </div>
                {testScore !== null && (
                  <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${testResult?.matched ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"}`}>
                    {testScore}% Match ({testResult?.confidence || "Testing"})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300/80">
                Click test and speak any sentence to verify your acoustic fingerprint match score.
              </p>
              <button
                onClick={handleTestVoice}
                disabled={isTesting}
                className="w-full py-2.5 px-3 rounded-2xl liquid-glass-interactive text-cyan-200 text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic size={14} className={isTesting ? "animate-pulse text-cyan-400" : ""} />
                <span>{isTesting ? "Analyzing Voice Sample..." : "Test Voice Match"}</span>
              </button>
            </div>

            {/* Re-enroll / Reset Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setProfile(null);
                  handleStartEnrollment();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Re-enroll Voice</span>
              </button>

              <button
                onClick={handleDeleteProfile}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Voice Profile</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
