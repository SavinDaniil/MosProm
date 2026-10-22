# Промпты оригинальных ассетов

Встроенный инструмент `image_gen.imagegen`, 22.10.2026. CLI / API-ключ не использовались. Генерации выполнены без заимствованных изображений-мишеней. Художественные референсы использованы для композиционного анализа, не как файлы для копирования.

## Окружение → public/assets/gatehouse.webp

`transparent_background: false`

> Create one original production background asset for a Russian mobile browser game about a beverage factory checkpoint. Wide landscape 1536x1024. Hand-painted 2D illustrated adventure-game art, thick imperfect dark ink contours, restrained textured gouache, muted sage green painted metal, warm ochre paper and burgundy details, dusky morning light. View from inside a gatehouse facing a large central service window. THROUGH THE WINDOW is an EMPTY factory corridor with tiled lower walls, overhead pipes, distant industrial double doors and a few warm ceiling lights. The window opening occupies the central 65% of image, empty center ready for a separate waist-up character sprite. Around edges visible sturdy sage metal frame with bolts, left wall a round analog clock, small wall speaker, right wall electrical conduit and red/green gate lamps. At very bottom narrow dark wooden counter edge. Beautiful carefully composed moody but inviting retro industrial workplace. Straight-on camera. No people, no text, no letters, no logos, no UI, no documents or phones in foreground. Original artwork, do not recreate any existing game scene.

## Персонажи: общая основа

Каждый персонаж создан отдельным вызовом. `transparent_background: true`. Полный промпт состоит из этой основы и соответствующего продолжения ниже:

> One original isolated waist-up character sprite for a Russian beverage-factory gatehouse 2D adventure game. Portrait canvas, front facing, arms relaxed at bottom, entire head and shoulders visible with generous space around edges. Hand-painted textured gouache and bold imperfect dark ink contours, expressive slightly caricatured anatomy, subtle dry-brush paper grain, muted retro sage green, warm ochre and burgundy palette. Warm morning sidelight. Appealing thoughtful human, not scary, not photorealistic, original character, no existing game assets. No text, logos or lettering. Genuinely transparent background. Subject:

### Андрей → public/assets/andrey.webp

> Andrey Volkov, male equipment engineer about 32, narrow long face with pronounced nose, tousled dark hair, slightly raised eyebrow and faint wry smile, warm pale skin, wearing unbranded ochre hardhat and sage-green industrial work jacket with mustard collar over burgundy shirt. One hand holds a folded sheet of paper down at waist. Confident curious attentive demeanor.

### Елена → public/assets/elena.webp

> Elena Mironova, female food-production technologist about 30, strong nose, warm pale skin, chin-length dark auburn hair tied back, angular burgundy eyeglasses, expressive slightly concerned eyebrows, white lab coat over muted burgundy blouse and small ochre lanyard without text. Holding a slim sage clipboard low against torso. Clever, friendly, slightly hurried, attentive demeanor.

### Виктор → public/assets/viktor.webp

> Viktor Sergeevich, male factory shift supervisor about 57, broad face, silver hair, thick silver mustache, bushy brows, smile lines, sage green uniform shirt with rolled sleeves, burgundy necktie, dark olive vest with ochre unlettered name badge. Hands resting on belt at waist. Warm competent wry mentor demeanor.
