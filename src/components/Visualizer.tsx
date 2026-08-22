import { motion } from "motion/react";
import { EmotionType, EMOTION_PROFILES } from "../services/voiceEmotionCore";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  emotion?: EmotionType;
}

export default function Visualizer({ state, emotion = "calm" }: VisualizerProps) {
  const emotionProfile = EMOTION_PROFILES[emotion] || EMOTION_PROFILES.calm;

  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed = 
      state === "listening" 
        ? 3.2 
        : state === "processing" 
        ? 1.8 
        : state === "speaking" 
        ? (emotion === "excited" || emotion === "funny" ? 1.9 : 2.5) 
        : 14;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2.2, repeat: Infinity, ease: "linear" }
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      const isDynamic = emotion === "excited" || emotion === "happy" || emotion === "funny";
      return {
        scale: isDynamic ? [1, 1.09, 0.96, 1.05, 1] : [1, 1.05, 0.98, 1.03, 1],
        opacity: [0.85, 1, 0.85, 1, 0.85],
        transition: { duration: isDynamic ? 0.5 : 0.65, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.03, 1],
        opacity: [0.75, 1, 0.75],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.97, 1.03, 0.97],
        opacity: [0.7, 0.95, 0.7],
        transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
      };
    }
    return {
      scale: [1, 1.015, 1],
      opacity: [0.5, 0.7, 0.5],
      transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
    };
  };

  // Dynamic Liquid Glass Aura palette infused with emotion styling
  const getTheme = () => {
    const emotionColor = emotionProfile.color;

    switch (state) {
      case "listening": 
        return { 
          color: "rgba(139, 92, 246, 0.95)", 
          glow: "shadow-violet-500/50", 
          border: "border-violet-400/50",
          gradient: "from-violet-500/30 via-indigo-500/20 to-cyan-500/10",
          subtleBorder: "rgba(167, 139, 250, 0.3)"
        };
      case "processing": 
        return { 
          color: "rgba(56, 189, 248, 0.95)", 
          glow: "shadow-sky-400/60", 
          border: "border-sky-400/50",
          gradient: "from-sky-400/30 via-cyan-500/20 to-indigo-500/10",
          subtleBorder: "rgba(56, 189, 248, 0.3)"
        };
      case "speaking": 
        return { 
          color: emotionColor, 
          glow: "shadow-pink-500/60", 
          border: "border-pink-400/50",
          gradient: "from-pink-500/30 via-violet-500/20 to-cyan-400/10",
          subtleBorder: emotionColor
        };
      default: 
        return { 
          color: "rgba(6, 182, 212, 0.8)", 
          glow: "shadow-cyan-500/35", 
          border: "border-cyan-500/40",
          gradient: "from-cyan-500/20 via-indigo-600/15 to-violet-600/10",
          subtleBorder: "rgba(6, 182, 212, 0.25)"
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Liquid Glass Diffuse Orb */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[65vw] h-[65vw] max-w-[500px] max-h-[500px] rounded-full blur-[95px] ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: state === "speaking" ? 0.25 : 0.16 }}
      />

      {/* Ring 1: Outer Liquid Glass Ring with subtle dash */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className="absolute w-[88vw] h-[88vw] max-w-[580px] max-h-[580px] rounded-full border border-dashed opacity-25"
        style={{ borderColor: theme.subtleBorder }}
      />

      {/* Ring 2: Segmented Soft Glass Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className="absolute w-[74vw] h-[74vw] max-w-[480px] max-h-[480px] rounded-full border border-dotted opacity-35"
        style={{ borderColor: theme.subtleBorder }}
      />

      {/* Ring 3: Refraction Scanner Ring */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[60vw] h-[60vw] max-w-[390px] max-h-[390px] rounded-full border ${theme.border} border-t-transparent border-b-transparent opacity-45`}
      />

      {/* Ring 4: Inner Orbit Ring */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className="absolute w-[46vw] h-[46vw] max-w-[300px] max-h-[300px] rounded-full border border-dashed opacity-50"
        style={{ borderColor: theme.subtleBorder }}
      />
      
      {/* Ring 5: Core HUD Glass Halo */}
      <motion.div
        animate={getRingAnimation(0, false)}
        className={`absolute w-[34vw] h-[34vw] max-w-[220px] max-h-[220px] rounded-full border-[2px] border-dotted ${theme.border} opacity-60`}
      />

      {/* Liquid Glass Core Orb */}
      <motion.div
        animate={getPulseAnimation()}
        className="relative w-[28vw] h-[28vw] max-w-[170px] max-h-[170px] rounded-full flex items-center justify-center p-[1px] shadow-2xl backdrop-blur-2xl"
        style={{
          background: `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.6) 100%)`,
          boxShadow: `0 0 45px ${theme.color}, inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 10px rgba(0, 0, 0, 0.7)`
        }}
      >
        {/* Inner Glass Layer */}
        <div 
          className={`w-full h-full rounded-full flex flex-col items-center justify-center bg-gradient-to-b ${theme.gradient} backdrop-blur-xl border border-white/20`}
        >
          {/* Subtle Specular Sheen */}
          <div className="absolute top-2 w-[70%] h-[35%] rounded-t-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

          {/* Central Logo Text */}
          <div 
            className="font-display font-bold tracking-[0.28em] text-lg sm:text-2xl md:text-3xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            style={{ textShadow: `0 0 16px ${theme.color}` }}
          >
            AURA
          </div>
          
          <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-300/80 mt-0.5 flex items-center gap-1">
            {state === "speaking" ? (
              <span>{emotionProfile.emoji} {emotionProfile.label}</span>
            ) : (
              <span>{state}</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
