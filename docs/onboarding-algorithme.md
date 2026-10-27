# Inscription Skynkod : l'algorithme à garder

Lita, 2026-10-27 : « Garde l'algorithme des onboarding screens comme on l'a fait, le dernier, mais l'UX/UI va complètement changer. »

Ce document décrit **le fond** : les questions, leur ordre, les choix possibles et les règles. Il ne dit rien du design. Le prototype précédent est archivé dans le scratchpad (`proto/archive-v7`).

## Ordre général

1. Bienvenue
2. Prénom (facultatif)
3. Carte du parcours : 7 étapes, puis « Ton profil »
4. Les 7 étapes, chacune avec une intro et une fin
5. « On prépare tout » (chargement)
6. Le Skyn Profile final
7. Les rappels : Koda, une fausse notification, ses 2 heures (matin 5h–11h, soir 18h–23h30, par pas de 30 min), « Turn on reminders » ou « Not now »

## Les 7 étapes

### 1. Ta peau
- **Objectif** (jusqu'à 3) : Peau nette (boutons, points noirs) · Peau hydratée (peau qui tire) · Teint uniforme (taches, marques) · Peau plus ferme (ridules, fermeté) · Moins de pores (brillance, texture) · Peau calme (rougeurs).
- **Tu es…** : Une femme · Un homme.
- **Tu as…** : 18–24 · 25–34 · 35–44 · 45–54 · 55 et plus · « Moins de 18 ans » ouvre l'écran « Skynkod est pour les 18 ans et plus », avec les soins de base et le conseil de voir un médecin pour l'acné.
- **Ménopause** (facultatif, seulement pour les femmes de 45 ans et plus) : Pas encore · En cours · Après · Je préfère ne pas dire.
- **Test 1 · 2 h après le lavage, ta peau…** (avec photos) : Elle tiraille (sèche) · Confortable (normale) · Brille au centre (mixte) · Brille partout (grasse).
- **Test 2 · À midi, ta peau brille…** : Pas du tout · Au centre · Partout.
- **Test 3 · Tes pores, tu les vois…** : À peine · Sur le nez · Nez et joues.
- **Test 4 · oui ou non** : Ta peau rougit ou pique avec un nouveau produit ? (→ sensible) · Au soleil, tu rougis avant de bronzer ? · Ta peau tiraille après la douche ?
- **Ta teinte** (facultatif) : 6 pastilles, de la plus claire à la plus foncée. Les teintes 4 à 6 donnent un SPF sans traces blanches et des soins doux pour les taches.
- **Règle du type de peau** (comme l'app) :
  - Grasse si : brille partout après lavage, OU brille partout à midi, OU pores nez et joues sans peau qui tiraille ;
  - sinon Mixte si : brille au centre, OU brille au centre à midi, OU (confortable et pores sur le nez) ;
  - sinon Sèche si : tiraille et ne brille pas à midi ;
  - sinon Normale.
- **Fin d'étape** : le type de peau, et ses choix.

### 2. Visage
- **Zones** (autant qu'on veut, en touchant le visage sur la photo) : Front · Joues · Nez · Menton.
- **Quelque chose te gêne sur ton visage ?** Oui / Non.
- Si oui, les **familles** (plusieurs) : Boutons · Rougeurs · Taches · Pores et brillance · Sécheresse · Rides et fermeté. Puis le détail en photos pour chaque famille choisie :
  - Boutons : points noirs et blancs · boutons rouges · gros boutons profonds · boutons au menton, au rythme des règles ou des hormones · petits boutons identiques qui grattent · cicatrices ;
  - Rougeurs : marques rouges après un bouton · petits vaisseaux visibles · peau qui réagit vite ;
  - Taches : marques brunes après un bouton · taches de soleil · teint terne ;
  - Pores et brillance : pores dilatés · petits points sur le nez · peau grasse · grain irrégulier ;
  - Sécheresse : sèche (manque de gras, ça pèle) · déshydratée (manque d'eau, ça tire) ;
  - Rides et fermeté : ridules · rides marquées · peau qui se relâche.

### 3. Yeux
- **Et autour de tes yeux ?** Oui / Non. Si oui (plusieurs, en photos) : cernes bleutés ou violets · cernes bruns · cernes creusés · poches · ridules au coin des yeux · petits grains blancs.

### 4. Lèvres
- **Un souci avec tes lèvres ?** Oui / Non. Si oui (plusieurs, en photos) : sèches, gercées · coins fendillés · plus foncées · ridules autour · ça pèle souvent.

### 5. Cou
- **Tu remarques quelque chose sur ton cou ?** Oui / Non. Si oui (plusieurs, en photos) : rides du cou · peau qui se relâche · peau sèche · taches plus foncées.

### 6. Ta vie
- **« What matters most to you right now? »** (si elle a au moins 2 préoccupations) : les photos de ses préoccupations, elle touche la principale, puis une 2e si elle en a 3 ou plus. Elles guident les verdicts produits, Rekod, le prochain achat et le bilan de la semaine. Avec une seule, elle devient la principale automatiquement.
- **Tu dors combien d'heures ?** De 4 à 10 h. Moins de 6 h : « Ta peau se répare surtout la nuit ».
- **Au quotidien, oui ou non** : stressée en ce moment ? · maquillage ou produit teinté souvent ? (sert à l'étape démaquillant) · beaucoup de temps dehors ? · tu transpires beaucoup ?

### 7. Sécurité (« Ça te concerne ? »)
- **Grossesse ou allaitement** (pas pour « Un homme ») → Je suis enceinte / J'allaite (un seul choix).
- **Une allergie à un ingrédient** → Parfum · Huiles essentielles · Fruits à coque · Lanoline · Alcool · Autre. Avec « Autre », **il faut écrire l'ingrédient**, sinon on ne peut pas continuer.
- **Un traitement pour la peau ou hormonal** → Roaccutane (isotrétinoïne) · Crème sur ordonnance (trétinoïne, adapalène…) · Antibiotiques · Traitement hormonal ou pilule.

## Ce qui accompagne le parcours
- **Koda** (le soleil, sans mains) accompagne et réagit aux réponses. Expressions : heureux, clin d'œil, joie, calme, curieux.
- **Le prénom** revient dans les messages et sur le profil final.
- Chaque étape a une **intro** (numéro, titre, une phrase) et une **fin** (bravo, le nombre de choix, ce qui a été identifié, puis la carte).

## Le Skyn Profile final
- Les 7 étapes cochées.
- Sections : Tes objectifs · Ta peau (type, et sensible si oui) · Ce qu'on va suivre (3 premiers, puis « + N autres ») · Ce qu'on évite pour toi (« Sans parfum »…) · On fait attention à (grossesse, traitement) · On choisit pour toi :
  - selon l'âge : routine simple / prévention / éclat et ridules / fermeté et confort ;
  - ménopause en cours ou après : peau bien nourrie ;
  - teintes 4 à 6 : SPF sans traces blanches et soins doux pour les taches.
- Boutons : Découvrir mon profil · Partager mon profil.

## Les images déjà prêtes (dans le projet)
- `assets/conditions/` : toutes les photos des problèmes, des tests de peau, des cernes, des lèvres et du cou, plus `face-zones.jpg`.
- `assets/koda/` : les 5 expressions de Koda.
- `assets/scenes/` : la carte de nuit, le bol de cristal, le miroir et le cœur de lumière.
- `assets/icons/` : les 8 icônes 3D des étapes.
