import type { Language } from '@/types'

interface Copy {
  game: {
    title: string
    daily: string
    aiMode: string
    wordNotFound: string
    notEnoughLetters: string
    alreadyGuessed: string
    youWon: string
    youLost: string
    theWordWas: string
    hint: string
    hintsLeft: string
    noHintsLeft: string
    shareResult: string
    nextWordIn: string
    playAgain: string
    close: string
  }
  auth: {
    signIn: string
    signUp: string
    signOut: string
    email: string
    password: string
    username: string
    continueWithApple: string
    continueWithGoogle: string
    orContinueWith: string
    suggestionTitle: string
    suggestionBody: string
    requiredTitle: string
    requiredBody: string
    maybeLater: string
    alreadyHaveAccount: string
    dontHaveAccount: string
    forgotPassword: string
  }
  stats: {
    title: string
    played: string
    winRate: string
    currentStreak: string
    maxStreak: string
    guessDistribution: string
    noStats: string
    signInForCloud: string
  }
  profile: {
    title: string
    editUsername: string
    language: string
    notifications: string
    premium: string
    restorePurchases: string
    deleteAccount: string
    deleteConfirm: string
    cancel: string
    save: string
  }
  ai: {
    title: string
    selectDifficulty: string
    selectTheme: string
    generating: string
    play: string
    definition: string
  }
  paywall: {
    title: string
    subtitle: string
    benefit1: string
    benefit2: string
    benefit3: string
    benefit4: string
    monthly: string
    lifetime: string
    restore: string
    terms: string
  }
  common: {
    loading: string
    error: string
    retry: string
    ok: string
    yes: string
    no: string
    premium: string
    free: string
  }
}

export const COPY: Record<Language, Copy> = {
  es: {
    game: {
      title: 'LEXIA',
      daily: 'Palabra del día',
      aiMode: 'Modo IA',
      wordNotFound: 'Palabra no encontrada',
      notEnoughLetters: 'Faltan letras',
      alreadyGuessed: 'Ya intentaste esta palabra',
      youWon: '¡Ganaste!',
      youLost: '¡Perdiste!',
      theWordWas: 'La palabra era',
      hint: 'Pista',
      hintsLeft: 'pistas restantes',
      noHintsLeft: 'Sin pistas disponibles',
      shareResult: 'Compartir resultado',
      nextWordIn: 'Siguiente palabra en',
      playAgain: 'Jugar de nuevo',
      close: 'Cerrar',
    },
    auth: {
      signIn: 'Iniciar sesión',
      signUp: 'Registrarse',
      signOut: 'Cerrar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      username: 'Nombre de usuario',
      continueWithApple: 'Continuar con Apple',
      continueWithGoogle: 'Continuar con Google',
      orContinueWith: 'O continuar con',
      suggestionTitle: '¡Guarda tu progreso!',
      suggestionBody: 'Crea una cuenta para no perder tu racha y estadísticas.',
      requiredTitle: 'Crea tu cuenta',
      requiredBody: 'Regístrate para seguir jugando y guardar tu progreso.',
      maybeLater: 'Ahora no',
      alreadyHaveAccount: '¿Ya tienes cuenta? Inicia sesión',
      dontHaveAccount: '¿No tienes cuenta? Regístrate',
      forgotPassword: '¿Olvidaste tu contraseña?',
    },
    stats: {
      title: 'Estadísticas',
      played: 'Jugadas',
      winRate: '% Victorias',
      currentStreak: 'Racha actual',
      maxStreak: 'Mejor racha',
      guessDistribution: 'Distribución de intentos',
      noStats: 'Aún no hay estadísticas. ¡Juega tu primera partida!',
      signInForCloud: 'Inicia sesión para sincronizar tus estadísticas',
    },
    profile: {
      title: 'Perfil',
      editUsername: 'Editar nombre',
      language: 'Idioma',
      notifications: 'Notificaciones diarias',
      premium: 'Premium',
      restorePurchases: 'Restaurar compras',
      deleteAccount: 'Eliminar cuenta',
      deleteConfirm: '¿Estás seguro? Esta acción no se puede deshacer.',
      cancel: 'Cancelar',
      save: 'Guardar',
    },
    ai: {
      title: 'Modo IA',
      selectDifficulty: 'Selecciona dificultad',
      selectTheme: 'Selecciona tema (opcional)',
      generating: 'Generando palabra...',
      play: 'Jugar',
      definition: 'Definición',
    },
    paywall: {
      title: 'Lexia Premium',
      subtitle: 'Desbloquea todo por un único pago',
      benefit1: '🤖 Modo IA con palabras únicas',
      benefit2: '🌐 Juega en español e inglés',
      benefit3: '📊 Estadísticas avanzadas en la nube',
      benefit4: '🎯 3 niveles de dificultad + 7 temas',
      monthly: '$0.99 / mes',
      lifetime: '$2.99 pago único',
      restore: 'Restaurar compras',
      terms: 'Términos y condiciones',
    },
    common: {
      loading: 'Cargando...',
      error: 'Algo salió mal',
      retry: 'Reintentar',
      ok: 'OK',
      yes: 'Sí',
      no: 'No',
      premium: 'PRO',
      free: 'Gratis',
    },
  },
  en: {
    game: {
      title: 'LEXIA',
      daily: "Today's word",
      aiMode: 'AI Mode',
      wordNotFound: 'Word not found',
      notEnoughLetters: 'Not enough letters',
      alreadyGuessed: 'Already guessed that word',
      youWon: 'You won!',
      youLost: 'You lost!',
      theWordWas: 'The word was',
      hint: 'Hint',
      hintsLeft: 'hints left',
      noHintsLeft: 'No hints available',
      shareResult: 'Share result',
      nextWordIn: 'Next word in',
      playAgain: 'Play again',
      close: 'Close',
    },
    auth: {
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      continueWithApple: 'Continue with Apple',
      continueWithGoogle: 'Continue with Google',
      orContinueWith: 'Or continue with',
      suggestionTitle: 'Save your progress!',
      suggestionBody: "Create an account so you don't lose your streak and stats.",
      requiredTitle: 'Create your account',
      requiredBody: 'Sign up to keep playing and save your progress.',
      maybeLater: 'Maybe later',
      alreadyHaveAccount: 'Already have an account? Sign in',
      dontHaveAccount: "Don't have an account? Sign up",
      forgotPassword: 'Forgot your password?',
    },
    stats: {
      title: 'Statistics',
      played: 'Played',
      winRate: 'Win %',
      currentStreak: 'Current streak',
      maxStreak: 'Max streak',
      guessDistribution: 'Guess distribution',
      noStats: 'No stats yet. Play your first game!',
      signInForCloud: 'Sign in to sync your statistics',
    },
    profile: {
      title: 'Profile',
      editUsername: 'Edit name',
      language: 'Language',
      notifications: 'Daily notifications',
      premium: 'Premium',
      restorePurchases: 'Restore purchases',
      deleteAccount: 'Delete account',
      deleteConfirm: 'Are you sure? This action cannot be undone.',
      cancel: 'Cancel',
      save: 'Save',
    },
    ai: {
      title: 'AI Mode',
      selectDifficulty: 'Select difficulty',
      selectTheme: 'Select theme (optional)',
      generating: 'Generating word...',
      play: 'Play',
      definition: 'Definition',
    },
    paywall: {
      title: 'Lexia Premium',
      subtitle: 'Unlock everything with a one-time payment',
      benefit1: '🤖 AI Mode with unique words',
      benefit2: '🌐 Play in Spanish and English',
      benefit3: '📊 Advanced cloud statistics',
      benefit4: '🎯 3 difficulty levels + 7 themes',
      monthly: '$0.99 / month',
      lifetime: '$2.99 one-time',
      restore: 'Restore purchases',
      terms: 'Terms and conditions',
    },
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Retry',
      ok: 'OK',
      yes: 'Yes',
      no: 'No',
      premium: 'PRO',
      free: 'Free',
    },
  },
}
