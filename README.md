# Lexia

Juego tipo Wordle diario para iOS, Android y Huawei (sin GMS), con soporte bilingüe ES/EN, modo IA impulsado por Claude Haiku y monetización mediante compra única + anuncios rewarded.

**Bundle ID:** `com.fcodlx.lexia`

## Funcionalidades

- 🎮 Tablero Wordle clásico: 5 letras, 6 intentos, animaciones de shake/flip y haptics
- 🌎 Bilingüe ES/EN con teclados específicos por idioma (Ñ en español)
- 👤 Registro progresivo: sugerencia en la partida 5, obligatorio en la 10
- 🔐 Auth con Supabase: Apple Sign-In, Google Sign-In y email + contraseña
- 🤖 Modo IA: Claude Haiku genera palabras por dificultad (fácil/medio/difícil) y tema
- 💎 Premium ($2.99 pago único o $0.99/mes): desbloquea segundo idioma y modo IA
- 📺 Anuncios rewarded: ver un anuncio otorga una pista extra
- 🔔 Notificación push diaria a las 9am con texto bilingüe
- 📤 Compartir resultado como emojis (🟩🟨⬛)

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Expo SDK 54 (Managed Workflow, sin EAS Build) |
| Lenguaje | TypeScript strict |
| Navegación | Expo Router (file-based) |
| Estilos | NativeWind v4 (Tailwind CSS) |
| Estado | Zustand + AsyncStorage persist |
| Animaciones | React Native Reanimated v4 |
| Backend | Supabase (Auth + Postgres + Edge Functions) |
| IA | Claude Haiku vía Edge Function `generate-word` |
| Pagos | RevenueCat (entitlement `premium`) |
| Anuncios | react-native-google-mobile-ads (solo rewarded) |
| Tests | Jest + jest-expo + React Native Testing Library |

## Requisitos

- Node.js 18+
- Xcode (builds iOS) y/o Android Studio (builds Android)
- Cuentas de servicios configuradas — ver `CLAUDE.md` sección 3 para el paso a paso completo (Supabase, Anthropic, RevenueCat, AdMob, Apple Developer, Google Cloud, Google Play, Expo, Firebase)

## Setup

```bash
npm install

# Variables de entorno (sin esto la app corre en modo local:
# sin auth, sin nube, sin IA, con Test IDs de AdMob)
cp .env.example .env.local
# → rellenar con los valores reales de cada servicio
```

### Backend (Supabase)

1. Crear proyecto en https://supabase.com/dashboard
2. SQL Editor → ejecutar `supabase/migrations/001_initial_schema.sql`
3. Authentication → Providers → activar Email, Apple y Google
4. Authentication → URL Configuration → añadir `lexia://auth/callback`
5. Edge Functions → Secrets → añadir `ANTHROPIC_API_KEY`
6. Desplegar la función: `supabase functions deploy generate-word`

## Desarrollo

```bash
npm start            # Metro / Expo Dev Server
npm run ios          # build + run en simulador iOS
npm run android      # build + run en emulador Android

npm test             # Jest (unitarios)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Builds nativos

No se usa EAS Build — los binarios se generan con Xcode y Android Studio:

```bash
npx expo prebuild --clean   # regenerar ios/ y android/ tras cambiar app.json
open ios/Lexia.xcworkspace  # iOS (siempre .xcworkspace)
# Android: abrir la carpeta android/ en Android Studio
```

Detalles de signing, APNs, keystore de release y Firebase en `CLAUDE.md` Fase 9.

## Estructura

```
app/            Pantallas (Expo Router): (tabs)/, auth/callback, paywall
components/     game/ (tablero, teclado), modals/, profile/, ui/
hooks/          useWordleGame, useAuth, usePremium, useRewardedAd, useAIWord, useNotifications
store/          Zustand: gameStore (progreso local), userStore (perfil, premium)
lib/            supabase client, utils puras, listas de palabras ES/EN
constants/      colors, config (teclados, dificultades), copy (strings ES/EN)
supabase/       migración SQL + Edge Function generate-word (Deno)
__tests__/      utils.test.ts, useWordleGame.test.ts
```

## Convenciones

- Estilos con `className` de NativeWind; `style={{}}` solo para valores calculados en runtime
- Todos los strings de UI salen de `constants/copy.ts` (`COPY[language]`)
- Keys de AsyncStorage solo desde `ASYNC_STORAGE_KEYS` en `constants/config.ts`
- Tipos explícitos en `types/index.ts`; nunca `any`
- Apple Sign-In solo en iOS; el botón de Google se oculta en Huawei sin GMS

Ver `CLAUDE.md` para el plan maestro completo del proyecto.
