# Lexia

Juego tipo Wordle diario para iOS, Android y Huawei (sin GMS), bilingüe ES/EN, con **Modo IA impulsado por Meta Muse Spark** y monetización por compra única + anuncios rewarded.

**Bundle ID:** `com.fcodlx.lexia`

## Funcionalidades

- 🎮 Tablero Wordle clásico: 5 letras, 6 intentos, shake/flip y haptics
- 📖 Validación con diccionario completo (~10.8k palabras ES, ~12.6k EN); las respuestas diarias salen de listas curadas (~500 palabras comunes por idioma) que no se repiten hasta agotar la lista
- 🌎 Bilingüe ES/EN con teclados propios (Ñ en español). El idioma principal es gratis; el segundo es Premium
- 👤 Registro progresivo: sugerencia en la partida 5, obligatorio en la 10. Los invitados tienen estadísticas locales
- 🔐 Auth con Supabase: Apple Sign-In, Google Sign-In (oculto sin Play Services / Huawei) y email + contraseña
- 🤖 Modo IA: Muse Spark genera palabras por dificultad y tema, con definición y pista. Caché compartida + límite diario por usuario
- 💎 Premium ($2.99 pago único o $0.99/mes vía RevenueCat): segundo idioma + Modo IA
- 📺 Anuncio rewarded = pista extra
- 🔔 Recordatorio diario a las 9:00 (ES/EN)
- 📤 Compartir resultado en emojis (🟩🟨⬛)
- 🗑️ Eliminar cuenta desde la app (requisito de App Store)

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Expo SDK 54 (sin EAS Build: builds con Xcode / Android Studio) |
| Lenguaje | TypeScript strict |
| Navegación | Expo Router |
| Estilos | NativeWind v4 |
| Estado | Zustand + AsyncStorage persist |
| Animaciones | Reanimated v4 |
| Backend | Supabase (Auth + Postgres + Storage + Edge Functions) |
| IA | Meta Model API — `muse-spark-1.3` vía Edge Function `generate-word` |
| Pagos | RevenueCat (entitlement `premium`) |
| Anuncios | react-native-google-mobile-ads (solo rewarded) |
| Tests | Jest 29 + jest-expo + React Native Testing Library |

## Arquitectura de secretos

| Dónde | Qué |
| --- | --- |
| `.env.local` (app, gitignored) | Solo valores públicos `EXPO_PUBLIC_*`: URL + anon/publishable key de Supabase, IDs de Google OAuth, keys públicas de RevenueCat, IDs de AdMob |
| Secretos de Supabase (Edge Functions) | `MODEL_API_KEY` (Meta). `SUPABASE_SERVICE_ROLE_KEY` la inyecta Supabase |

La clave de Muse **nunca** viaja en la app. La función `generate-word` valida el JWT, aplica el límite diario (`DAILY_AI_WORD_LIMIT`) y llama a Muse.

---

## Puesta en marcha — paso a paso

### 1. Meta Model API (Muse)

1. https://dev.meta.ai → confirma que **Billing** está activo (pay-as-you-go).
2. **API keys → Create API key** → nombre `lexia` → copia la clave (`LLM_…`, solo se muestra una vez).
3. *(Recomendado)* límite de gasto mensual en Billing.
4. Prueba la clave:
   ```bash
   read -s MODEL_API_KEY && export MODEL_API_KEY   # pega la clave (no se ve) y Enter
   ./scripts/muse-smoke-test.sh es
   ```
   Debe listar los modelos (incluido `muse-spark-1.3`) e imprimir un JSON con 5 palabras.

Coste: `muse-spark-1.3` = 1.25 USD/1M tokens de entrada · 4.25 USD/1M de salida (≈ 0.002–0.007 USD por llamada, cada una trae 5 palabras que alimentan la caché). `MUSE_MODEL=muse-ember-1.0` es ≈ 12× más barato.

### 2. Supabase

> El plan Free permite 2 proyectos activos por organización.

1. https://supabase.com/dashboard → **New project** → nombre `lexia` → guarda la contraseña de la BD.
2. **Project Settings → API Keys** → copia **Project URL** y la **anon** (o *publishable*) key.
3. Desde la raíz del repo:
   ```bash
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF>     # pide la contraseña de la BD

   npx supabase db push                               # migraciones 001–003 (tablas, RLS, triggers, bucket avatars)
   npx supabase config push                           # auth: redirect lexia://auth/callback, email, Apple

   cp supabase/functions/.env.example supabase/functions/.env   # pon tu MODEL_API_KEY (gitignored)
   npx supabase secrets set --env-file supabase/functions/.env

   npx supabase functions deploy generate-word
   npx supabase functions deploy delete-account
   ```
4. Comprueba en el dashboard: **Database → Tables** (6 tablas con RLS), **Storage** (bucket `avatars`), **Edge Functions** (2 funciones), **Edge Functions → Secrets** (`MODEL_API_KEY`).

### 3. App

```bash
npm install
cp .env.example .env.local
# → EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY del paso 2
```

Se añadió un módulo nativo (`expo-image-picker`), así que hay que regenerar las carpetas nativas:

```bash
npx expo prebuild --clean
npx expo run:ios --device        # o abre ios/Lexia.xcworkspace en Xcode
npx expo run:android             # o abre android/ en Android Studio
```

Después de cambiar `.env.local`: `npx expo start --clear` (las variables se incrustan en el bundle).

### 4. RevenueCat (premium)

- Las keys `test_…` usan la **Test Store** de RevenueCat: puedes "comprar" en desarrollo sin App Store.
  En el dashboard crea el entitlement `premium` y un offering **default** con un paquete *Lifetime* y uno *Monthly* de la Test Store.
- Producción: productos `com.fcodlx.lexia.premium_lifetime` ($2.99) y `com.fcodlx.lexia.premium_monthly` ($0.99) en App Store Connect y Play Console, asociados al entitlement `premium` (ver `CLAUDE.md` §3), y reemplaza las keys por las `appl_…` / `goog_…`.

### 5. Google Sign-In (opcional)

El botón solo aparece si `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (y en iOS `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`) tienen valores reales y el dispositivo tiene Play Services.

1. Google Cloud Console → OAuth client IDs **Web**, **iOS** (`com.fcodlx.lexia`) y **Android** (paquete + SHA-1).
2. En `supabase/config.toml` → `[auth.external.google]`: `enabled = true`, `client_id = "IOS_ID,WEB_ID"`, `secret = "<web secret>"`, `skip_nonce_check = true` → `npx supabase config push`.
3. Pon los IDs en `.env.local` y reconstruye.

### 6. Antes de publicar

- AdMob: reemplaza los Test IDs de `app.json` y `.env.local` por los reales (si no, no hay ingresos; sin App ID la app crashea).
- Supabase → activa **confirmación de email** con SMTP propio (`enable_confirmations = true` en `config.toml`).
- Apple: capability *Sign In with Apple* + *Push Notifications* (ver `CLAUDE.md` Fase 9).
- QA en dispositivo físico: compra sandbox, anuncio rewarded, notificación, Modo IA.

---

## Desarrollo

```bash
npm start            # Metro / Expo Dev Server
npm test             # Jest (52 tests)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run dict         # regenera lib/dict-*.ts y valida las listas de respuestas
```

### Listas de palabras

- `lib/words-es.ts` / `lib/words-en.ts`: **respuestas** del juego diario (editar a mano).
- `lib/dict-es.ts` / `lib/dict-en.ts`: **diccionario** de intentos válidos, generado desde `an-array-of-spanish-words` / `an-array-of-english-words` (MIT). No editar: corre `npm run dict`, que además falla si alguna respuesta no está en el diccionario.

### Modo IA (`supabase/functions/generate-word`)

1. Valida el JWT y el cuerpo; aplica el límite diario por usuario (`ai_generation_log`).
2. 60 % de las veces, si hay ≥ 3 palabras en `ai_words_cache` (mismo idioma/dificultad/tema) que el usuario no ha visto, sirve una de caché.
3. Si no, pide 5 candidatas a Muse (`json_schema` estricto, `reasoning_effort=low`), devuelve una y guarda todas en caché.
4. Sin `MODEL_API_KEY` o si Muse falla, devuelve palabras de respaldo — la app nunca se queda sin partida.

Variables opcionales: `MUSE_MODEL`, `MUSE_REASONING_EFFORT`, `MUSE_BASE_URL`, `DAILY_AI_WORD_LIMIT` (ver `supabase/functions/.env.example`). Logs: Dashboard → Edge Functions → generate-word → Logs.

## Estructura

```
app/            Pantallas (Expo Router): (tabs)/ (diario, IA, stats, perfil), auth/callback, paywall
components/     game/ (tablero, teclado), modals/, profile/, ui/
hooks/          useWordleGame, useAuth (+ useAuthBootstrap), usePremium, useRewardedAd, useAIWord, useNotifications
store/          gameStore (idioma, stats locales, resultado diario), userStore (perfil, premium)
lib/            supabase, revenuecat, avatar, utils, listas de respuestas y diccionarios
constants/      colors, config (teclados, dificultades, temas), copy (strings ES/EN)
supabase/       migrations/ 001–003, functions/ generate-word + delete-account (Deno), config.toml
scripts/        build-dictionaries.mjs, muse-smoke-test.sh
__tests__/      utils, useWordleGame, gameStore
```

## Convenciones

- `className` de NativeWind; `style={{}}` solo para valores de runtime
- Strings de UI solo desde `constants/copy.ts` (`COPY[language]`)
- Keys de AsyncStorage desde `ASYNC_STORAGE_KEYS`
- Tipos en `types/index.ts`; nunca `any`
- Apple Sign-In solo en iOS; Google oculto sin GMS

Ver `CLAUDE.md` para el plan maestro completo.
