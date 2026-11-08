# Иллюстрации страницы Платона

Пять изображений созданы для проекта генератором изображений. Это современные художественные реконструкции, а не изображения исторических событий или археологические свидетельства. В интерфейсе они помечены как художественные иллюстрации. Портрет Платона взят из прежнего проекта; его атрибуция остаётся в `public/portraits/attribution.json`.

Все новые файлы локальны, не требуют сторонних image-hosts, имеют WebP-формат и ширину не более 1440 px. Общий объём пяти фоновых сцен — около 860 KiB. Загрузка фонов отложена, hero-портрет имеет высокий приоритет. Исходные PNG не включены в production-сборку.

| Файл | Сюжет |
| --- | --- |
| `public/plato/athens.webp` | Афины, улица и агора |
| `public/plato/socrates.webp` | Философская беседа в портике |
| `public/plato/academy.webp` | Оливковый сад Академии |
| `public/plato/syracuse.webp` | Сиракузы и дворцовая терраса у моря |
| `public/plato/library.webp` | Кабинет со свитками в вечернем свете |

## Промпты

Общая спецификация: `Use case: historical-scene. Asset type: wide background illustration for an educational Plato biography. Unified art direction: quiet cinematic oil painting on aged linen, faded parchment beige, muted olive and brown, charcoal and stone gray, low saturation, atmospheric depth, visible painterly texture. Landscape wide composition, softly defined details, suitable behind a readable dark overlay. No text, no captions, no borders, no book-shaped codices, no modern objects. This is an artistic reconstruction, not a documentary image.`

К общей спецификации добавлен один из сюжетов:

1. `Ancient Athens around 410 BCE, narrow street opening onto an agora, stone buildings, a few distant citizens, warm pale morning light.`
2. `Athenian agora around 400 BCE, a small group in quiet philosophical discussion under a stone portico, thoughtful sober atmosphere, cool olive shadows.`
3. `Plato's Academy outside ancient Athens, olive grove, simple classical colonnade, a few distant students with scrolls, tranquil daylight.`
4. `Ancient Syracuse in Sicily around 360 BCE, palace terrace overlooking a Greek coastal city and the sea, restrained distant architecture, hazy blue-gray late afternoon.`
5. `A modest ancient Greek study around 350 BCE, rolled papyrus manuscripts on wooden shelves, low desk, an opening onto evening olive trees, soft amber sunset light.`
