# Dossier CNDP · Skynkod

*Brouillon préparé le 25 octobre 2026, à partir de ce que fait réellement l'application. Il sert à remplir les formulaires de la CNDP (loi 09-08) quand le site remarchera. Les parties entre crochets sont à compléter par Lita. Ce document n'est pas un avis juridique : une relecture par un avocat ou par la CNDP reste conseillée.*

---

## 1. Le responsable du traitement

- **Nom de la société** : [NOM], [FORME JURIDIQUE], au capital de [MONTANT] MAD
- **Adresse** : [ADRESSE], Maroc
- **RC / ICE / IF** : [NUMÉROS]
- **Représentante** : [NOM ET FONCTION]
- **Contact pour les données personnelles** : privacy@skynkod.com

## 2. Le traitement

- **Nom** : Application mobile Skynkod (soin de la peau)
- **Description courte** : application qui vérifie si des produits de soin conviennent au profil de peau de l'utilisatrice, l'aide à construire et suivre sa routine, tient un journal de sa peau, propose un programme de soin (Rekod), un scan du visage (Dekod) et un assistant de conseil (Koda). Les conseils sont cosmétiques, jamais un diagnostic médical.

## 3. Les finalités (pourquoi les données sont traitées)

1. Créer et gérer le compte de l'utilisatrice.
2. Vérifier la compatibilité des produits avec son profil de peau.
3. Construire et suivre ses routines, son programme Rekod et son plan de 7 jours.
4. Tenir son journal de peau et calculer ses progrès sur ses propres données.
5. Analyser une photo de son visage (Dekod) pour décrire ce qui est visible.
6. Répondre à ses questions (Koda, intelligence artificielle).
7. Lui envoyer des rappels (notifications) qu'elle a acceptés et qu'elle règle elle-même.
8. Gérer l'abonnement Premium (via Apple / Google).
9. Améliorer l'application (statistiques d'utilisation et rapports d'erreurs), désactivable.

## 4. Les personnes concernées

Les utilisatrices et utilisateurs de l'application, âgés de **18 ans ou plus** (âge vérifié à l'inscription ; un compte de mineur est supprimé automatiquement).

## 5. Les données traitées

| Catégorie | Données | Obligatoire ? |
|---|---|---|
| Identité et compte | Email, prénom (facultatif), date de naissance (pour l'âge), langue | Email et date de naissance : oui |
| Profil de peau | Type de peau, objectifs, problèmes choisis en photos (seulement la liste, jamais d'image d'elle) | Non |
| Journal | Humeur de la peau, ce qui se passe (boutons, stress, soleil…), sommeil (qualité et heures), note libre | Non |
| Routines et produits | Produits possédés ou souhaités, dates d'ouverture, routines, étapes cochées, produits arrêtés ou mis en pause | Non |
| Dépenses | Achats (prix, magasin, date, monnaie), budget | Non |
| Koda | Messages échangés avec l'assistant | Non |
| Dekod | Résultat du scan (notes de 0 à 10, conseils, luminosité de la photo), date du consentement | Non |
| Utilisation | Écrans ouverts, fonctions utilisées, type de téléphone, version, rapports d'erreurs | Non (désactivable) |
| Localisation | Position arrondie à environ 10 km, seulement si elle l'autorise | Non |

**Ce qui n'est jamais conservé** : la photo du visage de Dekod (analysée puis supprimée, sur le serveur comme sur le téléphone), et aucune donnée n'est vendue ni transmise à des marques.

## 6. Les données sensibles (données de santé)

Certaines données peuvent être considérées comme des **données de santé** :

- les affections de la peau (rosacée, eczéma, dermatite, psoriasis, acné fongique…), qu'elles soient diagnostiquées ou choisies en photos ;
- la grossesse ou l'allaitement ;
- les traitements (isotrétinoïne, crème sur ordonnance…) et les allergies ;
- le journal de peau et le sommeil ;
- le résultat du scan Dekod.

**Base légale** : le **consentement explicite** de l'utilisatrice.
- Une case séparée « Utiliser mes informations sensibles », non cochée par défaut, à l'inscription ou plus tard dans Réglages › Confidentialité.
- Sans cet accord, ces questions ne sont pas posées.
- Le retrait de l'accord efface ces données.
- Dekod a son propre accord, demandé avant le premier scan ; sa date est gardée dans le compte, et il peut être retiré à tout moment (avec ou sans suppression des résultats).

[À confirmer avec la CNDP : demande d'**autorisation préalable** pour les données sensibles.]

## 7. Les destinataires et sous-traitants

| Destinataire | Rôle | Données reçues | Lieu |
|---|---|---|---|
| Supabase Inc. | Hébergement de la base de données, des comptes et des fichiers | Toutes les données du compte | Francfort, Allemagne (Union européenne) |
| Anthropic PBC | Intelligence artificielle de Koda et de Dekod | La question et le contexte utile ; la photo Dekod, analysée puis non conservée | États-Unis |
| Apple / Google | Distribution de l'application, paiements | Selon leurs propres conditions | Selon leurs conditions |
| Open Beauty Facts | Fiches de produits | Seulement le numéro de code-barres, sans donnée personnelle | France |
| Open-Meteo | Météo | Seulement une position arrondie à 10 km, sans identifiant | Suisse |

## 8. Les transferts hors du Maroc

- **Union européenne (Allemagne)** : hébergement Supabase.
- **États-Unis** : Anthropic, pour Koda et Dekod.
- **Suisse** : Open-Meteo, sans donnée identifiante.

[À déclarer à la CNDP : demande d'**autorisation de transfert** vers les États-Unis et l'Union européenne, avec les garanties contractuelles des prestataires (contrats de traitement de données de Supabase et d'Anthropic).]

## 9. Les durées de conservation

- **Tant que le compte existe** : les données servent au fonctionnement de l'application.
- **Suppression du compte** (depuis l'application, à tout moment) : effacement immédiat de toutes les données, dans les 24 tables de la base. [Durée d'effacement des sauvegardes de Supabase : à vérifier.]
- **Compte inactif 12 mois** : suppression automatique, après un email de prévenance. *(Déjà en place sur le serveur.)*
- **Statistiques d'utilisation et rapports d'erreurs** : effacés automatiquement après 12 mois. *(Déjà en place sur le serveur.)*
- **Retrait du consentement santé** : effacement des données de santé.
- **Photo Dekod** : jamais conservée.

## 10. La sécurité

- Connexions chiffrées (HTTPS) entre l'application et les serveurs.
- Règles de sécurité au niveau de la base de données : chaque utilisatrice n'accède qu'à ses propres données (sur toutes les tables).
- Les clés secrètes ne sont jamais dans l'application ; elles restent sur le serveur.
- Les résultats Dekod ne peuvent être enregistrés que par le serveur.
- Option « discrétion » et verrouillage de l'application par code ou visage sur le téléphone.
- Accès d'administration limité à [NOMS DES PERSONNES AYANT ACCÈS].

## 11. Les droits des personnes et comment les exercer

- **Accès et portabilité** : téléchargement de toutes ses données depuis l'application (Réglages › Confidentialité).
- **Rectification** : directement dans l'application (profil, journal, produits).
- **Suppression** : suppression du compte et de toutes les données depuis l'application, à tout moment.
- **Retrait du consentement** : données de santé et Dekod, dans Réglages › Confidentialité.
- **Opposition** : statistiques d'utilisation désactivables ; rappels réglables ou désactivables.
- **Contact** : privacy@skynkod.com, réponse sous [30] jours.

## 12. Information des personnes

- La politique de confidentialité est publiée sur skynkod.com/privacy et accessible dans l'application.
- Les consentements sont demandés au moment où les données sont utilisées (inscription, données de santé, Dekod, localisation, notifications).
