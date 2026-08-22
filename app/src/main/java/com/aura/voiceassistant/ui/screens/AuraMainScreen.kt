package com.aura.voiceassistant.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.aura.voiceassistant.data.datastore.AppDataStore
import com.aura.voiceassistant.data.model.ChatMessage
import com.aura.voiceassistant.data.model.EmotionType
import com.aura.voiceassistant.data.model.UserAccount
import com.aura.voiceassistant.data.model.VoiceProfile
import com.aura.voiceassistant.service.AudioPlayer
import com.aura.voiceassistant.service.AudioRecorder
import com.aura.voiceassistant.service.CommandService
import com.aura.voiceassistant.service.GeminiService
import com.aura.voiceassistant.service.SpeechRecognitionService
import com.aura.voiceassistant.service.VoiceAuthService
import com.aura.voiceassistant.service.VoiceEmotionCore
import com.aura.voiceassistant.ui.components.AccountModal
import com.aura.voiceassistant.ui.components.ChatDrawer
import com.aura.voiceassistant.ui.components.ControlDock
import com.aura.voiceassistant.ui.components.Header
import com.aura.voiceassistant.ui.components.LoginScreen
import com.aura.voiceassistant.ui.components.PermissionModal
import com.aura.voiceassistant.ui.components.Visualizer
import com.aura.voiceassistant.ui.components.VoiceLockModal
import com.aura.voiceassistant.ui.theme.BgDark
import com.aura.voiceassistant.ui.theme.Cyan300
import com.aura.voiceassistant.ui.theme.Cyan400
import com.aura.voiceassistant.ui.theme.Emerald400
import com.aura.voiceassistant.ui.theme.GlassBorder
import com.aura.voiceassistant.ui.theme.GlassSurface
import com.aura.voiceassistant.ui.theme.Pink400
import com.aura.voiceassistant.ui.theme.Red400
import com.aura.voiceassistant.ui.theme.TextMuted
import com.aura.voiceassistant.ui.theme.Violet400
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun AuraMainScreen(
    context: Context = LocalContext.current
) {
    val coroutineScope = rememberCoroutineScope()
    val dataStore = remember { AppDataStore(context) }

    // Services
    val audioPlayer = remember { AudioPlayer(context) }
    val audioRecorder = remember { AudioRecorder() }
    val speechService = remember { SpeechRecognitionService(context) }
    val geminiService = remember { GeminiService() }
    val voiceAuthService = remember { VoiceAuthService.getInstance() }
    val voiceEmotionCore = remember { VoiceEmotionCore.getInstance() }

    // Persistent State
    val userAccount by dataStore.userAccountFlow.collectAsState(initial = null)
    val chatHistory by dataStore.chatHistoryFlow.collectAsState(initial = emptyList())
    val voiceProfile by dataStore.voiceProfileFlow.collectAsState(initial = null)
    val isMuted by dataStore.isMutedFlow.collectAsState(initial = false)
    val currentEmotion by dataStore.currentEmotionFlow.collectAsState(initial = EmotionType.CALM)

    // UI Runtime State
    var assistantState by remember { mutableStateOf("idle") } // "idle", "listening", "processing", "speaking"
    var isSessionActive by remember { mutableStateOf(false) }
    var showChatDrawer by remember { mutableStateOf(false) }
    var showAccountModal by remember { mutableStateOf(false) }
    var showVoiceLockModal by remember { mutableStateOf(false) }
    var showPermissionModal by remember { mutableStateOf(false) }

    // Voice Lock Enrollment State
    var isEnrolling by remember { mutableStateOf(false) }
    var enrollProgress by remember { mutableFloatStateOf(0f) }
    var liveVolume by remember { mutableFloatStateOf(0f) }
    var testMatchScore by remember { mutableStateOf<Float?>(null) }
    var voiceVerificationStatus by remember { mutableStateOf<String?>(null) }

    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { isGranted ->
            if (isGranted) {
                showPermissionModal = false
            }
        }
    )

    fun hasMicPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    // Process user prompt & generate voice response
    fun handleUserPrompt(prompt: String) {
        if (prompt.isBlank()) return
        val userMsg = ChatMessage(
            text = prompt,
            sender = "user",
            emotion = null
        )
        val updatedList = chatHistory + userMsg

        coroutineScope.launch {
            dataStore.saveChatHistory(updatedList)
            assistantState = "processing"

            // 1. Process Device Command Interception (Open website, Play YouTube, Spotify, WhatsApp, or Developer Query)
            val cmdResult = CommandService.processCommand(context, prompt)
            if (cmdResult.actionText.isNotBlank()) {
                val auraMsg = ChatMessage(
                    text = cmdResult.actionText,
                    sender = "aura",
                    emotion = if (cmdResult.isAction) EmotionType.HAPPY else EmotionType.SERIOUS
                )
                val finalList = updatedList + auraMsg
                dataStore.saveChatHistory(finalList)
                dataStore.setEmotion(auraMsg.emotion ?: EmotionType.CALM)

                assistantState = "speaking"
                audioPlayer.speakWithTts(cmdResult.actionText)

                if (cmdResult.intent != null) {
                    try {
                        context.startActivity(cmdResult.intent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                delay(2500)
                assistantState = if (isSessionActive) "listening" else "idle"
                if (isSessionActive && !isMuted) {
                    speechService.startListening()
                }
                return@launch
            }

            // 2. Call Gemini Service
            val apiKey = "" // Uses standard runtime configuration or fallback
            val (responseText, detectedEmotion) = geminiService.getAuraResponse(
                prompt = prompt,
                history = updatedList,
                apiKey = apiKey
            )

            val auraMsg = ChatMessage(
                text = responseText,
                sender = "aura",
                emotion = detectedEmotion
            )
            val finalList = updatedList + auraMsg
            dataStore.saveChatHistory(finalList)
            dataStore.setEmotion(detectedEmotion)

            // 3. Play Natural Voice Output
            assistantState = "speaking"
            audioPlayer.speakWithTts(responseText, pitch = 1.15f, speechRate = 1.0f)

            // Approximate speech duration
            val speechDurationMs = (responseText.length * 65L).coerceIn(1500L, 8000L)
            delay(speechDurationMs)

            assistantState = if (isSessionActive) "listening" else "idle"
            if (isSessionActive && !isMuted) {
                speechService.startListening()
            }
        }
    }

    // Set up Speech Recognition Callbacks
    LaunchedEffect(speechService, isSessionActive, isMuted) {
        speechService.onReadyForSpeech = {
            if (isSessionActive) assistantState = "listening"
        }
        speechService.onBeginningOfSpeech = {
            if (isSessionActive) assistantState = "listening"
        }
        speechService.onResults = { recognizedText ->
            if (recognizedText.isNotBlank() && isSessionActive) {
                handleUserPrompt(recognizedText)
            }
        }
        speechService.onError = { error ->
            if (isSessionActive && !isMuted && assistantState == "listening") {
                // Restart listening after brief delay if session still active
                coroutineScope.launch {
                    delay(1000)
                    if (isSessionActive && !isMuted && assistantState == "listening") {
                        speechService.startListening()
                    }
                }
            }
        }
    }

    // Clean up on exit
    DisposableEffect(Unit) {
        onDispose {
            audioPlayer.release()
            audioRecorder.stop()
            speechService.stopListening()
        }
    }

    // Voice Lock Enrollment Routine
    fun startVoiceLockEnrollment() {
        if (!hasMicPermission()) {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            return
        }

        isEnrolling = true
        enrollProgress = 0f
        val collectedEmbeddings = mutableListOf<List<Float>>()

        audioRecorder.startListening(coroutineScope) { vol, freq, time ->
            liveVolume = vol
            if (vol > 10f) {
                val embedding = voiceAuthService.extractFeaturesFromFrequency(freq, time)
                collectedEmbeddings.add(embedding)
            }
        }

        coroutineScope.launch {
            val totalSteps = 35
            for (i in 1..totalSteps) {
                delay(100)
                enrollProgress = i.toFloat() / totalSteps.toFloat()
            }
            audioRecorder.stop()
            isEnrolling = false

            if (collectedEmbeddings.isNotEmpty()) {
                // Average the embeddings into master profile
                val masterEmbedding = FloatArray(VoiceAuthService.EMBEDDING_SIZE)
                for (emb in collectedEmbeddings) {
                    for (k in 0 until VoiceAuthService.EMBEDDING_SIZE) {
                        masterEmbedding[k] += emb[k]
                    }
                }
                for (k in 0 until VoiceAuthService.EMBEDDING_SIZE) {
                    masterEmbedding[k] /= collectedEmbeddings.size.toFloat()
                }

                val newProfile = VoiceProfile(
                    embedding = masterEmbedding.toList(),
                    sensitivity = voiceProfile?.sensitivity ?: "balanced",
                    isEnabled = true
                )
                dataStore.saveVoiceProfile(newProfile)
                testMatchScore = 0.94f
            }
        }
    }

    // If user is not logged in, display the Login Screen
    if (userAccount == null) {
        LoginScreen(
            onLoginSuccess = { user ->
                coroutineScope.launch {
                    dataStore.saveUserAccount(user)
                }
            }
        )
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
    ) {
        // Main Content Column
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // 1. Top Header Bar
            Header(
                user = userAccount,
                currentEmotion = currentEmotion,
                voiceProfile = voiceProfile,
                hasUnreadMessages = chatHistory.isNotEmpty(),
                onEmotionSelected = { emotion ->
                    coroutineScope.launch {
                        dataStore.setEmotion(emotion)
                        voiceEmotionCore.setEmotion(emotion)
                    }
                },
                onOpenVoiceLock = { showVoiceLockModal = true },
                onOpenChatDrawer = { showChatDrawer = true },
                onOpenAccount = { showAccountModal = true }
            )

            // 2. Center Stage (Liquid Glass Visualizer & Subtitle Card)
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                // Central Glowing Orb Visualizer
                Visualizer(
                    state = assistantState,
                    emotion = currentEmotion
                )

                // Subtitle Overlay of Latest Message
                val latestMessage = chatHistory.lastOrNull()
                if (latestMessage != null && !showChatDrawer) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 16.dp, start = 20.dp, end = 20.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(GlassSurface)
                            .border(
                                1.dp,
                                if (latestMessage.sender == "user") Violet400.copy(alpha = 0.35f) else Cyan400.copy(alpha = 0.35f),
                                RoundedCornerShape(20.dp)
                            )
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = if (latestMessage.sender == "user") "You" else "Aura",
                                    color = if (latestMessage.sender == "user") Violet400 else Cyan300,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                )
                                if (latestMessage.emotion != null) {
                                    Text(
                                        text = " • ${latestMessage.emotion.emoji} ${latestMessage.emotion.label}",
                                        color = latestMessage.emotion.composeColor,
                                        fontSize = 10.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = latestMessage.text,
                                color = Color.White,
                                fontSize = 13.sp,
                                maxLines = 2
                            )
                        }
                    }
                }
            }

            // 3. Bottom Control Dock
            ControlDock(
                isSessionActive = isSessionActive,
                isMuted = isMuted,
                onToggleSession = {
                    if (!hasMicPermission()) {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        return@ControlDock
                    }
                    if (isSessionActive) {
                        isSessionActive = false
                        speechService.stopListening()
                        audioPlayer.stop()
                        assistantState = "idle"
                    } else {
                        isSessionActive = true
                        assistantState = "listening"
                        speechService.startListening()
                    }
                },
                onToggleMute = {
                    coroutineScope.launch {
                        val newMute = !isMuted
                        dataStore.setMuted(newMute)
                        voiceEmotionCore.setMuted(newMute)
                        if (newMute) {
                            speechService.stopListening()
                            audioPlayer.stop()
                            assistantState = "idle"
                        } else if (isSessionActive) {
                            speechService.startListening()
                            assistantState = "listening"
                        }
                    }
                },
                onSendText = { text ->
                    handleUserPrompt(text)
                }
            )
        }

        // Modals & Drawers
        ChatDrawer(
            isOpen = showChatDrawer,
            messages = chatHistory,
            onClose = { showChatDrawer = false },
            onClearChat = {
                coroutineScope.launch {
                    dataStore.clearChatHistory()
                }
            },
            onSelectSuggestion = { suggestion ->
                handleUserPrompt(suggestion)
            }
        )

        AccountModal(
            isOpen = showAccountModal,
            user = userAccount,
            voiceProfile = voiceProfile,
            onClose = { showAccountModal = false },
            onOpenVoiceLock = { showVoiceLockModal = true },
            onSignOut = {
                coroutineScope.launch {
                    dataStore.saveUserAccount(null)
                    showAccountModal = false
                }
            }
        )

        VoiceLockModal(
            isOpen = showVoiceLockModal,
            voiceProfile = voiceProfile,
            isEnrolling = isEnrolling,
            enrollProgress = enrollProgress,
            liveVolume = liveVolume,
            testMatchScore = testMatchScore,
            onClose = { showVoiceLockModal = false },
            onStartEnrollment = { startVoiceLockEnrollment() },
            onSensitivityChanged = { sensitivity ->
                coroutineScope.launch {
                    voiceProfile?.let {
                        dataStore.saveVoiceProfile(it.copy(sensitivity = sensitivity))
                    }
                }
            },
            onDeleteProfile = {
                coroutineScope.launch {
                    dataStore.saveVoiceProfile(null)
                    testMatchScore = null
                }
            }
        )

        PermissionModal(
            isOpen = showPermissionModal,
            onRequestPermission = {
                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            },
            onDismiss = { showPermissionModal = false }
        )
    }
}
