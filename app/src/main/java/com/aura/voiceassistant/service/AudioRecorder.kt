package com.aura.voiceassistant.service

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

class AudioRecorder {

    private var audioRecord: AudioRecord? = null
    private var recordJob: Job? = null
    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT

    @SuppressLint("MissingPermission")
    fun startListening(
        scope: CoroutineScope,
        onAudioData: (volume: Float, frequencyData: FloatArray, timeData: ShortArray) -> Unit
    ) {
        stop()

        val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
        val bufferSize = (minBufferSize * 2).coerceAtLeast(1024)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                return
            }

            audioRecord?.startRecording()

            recordJob = scope.launch(Dispatchers.IO) {
                val shortBuffer = ShortArray(512)
                val freqData = FloatArray(256)

                while (isActive && audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    val read = audioRecord?.read(shortBuffer, 0, shortBuffer.size) ?: 0
                    if (read > 0) {
                        var sum = 0L
                        for (i in 0 until read) {
                            sum += abs(shortBuffer[i].toInt())
                        }
                        val avgVolume = (sum.toFloat() / read) / 327.68f // 0 - 100 volume scale

                        // Compute discrete Fourier transform approximation on audio frame
                        for (k in freqData.indices) {
                            var real = 0f
                            var imag = 0f
                            val step = (read / freqData.size).coerceAtLeast(1)
                            for (n in 0 until read step step) {
                                val angle = 2.0 * Math.PI * k * n / read
                                val sample = shortBuffer[n] / 32768f
                                real += (sample * cos(angle)).toFloat()
                                imag -= (sample * sin(angle)).toFloat()
                            }
                            freqData[k] = (real * real + imag * imag).coerceIn(0f, 255f)
                        }

                        onAudioData(avgVolume.coerceIn(0f, 100f), freqData, shortBuffer)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stop() {
        recordJob?.cancel()
        recordJob = null
        try {
            if (audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                audioRecord?.stop()
            }
            audioRecord?.release()
            audioRecord = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
