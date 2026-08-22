package com.aura.voiceassistant.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.voiceassistant.data.model.EmotionType
import com.aura.voiceassistant.ui.theme.Cyan300
import com.aura.voiceassistant.ui.theme.Cyan400
import com.aura.voiceassistant.ui.theme.Indigo500
import com.aura.voiceassistant.ui.theme.Pink400
import com.aura.voiceassistant.ui.theme.Violet500

@Composable
fun Visualizer(
    state: String, // "idle", "listening", "processing", "speaking"
    emotion: EmotionType = EmotionType.CALM,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "visualizer_anim")

    // Rotation animations
    val rotationFast by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (state == "speaking") 3000 else 6000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotationFast"
    )

    val rotationSlowReverse by infiniteTransition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (state == "listening") 4000 else 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotationSlowReverse"
    )

    // Pulse animation
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = if (state == "speaking") 1.08f else if (state == "listening") 1.04f else 1.01f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (state == "speaking") 600 else 1400),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    val emotionColor = emotion.composeColor

    val baseThemeColor = when (state) {
        "listening" -> Violet500
        "processing" -> Cyan400
        "speaking" -> emotionColor
        else -> Cyan500
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        // Ambient Diffuse Glow Orb
        Box(
            modifier = Modifier
                .size(340.dp)
                .scale(pulseScale)
                .blur(70.dp)
                .clip(CircleShape)
                .background(baseThemeColor.copy(alpha = if (state == "speaking") 0.35f else 0.18f))
        )

        // Outer Dashed Orbit Ring
        Canvas(
            modifier = Modifier
                .size(320.dp)
                .rotate(rotationFast)
        ) {
            drawCircle(
                color = baseThemeColor.copy(alpha = 0.35f),
                style = Stroke(
                    width = 1.5f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 15f), 0f)
                )
            )
        }

        // Mid Dotted Orbit Ring
        Canvas(
            modifier = Modifier
                .size(250.dp)
                .rotate(rotationSlowReverse)
        ) {
            drawCircle(
                color = baseThemeColor.copy(alpha = 0.45f),
                style = Stroke(
                    width = 2f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 12f), 0f)
                )
            )
        }

        // Inner Scanner Ring
        Canvas(
            modifier = Modifier
                .size(190.dp)
                .rotate(rotationFast * 1.5f)
        ) {
            drawCircle(
                color = baseThemeColor.copy(alpha = 0.6f),
                style = Stroke(
                    width = 2.5f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(40f, 80f), 0f)
                )
            )
        }

        // Core Liquid Glass Orb
        Box(
            modifier = Modifier
                .size(130.dp)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.25f),
                            baseThemeColor.copy(alpha = 0.4f),
                            Color(0xFF030712).copy(alpha = 0.9f)
                        )
                    )
                )
                .border(1.5.dp, Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.5f), baseThemeColor.copy(alpha = 0.3f))), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "AURA",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif,
                    letterSpacing = 4.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (state == "speaking") {
                        Text(
                            text = "${emotion.emoji} ${emotion.label}",
                            color = emotionColor,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            fontFamily = FontFamily.Monospace
                        )
                    } else {
                        Text(
                            text = state.uppercase(),
                            color = Cyan300.copy(alpha = 0.8f),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Medium,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }
        }
    }
}
