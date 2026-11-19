# CLAUDE.md — Lexia

> Plan maestro para Claude Code. Lee este archivo completo antes de escribir una sola línea de código.

---

## 0. Cómo usar este plan en Claude Code

```bash
# 1. Instala Claude Code (requiere Node.js 18+ y suscripción Claude Pro o Max)
npm install -g @anthropic-ai/claude-code

# 2. Autentícate con tu cuenta de Claude
claude auth login

# 3. Crea la carpeta raíz y entra
mkdir lexia && cd lexia

# 4. Coloca este archivo como CLAUDE.md en la raíz del proyecto

# 5. Abre Claude Code en modo plan para validar antes de ejecutar
claude --permission-mode plan

# 6. Dentro del REPL, arranca la primera fase:
# > "Lee el CLAUDE.md completo y ejecuta la Fase 1: Setup del proyecto"

# Comandos útiles dentro del REPL:
# /cost        → ver gasto de tokens acumulado
# /compact     → comprimir contexto cuando supere ~150K tokens
# /clear       → limpiar conversación al cambiar de tarea
# Alt+T        → activar extended thinking para problemas complejos
# Escape       → cancelar respuesta en curso (NO uses Ctrl+C, eso cierra la sesión)
# @./ruta      → referenciar un archivo específico en tu prompt
```

---

## 1. Descripción del proyecto

**Nombre:** Lexia
**Bundle ID:** `com.fcodlx.lexia`
**Tipo:** Aplicación móvil React Native (Expo Managed Workflow)
**Plataformas objetivo:** iOS, Android, Huawei (sin Google Mobile Services)
**Descripción:** Juego tipo Wordle diario con soporte ES/EN, registro progresivo de usuarios, modo IA donde Meta Muse Spark genera palabras por dificultad y tema, y monetización mediante pago único + anuncios rewarded.

### Funcionalidades principales

1. Tablero Wordle clásico: 5 letras, 6 intentos, colores verde/amarillo/gris con animaciones
2. Soporte bilingüe ES/EN con teclados específicos por idioma (Ñ en español)
3. Registro progresivo: sugerencia suave en partida 5, obligatorio en partida 10
4. Auth con Supabase: Apple Sign-In, Google Sign-In, Email + contraseña
5. Perfil completo: username, avatar, idioma preferido, racha, estadísticas en nube
6. Modo IA: Muse Spark (Meta Model API) genera palabras por dificultad (fácil/medio/difícil) y tema (7 temas)
7. Monetización: pago único $2.99 desbloquea segundo idioma y modo IA; anuncios rewarded dan pistas
8. Notificaciones push diarias a las 9am con texto bilingüe
9. Compartir resultado como emojis estilo Wordle (🟩🟨⬛)

---

## 2. Stack tecnológico

| Capa           | Tecnología                                    | Notas                            |
| -------------- | --------------------------------------------- | -------------------------------- |
| Framework      | Expo SDK 52+ (Managed Workflow)               | No eject                         |
| Lenguaje       | TypeScript 5+                                 | strict: true                     |
| Navegación     | Expo Router v3                                | File-based routing               |
| **Estilos**    | **NativeWind v4**                             | **Tailwind CSS en React Native** |
| Estado global  | Zustand v4 + persist middleware               | AsyncStorage backend             |
| Animaciones    | React Native Reanimated v3                    | useNativeDriver: true            |
| Haptics        | expo-haptics                                  | Feedback táctil                  |
| Auth + DB      | Supabase JS v2                                | Auth + Postgres + Edge Functions |
| Storage local  | @react-native-async-storage/async-storage v2  | Sesión + progreso local          |
| IA palabras    | Meta Muse Spark (`muse-spark-1.3`)            | Via Supabase Edge Function       |
| Monetización   | RevenueCat v8                                 | iOS + Android + restore          |
| Anuncios       | react-native-google-mobile-ads v13            | Solo rewarded                    |
| Notificaciones | expo-notifications                            | Push diario                      |
| Compartir      | expo-sharing                                  | Resultado como texto de emojis   |
| Apple Auth     | expo-apple-authentication                     | iOS 13+                          |
| Google Auth    | @react-native-google-signin/google-signin v12 | No disponible sin GMS            |
| Linting        | ESLint + Prettier                             | Pre-configurado                  |
| Testing        | Jest + React Native Testing Library           | Unitarios                        |

### Por qué NativeWind v4 sobre Gluestack y Tamagui

NativeWind compila las clases Tailwind en build time — sin overhead de runtime. Sintaxis idéntica a web (`className="bg-green-700 px-4 rounded-lg"`), ecosistema activo (NativewindUI, React Native Reusables construidos sobre él), y para un juego con UI totalmente custom como Lexia, un sistema de utilidades supera a componentes prediseñados. Gluestack v3 está construido sobre NativeWind de todas formas, por lo que usarlo directamente es más limpio. V5 con Tailwind CSS v4 ya en pre-release garantiza adopción futura.

---

## 3. Cuentas y servicios — todos los enlaces

> ⚠️ **Crear estas cuentas ANTES de codificar.** Necesitas los IDs reales para `app.json` y las variables de entorno. Sin el App ID de AdMob la app crashea al iniciar en producción.

---

### 🔵 Supabase — Base de datos, Auth y Edge Functions

**Registro:** https://supabase.com/dashboard/sign-up
**Dashboard:** https://supabase.com/dashboard
**Documentación Auth Apple:** https://supabase.com/docs/guides/auth/social-login/auth-apple
**Documentación Auth Google:** https://supabase.com/docs/guides/auth/social-login/auth-google
**Documentación Edge Functions:** https://supabase.com/docs/guides/functions
**Plan:** Free tier para desarrollo; Pro ($25/mes) para producción
**Pasos tras registrarte:**

1. New Project → elegir región (us-east-1 para Latinoamérica) → guardar contraseña de BD
2. Settings → API → copiar `Project URL` y `anon public key`
3. Authentication → Providers → activar Email, Apple, Google
4. Authentication → URL Configuration → añadir `lexia://auth/callback` en Redirect URLs
5. Edge Functions → Secrets → añadir `MODEL_API_KEY` (Meta Model API)
6. SQL Editor → ejecutar `supabase/migrations/001_initial_schema.sql`

---

### 🔴 Meta Model API (Muse) — palabras IA

> Desde nov 2026 el Modo IA usa **Muse Spark** en lugar de Claude Haiku (mismo proveedor que
> voicify-note, imagify-studio, lensify-vision y fieldvision).

**Consola:** https://dev.meta.ai
**Endpoint:** `POST https://api.meta.ai/v1/chat/completions` (compatible con OpenAI, `response_format: json_schema` estricto)
**Plan:** Pay-as-you-go. `muse-spark-1.3`: 1.25 USD/1M tokens entrada · 4.25 USD/1M salida (≈ 0.002–0.007 USD por llamada de 5 palabras, incluye tokens de razonamiento). `muse-ember-1.0` ≈ 12× más barato.
**Pasos:**

1. https://dev.meta.ai → Billing activo → API keys → Create API key (`lexia`) → copiar (empieza por `LLM_`, solo se muestra una vez)
2. Guardarla como secret `MODEL_API_KEY` en Supabase Edge Functions (NUNCA en el cliente)
3. Probarla: `read -s MODEL_API_KEY && export MODEL_API_KEY && ./scripts/muse-smoke-test.sh es`

---

### 🟠 RevenueCat — Monetización in-app

**Registro:** https://app.revenuecat.com/signup
**Documentación React Native:** https://www.revenuecat.com/docs/getting-started/installation/reactnative
**Documentación Entitlements:** https://www.revenuecat.com/docs/getting-started/entitlements
**Plan:** Free hasta $2,500 MRR mensual; luego 1% del revenue
**Pasos:**

1. New Project → nombre "Lexia"
2. Add App → iOS → Bundle ID `com.fcodlx.lexia` → copiar `SDK API Key` iOS
3. Add App → Android → Package `com.fcodlx.lexia` → copiar `SDK API Key` Android
4. Entitlements → New Entitlement → ID exacto: `premium`
5. Productos (añadir DESPUÉS de crearlos en App Store Connect y Google Play):
   - `com.fcodlx.lexia.premium_lifetime` ($2.99 one-time)
   - `com.fcodlx.lexia.premium_monthly` ($0.99/mes)
6. Offerings → Default Offering → asociar ambos packages al entitlement `premium`

---

### 🟡 Google AdMob — Anuncios rewarded

**Registro:** https://admob.google.com/home
**Documentación React Native:** https://developers.google.com/admob/react-native/quick-start
**Test Ad Unit IDs (desarrollo):** https://developers.google.com/admob/android/test-ads
**Plan:** Gratuito. Ingresos por CPM (~$5–20 para rewarded en Latinoamérica)
**Prerequisito:** Cuenta de Google (si no tienes cuenta de Ads te pedirá crearla en el flujo)
**Pasos:**

1. Add App → iOS → nombre "Lexia" → guardar `iOS App ID` (formato `ca-app-pub-XXXX~XXXX`)
2. Add App → Android → nombre "Lexia" → guardar `Android App ID`
3. En app iOS: Ad Units → Add Ad Unit → Rewarded → nombre "Lexia Hints" → guardar Ad Unit ID
4. En app Android: igual → guardar Ad Unit ID
5. ⚠️ Los App IDs van en `app.json` antes del primer build — sin ellos la app crashea
6. Durante desarrollo usar Test IDs:
   - iOS App ID: `ca-app-pub-3940256099942544~1458002511`
   - Android App ID: `ca-app-pub-3940256099942544~3347511713`
   - Rewarded Ad Unit (ambas plataformas): `TestIds.REWARDED` del SDK

---

### 🍎 Apple Developer Program — iOS, App Store y Apple Sign-In

**Registro:** https://developer.apple.com/programs/enroll
**App Store Connect:** https://appstoreconnect.apple.com
**Documentación Sign In with Apple:** https://developer.apple.com/sign-in-with-apple/get-started
**Costo:** $99 USD/año (obligatorio para publicar y usar Apple Sign-In)
**Pasos en developer.apple.com:**

1. Certificates, IDs & Profiles → Identifiers → Register App ID
   - Bundle ID: `com.fcodlx.lexia`
   - Capabilities: ✅ Sign In with Apple, ✅ Push Notifications
2. Identifiers → Register Services ID (para OAuth web callback de Supabase)
   - Identifier: `com.fcodlx.lexia.siwa`
   - ✅ Sign In with Apple → Configure → Primary App ID: `com.fcodlx.lexia`
   - Return URLs: `https://TUPROYECTO.supabase.co/auth/v1/callback`
3. Keys → Create Key → nombre "Lexia Auth"
   - ✅ Sign In with Apple → Configure → Primary App ID: `com.fcodlx.lexia`
   - Descargar `.p8` (¡solo se puede descargar UNA vez!) → guardar Key ID y Team ID
4. Keys → Create Key → nombre "Lexia Push"
   - ✅ Apple Push Notifications service (APNs)
   - Descargar `.p8` → configurar en Xcode (Signing & Capabilities → Push Notifications) y subir a Firebase Cloud Messaging si se usa FCM como relay
     **Pasos en App Store Connect:**
5. My Apps → + → New App → Bundle ID: `com.fcodlx.lexia`, Name: Lexia, Language: ES/EN
6. In-App Purchases → + → Non-Consumable:
   - Reference Name: "Lexia Premium", Product ID: `com.fcodlx.lexia.premium_lifetime`, Price: $2.99
7. In-App Purchases → + → Auto-Renewable Subscription:
   - Crear grupo: "Lexia Premium Group"
   - Product ID: `com.fcodlx.lexia.premium_monthly`, Duration: 1 Month, Price: $0.99
8. Agreements → Paid Applications → firmar con datos bancarios
9. Users and Access → Sandbox → + → añadir email de prueba para testear compras

---

### 🟢 Google Cloud Console — Google Sign-In

**Consola:** https://console.cloud.google.com
**Documentación Android:** https://developers.google.com/identity/sign-in/android/start-integrating
**Documentación iOS:** https://developers.google.com/identity/sign-in/ios/start-integrating
**Plan:** Gratuito para Sign-In
**Pasos:**

1. New Project → nombre "Lexia"
2. APIs & Services → Library → buscar "Identity Platform" → Enable
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID:
   - **Web application** (para Supabase backend):
     - Authorized redirect URIs: `https://TUPROYECTO.supabase.co/auth/v1/callback`
     - Guardar Client ID y Client Secret → configurar en Supabase Auth → Google
   - **iOS**:
     - Bundle ID: `com.fcodlx.lexia`
     - Guardar iOS Client ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - **Android**:
     - Package name: `com.fcodlx.lexia`
     - SHA-1: obtener con `keytool -list -v -keystore ~/.android/debug.keystore` (debug) o el keystore de release
4. El Web Client ID también va en `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
5. ⚠️ En Huawei sin GMS: ocultar botón de Google. Verificar con `GoogleSignin.hasPlayServices().catch(() => false)`

---

### 🟣 Expo (cuenta para push notifications solamente)

**Registro:** https://expo.dev/signup
**Dashboard:** https://expo.dev
**Documentación Push Notifications:** https://docs.expo.dev/push-notifications/overview
**Plan:** Free tier es suficiente — solo se usa para el servicio de push notifications (Expo Push Service), no para builds.
**Pasos:**

1. Crear cuenta → crear proyecto "lexia" (solo para obtener el push token endpoint)
2. **No instalar eas-cli ni generar eas.json** — los builds se hacen con Xcode y Android Studio

> Los builds de iOS se generan con **Xcode** y los de Android con **Android Studio** directamente desde las carpetas `ios/` y `android/` generadas por `npx expo prebuild`.

---

### 🔵 Google Play Console — Android Store

**Registro:** https://play.google.com/console/signup
**Documentación publicación:** https://support.google.com/googleplay/android-developer/answer/6112435
**Costo:** $25 USD pago único
**Pasos:**

1. Registrarse como desarrollador individual o empresa
2. Create App → nombre "Lexia" → App type: Game → Free: sí
3. Monetization → Products → In-app products:
   - Product ID: `com.fcodlx.lexia.premium_lifetime` → $2.99 → Active
4. Monetization → Subscriptions:
   - Product ID: `com.fcodlx.lexia.premium_monthly` → $0.99 → 1 mes → Active
5. AdMob: el flow de configuración de la app pedirá vincular con AdMob
6. Setup → Banking → añadir cuenta bancaria para recibir pagos

---

## 4. Variables de entorno

### `.env.example` (SÍ commitear — sin valores reales)

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJXXXX

# Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXX.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=XXXX.apps.googleusercontent.com

# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_XXXX
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_XXXX

# AdMob App IDs (también van en app.json)
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXX~XXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXX~XXXX

# AdMob Ad Unit IDs
EXPO_PUBLIC_ADMOB_REWARDED_IOS=ca-app-pub-XXXX/XXXX
EXPO_PUBLIC_ADMOB_REWARDED_ANDROID=ca-app-pub-XXXX/XXXX
```

### En Supabase → Edge Functions → Secrets (nunca en el cliente)

```
MODEL_API_KEY=LLM_XXXX          # Meta Model API (Muse)
MUSE_MODEL=muse-spark-1.3       # opcional
DAILY_AI_WORD_LIMIT=40          # opcional
```

---

## 5. Estructura de archivos

```
lexia/
├── CLAUDE.md
├── app.json
├── package.json
├── tsconfig.json                      ← strict: true, paths @/*
├── tailwind.config.js                 ← NativeWind + colores custom
├── global.css                         ← @tailwind base/components/utilities
├── babel.config.js                    ← con nativewind/babel
├── metro.config.js                    ← con withNativeWind()
├── .env.local                         ← NO commitear
├── .env.example                       ← SÍ commitear
├── .gitignore
├── .eslintrc.js
├── .prettierrc
│
├── app/
│   ├── _layout.tsx                    ← import '../global.css' + providers
│   ├── index.tsx                      ← redirect a /(tabs)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                  ← Juego diario
│   │   ├── ai.tsx                     ← Modo IA (solo premium)
│   │   ├── stats.tsx                  ← Estadísticas
│   │   └── profile.tsx                ← Perfil
│   ├── auth/
│   │   └── callback.tsx               ← Deep link OAuth
│   └── paywall.tsx
│
├── components/
│   ├── game/
│   │   ├── WordleGame.tsx
│   │   ├── GameBoard.tsx
│   │   ├── GameCell.tsx
│   │   ├── GameKeyboard.tsx
│   │   └── GameToast.tsx
│   ├── modals/
│   │   ├── AuthModal.tsx
│   │   ├── DifficultySelector.tsx
│   │   ├── StatsModal.tsx
│   │   └── ShareCard.tsx
│   ├── profile/
│   │   ├── ProfileHeader.tsx
│   │   ├── StatsGrid.tsx
│   │   └── GuessDistribution.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       └── CountdownTimer.tsx
│
├── hooks/
│   ├── useWordleGame.ts
│   ├── useAuth.ts
│   ├── useAIWord.ts
│   ├── usePremium.ts
│   ├── useRewardedAd.ts
│   └── useNotifications.ts
│
├── store/
│   ├── gameStore.ts
│   └── userStore.ts
│
├── lib/
│   ├── supabase.ts
│   ├── words-es.ts                    ← 200+ palabras de 5 letras
│   ├── words-en.ts
│   └── utils.ts
│
├── constants/
│   ├── colors.ts
│   ├── config.ts
│   └── copy.ts                        ← todos los strings ES/EN
│
├── types/
│   └── index.ts
│
└── supabase/
    ├── functions/
    │   └── generate-word/
    │       └── index.ts               ← Edge Function Deno
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 6. Configuración NativeWind v4 — archivos exactos

Claude Code debe crear estos 4 archivos exactamente así:

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        correct: "#538D4E",
        present: "#B59F3B",
        absent: "#3A3A3C",
        game: {
          bg: "#121213",
          surface: "#1A1A1B",
          border: "#3A3A3C",
          "border-active": "#565758",
        },
      },
    },
  },
  // Safelist para clases construidas dinámicamente:
  safelist: [
    "bg-correct",
    "bg-present",
    "bg-absent",
    "border-correct",
    "border-present",
    "border-absent",
  ],
  plugins: [],
};
```

### `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

### `app/_layout.tsx` — primera línea obligatoria

```tsx
import "../global.css";
// resto del layout...
```

### Ejemplo de componente con NativeWind

```tsx
// En lugar de StyleSheet.create(), usar className:
<View className="flex-1 bg-game-bg items-center justify-center px-4">
  <Text className="text-white text-2xl font-bold tracking-[0.2em]">LEXIA</Text>
  <TouchableOpacity
    className="bg-correct px-6 py-3 rounded-xl mt-4 active:opacity-70"
    onPress={handlePress}
  >
    <Text className="text-white font-bold text-base">Jugar</Text>
  </TouchableOpacity>
</View>

// Para estilos dinámicos (colores en runtime), combinar className + style:
<View
  className="rounded-lg border-2"
  style={{ backgroundColor: cell.bgColor, borderColor: cell.borderColor }}
/>
```

---

## 7. Fases de desarrollo para Claude Code

> **Regla:** Ejecutar una fase → verificar con `npx tsc --noEmit` y `npx expo start` → confirmar antes de la siguiente. Nunca saltarse pasos.

---

### FASE 1 — Inicialización y NativeWind

```
Ejecuta la Fase 1:

1. Inicializar: npx create-expo-app lexia --template blank-typescript && cd lexia

2. Instalar NativeWind y peer deps:
   npx expo install nativewind react-native-reanimated react-native-safe-area-context
   npm install --save-dev tailwindcss

3. Instalar resto:
   npx expo install expo-router expo-haptics expo-apple-authentication
   npx expo install expo-notifications expo-sharing expo-crypto
   npx expo install @react-native-async-storage/async-storage
   npm install @supabase/supabase-js zustand
   npm install react-native-purchases
   npm install react-native-google-mobile-ads
   npm install @react-native-google-signin/google-signin

4. Crear los 4 archivos NativeWind: tailwind.config.js, global.css,
   babel.config.js, metro.config.js (exactamente como en sección 6)

5. Crear app.json con:
   - name: "Lexia", slug: "lexia", scheme: "lexia"
   - bundleIdentifier: "com.fcodlx.lexia"
   - package: "com.fcodlx.lexia"
   - plugins: expo-router, expo-notifications, expo-apple-authentication,
     react-native-google-mobile-ads con googleMobileAdsAppId por plataforma
     (usar Test IDs en desarrollo: iOS ca-app-pub-3940256099942544~1458002511,
      Android ca-app-pub-3940256099942544~3347511713)
   - ios.usesAppleSignIn: true
   - ios.infoPlist: NSCameraUsageDescription y NSPhotoLibraryUsageDescription

6. Crear tsconfig.json: strict:true, paths:{"@/*":["./*"]}

7. Crear .eslintrc.js, .prettierrc (singleQuote:true, semi:false, tabWidth:2)

8. Crear .gitignore: .env.local, ios/, android/, .expo/, node_modules/

9. Crear .env.example con todas las variables (sin valores reales)

10. Verificar NativeWind: crear app/index.tsx con
    <View className="flex-1 bg-red-500 items-center justify-center">
      <Text className="text-white text-xl">Lexia</Text>
    </View>
    Ejecutar: npx expo start --clear
    El fondo debe ser rojo. Si no, revisar babel.config.js y metro.config.js.
```

---

### FASE 2 — Tipos, constantes y utilidades

```
Ejecuta la Fase 2:

1. Crear types/index.ts con todos los tipos del proyecto:
   Language, Difficulty, LetterStatus, GameStatus, LetterCell, GameState,
   UserProfile, PlayerStats, AIWordResult, DifficultyConfig, AuthState,
   RegistrationPromptReason, GameResult

2. Crear constants/colors.ts (paleta oscura Wordle):
   correct:#538D4E, present:#B59F3B, absent:#3A3A3C,
   background:#121213, surface:#1A1A1B, border:#3A3A3C,
   borderActive:#565758, text:#FFFFFF, textMuted:#818384,
   error:#C84B31, premium:#B59F3B

3. Crear constants/config.ts:
   - WORD_LENGTH=5, MAX_ROWS=6
   - GAMES_BEFORE_SUGGESTION=5, GAMES_BEFORE_REQUIRED=10
   - KEYBOARDS completos (ES con Ñ, EN estándar, ambos con ENTER y ⌫)
   - DIFFICULTY_CONFIGS: array de 3 items con key, label{es,en},
     description{es,en}, emoji, color, maxHints, timeLimit
   - THEMES: {es:[7 temas], en:[7 temas]} con key, label, emoji
   - ASYNC_STORAGE_KEYS: objeto con todas las keys del proyecto

4. Crear constants/copy.ts:
   COPY = { es: {...}, en: {...} } con TODOS los strings visibles en UI

5. Crear lib/utils.ts con funciones puras:
   - getDailyWord(lang): deterministico por fecha
   - createEmptyBoard(): LetterCell[6][5]
   - evaluateGuess(guess, target): doble pasada para letras repetidas
   - formatTime(seconds): "MM:SS"
   - getTodayString(), getYesterdayString(): "YYYY-MM-DD"
   - sanitizeWord(word): toUpperCase + quitar acentos

6. Crear lib/words-es.ts: 200+ palabras de exactamente 5 letras (sin acentos)
7. Crear lib/words-en.ts: 200+ palabras de exactamente 5 letras

8. Verificar: npx tsc --noEmit → 0 errores
```

---

### FASE 3 — Supabase: schema y Edge Function

```
Ejecuta la Fase 3:

1. Crear supabase/migrations/001_initial_schema.sql:
   TABLAS: profiles, player_stats, game_history, daily_words, ai_words_cache
   (schema detallado en archivos ya generados del proyecto)

   TRIGGERS:
   - handle_new_user(): after INSERT on auth.users → crea profile + player_stats
   - update_stats_after_game(): after INSERT on game_history → actualiza stats y racha
     Lógica racha: last_played=ayer→streak+1; last_played=hoy→sin cambio; otro→reset a 1

   RLS en todas las tablas:
   - profiles/player_stats/game_history: solo el dueño (auth.uid() = id/user_id)
   - daily_words/ai_words_cache: SELECT público

2. Crear lib/supabase.ts: cliente singleton con AsyncStorage,
   autoRefreshToken:true, persistSession:true, detectSessionInUrl:false

3. Crear supabase/functions/generate-word/index.ts (Deno, NO Node.js):
   - CORS headers en todas las respuestas
   - Verificar JWT en Authorization header → 401 si no hay
   - Body: { language, difficulty, theme?, excludeWords? }
   - Consultar caché primero (60% probabilidad si hay ≥3 items disponibles)
   - Si llama Muse: model=muse-spark-1.3 (MUSE_MODEL), reasoning_effort=low, json_schema estricto, 5 candidatas por llamada
     Prompts por dificultad+idioma; tema opcional; excludeWords hasta 20
     Respuesta JSON: { word, definition, hint }
   - Validar word: exactamente 5 chars A-Z
   - Guardar en caché con UPSERT
   - Fallback hardcodeado si Claude falla

4. Verificar: npx tsc --noEmit → 0 errores
```

---

### FASE 4 — Stores y hooks de infraestructura

```
Ejecuta la Fase 4:

1. store/userStore.ts: Zustand persist → profile, stats, isPremium
2. store/gameStore.ts: Zustand persist → localGamesCount, lastPromptShown

3. hooks/useAuth.ts:
   - onAuthStateChange listener + loadUserData()
   - signUpWithEmail, signInWithEmail
   - signInWithApple (expo-apple-authentication + nonce + supabase signInWithIdToken)
   - signInWithGoogle (GoogleSignin + hasPlayServices check + supabase signInWithIdToken)
   - updateProfile, saveGame, signOut, dismissRegistrationPrompt
   - Computed: registrationPrompt, winRate

4. hooks/usePremium.ts: RevenueCat init, checkStatus, loadOfferings, purchase, restore

5. hooks/useRewardedAd.ts: AdMob rewarded load/show/reload, Promise-based

6. hooks/useNotifications.ts: requestPermissions, scheduleDailyReminder bilingüe

7. hooks/useAIWord.ts: generateWord con historial en AsyncStorage, getDifficultyConfig

8. Verificar: npx tsc --noEmit → 0 errores
```

---

### FASE 5 — Hook del juego

```
Ejecuta la Fase 5:

Crear hooks/useWordleGame.ts con:
- Estado: board, currentRow, currentCol, gameStatus, targetWord, language, hints, usedLetters
- Animación: shakeRow, flipRow, message
- handleKey(key): '⌫' borra, 'ENTER' evalúa (doble pasada evaluateGuess),
  letra válida agrega. Prioridad usedLetters: correct > present > absent (sin downgrade)
- useHint(): revela primera letra incorrecta en fila actual
- addHint(): incrementa hints
- resetGame(word, language, initialHints): resetea todo

Verificar: npx tsc --noEmit → 0 errores
```

---

### FASE 6 — Componentes del juego (NativeWind)

```
Ejecuta la Fase 6:
REGLA: className para todos los estilos estáticos. style={{ }} solo para
valores calculados en runtime (colores dinámicos por estado de celda).

1. GameCell.tsx: Animated.View con shake/flip/scale. Colores via style={{ }}.
2. GameBoard.tsx: calcula cellSize con useWindowDimensions. className="gap-1.5".
3. GameKeyboard.tsx: KEYBOARDS[language], teclas anchas para ENTER/⌫,
   colores de fondo según usedLetters via style={{ }}.
4. GameToast.tsx: Animated fadeIn/fadeOut, posición absoluta.
5. WordleGame.tsx: integra todo, header con selector ES/EN + título LEXIA + hints,
   barra inferior con racha y CountdownTimer.
6. CountdownTimer.tsx: setInterval, formato HH:MM:SS.

Verificar: npx expo start → juego completo funcional en simulador
```

---

### FASE 7 — Modales y componentes de perfil

```
Ejecuta la Fase 7:

1. AuthModal.tsx: bottom sheet, reason 'suggestion' (con ✕) vs 'required' (sin ✕),
   Apple (solo iOS) y Google (oculto en Huawei), inputs email/password/username,
   toggle signup/signin. Textos de constants/copy.ts.

2. DifficultySelector.tsx: 3 cards de dificultad + chips de tema wrap,
   botón con color de dificultad seleccionada.

3. StatsModal.tsx: resultado, palabra, definición IA, grid stats,
   GuessDistribution, countdown, botones compartir y cerrar.

4. GuessDistribution.tsx: barras horizontales 1-6, proporcionales al máximo,
   barra del intento ganador en bg-correct.

5. ShareCard.tsx: función async que genera texto de emojis (🟩🟨⬛) y usa expo-sharing.

6. ProfileHeader.tsx: avatar (imagen o iniciales), username, badge racha, badge PRO.

7. StatsGrid.tsx: grid 2x2, animación de conteo 0→valor en 800ms.

8. Button.tsx, Input.tsx, Avatar.tsx, Badge.tsx: componentes UI base con NativeWind.

Verificar: npx tsc --noEmit → 0 errores
```

---

### FASE 8 — Pantallas (Expo Router)

```
Ejecuta la Fase 8:

1. app/_layout.tsx: import '../global.css' PRIMERO, Stack, providers,
   RevenueCat init, onAuthStateChange, SafeAreaProvider, StatusBar.

2. app/(tabs)/_layout.tsx: 4 tabs (🎮🤖📊👤), tab IA con badge PRO si !isPremium,
   tabBarActiveTintColor: '#538D4E'.

3. app/(tabs)/index.tsx: juego diario, AuthModal, StatsModal al terminar,
   manejo de anuncio rewarded, check "ya jugué hoy" con AsyncStorage.

4. app/(tabs)/ai.tsx: guard !isAuthenticated → AuthModal required,
   guard !isPremium → paywall inline, DifficultySelector → generateWord → WordleGame.

5. app/(tabs)/stats.tsx: si !autenticado → stats locales + CTA; si autenticado →
   ProfileHeader + StatsGrid + GuessDistribution + historial últimas 10 partidas.

6. app/(tabs)/profile.tsx: si !autenticado → login CTA; si autenticado →
   avatar editable, username editable, selector idioma, toggle notificaciones,
   gestión premium, restaurar, cerrar sesión, eliminar cuenta.

7. app/paywall.tsx: 4 beneficios, 2 opciones de compra, restaurar, loading state.

8. app/auth/callback.tsx: exchangeCodeForSession + redirect a /(tabs).

Verificar: navegar todas las tabs sin errores de runtime
```

---

### FASE 9 — Prebuild y configuración de builds nativos

```
Ejecuta la Fase 9:

Los builds se generan directamente con Xcode (iOS) y Android Studio (Android).
No se usa EAS Build. El primer paso es generar las carpetas nativas con prebuild.

1. Generar carpetas nativas:
   npx expo prebuild --clean
   Esto lee app.json y genera ios/ y android/ con toda la configuración aplicada.
   ⚠️ Si se vuelve a cambiar app.json (plugins, permisos, bundle ID), repetir:
      npx expo prebuild --clean

2. iOS — abrir y configurar en Xcode:
   a. open ios/Lexia.xcworkspace
      (siempre .xcworkspace, nunca .xcodeproj)
   b. Target "Lexia" → Signing & Capabilities:
      - Team: tu Apple Developer Team
      - Bundle Identifier: com.fcodlx.lexia
      - Signing Certificate: Automatic (desarrollo) o Distribution (release)
      - Verificar ✅ Sign In with Apple
      - Verificar ✅ Push Notifications
        Si no aparece: + Capability → Push Notifications
   c. Build de desarrollo: Product → Run (en Simulator o device físico)
   d. Build de release (App Store):
      - Seleccionar "Any iOS Device (arm64)" como destino
      - Product → Archive → Distribute App → App Store Connect → Upload

3. iOS — Push Notifications (APNs):
   a. En Apple Developer → Keys → crear key con ✅ APNs → descargar .p8
   b. En Expo Dashboard → proyecto "lexia" → Credentials → iOS → APNs Key:
      - Subir el .p8, ingresar Key ID y Team ID
      (Expo Push Service usa esto para enviar las notificaciones aunque el build sea local)
   c. Con Automatic Signing en Xcode, el certificado de push se aprovisiona solo
      al hacer Archive si el App ID tiene Push Notifications habilitado

4. Android — abrir y configurar en Android Studio:
   a. File → Open → seleccionar la carpeta android/
   b. Sync Gradle al abrir (aceptar actualizaciones si las sugiere)
   c. En app/build.gradle verificar:
      applicationId "com.fcodlx.lexia"
      minSdkVersion 21
      targetSdkVersion 34
   d. Para Google Sign-In: descargar google-services.json desde
      Google Cloud Console → tu proyecto Android → Download config file
      Colocar en: android/app/google-services.json
   e. Build de desarrollo: Run → Run 'app' (en emulador o device físico)
   f. Build de release (Google Play):
      Build → Generate Signed Bundle/APK → Android App Bundle (.aab)
      Subir el .aab a Google Play Console → Internal Testing

5. Android — keystore de release (generar UNA sola vez, guardar fuera del repo):
   keytool -genkey -v \
     -keystore ~/lexia-release.keystore \
     -alias lexia \
     -keyalg RSA -keysize 2048 -validity 10000
   Registrar en android/app/build.gradle bajo signingConfigs.release:
   storeFile file(System.getenv("KEYSTORE_PATH") ?: "../../lexia-release.keystore")
   storePassword System.getenv("KEYSTORE_PASSWORD")
   keyAlias "lexia"
   keyPassword System.getenv("KEY_PASSWORD")
   ⚠️ Nunca commitear el .keystore ni las contraseñas en el repo

6. Firebase (para push notifications en Android):
   a. https://console.firebase.google.com → New Project → "Lexia"
   b. Add App → Android → Package: com.fcodlx.lexia → descargar google-services.json
   c. Project Settings → Cloud Messaging → subir la APNs .p8 key
      (para que iOS y Android compartan el mismo canal de push)
   d. En Expo Dashboard → proyecto "lexia" → Credentials → Android →
      FCM Server Key: pegar la key de Firebase → Cloud Messaging → Server Key

7. Verificar push end-to-end en devices físicos:
   - iOS: instalar build de desarrollo en iPhone → copiar Expo push token →
     probar desde https://expo.dev/notifications
   - Android: igual con un dispositivo Android real
```

---

### FASE 10 — Tests y pulido final

```
Ejecuta la Fase 10:

1. Instalar:
   npm install --save-dev jest @testing-library/react-native jest-expo @types/jest

2. Crear jest.config.js con preset 'jest-expo'

3. Crear jest.setup.ts con mocks para AsyncStorage, expo-haptics,
   expo-notifications, react-native-purchases

4. __tests__/utils.test.ts:
   - evaluateGuess('CRANE', 'CRANE') → todos 'correct'
   - evaluateGuess('SPEED', 'SPELL') → S:correct, P:correct, E:present, E:absent, D:absent
   - evaluateGuess('HELLO', 'WORLD') → H:absent, E:absent, L:present, L:correct, O:present
   - getDailyWord('es') y getDailyWord('en') → strings de exactamente 5 chars
   - createEmptyBoard() → 6 filas × 5 celdas con status 'empty'

5. __tests__/useWordleGame.test.ts con renderHook:
   - Estado inicial correcto
   - handleKey letra → currentCol++
   - handleKey '⌫' → currentCol--
   - handleKey 'ENTER' incompleto → no avanza fila
   - handleKey 'ENTER' completo → avanza fila + evalúa

6. npx jest --watchAll=false → 0 failures

7. Checklist completo:
   [ ] npx tsc --noEmit → 0 errores
   [ ] npx jest → 0 failures
   [ ] npx eslint . --ext .ts,.tsx → 0 errores críticos
   [ ] NativeWind className funciona en todos los componentes
   [ ] App inicia en iOS Simulator sin crashes (desde Xcode)
   [ ] App inicia en Android Emulator sin crashes (desde Android Studio)
   [ ] ios/Lexia.xcworkspace abre y compila sin warnings de signing
   [ ] android/ sincroniza Gradle sin errores
   [ ] google-services.json en android/app/
   [ ] Partida 5 → AuthModal sugerencia (se puede cerrar)
   [ ] Partida 5 → AuthModal sugerencia (se puede cerrar)
   [ ] Partida 10 → AuthModal obligatorio (sin botón cerrar)
   [ ] Auth email end-to-end funciona
   [ ] Stats sincronizan con Supabase
   [ ] Modo IA genera palabra (o fallback si no hay API key)
   [ ] Paywall aparece al intentar EN sin premium
   [ ] Anuncio rewarded da pista extra
   [ ] Notificación push se programa
   [ ] Compartir genera emojis correctos
   [ ] .env.local NO está en git
   [ ] README.md completo
```

---

## 8. Convenciones de código

- **Estilos:** siempre `className` de NativeWind para valores estáticos. `style={{ }}` solo para colores/medidas calculadas en runtime. Nunca `StyleSheet.create()`.
- **Exports:** named exports en todo excepto pantallas de Expo Router (que requieren default export).
- **Tipos:** siempre explícitos, nunca `any`. Todos en `types/index.ts`.
- **Textos UI:** siempre de `constants/copy.ts` con `COPY[language].seccion.clave`. Nunca strings hardcodeados en JSX.
- **AsyncStorage keys:** siempre de `constants/config.ts` → `ASYNC_STORAGE_KEYS`. Nunca strings mágicos inline.
- **Errores:** siempre `try/catch`. Nunca promesas sin `.catch()`.
- **Platform.OS:** verificar para Apple Sign-In (solo iOS) y Google (no Huawei sin GMS).
- **NativeWind clases dinámicas:** si construyes className con template literals, añadir las clases al `safelist` en `tailwind.config.js`.

---

## 9. Advertencias conocidas

- **NativeWind caché:** si los estilos no se actualizan tras un cambio en `tailwind.config.js`, ejecutar `npx expo start --clear`.
- **Prebuild y cambios en app.json:** cada vez que cambies plugins, permisos o bundle ID en `app.json`, debes volver a correr `npx expo prebuild --clean` y reabrir el proyecto en Xcode / Android Studio. Los cambios en `app.json` no se reflejan en `ios/` o `android/` automáticamente.
- **ios/ y android/ en git:** si el equipo completo usa `npx expo prebuild` como fuente de verdad, es válido no commitear estas carpetas (añadirlas al `.gitignore`). Si se commitean, todos deben correr `npx expo prebuild --clean` al hacer pull de cambios en `app.json`.
- **AdMob App ID:** debe estar en `app.json` antes del primer build de producción — sin él la app crashea al iniciar. Usar Test IDs en desarrollo.
- **Apple Sign-In:** solo iOS 13+. No renderizar el botón en Android bajo ningún concepto.
- **Google Sign-In en Huawei:** `hasPlayServices()` lanza excepción. Siempre envolver en try/catch y ocultar el botón si falla.
- **Supabase Edge Functions:** runtime Deno, no Node.js. Usar `import` ESM con URLs completas. No usar `require()`.
- **RevenueCat sandbox:** las compras en iOS Simulator son poco fiables. Usar dispositivo físico con cuenta sandbox de App Store Connect.
- **NativeWind + Animated.View:** se puede combinar `className` con `Animated.Value` en `style`. Si hay conflicto de tipos, usar `style` para la parte animada y `className` para el resto.

---

## 10. Resumen de enlaces — todos los registros

| #   | Servicio                      | URL de registro / acceso                    | Costo                            |
| --- | ----------------------------- | ------------------------------------------- | -------------------------------- |
| 1   | **Supabase**                  | https://supabase.com/dashboard/sign-up      | Free / $25 mes                   |
| 2   | **Meta Model API (Muse)**     | https://dev.meta.ai                         | Pay-as-you-go (~$0.005/llamada)  |
| 3   | **RevenueCat**                | https://app.revenuecat.com/signup           | Free hasta $2.5k MRR             |
| 4   | **Google AdMob**              | https://admob.google.com/home               | Gratis (ingresos por CPM)        |
| 5   | **Apple Developer**           | https://developer.apple.com/programs/enroll | $99 USD/año                      |
| 6   | **App Store Connect**         | https://appstoreconnect.apple.com           | Incluido en Apple Developer      |
| 7   | **Google Cloud Console**      | https://console.cloud.google.com            | Gratis (Sign-In)                 |
| 8   | **Google Play Console**       | https://play.google.com/console/signup      | $25 USD único                    |
| 9   | **Expo** (push notifications) | https://expo.dev/signup                     | Gratis                           |
