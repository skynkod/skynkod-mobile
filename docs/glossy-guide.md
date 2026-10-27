# Passer tout Skynkod dans l'univers glossy : le guide

But (Lita, 2026-10-27) : l'inscription, l'app et la landing page suivent **à 100 %** la direction artistique glossy. La description complète est dans `docs/branding-glossy.md`.

Le partage des rôles :
- **toi :** les maquettes et les images (avec ChatGPT) ;
- **moi :** les fondations dans le code, puis chaque écran refait à l'identique.

---

## L'ordre (une étape à la fois)

| # | Étape | Toi | Moi |
|---|---|---|---|
| 1 | **Fondations** | Rien. Tu valides juste 3 choix (voir plus bas) | Inter dans l'app, la palette, les cartes en verre, les boutons, les icônes au trait fin, le fond soie. L'app change d'un coup, sans toucher aux fonctions |
| 2 | **Inscription** | Les 59 images de `docs/onboarding-v3-prompts.md`. Commence par A et B (12 images) | Je refais chaque écran comme la maquette v3, tu valides sur ton iPhone, puis je l'intègre dans l'app |
| 3 | **L'app, écran par écran** | Une maquette par écran (prompt plus bas), en commençant par l'accueil | Je refais l'écran à l'identique, avec les vraies données. Un écran validé avant de passer au suivant |
| 4 | **Landing page** | Ta maquette (déjà faite) et ses images (liste plus bas) | Je reconstruis le site. **Je ne publie rien sans ton accord** |

---

## 1. Les 3 choix à valider pour les fondations
1. **Mode sombre :** l'univers glossy est clair. Soit l'app reste claire tout le temps, soit on crée une version « nuit glossy » (prune profond, verre sombre, étoiles).
2. **Le ciel de l'accueil** (nuages le jour, nuit le soir) : on le garde dans le nouvel univers, ou on le remplace par le fond soie.
3. **La barre du bas** (Home, Journal, +, Koda, Profile) : en verre dépoli flottant, comme le style le demande. À confirmer sur ta maquette de l'accueil.

---

## 2. L'inscription
Les prompts sont prêts : `docs/onboarding-v3-prompts.md`, 59 images. Avec les groupes A et B (12 images), les écrans principaux ont déjà l'ambiance de la maquette.

---

## 3. L'app : une maquette par écran

### Le prompt de base (à coller avant chaque écran)
> Design a high-fidelity mobile app screen (iPhone, 9:41 status bar) for Skynkod, a premium skincare app. Exact art direction: soft dreamy glossy universe, pearl-white to powder-pink background (#FBF4F8 to #F3E3EC) with white light halos, frosted glass cards (translucent white, soft blur, thin white border, soft pink shadow), dusty mauve accents (#8A6380 buttons, #A57B9C icons, #C5A8BB logo), a warm peach glow (#FCD5C8), thin 1.5px mauve line icons inside small glass circles, glossy 3D objects only as accents, real unretouched skin photos when skin is shown. Typography: Inter, large medium-weight titles in deep plum (#2E2232), small uppercase spaced labels, generous spacing. Mascot when needed: Koda, a small glossy peach-pink sun with rounded rays, big shiny eyes, blush, no arms. Clean, calm, luxurious, never clinical, never saturated. English text exactly as given below. Screen content:

Ensuite, colle le **contenu de l'écran** ci-dessous. Une maquette par écran. Le contenu est celui de l'app réelle : la maquette doit le garder, seul le style change.

### Les écrans, par ordre de priorité

**Les 5 onglets**
1. **Home** : date et météo en haut, « Good morning, [name] ». Skin forecast (la météo de ta peau du jour). Check-in du jour : « How's your skin today? » avec 5 humeurs, puis « How did you slept? » avec les heures. Une carte du moment (par exemple « Your skin is reacting », ou un conseil). « This morning » ou « Tonight » : la routine avec ses étapes à cocher, et le lien « Tired? Short version tonight ». « Check a product » : barre de recherche et scanner. Barre du bas : Home, Journal, bouton + rond, Koda, Profile.
2. **Journal** : un sélecteur de jours de la semaine, l'humeur de la peau (5 visages), les tags « What's going on? » (new pimple, redness, itchiness, peeling, dryness, oily, used new product), une note, les routines du jour cochées, et la carte « What your skin tells you » (les liens repérés).
3. **Koda** (le coach IA) : chat avec Koda, des suggestions de questions, et sa réponse dans des bulles de verre.
4. **Profile / More** : avatar et prénom, niveau, puis des listes en verre : Your skin right now, My Skyn Profile, My progress, Products, Budget, Scanner, Skyncyclopedia, Emergency, Notifications, Premium, Settings.
5. **Le bouton +** : un menu rapide (log my skin, scan a product, add a product, take a progress photo).

**Les fonctions phares**
6. **Rekod** (le programme) : semaine en cours, le soir de ce soir (rétinol, exfoliation, réparation, repos), le calendrier des 7 soirs, le bilan de la semaine (« All good / A little / A lot »), le chemin de progression.
7. **Dekod** (le scan de peau) : l'appareil photo avec l'ovale, puis les résultats (score, zones, comparaison avec le dernier scan).
8. **Product** : photo du produit, verdict de compatibilité pour ta peau (badge), ingrédients clés, « Not right now » si besoin, boutons « I have it » / « Add to To buy ».
9. **Search / Check a product** : barre de recherche, ingrédients populaires, résultats produits avec badges, et la carte « Seen on TikTok? » (Vrai / Ça dépend / Faux).
10. **Routines** : matin et soir, étapes avec produits (démaquillant, nettoyant, sérum, yeux, crème, SPF, lèvres), jours de la semaine pour les actifs.

**Le suivi**
11. **My progress** : courbes 1W/1M/3M/6M/1Y, métriques, frise de photos.
12. **My Skin Journey** : badges, niveaux, défis.
13. **Products (Skyn Shelf)** : filtres, cartes produits avec badges, dates d'ouverture.
14. **Budget (Skynbudget)** : dépensé ce mois, barre de budget, conseils.
15. **Emergency** : les situations (tuiles), puis « Your 7-day plan » jour par jour.

**Le reste** (une fois les autres faits)
16. Premium (l'offre), 17. Skyncyclopedia, 18. Skin check-in, 19. Notifications, 20. Settings, 21. Login.

### Les images d'app à préparer (même style que la partie A des prompts d'inscription)
- **Les emblèmes des fonctions**, en objets de verre brillant sur fond transparent : Rekod, Dekod, Koda (fait), Skynbudget, Emergency, Premium (diamant), Skyncyclopedia (livre), Journal.
- **Koda dans d'autres situations**, sur fond transparent : qui dort (la nuit), qui fête (badge), qui console (peau qui réagit), qui lit (encyclopédie).
- **Les illustrations pour les écrans vides** : par exemple « aucun produit encore », « pas encore de scan », « pas encore de photo ». 3 ou 4 objets de verre simples.
- **Le fond soie** (déjà dans les prompts d'inscription, n° 59).

---

## 4. La landing page
Ta maquette est la référence. Il me faut :
1. `lp-hero.png` : la composition du haut **sans le téléphone** (le soleil de verre, les cristaux et les panneaux de verre « Analyze / Decode / Personalize »). Je mets le téléphone en code, avec une **vraie capture** de l'app restylée.
2. `lp-face.png` : le grand visage de la section « Skincare that sees the bigger picture », **sans les bulles** (je les ajoute en code, animées).
3. `lp-glass-boxes.png` : les boîtes de verre avec le flacon et la texture, en bas.
4. Les 4 petits écrans « Analyze, Scan, Routine, Progress » : je les fais avec de **vraies captures** de l'app une fois restylée, donc rien à générer.

Le texte sera revu avec toi avant la mise en ligne. Deux phrases de la maquette ne peuvent pas être reprises telles quelles :
- « the AI skincare app » : c'est Koda, le coach IA, pas Skynkod ;
- « dermatology-backed » : seulement si c'est vrai.

---

## Comment m'envoyer les choses
- **Les images :** envoie-les avec leur **nom** dans ton message (par exemple « bubble-eyes »), même par petits groupes.
- **Les maquettes d'écrans :** une à la fois, avec le **nom de l'écran**. Je la refais, tu valides sur ton iPhone, puis on passe à la suivante.
- **Si une image a un faux damier gris au lieu d'un vrai fond transparent**, ce n'est pas grave : je l'enlève.
