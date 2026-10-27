# Prompts : la maquette d'inscription, à l'identique

Ces prompts décrivent **exactement ce qu'on voit sur ta maquette** (`design/onboarding-flow-mockup-v3.webp`). J'ai zoomé sur chaque élément avant de les écrire. Ils corrigent les anciens, qui étaient trop brillants et trop féeriques.

**Ce qu'on voit vraiment sur la maquette :**
- Les **bulles des étapes** sont de petites **sphères nacrées**, laiteuses et satinées, pas des bulles de savoir étincelantes. L'icône est un **simple trait mauve plat**, comme une icône d'iPhone.
- **Il n'y a presque pas d'étincelles.** La lumière est douce et naturelle.
- **Les photos des cartes** sont des **macros de peau qui remplissent toute la carte** : naturelles, couleur pêche-rosée, un peu fraîches. Le texte blanc en dessous est ajouté par le code.
- La **grande bulle transparente** de l'écran « Great! », le **fil lumineux**, le **cercle fin** sur la photo de la joue et le **fond rose** sont faits en code : pas d'image à générer.

**Comment faire :** une conversation par groupe, une image à la fois, copie le bloc **en entier**. Si un résultat est trop brillant, réponds : « *same image, more matte and simple, less shine, no sparkles* ».

---

## A. Les objets 3D

**`orb-welcome.png`** : ✅ déjà reçue, conforme à la maquette.

Le soleil n'est **pas** dans le prompt : je pose dessus le soleil de ton orbe de bienvenue, pour qu'il n'y ait qu'un seul logo partout.

**`profile-cards.png`**

```
Clean minimal 3D render for a premium iOS beauty app. Subject: three thin rounded-rectangle cards of frosted glass stacked on top of each other, slightly fanned: the back card rotated about -10 degrees, the middle card about +6 degrees, the front card straight and in front. Glass: frosted, milky, light pink-white (#F6EAF1), thin bright edges with a slight bevel, soft and calm. All three cards are completely EMPTY and blank: no symbol, no sun, no logo, no icon, no drawing, nothing on them. Soft pink shadow under the stack. Centered, front view, fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```


**Une seule bulle, vide.** Je pose moi-même les symboles dessus en code (le soleil de ton orbe pour Skin, des icônes au trait mauve pour les autres) : un seul logo, un seul style, partout.

**`bubble-empty.png`**

```
Clean minimal 3D app icon render, like a premium iOS beauty app. Subject: one sphere with a satin pearl finish: milky, softly translucent white-pink (#F8EDF3 to #EBD3E1), soft and smooth, not mirror-shiny, with one soft diffuse highlight on the top left, a gentle pearly iridescence on the edges, a faint pinkish rim, and a very soft pink shadow under it. The sphere is completely EMPTY: no symbol, no icon, no sun, no drawing, no logo, nothing inside or on it. Centered, front view, the sphere fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no black, no white, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

---

## B. Les grandes photos (haut de l'écran)

**`intro-skin.png`**

```
Extreme close-up of a young woman's face, very tightly framed: her closed eye with long natural dark lashes and the eyebrow at the top of the frame, the cheek filling the center and the bottom, and the side of the nose with the nostril entering from the bottom left corner. Light freckles on the cheek and the nose, a fresh dewy sheen on the cheek and the eyelid, visible pores. Vertical format 1080 x 1350, the face fills the whole frame. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`intro-profile.png`**

```
Close-up of a young woman's lower face and neck in side profile, facing right: slightly parted soft pink lips with a glossy balm shine, the chin, the jawline and the long neck going down to the bottom of the frame, a soft natural blush on the cheek. Dewy fresh skin. Plain very light pink background on the right side. Vertical format 1080 x 1350. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

---

## C. Les cartes du type de peau

**`card-skin-tight.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): dry skin on a cheek: clearly matte with NO shine at all, a slightly rough surface, many visible fine white dry flakes lifting on the surface, slightly dull. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-skin-comfortable.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): balanced normal skin on a cheek: even, smooth, small pores, a soft natural satin finish. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-skin-tzone.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the side of a nose and the cheek next to it: a visible oily shine on the nose, the cheek part matte. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-skin-oily.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): oily skin on a cheek: a clear glossy shine and visible enlarged pores. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

---

## D. Les cartes du visage

**`card-family-breakouts.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the side of a nose and the cheek with a few small red spots. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-family-redness.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with soft diffuse redness and a few tiny red dots. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-family-spots.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheekbone with a few flat brown pigment spots. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-family-pores.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with visible pores and a light shine. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-family-dryness.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with dry skin and fine white flakes. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-family-lines.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the forehead of a woman around 40, with a few fine horizontal lines across it, soft and natural, not deep wrinkles (no eyes, no eyebrows). Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-blackheads.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the side of a nose with small blackheads and a few tiny whiteheads. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-red-spots.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with a few red inflamed spots of different sizes. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-deep-spots.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a jawline with one large, deep, swollen red spot under the skin. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-hormonal.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a chin with a few red spots clustered on it. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-fungal.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a forehead with many small, identical, skin-coloured bumps evenly scattered. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-scars.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with small shallow acne scars. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-red-marks.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with flat pink-red marks left after old spots. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-vessels.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the side of a nose with fine visible red capillaries. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-reactive.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with light, blotchy, irritated redness. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-brown-marks.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with flat brown marks left after old spots, medium-brown skin. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-sun-spots.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheekbone with a few small brown sun spots, fair skin. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-dull.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with tired, dull, slightly greyish uneven skin tone. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-enlarged-pores.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with clearly enlarged round pores. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-nose-dots.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the side of a nose with small grey dots in the pores. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-oily.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a forehead with an oily shine and visible pores. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-uneven-texture.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with an uneven, slightly bumpy texture. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-dry.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with very dry flaky skin. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-dehydrated.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a cheek with fine criss-cross dehydration lines, slightly dull, not flaky. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-fine-lines.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the forehead of a woman around 35, with a few very fine, faint horizontal lines (no eyes, no eyebrows). Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-deep-wrinkles.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a forehead with deeper horizontal wrinkles, woman around 55. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-sagging.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): a jawline seen from the side with slightly loose skin, woman around 55. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

---

## E. Les cartes des yeux, des lèvres et du cou

Les yeux sont **ouverts**, cadrés serré, comme sur la maquette.

**`card-eye-blue-circles.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): one open eye looking at the camera, with blue-purple dark circles under it. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-eye-brown-circles.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): one open eye looking at the camera, with brown pigmented dark circles under it, medium-brown skin. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-eye-hollow.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): one open eye looking at the camera, with a hollow shadow under it. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores and a few natural freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-eye-puffy.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): one open eye looking at the camera, with soft puffiness under it. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-eye-lines.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): one open eye looking at the camera, with fine lines at the outer corner, woman around 45. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-eye-milia.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the area under one open eye, with three or four tiny white pearly bumps. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-lips-dry.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): slightly parted lips, dry and chapped with fine cracks. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-lips-corners.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the corner of a mouth, slightly cracked and red. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-lips-dark.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): slightly parted lips with naturally darker, evenly pigmented colour, healthy and smooth. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-lips-lines.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the upper lip with fine vertical lines on and above it, woman around 50. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-lips-peeling.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): slightly parted lips with small dry flakes lifting on the surface. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-neck-lines.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the front of a neck with two or three soft horizontal lines. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-neck-sagging.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the skin under the jaw and the upper neck, slightly loose, woman around 60. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-neck-dry.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the neck and upper décolleté with dry, slightly rough skin and a few fine flakes. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`card-neck-dark.png`**

```
Extreme macro crop of real skin that fills the whole frame edge to edge (no background visible, no full face): the side of a neck with a darker, velvety patch of skin, tan skin. Landscape format 1600 x 1000. Clean editorial skincare photography, like a premium dermatology-inspired beauty brand. Real human skin, extreme macro, true texture with visible pores, even skin tone with no freckles, fresh and slightly dewy, no makeup, no retouching. Soft natural daylight, very soft shadows, warm peach-pink skin tones, a light pinkish-white overall tone, true-to-life colours (not saturated, not purple). Sharp focus. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

---

## F. Koda comme sur la maquette (rayons pointus)

Même conversation pour les 5, pour qu'il soit identique partout.

**`koda-happy.png`**

```
Clean minimal 3D character render for a premium iOS beauty app. Subject: Koda, a small cute sun mascot: a round, soft, glossy body in light peach-pink (#F7D6D2 to #EFC2C6), with 8 short pointed triangular rays around it (soft cone shapes with slightly rounded tips, same peach-pink, a little darker at the base), no arms, no legs. Face: two big round dark brown glossy eyes with one white highlight each, light pink blush on the cheeks, a small open happy smile. Soft studio light from the top left, one soft highlight on the top of the body, very soft pink shadow. Front view, centered, fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`koda-wink.png`**

```
Clean minimal 3D character render for a premium iOS beauty app. Subject: Koda, a small cute sun mascot: a round, soft, glossy body in light peach-pink (#F7D6D2 to #EFC2C6), with 8 short pointed triangular rays around it (soft cone shapes with slightly rounded tips, same peach-pink, a little darker at the base), no arms, no legs. Face: two big round dark brown glossy eyes with one white highlight each, light pink blush on the cheeks, the right eye closed in a wink (a curved line) and a happy open smile. Soft studio light from the top left, one soft highlight on the top of the body, very soft pink shadow. Front view, centered, fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`koda-joy.png`**

```
Clean minimal 3D character render for a premium iOS beauty app. Subject: Koda, a small cute sun mascot: a round, soft, glossy body in light peach-pink (#F7D6D2 to #EFC2C6), with 8 short pointed triangular rays around it (soft cone shapes with slightly rounded tips, same peach-pink, a little darker at the base), no arms, no legs. Face: two big round dark brown glossy eyes with one white highlight each, light pink blush on the cheeks, both eyes closed in happy upward curves and a big open laughing smile. Soft studio light from the top left, one soft highlight on the top of the body, very soft pink shadow. Front view, centered, fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`koda-calm.png`**

```
Clean minimal 3D character render for a premium iOS beauty app. Subject: Koda, a small cute sun mascot: a round, soft, glossy body in light peach-pink (#F7D6D2 to #EFC2C6), with 8 short pointed triangular rays around it (soft cone shapes with slightly rounded tips, same peach-pink, a little darker at the base), no arms, no legs. Face: two big round dark brown glossy eyes with one white highlight each, light pink blush on the cheeks, both eyes gently closed in downward curves and a soft small smile. Soft studio light from the top left, one soft highlight on the top of the body, very soft pink shadow. Front view, centered, fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

**`koda-curious.png`**

```
Clean minimal 3D character render for a premium iOS beauty app. Subject: Koda, a small cute sun mascot: a round, soft, glossy body in light peach-pink (#F7D6D2 to #EFC2C6), with 8 short pointed triangular rays around it (soft cone shapes with slightly rounded tips, same peach-pink, a little darker at the base), no arms, no legs. Face: two big round dark brown glossy eyes with one white highlight each, light pink blush on the cheeks, both eyes open, a small round open mouth, and a small pink question mark floating next to the head. Soft studio light from the top left, one soft highlight on the top of the body, very soft pink shadow. Front view, centered, fills 80% of the frame. Background: fully transparent PNG (real alpha channel, no checkerboard). Square 1024 x 1024. Not fantasy, not magical, not dreamy: no glitter, no star sparkles, no bokeh, no light rays, no neon, no rainbow, no fairy dust. No text, no letters, no logo, no watermark.
```

---

## Ce qui reste comme sur ta maquette, sans image à générer
- La grande bulle transparente de « Great! », le fil, le cercle fin sur la joue, le fond rose et toutes les icônes au trait des listes : je les fais en code, comme sur la maquette.
