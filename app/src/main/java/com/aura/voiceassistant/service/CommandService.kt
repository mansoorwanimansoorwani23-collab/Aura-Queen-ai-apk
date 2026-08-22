package com.aura.voiceassistant.service

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.aura.voiceassistant.config.AppConfig
import java.net.URLEncoder

data class CommandResult(
    val actionText: String,
    val intent: Intent? = null,
    val isAction: Boolean = false
)

object CommandService {

    fun processCommand(context: Context, command: String): CommandResult {
        val lowerCmd = command.lowercase().trim()

        // 1. Fixed Developer Query Interception
        if (AppConfig.isDeveloperQuery(lowerCmd)) {
            return CommandResult(
                actionText = AppConfig.DEVELOPER_STATEMENT,
                intent = null,
                isAction = false
            )
        }

        // 2. Open Website: "open [site]"
        val openRegex = Regex("""^open\s+(.+)$""", RegexOption.IGNORE_CASE)
        val openMatch = openRegex.find(lowerCmd)
        if (openMatch != null && !lowerCmd.contains("youtube") && !lowerCmd.contains("spotify")) {
            var website = openMatch.groupValues[1].trim().replace("\\s+".toRegex(), "")
            if (!website.contains(".")) {
                website += ".com"
            }
            val url = if (!website.startsWith("http://") && !website.startsWith("https://")) {
                "https://www.$website"
            } else {
                website
            }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            return CommandResult(
                actionText = "Opening ${openMatch.groupValues[1]} for you.",
                intent = intent,
                isAction = true
            )
        }

        // 3. Media Search: "play [song] on youtube"
        val ytRegex = Regex("""^play\s+(.+?)\s+on\s+youtube$""", RegexOption.IGNORE_CASE)
        val ytMatch = ytRegex.find(lowerCmd)
        if (ytMatch != null) {
            val query = URLEncoder.encode(ytMatch.groupValues[1].trim(), "UTF-8")
            val ytUrl = "https://www.youtube.com/results?search_query=$query"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ytUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            return CommandResult(
                actionText = "Playing ${ytMatch.groupValues[1]} on YouTube.",
                intent = intent,
                isAction = true
            )
        }

        // 4. Media Search: "search [query] on spotify"
        val spotifyRegex = Regex("""^search\s+(.+?)\s+on\s+spotify$""", RegexOption.IGNORE_CASE)
        val spotifyMatch = spotifyRegex.find(lowerCmd)
        if (spotifyMatch != null) {
            val query = URLEncoder.encode(spotifyMatch.groupValues[1].trim(), "UTF-8")
            val spotifyUrl = "https://open.spotify.com/search/$query"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(spotifyUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            return CommandResult(
                actionText = "Searching ${spotifyMatch.groupValues[1]} on Spotify.",
                intent = intent,
                isAction = true
            )
        }

        // 5. WhatsApp Message: "send a whatsapp message to [number] saying [message]"
        val waRegex = Regex("""^send\s+a\s+whatsapp\s+message\s+to\s+([\d\+\s]+)\s+saying\s+(.+)$""", RegexOption.IGNORE_CASE)
        val waMatch = waRegex.find(lowerCmd)
        if (waMatch != null) {
            val number = waMatch.groupValues[1].replace("\\s+".toRegex(), "")
            val message = URLEncoder.encode(waMatch.groupValues[2].trim(), "UTF-8")
            val waUrl = "https://api.whatsapp.com/send?phone=$number&text=$message"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            return CommandResult(
                actionText = "Sending your WhatsApp message.",
                intent = intent,
                isAction = true
            )
        }

        return CommandResult(actionText = "", intent = null, isAction = false)
    }
}
