# Aura — Natural Emotion-Aware AI Voice Assistant (Android Native)

Aura is a native Android application built with **Kotlin** and **Jetpack Compose** featuring a natural young-adult female voice (`Aoede` voice engine), dynamic emotion delivery adaptation, acoustic Voice Lock biometrics, and contextual command execution.

---

## Key Features

- **Natural Female Voice Persona**: Powered by the expressive `Aoede` voice profile with natural conversational cadence, smooth pauses, and genuine human warmth.
- **Emotion-Aware Intelligence**: Dynamically adapts delivery across 8 distinct emotional tones: *Calm*, *Happy*, *Excited*, *Sad/Gentle*, *Worried/Attentive*, *Supportive*, *Funny/Playful*, and *Serious/Direct*.
- **Acoustic Voice Lock Biometrics**: 32-dimensional spectral feature extraction (spectral centroid, spectral rolloff, zero-crossing rate, energy variance) with Cosine Similarity verification and adjustable sensitivity thresholds (*relaxed*, *balanced*, *strict*).
- **Command & Media Execution**: Native Android Intent execution for YouTube searches, Spotify streaming, WhatsApp messaging, and web browsing.
- **Persistent DataStore**: Secure local persistence for conversation history, user authentication profiles, and biometric embeddings via `androidx.datastore.preferences`.
- **Liquid Glass Aesthetic**: Dark luxury palette (`#020611`) with animated orbital rings, glowing acoustic visualizers, and iOS-style floating liquid glass docks.
- **Developer Attribution**: Firmly anchored developer identity — *"My developer is Roof, from Kashmir."*

---

## Project Structure

```
├── app/
│   ├── src/main/
│   │   ├── java/com/aura/voiceassistant/
│   │   │   ├── AuraApplication.kt
│   │   │   ├── MainActivity.kt
│   │   │   ├── config/
│   │   │   │   └── AppConfig.kt
│   │   │   ├── data/
│   │   │   │   ├── datastore/AppDataStore.kt
│   │   │   │   └── model/
│   │   │   │       ├── ChatMessage.kt
│   │   │   │       ├── EmotionType.kt
│   │   │   │       ├── UserAccount.kt
│   │   │   │       └── VoiceProfile.kt
│   │   │   ├── service/
│   │   │   │   ├── AudioPlayer.kt
│   │   │   │   ├── AudioRecorder.kt
│   │   │   │   ├── CommandService.kt
│   │   │   │   ├── GeminiService.kt
│   │   │   │   ├── SpeechRecognitionService.kt
│   │   │   │   ├── VoiceAuthService.kt
│   │   │   │   └── VoiceEmotionCore.kt
│   │   │   └── ui/
│   │   │       ├── components/
│   │   │       │   ├── AccountModal.kt
│   │   │       │   ├── ChatDrawer.kt
│   │   │       │   ├── ControlDock.kt
│   │   │       │   ├── Header.kt
│   │   │       │   ├── LoginScreen.kt
│   │   │       │   ├── PermissionModal.kt
│   │   │       │   ├── Visualizer.kt
│   │   │       │   └── VoiceLockModal.kt
│   │   │       ├── screens/
│   │   │       │   └── AuraMainScreen.kt
│   │   │       └── theme/
│   │   │           ├── Color.kt
│   │   │           ├── Theme.kt
│   │   │           └── Type.kt
│   │   ├── res/
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── gradle/
│   ├── libs.versions.toml
│   └── wrapper/
├── .github/workflows/
│   └── build-apk.yml
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

---

## Building the Android APK

### Prerequisites
- Android Studio Ladybug / Koala or newer
- JDK 17
- Android SDK 35 (`compileSdk = 35`, `minSdk = 26`)

### Local Build Commands

1. **Assemble Debug APK**:
   ```bash
   ./gradlew assembleDebug
   ```
   The generated APK will be located at:
   `app/build/outputs/apk/debug/app-debug.apk`

2. **Assemble Release APK / AAB**:
   ```bash
   ./gradlew assembleRelease
   # or for App Bundle:
   ./gradlew bundleRelease
   ```
   The output is located at:
   `app/build/outputs/apk/release/app-release.apk`

---

## Continuous Integration (GitHub Actions)

This project contains an automated build workflow in `.github/workflows/build-apk.yml`.

When you push code or trigger `workflow_dispatch`:
1. Sets up JDK 17 and Gradle build environment.
2. Compiles and packages the debug APK.
3. Automatically uploads the resulting APK as a downloadable artifact.

### Secrets Configuration (Optional for Release Signing)
In your repository's **Settings > Secrets and variables > Actions**, you can configure:
- `GEMINI_API_KEY`: API key for Gemini models.
- `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`: Release keystore credentials for signed APKs.

---

## License & Credits

Developed by **Roof, from Kashmir**.
All rights reserved.
