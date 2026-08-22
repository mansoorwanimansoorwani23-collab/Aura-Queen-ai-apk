package com.aura.voiceassistant.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ChatMessage(
    val id: String = System.currentTimeMillis().toString(),
    val sender: String, // "user" or "aura"
    val text: String,
    val emotion: EmotionType = EmotionType.CALM,
    val timestamp: Long = System.currentTimeMillis()
)
