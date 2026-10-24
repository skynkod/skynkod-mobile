// App texts are written in English in the screens: t('Some text') returns the
// French below when the app is in French, and the English text otherwise (also
// as a fallback for anything not translated yet). {name}-style placeholders
// are filled from the second argument: t('Hi {name}', { name }).

// French is switched off until the design is final; turn it back on with 'fr'.
export const SUPPORTED_LANGUAGES = ['en']

const fr = {
  // ---------- Common ----------
  'Cancel': 'Annuler',
  'Continue': 'Continuer',
  'Back': 'Retour',
  'Skip': 'Passer',
  'Save': 'Enregistrer',
  'Delete': 'Supprimer',
  'Done': 'Terminé',
  'Error': 'Erreur',
  'Retry': 'Réessayer',
  'Loading…': 'Chargement…',
  'or': 'ou',

  // ---------- Errors coming from Supabase ----------
  'Invalid login credentials': 'Adresse e-mail ou mot de passe incorrect.',
  'Email not confirmed': "Ton adresse e-mail n'est pas encore confirmée. Regarde dans ta boîte mail.",
  'email rate limit exceeded': "Trop d'e-mails envoyés. Réessaie dans une heure.",
  'User already registered': 'Un compte existe déjà avec cette adresse.',
  'New password should be different from the old password.': "Le nouveau mot de passe doit être différent de l'ancien.",
  'Email link is invalid or has expired': 'Ce lien a expiré. Demandes-en un nouveau.',

  // ---------- Login ----------
  'Welcome to': 'Bienvenue sur',
  'Sign in': 'Se connecter',
  'Create account': 'Créer un compte',
  'Email': 'E-mail',
  'Password': 'Mot de passe',
  'At least 6 characters': 'Au moins 6 caractères',
  'Forgot password?': 'Mot de passe oublié ?',
  'Continue with Google': 'Continuer avec Google',
  'Remembered it? ': 'Tu t’en souviens ? ',
  'Already have an account? ': 'Déjà un compte ? ',
  'New to Skynkod? ': 'Pas encore de compte ? ',
  'Create one': 'Crée-le',
  'Reset your password': 'Réinitialise ton mot de passe',
  'New password': 'Nouveau mot de passe',
  'Save new password': 'Enregistrer le mot de passe',
  'Send the email again': "Renvoyer l'e-mail",
  'Send me a reset link': 'Envoie-moi un lien',
  'This link has expired. Please ask for a new one.': 'Ce lien a expiré. Demandes-en un nouveau.',
  'Choose your new password.': 'Choisis ton nouveau mot de passe.',
  'Please enter a valid email.': 'Entre une adresse e-mail valide.',
  'Check your email and tap the link on this phone.': 'Regarde tes e-mails et touche le lien sur ce téléphone.',
  'Could not send the email. Please try again.': "Impossible d'envoyer l'e-mail. Réessaie.",
  'Password must be at least 6 characters.': 'Le mot de passe doit faire au moins 6 caractères.',
  'Password updated': 'Mot de passe modifié',
  'You can now sign in with your new password.': 'Tu peux maintenant te connecter avec ton nouveau mot de passe.',
  'Could not save your new password. Please try again.': "Impossible d'enregistrer ton nouveau mot de passe. Réessaie.",
  'Google sign-in was cancelled.': 'Connexion avec Google annulée.',
  'Google sign-in failed. Please try again.': 'La connexion avec Google a échoué. Réessaie.',
  'Please fill in your email and password.': 'Entre ton e-mail et ton mot de passe.',
  'Account created': 'Compte créé',
  'Check your inbox to confirm your email, then sign in.': 'Regarde ta boîte mail pour confirmer ton adresse, puis connecte-toi.',
  'Authentication failed': 'La connexion a échoué',

  // ---------- Onboarding ----------
  'Good skin starts\nwith knowing yours.': 'Une belle peau commence\npar bien la connaître.',
  'A few quick questions, then we set everything up for you.': 'Quelques questions rapides, et on prépare tout pour toi.',
  "Let's start": "C'est parti",
  'Everything your skin needs, in one place.': 'Tout ce dont ta peau a besoin, au même endroit.',
  'Your skin journal': 'Ton journal de peau',
  'Log how your skin feels and see it change, day after day.': 'Note comment va ta peau et vois-la évoluer, jour après jour.',
  'Routines that fit': 'Des routines sur mesure',
  'Morning and evening steps made for your skin.': 'Des étapes matin et soir pensées pour ta peau.',
  'Meet Koda': 'Voici Koda',
  'Your AI skin coach, here for every question.': 'Ton coach peau IA, là pour toutes tes questions.',
  'How would you describe your skin?': 'Comment décrirais-tu ta peau ?',
  'Dry': 'Sèche',
  'Feels tight, can flake': 'Tiraille, peut peler',
  'Oily': 'Grasse',
  'Shiny by midday': 'Brille dès midi',
  'Combination': 'Mixte',
  'Oily T-zone, drier cheeks': 'Zone T grasse, joues plus sèches',
  'Normal': 'Normale',
  'Balanced, rarely bothers you': 'Équilibrée, rarement embêtante',
  'Sensitive': 'Sensible',
  'Reacts easily, turns red': 'Réagit vite, rougit facilement',
  'Not sure yet': 'Je ne sais pas encore',
  'You can take the skin quiz later': 'Tu pourras faire le quiz plus tard',
  'What would you like to work on?': 'Sur quoi aimerais-tu travailler ?',
  'Pick as many as you like.': 'Choisis-en autant que tu veux.',
  'Acne': 'Acné',
  'Redness': 'Rougeurs',
  'Dryness': 'Sécheresse',
  'Dark spots': 'Taches',
  'Fine lines': 'Ridules',
  'Large pores': 'Pores dilatés',
  'Dullness': 'Teint terne',
  'Sensitivity': 'Sensibilité',
  'And your main goal?': 'Et ton objectif principal ?',
  'Clearer skin': 'Une peau plus nette',
  'Deep hydration': 'Une hydratation profonde',
  'An even skin tone': 'Un teint unifié',
  'Smoother, firmer skin': 'Une peau plus lisse et ferme',
  'A routine I actually stick to': 'Une routine que je tiens vraiment',
  'Your Skyn Profile': 'Ton Skyn Profile',
  'Nice to meet your skin.': 'Ta peau n’a plus de secrets.',
  'Skin type': 'Type de peau',
  'To discover': 'À découvrir',
  'Working on': 'À travailler',
  'Goal': 'Objectif',
  'Your routines are ready, and Koda knows where to start.': 'Tes routines sont prêtes, et Koda sait par où commencer.',
  'Get started': 'Commencer',
}

const DICTIONARIES = { fr }

export const translate = (language, text, vars) => {
  if (typeof text !== 'string') return text
  let out = DICTIONARIES[language]?.[text] ?? text
  if (vars) {
    for (const [key, value] of Object.entries(vars)) out = out.split(`{${key}}`).join(String(value))
  }
  return out
}
