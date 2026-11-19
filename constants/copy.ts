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
    alreadyPlayed: string
    viewResult: string
    timeUp: string
    premiumLanguage: string
  }
  auth: {
    signIn: string
    signUp: string
    signOut: string
    email: string
    password: string
    username: string
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
    recentGames: string
    deviceStats: string
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
    premiumActive: string
    purchasesRestored: string
    noPurchases: string
    deleteFailed: string
    changeAvatar: string
    avatarFailed: string
    usernameTaken: string
  }
  ai: {
    title: string
    selectDifficulty: string
    selectTheme: string
    generating: string
    play: string
    definition: string
    language: string
    errorGenerating: string
    rateLimited: string
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
    noAutoRenew: string
    notAvailable: string
    purchaseFailed: string
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
  notifications: {
    title: string
    body: string
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
      alreadyPlayed: '¡Ya jugaste hoy!',
      viewResult: 'Ver resultado',
      timeUp: '¡Se acabó el tiempo!',
      premiumLanguage: 'El segundo idioma es Premium',
    },
    auth: {
      signIn: 'Iniciar sesión',
      signUp: 'Registrarse',
      signOut: 'Cerrar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      username: 'Nombre de usuario',
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
      recentGames: 'Últimas partidas',
      deviceStats: 'Estadísticas de este dispositivo',
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
      premiumActive: '✓ Premium activo',
      purchasesRestored: '¡Compras restauradas!',
      noPurchases: 'No se encontraron compras.',
      deleteFailed: 'No se pudo eliminar la cuenta. Inténtalo más tarde.',
      changeAvatar: 'Cambiar foto',
      avatarFailed: 'No se pudo subir la foto.',
      usernameTaken: 'Ese nombre ya está en uso.',
    },
    ai: {
      title: 'Modo IA',
      selectDifficulty: 'Selecciona dificultad',
      selectTheme: 'Selecciona tema (opcional)',
      generating: 'Generando palabra...',
      play: 'Jugar',
      definition: 'Definición',
      language: 'Idioma',
      errorGenerating: 'No se pudo generar la palabra. Inténtalo de nuevo.',
      rateLimited: 'Llegaste al límite diario del Modo IA. Vuelve mañana.',
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
      noAutoRenew: 'Sin renovación automática',
      notAvailable: 'Las compras no están disponibles todavía.',
      purchaseFailed: 'La compra no se completó.',
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
    notifications: {
      title: '¡Tu palabra del día te espera! 📝',
      body: 'Abre Lexia y demuestra que eres el mejor en palabras.',
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
      alreadyPlayed: "You've already played today!",
      viewResult: 'View result',
      timeUp: "Time's up!",
      premiumLanguage: 'The second language is Premium',
    },
    auth: {
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      email: 'Email',
      password: 'Password',
      username: 'Username',
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
      recentGames: 'Recent games',
      deviceStats: 'Stats on this device',
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
      premiumActive: '✓ Premium active',
      purchasesRestored: 'Purchases restored!',
      noPurchases: 'No purchases found.',
      deleteFailed: 'Could not delete the account. Try again later.',
      changeAvatar: 'Change photo',
      avatarFailed: 'Could not upload the photo.',
      usernameTaken: 'That username is already taken.',
    },
    ai: {
      title: 'AI Mode',
      selectDifficulty: 'Select difficulty',
      selectTheme: 'Select theme (optional)',
      generating: 'Generating word...',
      play: 'Play',
      definition: 'Definition',
      language: 'Language',
      errorGenerating: 'Could not generate a word. Please try again.',
      rateLimited: "You've reached today's AI Mode limit. Come back tomorrow.",
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
      noAutoRenew: 'No auto-renewal',
      notAvailable: 'Purchases are not available yet.',
      purchaseFailed: 'The purchase did not complete.',
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
    notifications: {
      title: 'Your daily word is waiting! 📝',
      body: 'Open Lexia and show off your vocabulary skills.',
    },
  },
}
