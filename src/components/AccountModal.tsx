import React from "react";
import { motion } from "motion/react";
import { User, LogOut, ShieldCheck, Mail, X, Code2 } from "lucide-react";
import { UserAccount } from "./LoginScreen";
import { APP_CONFIG } from "../config/appConfig";

interface Props {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onLogout: () => void;
  onOpenVoiceLock: () => void;
}

export default function AccountModal({ isOpen, user, onClose, onLogout, onOpenVoiceLock }: Props) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-md liquid-glass rounded-[32px] p-6 sm:p-8 shadow-2xl relative text-white glass-specular"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full liquid-glass-interactive text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <h2 className="text-xl font-semibold tracking-tight text-white mb-6 flex items-center gap-2">
          <User size={20} className="text-cyan-400" /> Account Management
        </h2>

        {/* User Glass Card */}
        <div className="p-4 rounded-2xl liquid-glass-subtle flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1.5px] shrink-0 shadow-lg shadow-cyan-500/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-[14px] object-cover" />
            ) : (
              <div className="w-full h-full bg-[#0d131f] rounded-[14px] flex items-center justify-center text-lg font-bold text-cyan-300">
                {user.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{user.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <Mail size={12} className="shrink-0" /> {user.email}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {user.provider} OAuth 2.0
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links & Developer Info */}
        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => {
              onClose();
              onOpenVoiceLock();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl liquid-glass-interactive text-xs text-slate-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-cyan-400" />
              <span>Voice Lock &amp; Biometrics</span>
            </div>
            <span className="text-cyan-400 font-medium">&rarr;</span>
          </button>

          {/* Fixed Application Developer Identity Card */}
          <div className="p-3.5 rounded-2xl liquid-glass-subtle flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Code2 size={16} className="text-indigo-400" />
              <span>Developer Identity</span>
            </div>
            <span className="font-mono text-cyan-300 font-medium">
              {APP_CONFIG.developerName}, {APP_CONFIG.developerLocation}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          id="account-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all text-sm font-medium cursor-pointer active:scale-[0.98]"
        >
          <LogOut size={16} />
          <span>Sign Out / Switch Account</span>
        </button>
      </motion.div>
    </div>
  );
}
