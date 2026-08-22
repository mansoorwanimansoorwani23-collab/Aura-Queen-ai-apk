package com.aura.voiceassistant.data.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.aura.voiceassistant.data.model.ChatMessage
import com.aura.voiceassistant.data.model.EmotionType
import com.aura.voiceassistant.data.model.UserAccount
import com.aura.voiceassistant.data.model.VoiceProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "aura_voice_assistant_prefs")

class AppDataStore(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    companion object {
        private val KEY_CHAT_HISTORY = stringPreferencesKey("aura_chat_history")
        private val KEY_USER_ACCOUNT = stringPreferencesKey("aura_auth_user")
        private val KEY_VOICE_PROFILE = stringPreferencesKey("aura_voice_lock_profile")
        private val KEY_IS_MUTED = booleanPreferencesKey("aura_is_muted")
        private val KEY_CURRENT_EMOTION = stringPreferencesKey("aura_current_emotion")
    }

    val chatHistoryFlow: Flow<List<ChatMessage>> = context.dataStore.data.map { preferences ->
        val raw = preferences[KEY_CHAT_HISTORY] ?: return@map emptyList()
        try {
            json.decodeFromString<List<ChatMessage>>(raw)
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun saveChatHistory(messages: List<ChatMessage>) {
        context.dataStore.edit { preferences ->
            try {
                preferences[KEY_CHAT_HISTORY] = json.encodeToString(messages)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    suspend fun clearChatHistory() {
        context.dataStore.edit { preferences ->
            preferences.remove(KEY_CHAT_HISTORY)
        }
    }

    val userAccountFlow: Flow<UserAccount?> = context.dataStore.data.map { preferences ->
        val raw = preferences[KEY_USER_ACCOUNT] ?: return@map null
        try {
            json.decodeFromString<UserAccount>(raw)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun saveUserAccount(user: UserAccount?) {
        context.dataStore.edit { preferences ->
            if (user == null) {
                preferences.remove(KEY_USER_ACCOUNT)
            } else {
                try {
                    preferences[KEY_USER_ACCOUNT] = json.encodeToString(user)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    val voiceProfileFlow: Flow<VoiceProfile?> = context.dataStore.data.map { preferences ->
        val raw = preferences[KEY_VOICE_PROFILE] ?: return@map null
        try {
            json.decodeFromString<VoiceProfile>(raw)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun saveVoiceProfile(profile: VoiceProfile?) {
        context.dataStore.edit { preferences ->
            if (profile == null) {
                preferences.remove(KEY_VOICE_PROFILE)
            } else {
                try {
                    preferences[KEY_VOICE_PROFILE] = json.encodeToString(profile)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    val isMutedFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_IS_MUTED] ?: false
    }

    suspend fun setMuted(muted: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_IS_MUTED] = muted
        }
    }

    val currentEmotionFlow: Flow<EmotionType> = context.dataStore.data.map { preferences ->
        val raw = preferences[KEY_CURRENT_EMOTION] ?: return@map EmotionType.CALM
        try {
            EmotionType.valueOf(raw)
        } catch (e: Exception) {
            EmotionType.CALM
        }
    }

    suspend fun setEmotion(emotion: EmotionType) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CURRENT_EMOTION] = emotion.name
        }
    }
}
