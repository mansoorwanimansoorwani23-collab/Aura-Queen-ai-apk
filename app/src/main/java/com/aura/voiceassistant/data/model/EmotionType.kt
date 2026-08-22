package com.aura.voiceassistant.data.model

import androidx.compose.ui.graphics.Color
import kotlinx.serialization.Serializable

@Serializable
enum class EmotionType(
    val label: String,
    val emoji: String,
    val description: String,
    val voiceStyle: String,
    val pitchPrompt: String,
    val colorHex: Long
) {
    HAPPY(
        label = "Happy",
        emoji = "😊",
        description = "Energetic, warm, slightly brighter tone and joyful inflection.",
        voiceStyle = "Warm, energetic, cheerful, and upbeat young-adult female voice with a bright smile in the tone.",
        pitchPrompt = "Speak in a lively, cheerful, warm, and happy tone with bright pitch inflections and a friendly smile.",
        colorHex = 0xFF38BDF8 // Sky Cyan
    ),
    SAD(
        label = "Gentle",
        emoji = "🥺",
        description = "Gentle, calm, softer delivery with caring warmth.",
        voiceStyle = "Gentle, softer, slower cadence, calm and deeply empathetic female voice.",
        pitchPrompt = "Speak with a gentle, softer, comforting cadence and a calm, caring, empathetic delivery.",
        colorHex = 0xFFA78BFA // Purple Violet
    ),
    EXCITED(
        label = "Excited",
        emoji = "✨",
        description = "Energetic and expressive with vibrant pitch dynamics.",
        voiceStyle = "High energy, enthusiastic, expressive, and delighted female voice.",
        pitchPrompt = "Speak with vibrant excitement, animated pitch variations, enthusiasm, and dynamic pacing.",
        colorHex = 0xFFF472B6 // Vibrant Pink
    ),
    WORRIED(
        label = "Concerned",
        emoji = "🤍",
        description = "Caring and slightly concerned, attentive and responsive.",
        voiceStyle = "Attentive, caring, considerate, slightly concerned female voice.",
        pitchPrompt = "Speak with a caring, attentive, slightly concerned, and reassuring tone.",
        colorHex = 0xFFFBBF24 // Warm Amber
    ),
    CALM(
        label = "Calm",
        emoji = "🌸",
        description = "Relaxed, soothing, and reassuring breathing rhythm.",
        voiceStyle = "Smooth, relaxed, reassuring, peaceful, and warm natural female voice.",
        pitchPrompt = "Speak in a calm, soothing, natural, and grounded tone with relaxed breathing pauses.",
        colorHex = 0xFF2DD4BF // Teal Mint
    ),
    FUNNY(
        label = "Playful",
        emoji = "😄",
        description = "Playful, witty, and naturally expressive humor.",
        voiceStyle = "Playful, humorous, witty, smiling delivery with teasing warmth.",
        pitchPrompt = "Speak in a playful, amusing, witty, and upbeat manner with spontaneous conversational rhythm.",
        colorHex = 0xFFF59E0B // Gold
    ),
    SERIOUS(
        label = "Focused",
        emoji = "🎯",
        description = "Clear, steady, articulate, and focused delivery.",
        voiceStyle = "Clear, steady, focused, articulate, and professional female voice.",
        pitchPrompt = "Speak with clear, crisp articulation, steady tempo, and focused, direct delivery.",
        colorHex = 0xFF818CF8 // Indigo
    ),
    SUPPORTIVE(
        label = "Supportive",
        emoji = "💖",
        description = "Warm, patient, comforting, and encouraging companion.",
        voiceStyle = "Warm, patient, comforting, reassuring, and deeply supportive female voice.",
        pitchPrompt = "Speak with warm compassion, patient pacing, comforting pauses, and genuine encouragement.",
        colorHex = 0xFFEC4899 // Rose Pink
    ),
    NEUTRAL(
        label = "Natural",
        emoji = "🎙️",
        description = "Warm, friendly, expressive everyday female companion.",
        voiceStyle = "Warm, natural, expressive young-adult female voice.",
        pitchPrompt = "Speak in a natural, warm, friendly, conversational female voice with natural breathing intervals.",
        colorHex = 0xFF06B6D4 // Cyan
    );

    val composeColor: Color
        get() = Color(colorHex)
}
