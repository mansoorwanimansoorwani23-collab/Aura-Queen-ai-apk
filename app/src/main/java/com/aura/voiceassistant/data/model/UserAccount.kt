package com.aura.voiceassistant.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserAccount(
    val id: String,
    val name: String,
    val email: String,
    val provider: String = "google",
    val avatarUrl: String? = null,
    val loggedInAt: Long = System.currentTimeMillis()
)
