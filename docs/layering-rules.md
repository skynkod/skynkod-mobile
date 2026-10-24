# Guide « How to apply » de Skynkod — règles à faire relire

Document destiné au ou à la dermatologue (ou pharmacien·ne) qui relit le guide avant la sortie de l'app.

**Ce que fait le guide (fonction Premium).** À partir de la routine enregistrée par l'utilisatrice (ses propres produits, matin et soir), l'app affiche :
- l'ordre d'application ;
- pour chaque produit, la quantité et la façon de l'appliquer ;
- quels soirs reçoivent quel actif fort.

**Comment il est construit.**
- Uniquement des règles fixes (pas d'intelligence artificielle), appliquées à la vraie liste INCI de chaque produit.
- Chaque règle vient d'une source reconnue, citée ci-dessous et affichée dans l'app.
- Pas de fausse précision : aucun temps d'attente chiffré entre deux produits (« laissez absorber avant la couche suivante »).
- Koda peut expliquer ces règles, mais jamais en inventer.

**Ce que le guide ne fait pas.** Il ne remplace pas un avis médical. L'app affiche : « General guidance from dermatology sources, not a medical prescription. If you use a prescribed treatment, follow your doctor's instructions. » Les alertes d'incompatibilité (rétinoïde + acide le même soir, vitamine C + peroxyde de benzoyle, exfoliation trop fréquente, absence de SPF) existent déjà dans l'app et restent gratuites, car elles relèvent de la sécurité.

---

## 1. Les règles

| # | Règle telle qu'affichée (traduite) | Source |
|---|---|---|
| 1 | Nettoyer d'abord, puis appliquer les traitements juste après le nettoyage. | [AAD](https://www.aad.org/public/skin-hair-nails/skin-care/skin-care-products) |
| 2 | Appliquer du plus fluide au plus épais, pour que les produits légers atteignent la peau. | [Cleveland Clinic](https://health.clevelandclinic.org/proper-skin-care-product-order) |
| 3 | Contour des yeux : avec l'annulaire, qui tire le moins sur la peau fine. La crème yeux se met après les sérums, avant la crème hydratante. | AAD, Cleveland Clinic |
| 4 | Une huile visage se met juste avant la crème hydratante. | Cleveland Clinic |
| 5 | Crème hydratante et écran solaire après les traitements ; l'écran solaire est la dernière étape de soin le matin. | AAD, Cleveland Clinic |
| 6 | Visage : au moins 1 cuillère à café d'écran solaire (environ la longueur de l'index et du majeur), environ 15 minutes avant de sortir, à renouveler toutes les 2 heures en extérieur. | [AAD, How to apply sunscreen](https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen) |
| 7 | Rétinoïdes le soir uniquement : la lumière peut les désactiver. | Cleveland Clinic, AAD (fiche patient) |
| 8 | Une quantité de la taille d'un petit pois suffit pour tout le visage, sur peau parfaitement sèche, avec une crème hydratante par-dessus. Commencer un soir sur 2 ou 3, et augmenter seulement si la peau le tolère. | [AAD, fiche patient « How to use topical retinoids »](https://www.alabamaderm.com/articles/aad_education_library/920179-how-to-use-topical-retinoids) |
| 9 | La vitamine C agit mieux le matin, avant l'écran solaire : elle renforce l'écran solaire, elle ne le remplace pas. | Cleveland Clinic ; [Al-Niaimi & Chiang, J Clin Aesthet Dermatol 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5605218/) |
| 10 | Ne pas utiliser la vitamine C en même temps que des acides exfoliants (AHA) : à des moments différents. | Cleveland Clinic |
| 11 | Traitements localisés (acide salicylique, peroxyde de benzoyle) sur les boutons juste après le nettoyage ; porter un écran solaire, car ils peuvent augmenter la sensibilité au soleil. | Cleveland Clinic |
| 12 | Trop de produits anti-âge à la fois peuvent irriter : un seul actif fort par soir suffit. | AAD |
| 13 | Le cou vieillit comme le visage : y appliquer nettoyant, sérums, crème et écran solaire. Avec le rétinol, commencer sur le cou une fois que le visage le tolère bien. | AAD |
| 14 | Les lèvres brûlent aussi : au soleil, un baume à lèvres avec SPF, à renouveler souvent. | AAD, How to apply sunscreen |
| 15 | Contour des yeux (ajouté le 24/10/2026) : peptides chaque jour (Argireline, Matrixyl, peptides de cuivre) ; rétinol ou rétinal pour les yeux le soir uniquement, 2 à 3 soirs par semaine, sur l'os orbital et pas sur la paupière ; les autres soirs, la crème aux peptides. | Études citées dans le guide des ingrédients ; règles 7 et 8 |
| 16 | Lèvres : gommage doux 1 à 2 fois par semaine, masque à lèvres épais la nuit 1 à 2 fois par semaine. | À valider par la relectrice |

## 2. Comment l'app range les produits

Les produits sont classés par « couche », du plus fluide au plus épais. À rang égal, l'ordre choisi par l'utilisatrice est gardé.

1. Nettoyant
2. Traitement localisé (boutons)
3. Exfoliant sans rinçage (lotion, pads, liquide BHA/AHA)
4. Lotion tonique
5. Essence / ampoule
6. Sérum (un sérum contenant un rétinoïde passe après les autres sérums)
7. Contour des yeux
8. Huile visage (sérum ou soin dont les 2 premiers ingrédients sont une huile, sans eau)
9. Crème hydratante
10. Masque de nuit (dernière étape du soir)
11. Écran solaire (dernière étape du matin)
12. Lèvres : gommage (1 à 2 fois par semaine), puis baume (SPF le matin), puis masque à lèvres la nuit (1 à 2 fois par semaine)

Les produits pour les yeux et les lèvres ne comptent pas comme « actif fort » du visage dans le tableau des soirs.

Les masques à rincer : « après le nettoyage, selon l'étiquette, puis rincer et continuer la routine ».

## 3. Comment l'app reconnaît les actifs

D'après la liste INCI réelle et le nom du produit :
- **Rétinoïde** : rétinol (et ses formes présentes dans le guide des ingrédients).
- **Acide exfoliant** : acide glycolique, salicylique, lactique, mandélique, ou un nom contenant AHA, BHA, peel, exfoli.
- **Vitamine C**.
- **Peroxyde de benzoyle**.
- **Filtre solaire** : catégorie « écran solaire », oxyde de zinc ou filtres chimiques.

## 4. Les messages affichés selon la routine

- Rétinoïde dans la routine du matin → « Déplacez votre rétinoïde le soir. » (règle 7)
- Pas d'écran solaire le matin → « Terminez par un écran solaire chaque matin. » (règle 5)
- Vitamine C le soir → « Elle agirait mieux le matin, avant l'écran solaire. » (règle 9)
- Vitamine C et acide le même jour → « Utilisez-les à des moments différents. » (règle 10)
- Deux actifs forts le même soir → « Gardez un seul actif fort par soir. » (règle 12), avec le tableau des soirs de la semaine.

## 5. Questions pour la relecture

1. Ces règles et leur formulation vous semblent-elles justes et suffisantes pour un public non médical ?
2. L'ordre des couches (section 2) vous convient-il, en particulier la place du traitement localisé, de l'exfoliant sans rinçage et de l'huile ?
3. Faut-il ajouter une règle (par exemple pour les peaux sensibles : rétinoïde appliqué entre deux couches de crème) ?
4. Les quantités ne sont données que lorsqu'une source les précise (rétinoïde, écran solaire). Faut-il en donner pour d'autres produits ?

*Les règles sont aussi dans le code de l'app (utils/layering.js), avec les mêmes sources.*
