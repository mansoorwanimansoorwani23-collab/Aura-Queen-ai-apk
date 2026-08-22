package com.aura.voiceassistant.service

import com.aura.voiceassistant.data.model.EmotionType

class VoiceEmotionCore private constructor() {

    private var currentEmotion: EmotionType = EmotionType.CALM
    private var isMuted: Boolean = false
    val primaryVoiceName: String = "Aoede" // Warm natural young-adult female voice

    companion object {
        @Volatile
        private var instance: VoiceEmotionCore? = null

        fun getInstance(): VoiceEmotionCore {
            return instance ?: synchronized(this) {
                instance ?: VoiceEmotionCore().also { instance = it }
            }
        }
    }

    fun getCurrentEmotion(): EmotionType = currentEmotion

    fun setEmotion(emotion: EmotionType) {
        currentEmotion = emotion
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
    }

    fun isMuted(): Boolean = isMuted

    /**
     * Intelligently classify context and emotion from conversation text
     */
    fun detectEmotion(userText: String, assistantText: String? = null): EmotionType {
        val text = "$userText ${assistantText.orEmpty()}".lowercase()

        // 1. Excitement / Celebration / Happiness
        if (Regex("""yay|hurray|awesome|fantastic|wonderful|amazing|congrat|celebrat|so happy|love this|best day|thrilled|super excited|let's go|woohoo""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.EXCITED
        }

        // 2. Playful / Humor / Jokes
        if (Regex("""joke|funny|haha|lol|rofl|lmao|pun|make me laugh|hilarious|silly|kidding|teasing""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.FUNNY
        }

        // 3. Sadness / Grief / Loneliness / Heartbreak
        if (Regex("""sad|cry|crying|depressed|heartbroken|lonely|down today|bad day|miss them|lost my|grief|hurts|unhappy""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.SAD
        }

        // 4. Worry / Anxiety / Fear / Distress
        if (Regex("""scared|worried|anxious|panic|stress|nervous|afraid|emergency|danger|freaking out|overwhelmed""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.WORRIED
        }

        // 5. Need for encouragement / Support / Validation
        if (Regex("""help me|can't do this|need advice|struggling|give up|support|comfort|be here for me|cheer me up|hard time""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.SUPPORTIVE
        }

        // 6. Joy / Positivity / Gratitude
        if (Regex("""thank you so much|grateful|good news|smiling|delightful|nice|pleasant|having fun|blessed""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.HAPPY
        }

        // 7. Serious / Urgent / Work / Technical / Direct
        if (Regex("""urgent|important|security|password|critical|developer|who created|who made|code|math|calculate|formal|strictly""", RegexOption.IGNORE_CASE).containsMatchIn(text)) {
            return EmotionType.SERIOUS
        }

        // 8. Default friendly, calm, conversational warm female baseline
        return EmotionType.CALM
    }
}
