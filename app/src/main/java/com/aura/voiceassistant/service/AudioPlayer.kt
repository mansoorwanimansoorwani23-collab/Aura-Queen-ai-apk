package com.aura.voiceassistant.service

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.speech.tts.TextToSpeech
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale

class AudioPlayer(private val context: Context) {

    private var audioTrack: AudioTrack? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsInitialized = false

    init {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech?.language = Locale.US
                isTtsInitialized = true
            }
        }
    }

    suspend fun playPCM24k(base64PCM: String) = withContext(Dispatchers.IO) {
        stop()
        try {
            val audioBytes = Base64.decode(base64PCM, Base64.DEFAULT)
            val sampleRate = 24000
            val channelConfig = AudioFormat.CHANNEL_OUT_MONO
            val audioFormat = AudioFormat.ENCODING_PCM_16BIT
            val minBufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat)
            val bufferSize = audioBytes.size.coerceAtLeast(minBufferSize)

            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(audioFormat)
                        .setSampleRate(sampleRate)
                        .setChannelMask(channelConfig)
                        .build()
                )
                .setBufferSizeInBytes(bufferSize)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            audioTrack?.write(audioBytes, 0, audioBytes.size)
            audioTrack?.play()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun speakWithTts(text: String, pitch: Float = 1.15f, speechRate: Float = 1.0f) {
        stop()
        if (isTtsInitialized && textToSpeech != null) {
            textToSpeech?.setPitch(pitch) // Natural brighter tone for female voice
            textToSpeech?.setSpeechRate(speechRate)
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "aura_utterance_${System.currentTimeMillis()}")
        }
    }

    fun stop() {
        try {
            audioTrack?.stop()
            audioTrack?.release()
            audioTrack = null
        } catch (e: Exception) {
            // ignore
        }
        try {
            textToSpeech?.stop()
        } catch (e: Exception) {
            // ignore
        }
    }

    fun release() {
        stop()
        textToSpeech?.shutdown()
        textToSpeech = null
    }
}
