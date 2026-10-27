# Le livre de règles des routines Skynkod

Version du 27 octobre 2026. **Brouillon : une dermatologue ou une pharmacienne doit le relire avant la sortie.**

Ce livre dit comment Skynkod construit chaque routine : la routine de base gratuite et Rekod. Le code doit suivre ces règles à la lettre, sans IA pour décider. Koda peut expliquer une règle, jamais en inventer une.

Il remplace `docs/rekod/regles-rekod.html` (19 octobre). Il reprend ce document et ajoute toutes les règles écrites depuis : démaquillant, yeux, lèvres, âge, teinte, ménopause, peroxyde de benzoyle, routine gratuite.

Skynkod donne des conseils cosmétiques. Il ne pose pas de diagnostic, ne remplace pas une consultation et ne modifie jamais un traitement prescrit.

---

## 0. Comment lire ce livre

Chaque règle porte un niveau de preuve :

| Niveau | Ce que ça veut dire |
|---|---|
| 🟢 **Officiel** | Une recommandation d'une société savante ou d'une autorité : AAD (Académie américaine de dermatologie), NICE (autorité de santé britannique), FDA (autorité américaine du médicament), NRS (Société nationale de la rosacée, États-Unis). |
| 🔵 **Études** | Des essais cliniques ou des synthèses publiées, sans recommandation officielle. |
| 🟡 **Pratique des dermatologues** | Ce que les dermatologues conseillent couramment, sans essai qui le prouve. On y trouve aussi les conseils des dermatologues qui font de la pédagogie (Dr Shereene Idriss, Dr Whitney Bowe…). |
| ⚪ **Choix Skynkod** | Une prudence ou un choix pratique de notre part, à valider par la relectrice. |

Et un état dans le code :
- ✅ **le code suit la règle**
- ❌ **écart** (détaillé dans la section 9)

**Ce que la relectrice doit vérifier :** les règles 🟡 et ⚪ en priorité.

---

## 1. Les sources

### Recommandations officielles 🟢
- **Acné, AAD 2024** : Reynolds RV et al. *Guidelines of care for the management of acne vulgaris.* J Am Acad Dermatol 2024;90(5):1006.e1-30.
  - Recommandation forte : peroxyde de benzoyle, rétinoïdes en crème, antibiotiques locaux associés au peroxyde.
  - Recommandation sous condition : acide azélaïque (preuve modérée, « particulièrement utile pour les peaux sensibles ou foncées ») et acide salicylique (preuve faible). [Résumé](https://www.healthday.com/healthpro-news/skin-health/aad-updates-guidelines-for-management-of-acne-vulgaris)
- **Acné, NICE NG198 (2021, revue en 2026)** : nettoyant doux non alcalin (« syndet ») deux fois par jour ; crème, SPF et maquillage non gras et non comédogènes ; démaquiller le soir ; ne pas toucher les boutons (cicatrices). [Texte](https://www.nice.org.uk/guidance/ng198/chapter/recommendations)
- **Eczéma de l'adulte, AAD 2023** : Sidbury R et al. J Am Acad Dermatol 2023;89(1):e1-e20. La crème hydratante est une recommandation forte. [Résumé](https://www.aad.org/news/updated-atopic-dermatitis-guidelines-topical-therapies)
- **Rosacée, NRS 2019** : Thiboutot D et al. J Am Acad Dermatol 2020;82(6):1501-1510. Nettoyant doux, crème hydratante et crème solaire chaque jour.
  - Selon l'enquête de la NRS, les irritants les plus cités sont l'alcool, l'hamamélis, le parfum, le menthol, la menthe poivrée et l'eucalyptus. [NRS](https://www.rosacea.org/patients/materials/coping-with-rosacea/coping-with-common-triggers)
- **Acide azélaïque 15 %** : autorisé par la FDA pour les boutons de la rosacée (2002). Effets courants : picotements (29 %), démangeaisons (11 %).
- **Crème solaire, AAD** : large spectre (UVA et UVB), SPF 30 ou plus, résistante à l'eau ; renouveler environ toutes les 2 heures dehors. [FAQ AAD](https://www.aad.org/media/stats/prevention-and-care/sunscreen-faqs)
- **AHA, FDA 2005** : les AHA rendent la peau plus sensible au soleil pendant l'utilisation et jusqu'à une semaine après. Il faut une crème solaire. [FDA](https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids)
- **Ados et jeunes, AAD** : pour les ados, nettoyer, hydrater et se protéger du soleil. Pas d'actifs anti-âge comme le rétinol ; un rétinoïde contre l'acné seulement sur avis d'une dermatologue. [AAD](https://www.aad.org/news/dermatologist-guide-skincare)
- **Isotrétinoïne, conseils des hôpitaux britanniques (NHS)** :
  - une routine en 2 étapes, nettoyant doux et crème ;
  - arrêter les acides, le peroxyde de benzoyle et les rétinoïdes ;
  - baume à lèvres, et SPF ;
  - pas d'épilation à la cire, de laser ni de dermabrasion pendant le traitement et 6 mois après.
  - Sources : [Royal Berkshire](https://www.royalberkshire.nhs.uk/media/mqlnuujf/skincare-routine-while-on-isotretinoin_may24.pdf), [King's College](https://www.kch.nhs.uk/wp-content/uploads/2023/01/pl-1018.1-skin-care-routine-while-taking-isotretinoin.pdf), [AAD](https://aad.org/public/diseases/acne/derm-treat/isotretinoin/side-effects).

### Études et synthèses 🔵
- **Crème solaire et vieillissement** : Hughes MCB 2013, Ann Intern Med (essai randomisé).
- **Rétinoïdes et âge** : Mukherjee S 2006, Clin Interv Aging.
- **Acides AHA et BHA** : Kornhauser A 2010.
- **Niacinamide** : Draelos ZD 2006 (sébum) ; Bissett DL 2005 (peau qui vieillit) ; Navarrete-Solís 2011 (mélasma).
- **Vitamine C** : Telang PS 2013 ; Al-Niaimi F 2017.
- **Bakuchiol** : Dhaliwal S 2019 (comparé au rétinol).
- **Peptides** : Robinson 2005, Gorouhi 2009, Pickart 2018, Blanes-Mira 2002.
- **Acide azélaïque et marques brunes après les boutons** : Kircik LH 2011.
- **Acide tranexamique** : Taraz M 2017.
- **Céramides** : Draelos ZD 2018.
- **Hydratants** : Purnamawati S 2017.
- **Grossesse** : Bozzo P 2011, Can Fam Physician.
  - Acide azélaïque et peroxyde de benzoyle : généralement acceptés.
  - Acide glycolique : probablement sans risque.
  - Acide salicylique : faible dose acceptée, pas de peeling.
  - Rétinoïdes : à éviter.
- **Marques brunes après les boutons sur peau foncée** :
  - Synthèse dans [J Clin Aesthet Dermatol](https://jcadonline.com/postinflammatory-hyperpigmentation-a-review-of-the-epidemiology-clinical-features-and-treatment-options-in-skin-of-color/) : soigner l'inflammation tôt, protéger du soleil, et éviter l'irritation, qui crée elle-même des taches.
- **Crème solaire teintée (oxydes de fer)** :
  - Synthèse 2024 (Int J Dermatol) : à préférer pour les peaux qui marquent facilement, car elle protège aussi de la lumière visible.
  - Un essai sur le mélasma : MASI −75 % contre −60 % avec une crème solaire qui ne protège que des UV. [Résumé](https://practicaldermatology.com/news/iron-oxides-in-tinted-sunscreens-may-improve-hyperpigmentation-protection-study/2487035)
- **Dermatite périorale** : l'arrêt de tous les produits (« thérapie zéro ») est le traitement de choix des formes légères. Les crèmes à la cortisone sont contre-indiquées. [PubMed 26415314](https://pubmed.ncbi.nlm.nih.gov/26415314/)
- **Ménopause** : la baisse des œstrogènes rend la peau plus sèche et sa barrière plus fragile. [Int J Women's Dermatol 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6451761)
- **Contour des yeux** : peu d'essais sur les crèmes pour les yeux (synthèse 2024, Int J Women's Dermatol). La crème du visage et le SPF sont la base ; une crème pour les yeux est un plus, au bénéfice modeste.
- **Trétinoïne et peroxyde de benzoyle** :
  - Le peroxyde dégrade la trétinoïne classique (50 % en 2 heures quand on mélange les deux).
  - L'adapalène et certaines nouvelles formules résistent. [JCAD](https://jcadonline.com/absence-of-degradation-of-tretinoin-when-benzoyl-peroxide-is-combined-with-an-optimized-formulation-of-tretinoin-gel-0-05-2/)

- **Vitamine C** : une revue systématique ([J Clin Aesthet Dermatol](https://jcadonline.com/clinical-applications-of-vitamin-c-in-dermatology-a-systematic-review/)) montre que l'acide ascorbique pur est la forme la plus prouvée, et que l'ascorbyl glucoside et le tétrahexyldécyl ascorbate sont mieux tolérés.
- **Marques rouges après les boutons** : une revue systématique ([PubMed 35076997](https://pubmed.ncbi.nlm.nih.gov/35076997/)) et un essai comparant acide azélaïque 20 % et acide tranexamique 5 % ([PMC10199364](https://pmc.ncbi.nlm.nih.gov/articles/PMC10199364/)).

### Pratique des dermatologues 🟡
- **Rétinoïdes** : commencer 2 soirs par semaine, puis un soir sur deux, puis tous les soirs si la peau le tolère. Une noisette pour tout le visage, sur peau sèche, et de la crème. Si la peau s'irrite, on arrête, on hydrate, puis on reprend lentement (fiches patients de l'AAD).
- **Skin cycling (Dr Whitney Bowe)** : alterner les soirs actifs et les soirs de récupération.
  - Il n'existe **aucun essai sur le planning lui-même** ; seuls ses actifs ont été étudiés.
  - Pour une rosacée ou un eczéma, il faut plus de soirs de récupération. [Dermatology Times](https://www.dermatologytimes.com/view/social-media-mythbusters-skin-cycling)
- **Dr Shereene Idriss** (conseils écrits, pas ses vidéos, que je ne peux pas regarder) :
  - un matin court : antioxydant, crème si besoin, SPF 50 renouvelé dehors ;
  - de l'eau le matin et un nettoyant le soir peuvent suffire ;
  - le rétinol quelques soirs par semaine, sans chercher l'effet rapide ;
  - ne pas mettre un rétinoïde et un acide le même soir chez une débutante ;
  - la façon d'utiliser un produit compte plus que son prix.
  - Sources : [dridriss.com](https://dridriss.com/blogs/news/morning-skincare-routine-dermatologists-5-minute-simple-effective-regimen), [Daily Vanity](https://dailyvanity.sg/beauty-tips/20s-skincare-must-haves/).
- **Niacinamide et vitamine C ensemble** : sans problème avec les produits modernes. La vieille idée vient d'essais en laboratoire (chaleur, solution pure).

**Ce que je n'ai pas pu vérifier :**
- le texte complet du guide AAD 2024 (je l'ai lu à travers des résumés) ;
- le consensus 2022 sur la protection solaire de toutes les teintes ;
- les vidéos de la Dr Idriss.

La relectrice doit contrôler ces trois points.

---

## 2. La base de toutes les routines (routine gratuite)

Matin : nettoyant → crème → SPF. Soir : démaquillant → nettoyant → crème.

| # | Règle | Preuve | Code |
|---|---|---|---|
| B1 | Crème solaire tous les matins, en dernière étape. C'est le geste anti-âge et anti-taches le plus prouvé. | 🟢 AAD · 🔵 Hughes 2013 | ✅ |
| B2 | La crème solaire est **large spectre (UVA et UVB)** et SPF 30 au minimum : un filtre UVA dans la liste, ou « UVA », « large spectre », « PA+++ » ou « zinc » sur l'étiquette. Jamais de SPF 15 ou 20. Skynkod préfère SPF 50. | 🟢 AAD · ⚪ SPF 50 | ✅ |
| B3 | Nettoyant doux, sans savon, non alcalin, sans grains. | 🟢 NICE | ✅ |
| B4 | Le matin : **pas de nettoyant**, une brume d'eau thermale (ou d'eau tiède), puis on tamponne. Le nettoyage du soir suffit, et la peau garde ses huiles protectrices. Sauf peau grasse ou à tendance acnéique : nettoyant doux matin et soir (NICE). | 🟡 Idriss, ancien livre | ✅ |
| B5 | Le soir, on enlève le maquillage et la crème solaire avant de nettoyer (double nettoyage). Utile surtout avec du maquillage, un SPF résistant à l'eau ou un SPF minéral. | 🟢 NICE (démaquiller) · 🟡 double nettoyage | ✅ (étape chaque soir, car SPF chaque matin) |
| B6 | Crème hydratante matin et soir. Texture selon la peau : légère pour une peau grasse ou qui transpire, riche pour une peau sèche ou ménopausée. | 🟢 AAD eczéma · 🔵 Purnamawati · ⚪ textures | ✅ |
| B7 | Peau à tendance acnéique : crème, SPF et démaquillant non comédogènes, sans huiles lourdes. | 🟢 NICE | ✅ (moteur des verdicts) |
| B8 | Aucun actif fort dans les étapes de base : pas de rétinoïde, d'acide exfoliant ni de vitamine C concentrée. | ⚪ | ✅ |
| B9 | Seulement des produits dont la liste d'ingrédients complète est connue et 100 % compatibles avec son profil. Sinon le plus doux, en expliquant pourquoi. Jamais un produit « à éviter ». | ⚪ | ✅ |
| B10 | Ses propres produits d'abord, s'ils lui conviennent. | ⚪ | ✅ |
| B11 | Même profil, même routine (pas de hasard). | ⚪ | ✅ |

---

## 3. Introduire les actifs (rythme)

| # | Règle | Preuve | Code |
|---|---|---|---|
| R1 | **Un seul nouvel actif fort à la fois**, 2 semaines d'écart, le plus utile d'abord : le soir Traitement (semaine 1), puis le peroxyde de benzoyle s'il y a des boutons rouges, puis la vitamine C, puis l'exfoliation. Les soins doux (niacinamide, peptides, acide hyaluronique) ne comptent pas. Ses 2 premières semaines, l'exfoliation prend la place d'un soir Traitement. | 🟡 pratique courante | ✅ |
| R2 | Rétinoïde : 2 soirs par semaine au départ, puis plus souvent si tout va bien. Au moins 2 semaines à chaque palier. | 🟡 fiches AAD | ✅ |
| R3 | Rétinoïde : une noisette pour tout le visage, sur peau sèche, crème par-dessus ; éviter le coin des yeux, du nez et de la bouche. | 🟡 fiches AAD | ✅ (guide d'application) |
| R4 | Débutante ou peau sensible : rétinol faible (0,1–0,3 %) ou rétinal faible. Habituée : plus fort. | 🔵 Mukherjee · 🟡 | ✅ |
| R5 | Acide exfoliant : pas avant la semaine 3 ; 2 soirs maximum (1 pour une peau sensible). Peelings et acides à 15 % ou plus seulement pour une peau habituée. | 🔵 Kornhauser · ⚪ | ✅ |
| R6 | Jamais un rétinoïde et un acide exfoliant le même soir, ni deux soirs de suite. | 🟡 Idriss, Bowe | ✅ |
| R7 | Peroxyde de benzoyle : jamais en même temps que la trétinoïne classique (on sépare matin et soir, ou on change de soir). L'adapalène le supporte. | 🔵 études de stabilité | ✅ (soirs Réparation et Reset) |
| R8 | Bilan chaque semaine. « Un peu » : on reste au même palier et un soir actif devient un soir Reset. « Beaucoup » : une semaine de repos, puis un palier plus bas. Gonflement, plaques qui suintent ou réaction qui s'étend : on arrête et on consulte. | 🟡 fiches AAD | ✅ |
| R9 | Les premières semaines d'un rétinoïde, la peau peut sembler pire (purge). Avant 8 à 12 semaines, on ne conclut pas que ça ne marche pas. | 🟡 | ✅ |
| R10 | 3 actifs forts au maximum (rétinoïde, acide, peroxyde de benzoyle), chacun sur ses soirs. **2 pour une peau sensible ou après une réaction** (bilan « un peu » ou « beaucoup », et 2 semaines après une semaine de repos) : avec des boutons rouges, on garde le rétinoïde et le peroxyde, la paire la plus prouvée, et l'exfoliation s'arrête. | ⚪ à décider | ✅ |
| R11 | Test de tolérance : la quantité habituelle sur une zone de la taille d'une pièce, au pli du coude, matin et soir, pendant 7 à 10 jours (un nettoyant : 5 minutes puis rincer). Puis sur le visage un soir sur deux la première semaine. Une allergie peut mettre plusieurs jours à apparaître. | 🟢 AAD | ✅ (l'app demande le résultat au 7e jour) |
| R12 | Délais honnêtes : acné, premier changement en 4 à 6 semaines et plus net vers 12 (AAD) ; rides, premier changement vers 12 semaines et résultat net vers 6 mois (essais sur les rétinoïdes) ; taches, 8 à 12 semaines. Jamais de promesse plus rapide. | 🟢 AAD · 🔵 études | ✅ |
| R13 | Acné toujours là après 12 semaines régulières : on propose une seule fois, sans l'imposer, un essai de 6 à 8 semaines avec moins de lait et de sucres rapides, à noter dans le journal. On ne l'interdit jamais. | 🔵 méta-analyse sur le lait (Nutrients 2018) ; essai randomisé sur les sucres rapides (Smith 2007) ; lien modeste, sans preuve de cause | ✅ (fin de Rekod, Koda) |

---

## 4. La semaine Rekod (skin cycling)

Les soirs tournent : **Exfoliation**, **Traitement** (rétinol, acide azélaïque ou traitement doux), **Réparation** et **Reset** (aucun actif).

| # | Règle | Preuve | Code |
|---|---|---|---|
| S1 | Au moins 3 soirs sans actif fort par semaine ; au maximum 4 soirs actifs forts, 3 pour une peau sensible. | 🟡 Bowe · ⚪ | ✅ |
| S2 | Un soir Exfoliation n'est jamais à côté d'un autre soir actif fort (dimanche–lundi compris). Peau sensible : jamais deux soirs actifs forts d'affilée. | 🟡 · ⚪ | ✅ |
| S3 | Le rétinoïde : 4 soirs par semaine au maximum, le rythme que Skynkod conseille. **Les guides permettent d'aller jusqu'à tous les soirs** : c'est un choix de tolérance de Skynkod. Elle peut en ajouter elle-même dans Rekod, jusqu'à 7, après un avertissement. Pas pour une peau sensible, ni pendant la grossesse. Si sa peau réagit, on revient au rythme conseillé et on lui explique pourquoi. | ⚪ à décider | ✅ |
| S4 | Pas de produit sûr pour un soir actif : le soir devient Réparation, jamais un soir vide. | ⚪ | ✅ |
| S5 | Le planning lui-même n'a pas d'essai clinique : on ne le présente jamais comme « prouvé ». | 🟡 | ✅ |

---

## 5. Par préoccupation

### Acné (points noirs, boutons rouges, hormonale)
| # | Règle | Preuve | Code |
|---|---|---|---|
| A1 | La base prouvée : **un rétinoïde** (points noirs et boutons) et **le peroxyde de benzoyle** (boutons rouges). Le peroxyde est une vraie étape, en couche fine sur **toute la zone** où sortent les boutons, et pas seulement sur les boutons, les soirs Réparation et Reset. | 🟢 AAD 2024, recommandation forte | ✅ |
| A2 | Acide salicylique (BHA) sur les soirs Exfoliation : utile pour les pores bouchés, mais la preuve est faible. Ce n'est jamais le seul actif contre l'acné. | 🟢 AAD (sous condition) | ✅ |
| A3 | Acide azélaïque : bonne alternative, surtout pour les peaux sensibles ou foncées. | 🟢 AAD (sous condition) | ✅ |
| A4 | Niacinamide le matin (sébum, apaisement). | 🔵 Draelos 2006 | ✅ |
| A5 | Ne pas toucher les boutons : risque de cicatrices. Koda le rappelle. | 🟢 NICE | ✅ (Koda) |
| A6 | Boutons profonds et douloureux (kystes) : **on conseille d'abord une dermatologue**. Une routine douce reste possible en attendant, sans actifs forts ajoutés. | 🟢 AAD (isotrétinoïne pour l'acné sévère) | ✅ |
| A7 | Premiers résultats vers 6 à 8 semaines, net vers 12. | 🟢 AAD | ✅ |

### Taches brunes, marques, mélasma
| # | Règle | Preuve | Code |
|---|---|---|---|
| T1 | SPF chaque matin : sans lui, aucun actif ne suffit. | 🟢 AAD · 🔵 | ✅ |
| T2 | Taches, marques, mélasma ou peau foncée : **le SPF teinté aux oxydes de fer est conseillé, jamais imposé** (il protège aussi de la lumière visible). Le conseil est écrit sur l'étape SPF. | 🔵 synthèse 2024 | ✅ |
| T3 | Actifs : acide azélaïque, rétinoïde, niacinamide, vitamine C, acide tranexamique, arbutine. | 🔵 Kircik, Taraz, Navarrete-Solís | ✅ |
| T4 | Éviter l'irritation : sur peau foncée, l'irritation crée de nouvelles taches. | 🔵 synthèse JCAD | ✅ (acides doux) |
| T5 | Mélasma : avis médical conseillé (la contraception hormonale peut le déclencher). La chaleur (sauna, hammam, sport à forte chaleur) peut aussi le foncer : c'est écrit sur l'étape SPF. | 🟡 (chaleur : avis de cliniciens, pas d'étude) | ✅ |
| T6 | Marques rouges après les boutons : acide tranexamique les soirs Réparation, acide azélaïque possible. Pour les marques qui durent des mois, le laser vasculaire chez une dermatologue est le plus efficace : on le dit honnêtement. | 🔵 revue systématique 2022 (PubMed 35076997), essai 2023 (PMC10199364) | ✅ |

### Rides, fermeté
| # | Règle | Preuve | Code |
|---|---|---|---|
| F1 | SPF chaque matin, puis rétinoïde : les deux gestes les plus prouvés. | 🟢 · 🔵 | ✅ |
| F2 | Vitamine C le matin (antioxydant) ; peptides et niacinamide en plus. | 🔵 (preuve modérée) | ✅ |
| F3 | On ne promet pas de « rajeunir » : une peau plus lisse, en 8 à 12 semaines. | ⚪ | ✅ |

### Éclat, pores, brillance
| # | Règle | Preuve | Code |
|---|---|---|---|
| C1 | Éclat : AHA (glycolique ou lactique) le soir, vitamine C le matin. Une débutante qui ne veut que de l'éclat commence sans rétinoïde. | 🔵 | ✅ |
| C2 | Pores : on ne peut pas les « fermer ». BHA, rétinoïde et niacinamide les rendent moins visibles. | 🔵 | ✅ |
| C3 | AHA : SPF obligatoire pendant l'utilisation et une semaine après. | 🟢 FDA | ✅ (SPF chaque matin) |
| C4 | Peau mixte : l'acide salicylique seulement sur la zone T et là où sortent les boutons, pas sur les joues sèches. | 🟡 dermatologues dans la presse | ✅ (conseil sur l'étape) |

### Rougeurs, peau sensible, peau sèche ou déshydratée
| # | Règle | Preuve | Code |
|---|---|---|---|
| P1 | La barrière d'abord : céramides, glycérine, panthénol ; pas d'acides les 4 premières semaines. | 🟢 AAD eczéma · 🔵 Draelos 2018 | ✅ |
| P2 | Sans parfum, sans alcool asséchant, sans huiles essentielles ni menthol. | 🟢 NRS | ✅ (moteur) |
| P3 | SPF minéral (oxyde de zinc) de préférence. | 🟡 | ✅ |
| P4 | Pas de vitamine C pure (acide ascorbique) : un dérivé plus doux (ascorbyl glucoside, tétrahexyldécyl ascorbate…) ou de la niacinamide à la place. | 🔵 revue systématique, J Clin Aesthet Dermatol 2025 | ✅ |
| P5 | Peau sèche ou déshydratée : sérum hydratant sur peau humide, crème riche, couche occlusive le soir sur les zones sèches. | 🔵 Purnamawati | ✅ |

### Yeux, lèvres, cou
| # | Règle | Preuve | Code |
|---|---|---|---|
| Y1 | Crème pour les yeux : facultative (peu de preuves). La crème du visage et le SPF suffisent à la base. | 🔵 synthèse 2024 | ✅ (facultatif) |
| Y2 | Cernes : le type compte (bleutés, bruns, creusés). Pour les cernes creusés, une crème ne change presque rien : on le dit honnêtement. | 🔵 · ⚪ | ✅ |
| Y3 | Lèvres : baume avec SPF le jour, baume nourrissant le soir. | 🟢 AAD | ✅ (facultatif) |
| Y4 | Cou : les mêmes produits que le visage, descendus jusqu'au cou ; le rétinol seulement quand le visage le tolère. | 🟡 | ✅ (guide d'application) |
| Y5 | Grains de milium : une crème pour les yeux légère, jamais un baume riche autour des yeux. | 🟡 explication logique, pas d'étude | ✅ |

---

## 6. Situations particulières

### Grossesse et allaitement
| # | Règle | Preuve | Code |
|---|---|---|---|
| G1 | **Aucun rétinoïde** (rétinol, rétinal, adapalène, trétinoïne), ni hydroquinone. | 🟢 · 🔵 Bozzo | ✅ |
| G2 | Le soir Traitement devient **acide azélaïque, pour tous les objectifs**, anti-âge compris : c'est l'actif le mieux étudié pendant la grossesse. Il aide l'acné, les taches et les rougeurs, peu les rides. | 🔵 | ✅ |
| G3 | Pas d'acide salicylique à forte dose ni de peeling ; AHA doux possibles. | 🔵 | ✅ |
| G4 | Peroxyde de benzoyle : généralement accepté ; Koda dit « parles-en à ton médecin ou ta sage-femme ». | 🔵 (avis partagés) | ✅ (note « en parler ») |
| G5 | Si elle a aussi un traitement sur ordonnance (par exemple trétinoïne) : **alerte claire, en parler tout de suite à son médecin.** | 🟢 | ✅ |

### Âge
| # | Règle | Preuve | Code |
|---|---|---|---|
| J1 | 18–24 ans sans objectif anti-âge, acné ou taches : pas de rétinol. La base (nettoyer, hydrater, SPF) suffit, et un traitement doux si besoin. | 🟢 AAD (ados) · ⚪ extension aux 18–24 ans | ✅ |
| J2 | Ménopause : crème riche, acides doux ; le rétinoïde reste utile si la peau le tolère. | 🔵 IJWD 2019 | ✅ |

### Teinte de peau (pastilles 4 à 6)
| # | Règle | Preuve | Code |
|---|---|---|---|
| D1 | Acides doux (mandélique, PHA, lactique), jamais de peeling fort. | 🔵 synthèse JCAD | ✅ |
| D2 | Acné ou marques : **acide azélaïque les 4 premières semaines, puis rétinol doux** (2 soirs les semaines 5 et 6). | 🟢 AAD | ✅ |
| D3 | SPF : alerte « traces blanches » pour les SPF minéraux ; SPF teinté de préférence. | 🔵 | ✅ |

### Maladies diagnostiquées (avec son accord pour les données de santé)
| # | Règle | Preuve | Code |
|---|---|---|---|
| M1 | **Rosacée** : nettoyant doux, crème, SPF minéral ; sans les irritants listés par la NRS ; pas d'exfoliation. Acide azélaïque possible. **Pas de rétinol sans l'avis de sa dermatologue** : c'est un déclencheur connu, et notre moteur le classe lui-même ainsi. | 🟢 NRS · FDA azélaïque | ✅ |
| M2 | **Eczéma** : la crème hydratante est le traitement de base. Pas d'acides ; **pas de rétinol sans avis**. | 🟢 AAD 2023 | ✅ |
| M3 | **Dermatite périorale** : routine minimale (« thérapie zéro ») : nettoyant doux, crème légère, SPF. Pas de crème riche ou occlusive, pas de cortisone, pas d'actifs ajoutés par Skynkod. | 🔵 | ✅ |
| M4 | **Dermatite séborrhéique** : douceur, pas d'alcool. L'antifongique (kétoconazole, zinc pyrithione) est un traitement : sur avis médical. | 🔵 (preuve faible pour les huiles) | ✅ en partie |
| M5 | **Psoriasis du visage** : traité comme une peau sensible (pas d'acides forts, barrière d'abord), avis médical. | 🟡 | ✅ |
| M6 | **Acné fongique suspectée** : on évite certains ingrédients (preuve faible, surtout des essais en laboratoire) et on conseille un avis médical. | 🔵 faible | ✅ |

### Après un soin en institut (peeling, laser, microneedling)
| # | Règle | Preuve | Code |
|---|---|---|---|
| I1 | Plan SOS « Après un soin » : les consignes du praticien d'abord. 7 jours sans rétinol, acides, vitamine C ni gommage ; nettoyant doux, soin apaisant, crème, SPF minéral ; le moins de soleil et de chaleur possible. Après un laser : actifs en pause environ 2 semaines. Reprise un actif à la fois, la niacinamide d'abord. | 🟡 consignes de cliniques, pas de recommandation officielle | ✅ |
| I2 | Plan SOS « Coup de soleil » : douches fraîches, crème à l'aloe ou au soja sur peau humide, boire plus, ibuprofène ou aspirine si besoin (avis du pharmacien), ne jamais percer les cloques (vaseline dessus). Aucun actif ; reprise quand la peau ne pèle plus. Médecin le jour même si fièvre, frissons, nausées ou grandes cloques. | 🟢 AAD | ✅ |
| I3 | Plan SOS « Après une épilation à la cire » : 48 à 72 heures sans actifs, sans soleil, sauna ni sport intense ; compresse fraîche, soin apaisant, SPF minéral. Jamais de cire sur une peau sous rétinoïde, trétinoïne ou isotrétinoïne, ni dans la semaine après un peeling. | 🟡 pratique ; notices des rétinoïdes | ✅ |

### Traitements
Principe ⚪ : **son traitement prescrit est l'actif principal.** Skynkod n'ajoute pas un autre actif fort de même effet. Il construit autour une base douce et met son traitement dans la routine, aux moments prescrits. Skynkod ne change jamais une dose ni un rythme prescrits.

| # | Traitement | Règle | Preuve | Code |
|---|---|---|---|---|
| X1 | **Isotrétinoïne** (Roaccutane, Curacné) | Nettoyant doux et crème (riche si besoin), SPF ; **baume à lèvres indispensable** (pas facultatif) ; aucun acide, rétinoïde ni peroxyde de benzoyle ; pas de gommage des lèvres ; pas d'épilation à la cire. | 🟢 NHS, AAD | ✅ |
| X2 | **Trétinoïne ou adapalène sur ordonnance** | Elle remplace le rétinol Skynkod : son tube devient le soir Traitement, aux soirs prescrits. Pas d'acide les mêmes soirs. Crème et SPF obligatoires. | 🟢 AAD | ✅ |
| X3 | **Peroxyde de benzoyle ou clindamycine sur ordonnance** | Son produit dans la routine, au moment prescrit ; jamais avec la trétinoïne classique au même moment. | 🟢 AAD · 🔵 | ✅ |
| X4 | **Métronidazole** (rosacée) | Son produit dans la routine ; base très douce ; pas d'exfoliation. | 🟢 NRS | ✅ |
| X5 | **Kétoconazole** (dermatite séborrhéique, acné fongique) | Son produit dans la routine, aux jours prescrits ; base douce. | 🔵 | ✅ |
| X6 | **Antibiotique par la bouche** (doxycycline, etc.) | Ces antibiotiques rendent la peau sensible au soleil : SPF 50 obligatoire, rappel de le renouveler dehors, AHA avec prudence. | 🟢 notice du médicament | ✅ |
| X7 | **Contraception ou traitement hormonal** | Rien à changer dans la routine. Koda signale juste que ça peut jouer sur l'acné et le mélasma. | 🟡 | ✅ |

---

## 7. Signes d'alerte : Skynkod conseille un médecin

La fiche « When to see a doctor » de l'encyclopédie et Koda suivent cette liste (sources : AAD, NHS, HSE).

**Tout de suite (urgence) :**
- gonflement des lèvres, de la langue ou de la gorge, difficulté à respirer, urticaire qui s'étend ;
- douleur intense, peau qui blanchit ou brunit, ou cloques après un acide ou un peeling : rincer abondamment, puis urgences ;
- rougeur chaude qui s'étend vite, avec douleur ou fièvre (infection) ;
- coup de soleil avec fièvre, frissons, nausées ou grandes cloques.

**Dans les semaines qui viennent (dermatologue) :**
- la règle ABCDE pour un grain de beauté (Asymétrie, Bords, Couleurs, Diamètre de plus de 6 mm, Évolution), et le grain de beauté qui ne ressemble pas aux autres ;
- une plaie ou une croûte qui ne guérit pas en 4 semaines.


- Acné kystique ou nodulaire, cicatrices qui se creusent.
- Une tache qui change de forme ou de couleur, ou une lésion qui saigne.
- Une réaction qui gonfle, suinte ou s'étend.
- Pas de mieux après la semaine de repos.
- Un nouveau symptôme pendant la grossesse.

---

## 8. Ce que Skynkod ne dit jamais

- « Validé par des dermatologues », tant qu'une dermatologue n'a pas relu et signé ce livre.
- Qu'un produit « soigne » une maladie.
- Qu'on peut arrêter ou changer un traitement prescrit.
- Que le skin cycling est « prouvé ».

---

## 9. Écarts entre le code et ce livre

### 🔴 Sécurité : ✅ corrigé le 27 octobre 2026

Choix de Lita :
- une liste précise des traitements ;
- son traitement devient une vraie étape de sa routine (matin, soir ou les deux ; tous les jours ou certains jours) ;
- rosacée et eczéma : le rétinol seulement si sa dermatologue est d'accord, 2 soirs par semaine au maximum, à faible dose ;
- acné kystique : un message « vois une dermatologue » et une routine douce.

Tests : `tests/treatments.test.mjs`.

| # | Écart | Correction proposée |
|---|---|---|
| ✅ E1 | « Crème sur ordonnance » est une seule case. Skynkod enlève alors tous les actifs, mais son traitement n'apparaît pas dans la routine. Métronidazole et kétoconazole ne sont pas dans la liste. Une femme enceinte avec une crème sur ordonnance n'a pas d'alerte. | Liste détaillée des traitements. Son traitement devient une étape, aux soirs qu'elle indique. Alerte grossesse et rétinoïde prescrit. |
| ✅ E2 | L'antibiotique par la bouche n'a aucun effet sur la routine. | SPF 50 marqué « indispensable », rappel de le renouveler, prudence avec les AHA. |
| ✅ E3 | Rosacée et eczéma : le rétinol arrive à la semaine 5. | On reste sur l'acide azélaïque (rosacée) ou sans traitement (eczéma). Le rétinol seulement si elle dit que sa dermatologue est d'accord. |
| ✅ E4 | Acné kystique : Rekod construit une routine active comme pour les autres. | D'abord le conseil de voir une dermatologue ; en attendant, une routine douce, sans nouvel actif fort. |
| ✅ E5 | Isotrétinoïne : le baume à lèvres est facultatif. | Baume indispensable matin et soir, avec SPF le jour. |
| ✅ E6 | Dermatite périorale : elle reçoit l'acide azélaïque, des sérums, des soins des yeux et des lèvres, et peut-être une crème riche. | Routine minimale : nettoyant doux, crème légère, SPF. |

### 🟠 Preuves : ✅ corrigé le 27 octobre 2026

Choix de Lita :
- **E7 :** le plus utile d'abord.
- **E8 :** acide azélaïque pour tous les objectifs pendant la grossesse.
- **E9 :** SPF teinté conseillé, jamais imposé.
- **E10 :** acide azélaïque 4 semaines, puis rétinol.
- **E12 :** 3 actifs forts, puis 2 en cas de réaction ou de peau sensible.

Catalogue au 27 octobre : 145 crèmes solaires, dont 127 avec un filtre UVA dans la liste et 12 teintées aux oxydes de fer.

Tests : `tests/evidence.test.mjs`.

| # | Écart | Correction proposée |
|---|---|---|
| ✅ E7 | La 1re semaine de Rekod peut ajouter jusqu'à 4 actifs nouveaux en même temps : sérum du matin, rétinol, peroxyde de benzoyle, peptides pour les yeux. | Un actif à la fois, 2 semaines d'écart. Ordre proposé : sérum du matin, puis traitement du soir, puis exfoliation, puis peroxyde. |
| ✅ E8 | Grossesse : le soir Traitement met du bakuchiol ou des peptides. | Acide azélaïque, mieux étudié pendant la grossesse. |
| ✅ E9 | Taches, mélasma, peaux foncées : le SPF teinté n'est pas préféré. | Préférer un SPF teinté (oxydes de fer) pour ces profils. |
| ✅ E10 | Peaux foncées avec acné ou marques : l'acide azélaïque n'est pas préféré. | Soir Traitement à l'acide azélaïque d'abord ; rétinol plus tard si elle le veut. |
| ✅ E11 | Le psoriasis n'est pas traité comme une peau sensible. | L'ajouter aux maladies qui rendent la peau sensible. |
| ✅ E13 | Le SPF est choisi d'après « SPF 50 » dans son nom ; la protection UVA n'est pas vérifiée. | Exiger « large spectre », « UVA », « PA+++ » ou des filtres UVA connus dans la liste d'ingrédients. |

### 🟡 Décidé avec Lita : ✅ fait le 27 octobre 2026

- **E14 :** 4 soirs au maximum, sauf si elle en ajoute elle-même (réglage « Retinol nights » dans Rekod, avec un avertissement).
- **E15 :** le peroxyde de benzoyle est une vraie étape, sur la zone.
- **E16 :** pas de nettoyant le matin, sauf pour une peau grasse ou acnéique ; de l'eau thermale à la place.

3 eaux thermales ont été ajoutées au catalogue : Avène, La Roche-Posay et Uriage. Leurs ingrédients viennent des fiches de pharmacies.

| # | Question | Ce que je conseille |
|---|---|---|
| ✅ E12 | Combien d'actifs forts au total dans une routine : 2 (ancien livre) ou 3 (code actuel : acide, rétinol, peroxyde) ? | 3, chacun sur ses soirs, seulement chez une peau qui tolère bien. |
| ✅ E14 | Rétinoïde au maximum 4 soirs par semaine (skin cycling), alors que les guides vont jusqu'à tous les soirs ? | Garder 4 au maximum, et le dire honnêtement : c'est un choix de tolérance. |
| ✅ E15 | Boutons rouges : le peroxyde de benzoyle doit-il rester facultatif ? | En faire une vraie étape (sur les boutons), car c'est la recommandation la plus forte. |
| ✅ E16 | Matin à l'eau seule pour les peaux sèches ou sensibles ? | Le proposer en option, sans l'imposer. |

---

## 10. Questions pour la relectrice

1. Les rythmes du rétinoïde et des acides (sections 3 et 4) sont-ils justes ?
2. Les règles des traitements (section 6) : faut-il en ajouter, ou en retirer ?
3. Rosacée et eczéma : le rétinol doit-il être exclu, ou permis à faible dose après un temps calme ?
4. Grossesse : l'acide azélaïque comme traitement principal vous convient-il ? Et le peroxyde de benzoyle ?
5. Les niveaux de preuve sont-ils justes, actif par actif ?
6. Peut-on dire « routine relue par une dermatologue » une fois vos corrections intégrées ?
