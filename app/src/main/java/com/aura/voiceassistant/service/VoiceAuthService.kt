package com.aura.voiceassistant.service

import com.aura.voiceassistant.data.model.VoiceProfile
import kotlin.math.pow
import kotlin.math.sqrt

data class VoiceVerificationResult(
    val matched: Boolean,
    val score: Float,
    val threshold: Float,
    val confidence: String // "high", "medium", "low", "unverified"
)

class VoiceAuthService private constructor() {

    companion object {
        const val EMBEDDING_SIZE = 32

        @Volatile
        private var instance: VoiceAuthService? = null

        fun getInstance(): VoiceAuthService {
            return instance ?: synchronized(this) {
                instance ?: VoiceAuthService().also { instance = it }
            }
        }
    }

    /**
     * Extracts acoustic feature embedding from audio frequency & time domain data.
     * Compresses FFT bins into a 32-dimensional normalized vector.
     */
    fun extractFeaturesFromFrequency(frequencyData: FloatArray, timeDomainData: ShortArray? = null): List<Float> {
        val features = FloatArray(EMBEDDING_SIZE)
        val binCount = frequencyData.size
        val bandCount = EMBEDDING_SIZE - 4
        val bandSize = (binCount / bandCount).coerceAtLeast(1)

        // 1. Multi-band frequency energy distribution (first 28 bins)
        for (i in 0 until 28) {
            var sum = 0f
            val start = i * bandSize
            val end = (start + bandSize).coerceAtMost(binCount)
            for (j in start until end) {
                sum += frequencyData[j]
            }
            features[i] = if (end > start) sum / (end - start) else 0f
        }

        // 2. Spectral Centroid (Vocal tract brightness resonance)
        var weightedSum = 0f
        var totalEnergy = 0f
        for (i in 0 until binCount) {
            weightedSum += i * frequencyData[i]
            totalEnergy += frequencyData[i]
        }
        val centroid = if (totalEnergy > 0f) weightedSum / totalEnergy else 0f
        features[28] = (centroid / (binCount / 2f)).coerceIn(0f, 1f)

        // 3. Spectral Rolloff (85% energy frequency cut-off)
        var cumulative = 0f
        val threshold = totalEnergy * 0.85f
        var rolloffIndex = 0
        for (i in 0 until binCount) {
            cumulative += frequencyData[i]
            if (cumulative >= threshold) {
                rolloffIndex = i
                break
            }
        }
        features[29] = if (binCount > 0) (rolloffIndex.toFloat() / binCount.toFloat()).coerceIn(0f, 1f) else 0f

        // 4. Zero Crossing Rate from time domain (if provided)
        if (timeDomainData != null && timeDomainData.size > 1) {
            var zcr = 0
            for (i in 1 until timeDomainData.size) {
                val prev = timeDomainData[i - 1]
                val curr = timeDomainData[i]
                if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
                    zcr++
                }
            }
            features[30] = (zcr.toFloat() / timeDomainData.size.toFloat()).coerceIn(0f, 1f)
        } else {
            features[30] = 0.5f
        }

        // 5. Energy Variance (dynamic vocal variance)
        val avgEnergy = if (binCount > 0) totalEnergy / binCount else 0f
        var variance = 0f
        for (i in 0 until binCount) {
            variance += (frequencyData[i] - avgEnergy).pow(2)
        }
        features[31] = (sqrt(if (binCount > 0) variance / binCount else 0f) / 128f).coerceIn(0f, 1f)

        // Normalize embedding vector to unit length (L2 norm)
        var norm = 0f
        for (i in 0 until EMBEDDING_SIZE) {
            norm += features[i] * features[i]
        }
        norm = sqrt(norm)
        if (norm > 0f) {
            for (i in 0 until EMBEDDING_SIZE) {
                features[i] /= norm
            }
        }

        return features.toList()
    }

    /**
     * Computes Cosine Similarity between two voice feature vectors.
     * Returns a score from 0.0 to 1.0.
     */
    fun computeSimilarity(vecA: List<Float>, vecB: List<Float>): Float {
        if (vecA.isEmpty() || vecB.isEmpty() || vecA.size != vecB.size) return 0f
        var dotProduct = 0f
        var normA = 0f
        var normB = 0f

        for (i in vecA.indices) {
            dotProduct += vecA[i] * vecB[i]
            normA += vecA[i] * vecA[i]
            normB += vecB[i] * vecB[i]
        }

        val denominator = sqrt(normA) * sqrt(normB)
        if (denominator == 0f) return 0f
        val similarity = dotProduct / denominator
        return similarity.coerceIn(0f, 1f)
    }

    /**
     * Verifies audio against enrolled voice profile.
     */
    fun verifyFeatures(currentEmbedding: List<Float>, profile: VoiceProfile?): VoiceVerificationResult {
        if (profile == null || !profile.isEnabled || profile.embedding.isEmpty()) {
            return VoiceVerificationResult(matched = true, score = 1.0f, threshold = 0.7f, confidence = "unverified")
        }

        // Determine threshold based on sensitivity setting
        val threshold = when (profile.sensitivity.lowercase()) {
            "relaxed" -> 0.62f
            "strict" -> 0.82f
            else -> 0.72f // balanced default
        }

        val score = computeSimilarity(profile.embedding, currentEmbedding)
        val matched = score >= threshold

        val confidence = when {
            score >= threshold + 0.1f -> "high"
            score >= threshold -> "medium"
            else -> "low"
        }

        return VoiceVerificationResult(
            matched = matched,
            score = score,
            threshold = threshold,
            confidence = confidence
        )
    }
}
