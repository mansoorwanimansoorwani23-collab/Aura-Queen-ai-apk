import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Keyboard, 
  Send, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  X,
  Smile,
  Volume2
} from "lucide-react";
import { getAuraResponse, getAuraAudio, resetAuraSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import { VoiceAuthService, VoiceProfile } from "./services/voiceAuthService";
import { APP_CONFIG, isDeveloperQuery } from "./config/appConfig";
import { VoiceEmotionCore, EmotionType, EMOTION_PROFILES } from "./services/voiceEmotionCore";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import VoiceLockModal from "./components/VoiceLockModal";
import LoginScreen, { UserAccount } from "./components/LoginScreen";
import AccountModal from "./components/AccountModal";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya" | "aura";
  text: string;
  emotion?: EmotionType;
  timestamp?: number;
}

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem("aura_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [appState, setAppState] = useState<AppState>("idle");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>("calm");
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("aura_chat_history") || localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("aura_chat_history", JSON.stringify(messages));
  }, [messages]);

  // Microphone & Audio Mute State
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.setMuted(isMuted);
    }
    VoiceEmotionCore.getInstance().setMuted(isMuted);
  }, [isMuted]);

  // Voice Lock & Speaker Verification State
  const voiceAuth = VoiceAuthService.getInstance();
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(() => voiceAuth.getProfile());
  const [showVoiceLockModal, setShowVoiceLockModal] = useState(false);
  const [voiceVerificationStatus, setVoiceVerificationStatus] = useState<{
    matched: boolean;
    score: number;
    confidence: string;
    timestamp: number;
  } | null>(null);

  // UI Modals & Panels
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showChatDrawer) {
      scrollToBottom();
    }
  }, [messages, showChatDrawer]);

  // Check voice profile updates
  const handleProfileUpdated = (updated: VoiceProfile | null) => {
    setVoiceProfile(updated);
  };

  // Logout handler
  const handleLogout = () => {
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
    }
    setIsSessionActive(false);
    setAppState("idle");
    localStorage.removeItem("aura_auth_user");
    setCurrentUser(null);
    setShowAccountModal(false);
  };

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: finalTranscript,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 1. Mandatory Developer Identity Check
    if (isDeveloperQuery(finalTranscript)) {
      const responseText = APP_CONFIG.developerStatement;
      setCurrentEmotion("serious");
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString() + "-dev", 
          sender: "aura", 
          text: responseText, 
          emotion: "serious",
          timestamp: Date.now() 
        },
      ]);
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getAuraAudio(responseText, "serious");
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
      return;
    }
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 2. Check for browser commands
    const commandResult = processCommand(finalTranscript);

    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      setCurrentEmotion("happy");
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString() + "-a", 
          sender: "aura", 
          text: responseText, 
          emotion: "happy",
          timestamp: Date.now() 
        },
      ]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getAuraAudio(responseText, "happy");
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          window.open(commandResult.url, "_blank");
        }
      }, 1500);
    } else {
      // 3. Chit-Chat via Gemini Emotion Engine
      const result = await getAuraResponse(finalTranscript, messagesRef.current);
      responseText = result.text;
      const detectedEmotion = result.emotion;
      setCurrentEmotion(detectedEmotion);

      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString() + "-a", 
          sender: "aura", 
          text: responseText, 
          emotion: detectedEmotion,
          timestamp: Date.now() 
        },
      ]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getAuraAudio(responseText, detectedEmotion);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      setVoiceVerificationStatus(null);
      resetAuraSession();
    } else {
      try {
        setIsSessionActive(true);
        resetAuraSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };

        session.onEmotionChange = (emotion) => {
          setCurrentEmotion(emotion);
        };
        
        session.onMessage = (sender, text) => {
          const detectedEmotion = VoiceEmotionCore.getInstance().detectEmotion(text);
          setCurrentEmotion(detectedEmotion);
          setMessages((prev) => [
            ...prev,
            { 
              id: Date.now().toString() + "-" + sender, 
              sender, 
              text, 
              emotion: detectedEmotion,
              timestamp: Date.now() 
            },
          ]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        // Live Voice Lock biometric verification listener
        session.onVoiceVerified = (result) => {
          setVoiceVerificationStatus({
            ...result,
            timestamp: Date.now(),
          });
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  // If user is not authenticated, show modern OAuth Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => setCurrentUser(user)}
        onContinueAsGuest={() => {
          const guest: UserAccount = {
            id: `guest_${Date.now()}`,
            name: "Guest User",
            email: "guest@aura.ai",
            provider: "google",
            loggedInAt: Date.now(),
          };
          localStorage.setItem("aura_auth_user", JSON.stringify(guest));
          setCurrentUser(guest);
        }}
      />
    );
  }

  // Quick suggestion prompts
  const suggestionPrompts = [
    "Who is your developer?",
    "Tell me something funny",
    "I had a great day today!",
    "Play lofi beats on YouTube",
    "Search synthwave on Spotify",
  ];

  const currentEmotionProfile = EMOTION_PROFILES[currentEmotion] || EMOTION_PROFILES.calm;

  return (
    <div className="h-[100dvh] w-screen bg-[#020611] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none">
      {/* Microphone Permission Modal */}
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Voice Lock Management & Enrollment Modal */}
      <VoiceLockModal
        isOpen={showVoiceLockModal}
        onClose={() => setShowVoiceLockModal(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* User Account & Management Modal */}
      <AccountModal
        isOpen={showAccountModal}
        user={currentUser}
        onClose={() => setShowAccountModal(false)}
        onLogout={handleLogout}
        onOpenVoiceLock={() => setShowVoiceLockModal(true)}
      />

      {/* Gemini Ambient Mesh Glows */}
      <div className="gemini-ambient-bg">
        <div className="gemini-orb-1" />
        <div className="gemini-orb-2" />
        <div className="gemini-orb-3" />
      </div>

      {/* Top Liquid Glass Navigation Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-30 shrink-0 px-4 py-3 sm:px-8 sm:py-5 pointer-events-auto">
        
        {/* Left: Liquid Glass Brand Badge + Female Voice Tag */}
        <div className="flex items-center gap-3">
          <div className="liquid-glass-pill px-3 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-lg">
            <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 p-[1px] flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-[#050b18] rounded-[10px] flex items-center justify-center font-display font-bold text-xs tracking-wider text-cyan-300">
                A
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-wide text-white">Aura</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                <Volume2 size={10} />
                Natural Female Voice
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Emotion Style Badge & Interactive Mood Selector */}
        <div className="relative">
          <button
            id="emotion-style-selector-btn"
            onClick={() => setShowEmotionMenu(!showEmotionMenu)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl transition-all cursor-pointer shadow-md ${currentEmotionProfile.badgeBg} ${currentEmotionProfile.badgeBorder} ${currentEmotionProfile.badgeText}`}
            title="Aura Emotion Delivery Style"
          >
            <span>{currentEmotionProfile.emoji}</span>
            <span className="font-semibold">{currentEmotionProfile.label} Tone</span>
            <span className="text-[10px] opacity-70">▾</span>
          </button>

          {/* Emotion Dropdown Menu */}
          <AnimatePresence>
            {showEmotionMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-2 rounded-2xl liquid-glass border border-white/20 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1 text-left"
              >
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10 flex justify-between items-center">
                  <span>Emotion Voice Layer</span>
                  <span className="text-cyan-400">Aoede 24kHz</span>
                </div>
                
                {(Object.keys(EMOTION_PROFILES) as EmotionType[]).map((eKey) => {
                  const profile = EMOTION_PROFILES[eKey];
                  const isSelected = currentEmotion === eKey;
                  return (
                    <button
                      key={eKey}
                      onClick={() => {
                        setCurrentEmotion(eKey);
                        VoiceEmotionCore.getInstance().setEmotion(eKey);
                        setShowEmotionMenu(false);
                      }}
                      className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? `${profile.badgeBg} ${profile.badgeText} border border-white/20` 
                          : "hover:bg-white/10 text-slate-300 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{profile.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{profile.label}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{profile.description}</span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions (Voice Lock, Chat History Drawer, Account) */}
        <div className="flex items-center gap-2">
          {/* Desktop Voice Lock Badge */}
          <button
            id="voice-lock-header-badge"
            onClick={() => setShowVoiceLockModal(true)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-md ${
              voiceProfile?.isEnabled
                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25"
                : "liquid-glass-pill text-slate-300 hover:text-white"
            }`}
            title="Voice Lock Biometric Settings"
          >
            {voiceProfile?.isEnabled ? (
              <>
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Voice Lock Active</span>
              </>
            ) : (
              <>
                <Lock size={13} className="text-slate-400" />
                <span>Voice Lock</span>
              </>
            )}
          </button>

          {/* Conversation History Drawer Button */}
          <button
            id="chat-drawer-toggle-btn"
            onClick={() => setShowChatDrawer(!showChatDrawer)}
            className={`p-2.5 rounded-2xl liquid-glass-interactive cursor-pointer relative ${
              showChatDrawer ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300" : "text-slate-300"
            }`}
            title="Conversation History"
          >
            <MessageSquare size={17} />
            {messages.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* User Account Capsule Button */}
          <button
            id="account-btn"
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl liquid-glass-interactive cursor-pointer text-xs font-medium text-slate-200"
            title="Account Management"
          >
            <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1px] flex items-center justify-center overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-[10px]" />
              ) : (
                <span className="text-[11px] font-bold text-white">{currentUser.name.charAt(0)}</span>
              )}
            </div>
            <span className="hidden sm:inline max-w-[85px] truncate">{currentUser.name}</span>
          </button>
        </div>
      </header>

      {/* Main Center Area: Emotion-Aware Visualizer & Real-Time Status HUD */}
      <main className="absolute inset-0 flex flex-col items-center justify-center w-full h-full z-10 overflow-hidden pointer-events-none">
        
        {/* Real-Time Central Visualizer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Visualizer state={appState} emotion={currentEmotion} />
        </div>

        {/* Live Dynamic Floating Status HUD Pills */}
        <div className="absolute top-24 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none px-4 z-20">
          <AnimatePresence>
            {appState === "listening" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="liquid-glass-pill px-4 py-1.5 rounded-full flex items-center gap-2 text-violet-300 text-xs sm:text-sm font-medium shadow-lg"
              >
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                <span>Listening to your voice...</span>
              </motion.div>
            )}

            {appState === "processing" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="liquid-glass-pill px-4 py-1.5 rounded-full flex items-center gap-2 text-cyan-300 text-xs sm:text-sm font-medium shadow-lg"
              >
                <Loader2 size={14} className="animate-spin text-cyan-400" />
                <span>Processing context &amp; emotion...</span>
              </motion.div>
            )}

            {appState === "speaking" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`liquid-glass-pill px-4 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm font-medium shadow-lg border ${currentEmotionProfile.badgeBorder} ${currentEmotionProfile.badgeText}`}
              >
                <span>{currentEmotionProfile.emoji}</span>
                <span>Aura speaking ({currentEmotionProfile.label} tone)</span>
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Speaker Matched Biometric Badge */}
          <AnimatePresence>
            {isSessionActive && voiceProfile?.isEnabled && voiceVerificationStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`px-3 py-1 rounded-full text-[11px] font-mono border backdrop-blur-xl shadow-lg flex items-center gap-1.5 ${
                  voiceVerificationStatus.matched
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {voiceVerificationStatus.matched ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Speaker Verified ({Math.round(voiceVerificationStatus.score * 100)}%)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span>Verifying acoustic profile...</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Latest Spoken Response Subtitle Card */}
        {!showChatDrawer && messages.length > 0 && (
          <div className="absolute bottom-28 max-w-lg w-[90%] pointer-events-auto z-20">
            <AnimatePresence mode="popLayout">
              {messages.slice(-1).map((lastMsg) => {
                const msgEmotion = lastMsg.emotion ? EMOTION_PROFILES[lastMsg.emotion] : null;
                return (
                  <motion.div
                    key={lastMsg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    className={`p-3.5 sm:p-4 rounded-2xl liquid-glass text-xs sm:text-sm leading-relaxed shadow-xl ${
                      lastMsg.sender === "user"
                        ? "border-violet-400/30 text-violet-100"
                        : "border-cyan-400/30 text-cyan-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className={lastMsg.sender === "user" ? "text-violet-300 font-bold" : "text-cyan-300 font-bold"}>
                          {lastMsg.sender === "user" ? "You" : "Aura"}
                        </span>
                        {msgEmotion && (
                          <span className="text-[10px] text-slate-400">
                            • {msgEmotion.emoji} {msgEmotion.label}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowChatDrawer(true)}
                        className="hover:text-cyan-300 transition-colors"
                      >
                        View all &rarr;
                      </button>
                    </div>
                    <p className="line-clamp-2">{lastMsg.text}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Slide-Over Liquid Glass Chat History Sheet */}
      <AnimatePresence>
        {showChatDrawer && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-40 liquid-glass border-l border-white/15 p-5 flex flex-col justify-between shadow-2xl glass-specular"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-cyan-400" />
                <h3 className="text-base font-semibold text-white">Conversation</h3>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Clear conversation history?")) {
                        setMessages([]);
                        resetAuraSession();
                      }
                    }}
                    className="p-1.5 rounded-xl liquid-glass-interactive text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => setShowChatDrawer(false)}
                  className="p-1.5 rounded-xl liquid-glass-interactive text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                  <Sparkles className="w-8 h-8 text-cyan-400/50 mb-2" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Start a live voice call or type a prompt below.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const mEmotion = m.emotion ? EMOTION_PROFILES[m.emotion] : null;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          m.sender === "user"
                            ? "bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white rounded-tr-xs border border-violet-400/30"
                            : "liquid-glass-subtle text-slate-100 rounded-tl-xs border border-cyan-400/20"
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1 px-1">
                        <span>{m.sender === "user" ? "You" : "Aura"}</span>
                        {mEmotion && (
                          <span className="text-cyan-400/80">
                            • {mEmotion.emoji} {mEmotion.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-1.5 shrink-0">
              {suggestionPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    handleTextCommand(prompt);
                  }}
                  className="px-2.5 py-1 rounded-full liquid-glass-subtle text-[10px] text-cyan-300 hover:text-white border border-cyan-500/20 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating iOS-Style Liquid Glass Control Bar */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-5 sm:pb-8 z-30 shrink-0 gap-3 px-4 pointer-events-auto">
        
        {/* Expandable Liquid Glass Text Input Form */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.97 }}
              className="w-full max-w-lg flex flex-col gap-2"
            >
              {/* Quick suggestions pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1">
                {suggestionPrompts.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setTextInput(s);
                    }}
                    className="whitespace-nowrap px-3 py-1 rounded-full liquid-glass-subtle text-[11px] text-cyan-300 hover:text-white border border-cyan-500/25 hover:border-cyan-400 transition-all cursor-pointer shrink-0"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <form 
                onSubmit={handleTextSubmit}
                className="w-full flex items-center gap-2 liquid-glass rounded-3xl p-2 pl-4 shadow-2xl glass-specular"
              >
                <input 
                  id="text-command-input"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask Aura anything in her natural voice..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-400 text-sm font-normal"
                  autoFocus
                />
                <button 
                  id="send-text-btn"
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2.5 rounded-2xl liquid-glass-primary text-white disabled:opacity-40 transition-all cursor-pointer shadow-md"
                  title="Send Prompt"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sleek Liquid Glass Dock */}
        <div className="flex items-center gap-3 p-2 rounded-[28px] liquid-glass border border-white/15 backdrop-blur-2xl shadow-2xl glass-specular">
          
          {/* 1. Mute / Unmute Microphone Button */}
          <button
            id="mute-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isMuted
                ? "bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30"
                : "liquid-glass-interactive text-slate-200"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? (
              <MicOff size={19} className="text-red-400" />
            ) : (
              <Mic size={19} className="text-cyan-300" />
            )}
          </button>

          {/* 2. Primary Voice Conversation Button / State Indicator */}
          <button
            id="voice-session-btn"
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-7 sm:px-9 py-3.5 rounded-2xl font-medium tracking-wide transition-all duration-300 cursor-pointer
              ${
                isSessionActive
                  ? "bg-red-500/25 text-red-200 border border-red-500/50 hover:bg-red-500/35 shadow-lg shadow-red-500/25"
                  : "liquid-glass-primary text-white"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <PhoneOff size={19} className="text-red-400 animate-pulse" />
                <span className="text-sm font-semibold">End Session</span>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              </>
            ) : (
              <>
                <PhoneCall size={19} className="group-hover:scale-110 transition-transform text-white" />
                <span className="text-sm font-semibold">Start Live Call</span>
              </>
            )}
          </button>

          {/* 3. Keyboard Toggle Button */}
          <button
            id="keyboard-toggle-btn"
            onClick={() => setShowTextInput(!showTextInput)}
            className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
              showTextInput
                ? "bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20"
                : "liquid-glass-interactive text-slate-200"
            }`}
            title={showTextInput ? "Close Text Input" : "Open Keyboard Input"}
          >
            <Keyboard size={19} />
          </button>
        </div>

      </footer>
    </div>
  );
}
