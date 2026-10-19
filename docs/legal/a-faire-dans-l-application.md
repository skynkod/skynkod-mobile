# À faire pour que l'application colle aux textes légaux

Ces points découlent des brouillons de conditions d'utilisation et de politique de confidentialité. Ils sont classés du plus important au moins important. Aucun n'est encore fait.

## À trancher avec l'avocat

1. **Le Journal et les données de santé.** Aujourd'hui, le Journal (humeur de la peau, boutons, règles, stress…) est rempli **même sans** la case « données de santé ». Ces informations peuvent être considérées comme des données de santé. Deux possibilités :
   - élargir la case de consentement santé au Journal (et ne proposer le Journal qu'avec cet accord) ;
   - ou considérer que le Journal relève du service lui-même, et le dire clairement au moment de l'inscription.
2. **Les transferts à l'étranger** (hébergement en Allemagne, Koda aux États-Unis) : autorisation de la CNDP, consentement explicite, ou les deux ?
3. **La déclaration ou la demande d'autorisation à la CNDP**, avant le lancement.
4. **La langue qui fait foi** en cas de différence entre le français et l'anglais.

## À construire dans l'application

5. ✅ **Fait** : date de naissance demandée à l'inscription ; en dessous de 18 ans, le compte est supprimé.
6. **Suppression des comptes inactifs après 12 mois**, avec un email de prévenance avant, par exemple 30 jours avant. Il faudra une tâche automatique côté serveur, et un vrai service d'envoi d'emails.
7. ✅ **Fait** : Koda et Anthropic sont mentionnés dans l'étape de consentement.
8. **La case « Offres de marques »** : aucune offre n'existe encore. Il faudra décider comment les présenter sans jamais transmettre l'identité aux marques, ou retirer la case en attendant.
9. ✅ **Fait** : la case « Statistiques anonymes » est remplacée par des statistiques d'utilisation liées au compte, activées par défaut, désactivables dans Réglages › Confidentialité, gardées 12 mois. **À faire valider par l'avocat** : l'intérêt légitime comme base (au lieu du consentement).
10. ✅ **Fait** : Open Beauty Facts est cité dans À propos.
11. **Droit d'accès** : prévoir comment envoyer à une utilisatrice une copie de ses données si elle le demande. Au début, cela peut se faire par email, à la main.

## À mettre en ligne

12. **Publier les deux textes** aux adresses déjà utilisées par l'application : skynkod.com/terms et skynkod.com/privacy.
13. **Remplir l'« étiquette de confidentialité »** sur l'App Store et Google Play, avec les mêmes informations que la politique.
14. **Vérifier la durée de conservation des sauvegardes** de Supabase, pour la section 8.
