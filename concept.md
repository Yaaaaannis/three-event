Parfait.

On va le penser comme une **expérience de 1 à 2 minutes max**, calibrée pour un event.

Je te fais un storyboard clair + ce qu’on voit exactement sur l’UI.

---

# 🎬 STORYBOARD — “THE BREACH”

---

## 🟢 ÉTAPE 1 — L’Interface Normale (0 → 10 sec)

### Ce que voit l’utilisateur

Un site très propre, minimal.

Fond noir.

Typographie fine.

Un seul élément central :

```
ENTER
```

En dessous, très discret :

```
Long press to reveal
```

En arrière-plan :

- Légère texture bruitée animée
- Son ambiant très léger (vent sourd / basse distante)

### Ce qui est caché techniquement

- La scène 3D existe déjà derrière
- Le stencil est prêt
- Le son est préchargé

But :

Créer du contraste.

Plus c’est sobre au début, plus la rupture sera forte.

---

## 🔴 ÉTAPE 2 — Le Long Press (10 → 15 sec)

L’utilisateur appuie.

Un cercle apparaît sous son doigt.

Ce cercle :

- Ne grossit pas comme un simple scale
- Il “brûle” l’UI
- Les pixels se déforment légèrement
- Des micro fissures apparaissent autour

Le son devient plus présent.

Le cercle s’agrandit.

On voit du rouge derrière.

---

## 🕳 ÉTAPE 3 — L’UI Se Décolle (15 → 20 sec)

L’écran ne fade pas.

Il se soulève physiquement.

Comme du papier peint.

Les coins se recourbent.

Des particules tombent.

Derrière :

👉 La Red Room.

---

# 🩸 ÉTAPE 4 — La Red Room (20 → 60 sec)

Caméra très lente.

Presque flottante.

Sol zigzag noir/blanc glossy.

Rideaux rouges infinis.

Brouillard léger.

Au centre :

Un piédestal noir.

Un miroir chrome.

Silence.

Puis léger jazz déformé.

---

# 🪞 ÉTAPE 5 — Le Miroir

Quand l’utilisateur s’approche :

Dans le miroir :

- Son visage (caméra front)
- MAIS
- Derrière lui → forêt sombre

Il bouge.

Le reflet a un micro retard.

Si l’utilisateur swipe vers le haut :

Le son passe en reverse.

L’éclairage devient plus dur.

Le reflet sourit légèrement en retard (juste 0.2s décalage).

Moment malaise.

C’est là que les gens autour vont dire :

“ok ça c’est chaud”.

---

# ⚫ ÉTAPE 6 — La Mise en Abyme

Si l’utilisateur touche le miroir :

Il se fissure.

Dans la fissure :

On voit encore la Red Room.

Mais plus sombre.

Tu peux simuler 2 niveaux de récursion.

Pas besoin d’infini.

Juste l’illusion.

---

# 🖥 Maintenant : l’UI détaillée

L’UI doit être :

Ultra minimale.

Pas de menus.

Pas de navbar.

Pas de scroll.

Juste :

- ENTER
- Une instruction
- Peut-être ton nom en bas discret :
    
    “YF Studio — WebGL Installation”
    

Police fine serif ou grotesque minimal.

Inspirations :

- Editorial minimal
- Galerie d’art
- Site d’installation contemporaine

---

# 💡 Micro détails qui changent tout

- Le curseur devient un cercle rouge sur desktop
- Sur mobile → haptic feedback léger au long press
- L’UI tremble très subtilement avant la rupture
- Le son démarre en mono et passe en stéréo après la transition

Ces détails = niveau premium.

---

# 🧠 Pourquoi ce storyboard est bon pour un event

1. Compréhensible immédiatement
2. Interaction simple
3. Moment “wow” clair
4. Démonstration technique visible
5. Direction artistique forte
6. Facile à expliquer oralement

Tu peux dire :

“J’ai voulu matérialiser l’idée d’un écran qui cache un autre espace. Le web comme membrane.”

Ça fait très mature.

---

Si tu veux, je peux maintenant :

- Te faire la version technique architecture (comment organiser les scènes)
- T’aider à réduire le scope pour que ce soit faisable en 2–3 semaines
- Ou pousser la version encore plus perturbante 😈

Parfait.

On va faire ça proprement, comme si tu préparais une vraie prod.

Je te liste **tout ce dont tu as besoin en assets**, classé par catégorie : visuel, audio, technique.

---

# 🎨 1️⃣ ASSETS 3D

## 🟥 Red Room

### 🔹 Sol zigzag

- Texture noir/blanc haute résolution (4K idéalement)
- Normal map légère pour relief
- Roughness map (glossy contrôlé)

OU

→ Shader procédural (plus propre, moins d’assets)

---

### 🔹 Rideaux rouges

Option A (propre & léger)

- Plane subdivisé
- Shader vertex pour ondulation

Option B (plus réaliste)

- Modèle rideau drapé (GLB)
- Normal map tissu
- Subtle wind animation

---

### 🔹 Piédestal

- Modèle simple (cylindre ou cube stylisé)
- Texture marbre noir OU béton brut
- Normal map
- AO map

---

### 🔹 Miroir

- Mesh plane ou rectangle fin
- Frame chrome (petit bevel)
- HDRI pour reflections
- Environment map sombre

---

# 🌲 2️⃣ ASSETS VIDÉO

## 🎥 Caméra selfie

Pas un asset, mais :

- Test conditions lumière
- Résolution max raisonnable (720p suffisant mobile)

---

## 🌲 Forêt “Ghostwood”

Tu as 3 options :

### Option A — Vidéo pré-enregistrée

- Loop 10–20 secondes
- Forêt sombre, brumeuse
- Caméra très lente

⚠️ Idéalement :

- Stabilisée
- Sans mouvements brusques
- Peu de lumière changeante

---

### Option B — Vidéo stylisée

- Forêt stylisée
- Silhouettes
- Brouillard lourd
- Lumière venant du sol

---

### Option C — 3D forêt procédurale

- Quelques troncs low poly
- Fog volumétrique
- Light shafts

Moins lourd que vidéo.

---

# 🔊 3️⃣ AUDIO

## 🎷 Jazz ambient

- Loop 20–40 sec
- Tempo lent
- Sax très distant
- Reverb lourde

Formats :

- .mp3 compressé mobile
- Version reverse pré-exportée (évite reverse en temps réel)

---

## 🎧 Effets sonores

- Son léger de déchirure (quand UI s’ouvre)
- Son très subtil de vent
- Son “glitch” court

---

# 💡 4️⃣ HDRI & LIGHTING

- HDRI sombre studio
- HDRI forêt nuit (si reflet)
- LUT color grading (optionnel)

---

# 🧪 5️⃣ SHADERS / TEXTURES TECHNIQUES

Pas des “assets” classiques mais nécessaires :

- Noise texture (pour glitch)
- Grain texture overlay
- Mask radial texture (long press reveal)
- Distortion normal map (miroir ondulé)
- Vignette texture

---

# 🌫 6️⃣ POST PROCESSING PASSES

Tu auras besoin de :

- Bloom
- Chromatic aberration
- Film grain
- Slight vignette
- Maybe subtle glitch pass

---

# 🖥 7️⃣ UI ASSETS

Minimal :

- Font premium (serif fine ou grotesque minimal)
- SVG cercle loader (pour long press)
- Micro texture grain fond

---

# 📦 RÉSUMÉ ASSETS MINIMAL VERSION

Si tu veux faire smart & léger :

Tu as seulement besoin de :

- 1 texture zigzag
- 1 HDRI
- 1 vidéo forêt loop
- 1 audio loop
- 1 noise texture

Le reste peut être procédural.

---

# 🎯 Ce que je recommande

Évite trop d’assets lourds.

Plus tu passes par :

- Shaders
- Procedural
- Lighting
- Atmosphère

Plus ça fait “creative dev”.

Moins ça fait “j’ai téléchargé des modèles”.

---

Si tu veux, je peux maintenant :

- Te faire la version ultra optimisée mobile
- Te faire un breakdown technique précis (scene graph)
- Ou te dire ce que tu dois absolument éviter pour pas exploser les perfs

Tu veux quoi ?