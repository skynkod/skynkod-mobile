import AsyncStorage from '@react-native-async-storage/async-storage'

const LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

const TRANSLATIONS = {
  en: {
    // Auth
    auth_email: 'Email',
    auth_password: 'Password',
    auth_sign_in: 'Sign In',
    auth_sign_up: 'Sign Up',
    auth_create_account: 'Create Account',
    auth_already_have: 'Already have an account? Sign In',
    auth_no_account: "Don't have an account? Sign Up",
    
    // Home
    home_title: 'Home',
    home_yesterday_score: 'Yesterday\'s Score',
    
    // Journal
    journal_title: 'Journal',
    journal_daily_checkin: 'Daily Check-in',
    journal_mood: 'How\'s your mood?',
    journal_conditions: 'Skin conditions?',
    journal_notes: 'Add notes...',
    journal_save: 'Save Entry',
    
    // Progress
    progress_title: 'Progress',
    progress_7day: '7-Day Trend',
    progress_avg_score: 'Average Score',
    
    // Analysis
    analysis_title: 'Analysis',
    analysis_improvement: 'Overall Improvement',
    analysis_photos: 'Photo Timeline',
    
    // Koda
    koda_title: 'Koda AI Coach',
    koda_ask: 'Ask Koda...',
    koda_send: 'Send',
    
    // Routines
    routines_title: 'Routines',
    routines_morning: 'Morning Routine',
    routines_evening: 'Evening Routine',
    routines_streak: 'Current Streak',
    routines_complete: 'Mark as Complete',
    
    // Products
    products_title: 'Products',
    products_inventory: 'My Products',
    products_add: 'Add Product',
    
    // Photos
    photos_title: 'Photos',
    photos_take: 'Take Photo',
    photos_pick: 'Pick Photo',
    photos_no_photos: 'No photos yet',
    
    // Premium
    premium_title: 'Go Premium',
    premium_price: '$4.99/month',
    premium_start: 'Start Premium Now',
    premium_unlimited_koda: 'Unlimited Koda Chat',
    premium_routine_gen: 'Routine Generator',
    premium_photo_analysis: 'Photo Analysis',
    premium_export: 'Export Reports',
    
    // Settings
    settings_title: 'Settings',
    settings_logout: 'Logout',
    settings_dark_mode: 'Dark Mode',
    settings_language: 'Language',
    
    // Common
    common_ok: 'OK',
    common_cancel: 'Cancel',
    common_save: 'Save',
    common_delete: 'Delete',
    common_error: 'Error',
    common_success: 'Success',
  },
  es: {
    // Auth
    auth_email: 'Correo electrónico',
    auth_password: 'Contraseña',
    auth_sign_in: 'Iniciar sesión',
    auth_sign_up: 'Registrarse',
    auth_create_account: 'Crear cuenta',
    auth_already_have: '¿Ya tienes cuenta? Inicia sesión',
    auth_no_account: '¿No tienes cuenta? Regístrate',
    
    // Home
    home_title: 'Inicio',
    home_yesterday_score: 'Puntuación de ayer',
    
    // Journal
    journal_title: 'Diario',
    journal_daily_checkin: 'Registro diario',
    journal_mood: '¿Cómo te sientes?',
    journal_conditions: '¿Condiciones de piel?',
    journal_notes: 'Añadir notas...',
    journal_save: 'Guardar',
    
    // Progress
    progress_title: 'Progreso',
    progress_7day: 'Tendencia 7 días',
    progress_avg_score: 'Puntuación promedio',
    
    // Analysis
    analysis_title: 'Análisis',
    analysis_improvement: 'Mejora general',
    analysis_photos: 'Línea de tiempo de fotos',
    
    // Koda
    koda_title: 'Koda - Entrenador IA',
    koda_ask: 'Pregunta a Koda...',
    koda_send: 'Enviar',
    
    // Routines
    routines_title: 'Rutinas',
    routines_morning: 'Rutina matutina',
    routines_evening: 'Rutina nocturna',
    routines_streak: 'Racha actual',
    routines_complete: 'Marcar como completado',
    
    // Products
    products_title: 'Productos',
    products_inventory: 'Mis productos',
    products_add: 'Añadir producto',
    
    // Photos
    photos_title: 'Fotos',
    photos_take: 'Tomar foto',
    photos_pick: 'Seleccionar foto',
    photos_no_photos: 'Sin fotos aún',
    
    // Premium
    premium_title: 'Acceso Premium',
    premium_price: '$4.99/mes',
    premium_start: 'Comenzar Premium',
    premium_unlimited_koda: 'Koda ilimitado',
    premium_routine_gen: 'Generador de rutinas',
    premium_photo_analysis: 'Análisis de fotos',
    premium_export: 'Exportar reportes',
    
    // Settings
    settings_title: 'Configuración',
    settings_logout: 'Cerrar sesión',
    settings_dark_mode: 'Modo oscuro',
    settings_language: 'Idioma',
    
    // Common
    common_ok: 'OK',
    common_cancel: 'Cancelar',
    common_save: 'Guardar',
    common_delete: 'Eliminar',
    common_error: 'Error',
    common_success: 'Éxito',
  },
  fr: {
    // Auth
    auth_email: 'Email',
    auth_password: 'Mot de passe',
    auth_sign_in: 'Se connecter',
    auth_sign_up: "S'inscrire",
    auth_create_account: 'Créer un compte',
    auth_already_have: 'Vous avez déjà un compte? Se connecter',
    auth_no_account: "Vous n'avez pas de compte? S'inscrire",
    
    // Home
    home_title: 'Accueil',
    home_yesterday_score: 'Score d\'hier',
    
    // Journal
    journal_title: 'Journal',
    journal_daily_checkin: 'Enregistrement quotidien',
    journal_mood: 'Comment vous sentez-vous?',
    journal_conditions: 'Conditions de peau?',
    journal_notes: 'Ajouter des notes...',
    journal_save: 'Enregistrer',
    
    // Progress
    progress_title: 'Progrès',
    progress_7day: 'Tendance 7 jours',
    progress_avg_score: 'Score moyen',
    
    // Analysis
    analysis_title: 'Analyse',
    analysis_improvement: 'Amélioration globale',
    analysis_photos: 'Chronologie des photos',
    
    // Koda
    koda_title: 'Koda - Coach IA',
    koda_ask: 'Demander à Koda...',
    koda_send: 'Envoyer',
    
    // Routines
    routines_title: 'Routines',
    routines_morning: 'Routine du matin',
    routines_evening: 'Routine du soir',
    routines_streak: 'Série actuelle',
    routines_complete: 'Marquer comme complété',
    
    // Products
    products_title: 'Produits',
    products_inventory: 'Mes produits',
    products_add: 'Ajouter un produit',
    
    // Photos
    photos_title: 'Photos',
    photos_take: 'Prendre une photo',
    photos_pick: 'Sélectionner une photo',
    photos_no_photos: 'Pas de photos encore',
    
    // Premium
    premium_title: 'Premium',
    premium_price: '$4.99/mois',
    premium_start: 'Commencer Premium',
    premium_unlimited_koda: 'Koda illimité',
    premium_routine_gen: 'Générateur de routines',
    premium_photo_analysis: 'Analyse de photos',
    premium_export: 'Exporter les rapports',
    
    // Settings
    settings_title: 'Paramètres',
    settings_logout: 'Se déconnecter',
    settings_dark_mode: 'Mode sombre',
    settings_language: 'Langue',
    
    // Common
    common_ok: 'OK',
    common_cancel: 'Annuler',
    common_save: 'Enregistrer',
    common_delete: 'Supprimer',
    common_error: 'Erreur',
    common_success: 'Succès',
  },
}

export const getLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem('app_language')
    return saved || 'en'
  } catch (error) {
    return 'en'
  }
}

export const setLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem('app_language', lang)
  } catch (error) {
    console.error('Set language error:', error)
  }
}

export const t = (key, language = 'en') => {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key
}

export const getLanguages = () => LANGUAGES