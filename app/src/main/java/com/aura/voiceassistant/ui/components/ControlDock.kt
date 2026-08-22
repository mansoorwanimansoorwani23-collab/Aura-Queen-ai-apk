package com.aura.voiceassistant.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Keyboard
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.voiceassistant.config.AppConfig
import com.aura.voiceassistant.ui.theme.Cyan300
import com.aura.voiceassistant.ui.theme.Cyan400
import com.aura.voiceassistant.ui.theme.GlassBorder
import com.aura.voiceassistant.ui.theme.GlassBorderLight
import com.aura.voiceassistant.ui.theme.GlassPill
import com.aura.voiceassistant.ui.theme.GlassSurface
import com.aura.voiceassistant.ui.theme.Indigo500
import com.aura.voiceassistant.ui.theme.Pink500
import com.aura.voiceassistant.ui.theme.Red400
import com.aura.voiceassistant.ui.theme.Red500
import com.aura.voiceassistant.ui.theme.Violet500

@Composable
fun ControlDock(
    isSessionActive: Boolean,
    isMuted: Boolean,
    onToggleSession: () -> Unit,
    onToggleMute: () -> Unit,
    onSendText: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showTextInput by remember { mutableStateOf(false) }
    var textQuery by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Expandable Text Input Box
        AnimatedVisibility(
            visible = showTextInput,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            ) {
                // Quick Suggestion Prompts
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    AppConfig.SUGGESTION_PROMPTS.forEach { prompt ->
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(GlassSurface)
                                .border(1.dp, Cyan400.copy(alpha = 0.3f), CircleShape)
                                .clickable {
                                    textQuery = prompt
                                    onSendText(prompt)
                                    textQuery = ""
                                    showTextInput = false
                                }
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = prompt,
                                color = Cyan300,
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                // Input Field Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(GlassSurface)
                        .border(1.dp, GlassBorderLight, RoundedCornerShape(24.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    BasicTextField(
                        value = textQuery,
                        onValueChange = { textQuery = it },
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 6.dp, vertical = 6.dp),
                        textStyle = TextStyle(
                            color = Color.White,
                            fontSize = 14.sp
                        ),
                        cursorBrush = SolidColor(Cyan400),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                if (textQuery.isNotBlank()) {
                                    onSendText(textQuery)
                                    textQuery = ""
                                    showTextInput = false
                                }
                            }
                        ),
                        decorationBox = { innerTextField ->
                            if (textQuery.isEmpty()) {
                                Text(
                                    text = "Ask Aura anything in her natural voice...",
                                    color = Color.Gray,
                                    fontSize = 13.sp
                                )
                            }
                            innerTextField()
                        }
                    )

                    IconButton(
                        onClick = {
                            if (textQuery.isNotBlank()) {
                                onSendText(textQuery)
                                textQuery = ""
                                showTextInput = false
                            }
                        },
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Brush.linearGradient(listOf(Cyan400, Violet500)))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Send",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        // Bottom Floating iOS Liquid Glass Dock
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(28.dp))
                .background(GlassSurface)
                .border(1.dp, GlassBorder, RoundedCornerShape(28.dp))
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // 1. Mute Button
            IconButton(
                onClick = onToggleMute,
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (isMuted) Red500.copy(alpha = 0.2f) else GlassPill)
                    .border(
                        1.dp,
                        if (isMuted) Red500.copy(alpha = 0.5f) else GlassBorder,
                        RoundedCornerShape(18.dp)
                    )
            ) {
                Icon(
                    imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                    contentDescription = "Mute",
                    tint = if (isMuted) Red400 else Cyan300,
                    modifier = Modifier.size(20.dp)
                )
            }

            // 2. Primary Voice Session Call Button
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        if (isSessionActive) Brush.linearGradient(listOf(Red500.copy(alpha = 0.8f), Red400.copy(alpha = 0.8f)))
                        else Brush.linearGradient(listOf(Cyan400, Indigo500, Pink500))
                    )
                    .clickable { onToggleSession() }
                    .padding(horizontal = 24.dp, vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = if (isSessionActive) Icons.Default.CallEnd else Icons.Default.Call,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = if (isSessionActive) "End Session" else "Start Live Call",
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }
            }

            // 3. Keyboard Input Toggle
            IconButton(
                onClick = { showTextInput = !showTextInput },
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (showTextInput) Cyan400.copy(alpha = 0.2f) else GlassPill)
                    .border(
                        1.dp,
                        if (showTextInput) Cyan400.copy(alpha = 0.5f) else GlassBorder,
                        RoundedCornerShape(18.dp)
                    )
            ) {
                Icon(
                    imageVector = Icons.Default.Keyboard,
                    contentDescription = "Keyboard Input",
                    tint = if (showTextInput) Cyan300 else Color.LightGray,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
