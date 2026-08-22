import React from "react";
import { motion } from "motion/react";
import { MicOff, X } from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

interface Props {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-md liquid-glass rounded-[32px] p-6 sm:p-8 shadow-2xl relative text-center flex flex-col items-center glass-specular"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full liquid-glass-interactive text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-5 shadow-lg shadow-red-500/10">
          <MicOff size={28} />
        </div>
        
        <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">Microphone Blocked</h2>
        <p className="text-slate-300/80 text-sm mb-6 leading-relaxed max-w-xs">
          Your browser has blocked microphone access for this site. {APP_CONFIG.appName} cannot hear your voice commands until you allow it.
        </p>
        
        <div className="liquid-glass-subtle rounded-2xl p-4 text-left w-full mb-6">
          <h4 className="text-xs font-mono uppercase text-cyan-300 mb-2 tracking-wider">How to enable:</h4>
          <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <li>Click the lock/settings icon in your browser's address bar.</li>
            <li>Find <strong>Microphone</strong> permissions and set to <strong>Allow</strong>.</li>
            <li>Refresh or reopen the application.</li>
          </ol>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl liquid-glass-primary text-white font-semibold text-sm cursor-pointer shadow-lg active:scale-[0.98]"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}
