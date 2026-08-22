package com.aura.voiceassistant.service

import com.aura.voiceassistant.config.AppConfig
import com.aura.voiceassistant.data.model.ChatMessage
import com.aura.voiceassistant.data.model.EmotionType
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject

class GeminiService {

    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }

    private val voiceEmotionCore = VoiceEmotionCore.getInstance()

    suspend fun getAuraResponse(
        prompt: String,
        history: List<ChatMessage> = emptyList(),
        apiKey: String
    ): Pair<String, EmotionType> = withContext(Dispatchers.IO) {
        // 1. Mandatory Developer Identity Interception
        if (AppConfig.isDeveloperQuery(prompt)) {
            voiceEmotionCore.setEmotion(EmotionType.SERIOUS)
            return@withContext Pair(AppConfig.DEVELOPER_STATEMENT, EmotionType.SERIOUS)
        }

        // Check if API key is provided
        if (apiKey.isBlank()) {
            val defaultAnswer = "Hello! I am Aura, your natural emotion-aware voice assistant. How can I help you today?"
            val emotion = voiceEmotionCore.detectEmotion(prompt, defaultAnswer)
            return@withContext Pair(defaultAnswer, emotion)
        }

        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"

            // Format sliding window memory (last 20 messages)
            val recentHistory = history.takeLast(20)
            val contentsArray = buildJsonArray {
                for (msg in recentHistory) {
                    val role = if (msg.sender == "user") "user" else "model"
                    addJsonObject {
                        put("role", role)
                        putJsonArray("parts") {
                            addJsonObject {
                                put("text", msg.text)
                            }
                        }
                    }
                }
                // Current user message
                addJsonObject {
                    put("role", "user")
                    putJsonArray("parts") {
                        addJsonObject {
                            put("text", prompt)
                        }
                    }
                }
            }

            val requestBody = buildJsonObject {
                put("contents", contentsArray)
                putJsonObject("systemInstruction") {
                    putJsonArray("parts") {
                        addJsonObject {
                            put("text", AppConfig.SYSTEM_INSTRUCTION)
                        }
                    }
                }
                putJsonObject("generationConfig") {
                    put("temperature", 0.7)
                    put("topP", 0.95)
                    put("maxOutputTokens", 512)
                }
            }

            val response = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(requestBody.toString())
            }

            val responseBody = response.bodyAsText()
            val jsonElement = Json.parseToJsonElement(responseBody).jsonObject
            val candidates = jsonElement["candidates"]?.jsonArray
            val firstCandidate = candidates?.firstOrNull()?.jsonObject
            val content = firstCandidate?.get("content")?.jsonObject
            val parts = content?.get("parts")?.jsonArray
            val text = parts?.firstOrNull()?.jsonObject?.get("text")?.jsonPrimitive?.content
                ?: "I'm right here with you."

            val detectedEmotion = voiceEmotionCore.detectEmotion(prompt, text)
            voiceEmotionCore.setEmotion(detectedEmotion)

            return@withContext Pair(text, detectedEmotion)
        } catch (e: Exception) {
            e.printStackTrace()
            val fallback = "I encountered a brief connection issue. Don't worry, please try again!"
            return@withContext Pair(fallback, EmotionType.SUPPORTIVE)
        }
    }

    suspend fun synthesizeSpeech(
        text: String,
        emotion: EmotionType,
        apiKey: String
    ): String? = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) return@withContext null

        try {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"
            val speechPrompt = "[Voice Tone: ${emotion.pitchPrompt}]\n$text"

            val requestBody = buildJsonObject {
                putJsonArray("contents") {
                    addJsonObject {
                        putJsonArray("parts") {
                            addJsonObject {
                                put("text", speechPrompt)
                            }
                        }
                    }
                }
                putJsonObject("generationConfig") {
                    putJsonArray("responseModalities") {
                        add("AUDIO")
                    }
                    putJsonObject("speechConfig") {
                        putJsonObject("voiceConfig") {
                            putJsonObject("prebuiltVoiceConfig") {
                                put("voiceName", voiceEmotionCore.primaryVoiceName)
                            }
                        }
                    }
                }
            }

            val response = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(requestBody.toString())
            }

            val responseBody = response.bodyAsText()
            val jsonElement = Json.parseToJsonElement(responseBody).jsonObject
            val candidates = jsonElement["candidates"]?.jsonArray
            val parts = candidates?.firstOrNull()?.jsonObject
                ?.get("content")?.jsonObject
                ?.get("parts")?.jsonArray

            val audioData = parts?.firstOrNull()?.jsonObject
                ?.get("inlineData")?.jsonObject
                ?.get("data")?.jsonPrimitive?.content

            return@withContext audioData
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext null
        }
    }
}
