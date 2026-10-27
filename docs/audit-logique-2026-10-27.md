# Audit de la logique de l'app (27 octobre 2026)

Le but : vérifier que ce que l'inscription demande est vraiment utilisé par le reste de l'app (verdicts produits, Rekod, routines, Koda, rapport), et que ce qu'on promet à l'écran est vrai.

La nouvelle inscription suit `docs/onboarding-algorithme.md`. Elle remplace l'ancien questionnaire, donc certaines réponses ont disparu et d'autres sont apparues. C'est là que se trouvent presque tous les problèmes.

Les tests automatiques passent tous (18 séries). Les problèmes ci-dessous sont des trous de logique, pas des plantages.

---

## 🔴 Critique : sécurité

### 1. ✅ Corrigé : les maladies de peau diagnostiquées ne sont plus demandées
- **Avant :** « Has a doctor ever diagnosed one of these? » : rosacée, eczéma, psoriasis, dermatite périorale, dermatite séborrhéique, mélasma.
- **Maintenant :** cette question n'existe plus. L'étape Sécurité demande seulement grossesse, allergies et traitements.
- **Conséquence :** les règles produits liées à ces maladies (éviter les irritants pour la rosacée, les huiles pour la dermatite séborrhéique, les crèmes riches pour la dermatite périorale…) ne s'activent plus jamais pour une nouvelle utilisatrice.
- **Correction proposée :** ajouter une 4e ligne à l'étape Sécurité, « A skin condition diagnosed by a doctor », avec les 6 choix. Même style que les autres lignes.

### 2. ✅ Corrigé : l'allergie « Other » tapée à la main n'est jamais vérifiée
- Koda dit : « Type the ingredient: we'll keep it out of all your advice. »
- **Dans les faits :** l'app ne vérifie que 5 allergies (parfum, huiles essentielles, fruits à coque, lanoline, alcool). Ce qu'elle tape (par exemple « niacinamide ») est enregistré, mais aucun produit n'est jamais comparé à cet ingrédient.
- **Conséquence :** on promet de la protéger d'un ingrédient sans le faire.
- **Correction proposée :** chercher le mot tapé dans la liste d'ingrédients de chaque produit (avec ses noms courants), et afficher « Contains X, which you want to avoid » comme pour les 5 autres.

---

## 🟠 Important : promesses non tenues

### 3. ✅ Corrigé (verdicts produits et Koda ; Rekod pas encore adapté à l'âge) : « We choose for you » et les petites phrases de Koda ne sont reliés à rien
L'inscription demande désormais l'âge, la ménopause, la teinte de peau, le sommeil, le stress, le temps dehors et la transpiration. **Aucune de ces réponses n'est lue par le reste de l'app** : ni les verdicts produits, ni Rekod, ni les routines, ni Koda.

Ce qui est promis sans être fait :
- l'écran final « We choose for you » : *Prevention*, *Glow & fine lines*, *Firmness & comfort* (selon l'âge), *Well-nourished skin* (ménopause), *SPF with no white cast* et *Gentle care for dark spots* (teintes 4 à 6) ;
- Koda pendant les questions : « We'll boost your sun protection » (dehors), « We'll pick light textures » (transpiration), « Stress shows on the skin, we'll follow it » (stress), « Noted: sunscreens with no white cast » (teinte).

**Deux choix possibles :**
- **a.** brancher ces réponses : sur les verdicts produits (SPF sans traces blanches pour les teintes 4 à 6, textures légères si elle transpire, actifs adaptés à l'âge et à la ménopause), sur Rekod et sur Koda ;
- **b.** retirer les promesses tant que ce n'est pas branché.

Je conseille **a**. C'est ce qui rend ces questions utiles, sinon elles allongent l'inscription pour rien.

### 4. ✅ Corrigé : la préoccupation principale n'est jamais choisie
- L'écran « What we spotted » dit : « Where to start? We'll choose together when we build your routine. »
- **Dans les faits :** ce choix n'existe nulle part au moment de construire la routine. Sans choix, l'app prend automatiquement **le premier problème touché sur les photos**.
- **Conséquence :** cette « priorité » pilote beaucoup de choses : les verdicts produits, « Next best buy », le tri de l'étagère, Rekod et le bilan de la semaine. Elle est donc choisie au hasard de l'ordre des taps.
- **Correction proposée :** ajouter la question « Which one matters most to you right now? » sur l'écran « What we spotted », en touchant une des photos. Ou bien la poser au début du constructeur de routine, comme promis.

### 5. ✅ Corrigé : les 3 sortes de cernes deviennent une seule
- L'écran dit : « Dark circles don't all have the same cause, so not the same solution. »
- **Dans les faits :** bleutés, bruns ou creusés sont tous enregistrés comme « Dark circles ». Le détail est gardé, mais rien ne le lit.
- **Correction proposée :** relier chaque sorte à ses actifs (caféine et vitamine K pour les bleutés, vitamine C et niacinamide pour les bruns, hydratation et peptides pour les creusés) dans les verdicts des contours des yeux.

### 6. ✅ Corrigé : les rappels sont demandés sans explication
L'ancien parcours avait un écran « A gentle reminder, morning and evening? ». Maintenant, la fenêtre d'autorisation de l'iPhone apparaît d'un coup, à la première ouverture de l'app, sans aucun contexte. Beaucoup de gens refusent quand ils ne savent pas à quoi ça sert.
- **Correction proposée :** remettre un petit écran dans le style de l'inscription, juste avant « See my results ».

---

## 🟡 Moyen : incohérences

### 7. ✅ Corrigé : My Skyn Profile pose encore l'ancien questionnaire
- On y trouve encore les questions supprimées : routine actuelle, actifs, temps, budget, préférences (vegan, sans parfum…), diagnostics.
- On n'y trouve pas les nouvelles : âge, ménopause, teinte, zones du visage, mode de vie.
- Il y a donc deux versions du profil, qui ne se ressemblent pas.
- **Correction proposée :** refaire My Skyn Profile avec les mêmes questions et le même style que l'inscription.

### 8. Le rapport pour le dermatologue n'a plus l'âge
Le rapport lisait la date de naissance, qu'on ne demande plus. Il faut qu'il lise la tranche d'âge à la place.

### 9. Le phototype solaire n'a plus que 2 réponses
« Do you burn before you tan? » oui / non. On ne distingue plus les peaux très claires (I–II) des peaux très foncées (V–VI). La teinte choisie (6 pastilles) pourrait compléter cette information.

### 10. Certaines cartes n'ont aucun effet
« Darker lips » et « Lines around the lips » sont enregistrées, mais aucun conseil n'en dépend. Ce n'est pas grave, mais il faut le savoir.

### 11. ✅ Corrigé : les photos des problèmes ne sont pas les mêmes partout
L'inscription utilise tes nouvelles macros de peau. « My skin issues » (dans le profil et depuis le journal) montre encore les anciennes illustrations (visage entier avec une loupe), que tu trouvais flippantes.

---

## 🟢 Bas : ménage

### 12. De l'ancien code ne sert plus
Les anciens écrans « why » de l'inscription (`utils/onboarding-why.js`) ne sont plus utilisés. C'est sans effet pour l'utilisatrice.

### 13. Un raccourci pour mes tests
J'ai ajouté un raccourci, seulement en développement et dans le navigateur (`?onboarding=nom-de-l-écran`). Il n'existe pas dans l'app publiée.

---

## Ordre conseillé
1. Les maladies de peau diagnostiquées (sécurité).
2. L'allergie « Other » vraiment vérifiée (sécurité).
3. Le choix de la préoccupation principale.
4. Brancher âge, ménopause, teinte, dehors, transpiration, stress, et les sortes de cernes (ou retirer les promesses).
5. L'écran des rappels.
6. My Skyn Profile aligné sur l'inscription, avec les nouvelles photos.
7. Le rapport : la tranche d'âge.
