package com.aura.voiceassistant.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.voiceassistant.data.model.EmotionType
import com.aura.voiceassistant.data.model.UserAccount
import com.aura.voiceassistant.data.model.VoiceProfile
import com.aura.voiceassistant.ui.theme.Cyan300
import com.aura.voiceassistant.ui.theme.Cyan400
import com.aura.voiceassistant.ui.theme.Emerald400
import com.aura.voiceassistant.ui.theme.GlassBorder
import com.aura.voiceassistant.ui.theme.GlassPill
import com.aura.voiceassistant.ui.theme.GlassSurface
import com.aura.voiceassistant.ui.theme.Pink400

@Composable
fun Header(
    user: UserAccount?,
    currentEmotion: EmotionType,
    voiceProfile: VoiceProfile?,
    hasUnreadMessages: Boolean,
    onEmotionSelected: (EmotionType) -> Unit,
    onOpenVoiceLock: () -> Unit,
    onOpenChatDrawer: () -> Unit,
    onOpenAccount: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showEmotionMenu by remember { mutableStateOf(false) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Left: Aura Brand & Natural Female Voice Tag
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(GlassSurface)
                .border(1.dp, GlassBorder, RoundedCornerShape(20.dp))
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Brush.linearGradient(listOf(Cyan400, Pink400))),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "A",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "Aura",
                color = Color.White,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.width(6.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Pink400.copy(alpha = 0.15f))
                    .border(1.dp, Pink400.copy(alpha = 0.3f), CircleShape)
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.VolumeUp,
                    contentDescription = null,
                    tint = Pink400,
                    modifier = Modifier.size(10.dp)
                )
                Spacer(modifier = Modifier.width(3.dp))
                Text(
                    text = "Female",
                    color = Pink400,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Center: Emotion Selector Dropdown
        Box {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(currentEmotion.composeColor.copy(alpha = 0.15f))
                    .border(1.dp, currentEmotion.composeColor.copy(alpha = 0.4f), CircleShape)
                    .clickable { showEmotionMenu = true }
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(text = currentEmotion.emoji, fontSize = 13.sp)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${currentEmotion.label} Tone",
                    color = currentEmotion.composeColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = currentEmotion.composeColor,
                    modifier = Modifier.size(16.dp)
                )
            }

            DropdownMenu(
                expanded = showEmotionMenu,
                onDismissRequest = { showEmotionMenu = false },
                modifier = Modifier
                    .background(Color(0xFF0F172A))
                    .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
            ) {
                EmotionType.values().forEach { emotion ->
                    DropdownMenuItem(
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = emotion.emoji, fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = emotion.label,
                                        color = if (emotion == currentEmotion) emotion.composeColor else Color.White,
                                        fontWeight = if (emotion == currentEmotion) FontWeight.Bold else FontWeight.Normal,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = emotion.description,
                                        color = Color.Gray,
                                        fontSize = 10.sp,
                                        maxLines = 1
                                    )
                                }
                                if (emotion == currentEmotion) {
                                    Spacer(modifier = Modifier.weight(1f))
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = emotion.composeColor,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        },
                        onClick = {
                            onEmotionSelected(emotion)
                            showEmotionMenu = false
                        }
                    )
                }
            }
        }

        // Right Actions (Voice Lock, Messages Drawer, Account)
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Voice Lock Icon
            IconButton(
                onClick = onOpenVoiceLock,
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (voiceProfile?.isEnabled == true) Emerald400.copy(alpha = 0.15f)
                        else GlassSurface
                    )
                    .border(
                        1.dp,
                        if (voiceProfile?.isEnabled == true) Emerald400.copy(alpha = 0.4f)
                        else GlassBorder,
                        RoundedCornerShape(12.dp)
                    )
            ) {
                Icon(
                    imageVector = if (voiceProfile?.isEnabled == true) Icons.Default.Shield else Icons.Default.Lock,
                    contentDescription = "Voice Lock",
                    tint = if (voiceProfile?.isEnabled == true) Emerald400 else Color.LightGray,
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Chat Drawer Toggle
            Box {
                IconButton(
                    onClick = onOpenChatDrawer,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(GlassSurface)
                        .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.ChatBubbleOutline,
                        contentDescription = "Chat History",
                        tint = Color.LightGray,
                        modifier = Modifier.size(16.dp)
                    )
                }
                if (hasUnreadMessages) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .align(Alignment.TopEnd)
                            .clip(CircleShape)
                            .background(Cyan400)
                    )
                }
            }

            Spacer(modifier = Modifier.width(6.dp))

            // User Avatar / Profile
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Brush.linearGradient(listOf(Cyan400, Violet500)))
                    .clickable { onOpenAccount() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = user?.name?.take(1) ?: "U",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
