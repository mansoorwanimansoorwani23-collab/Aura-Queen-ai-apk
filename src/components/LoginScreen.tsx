import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Mic, Sparkles, Loader2 } from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "microsoft";
  token?: string;
  loggedInAt: number;
}

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
  onContinueAsGuest?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onContinueAsGuest }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "microsoft" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingProvider("google");
    setErrorMsg(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 750));

      const mockGoogleUser: UserAccount = {
        id: `goog_${Date.now()}`,
        name: "Ali Mohammad",
        email: "alimohammad222rr@gmail.com",
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=Ali+Mohammad&backgroundColor=8b5cf6`,
        provider: "google",
        token: `g_oauth_${Math.random().toString(36).substring(2)}`,
        loggedInAt: Date.now(),
      };

      localStorage.setItem("aura_auth_user", JSON.stringify(mockGoogleUser));
      onLoginSuccess(mockGoogleUser);
    } catch (e: any) {
      console.error("Google Auth error:", e);
      setErrorMsg("Google Sign-In failed. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoadingProvider("microsoft");
    setErrorMsg(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockMsUser: UserAccount = {
        id: `ms_${Date.now()}`,
        name: "Ali Mohammad",
        email: "alimohammad@outlook.com",
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=Ali+M&backgroundColor=0284c7`,
        provider: "microsoft",
        token: `ms_oauth_${Math.random().toString(36).substring(2)}`,
        loggedInAt: Date.now(),
      };

      localStorage.setItem("aura_auth_user", JSON.stringify(mockMsUser));
      onLoginSuccess(mockMsUser);
    } catch (e: any) {
      console.error("Microsoft Auth error:", e);
      setErrorMsg("Microsoft Sign-In failed. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020611] text-white p-4 sm:p-6 overflow-y-auto">
      {/* Gemini Ambient Mesh Glows */}
      <div className="gemini-ambient-bg">
        <div className="gemini-orb-1" />
        <div className="gemini-orb-2" />
        <div className="gemini-orb-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md liquid-glass rounded-[32px] p-8 sm:p-10 relative z-10 flex flex-col items-center text-center glass-specular shadow-2xl"
      >
        {/* Aura Logo & Brand Capsule */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl p-[1.5px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-xl shadow-cyan-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#070e1c]/90 rounded-[22px] backdrop-blur-xl flex items-center justify-center">
              <Mic className="w-9 h-9 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-tr from-violet-500 to-cyan-400 rounded-full p-1 text-white shadow-md">
            <Sparkles size={13} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300">{APP_CONFIG.appName}</span>
        </h1>
        <p className="text-sm text-slate-300/80 mb-8 max-w-xs leading-relaxed font-normal">
          Next-generation AI voice assistant with voice authentication and smart actions.
        </p>

        {/* Error notification */}
        {errorMsg && (
          <div className="w-full mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-center">
            {errorMsg}
          </div>
        )}

        {/* Primary OAuth Action Buttons with Liquid Glass feel */}
        <div className="w-full space-y-3.5">
          {/* Continue with Google */}
          <button
            id="login-google-btn"
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3.5 py-3.5 px-5 rounded-2xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-white/10 disabled:opacity-60 cursor-pointer"
          >
            {loadingProvider === "google" ? (
              <Loader2 size={18} className="animate-spin text-slate-900" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Continue with Microsoft */}
          <button
            id="login-microsoft-btn"
            onClick={handleMicrosoftLogin}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3.5 py-3.5 px-5 rounded-2xl liquid-glass-interactive text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
          >
            {loadingProvider === "microsoft" ? (
              <Loader2 size={18} className="animate-spin text-cyan-400" />
            ) : (
              <svg className="w-4.5 h-4.5" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            )}
            <span>Continue with Microsoft</span>
          </button>
        </div>

        {/* Security / Biometrics badge */}
        <div className="mt-8 pt-6 border-t border-white/10 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
          <span>Biometric Voice Lock &amp; OAuth 2.0 Protected</span>
        </div>

        {onContinueAsGuest && (
          <button
            onClick={onContinueAsGuest}
            className="mt-4 text-xs text-slate-400 hover:text-cyan-300 transition-colors underline cursor-pointer"
          >
            Or explore as guest
          </button>
        )}
      </motion.div>
    </div>
  );
}
