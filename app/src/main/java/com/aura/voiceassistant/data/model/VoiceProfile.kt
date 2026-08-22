package com.aura.voiceassistant.data.model

import kotlinx.serialization.Serializable

@Serializable
data class VoiceProfile(
    val id: String = "vp_${System.currentTimeMillis()}",
    val enrolledAt: Long = System.currentTimeMillis(),
    val passphrase: String = "Aura, authorize and verify my voice for secure voice commands",
    val embedding: List<Float> = emptyList(), // 32-dimensional normalized acoustic feature vector
    val sensitivity: String = "balanced", // "relaxed", "balanced", "strict"
    val isEnabled: Boolean = true
)
