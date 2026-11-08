# Immersive philosopher content

The existing catalogue in `src/data/philosophers.ts` stays compatible. The immersive page is an opt-in extension: `src/data/plato-types.ts` defines reusable interfaces, `src/data/plato.ts` exports the complete `platoProfile`, and `src/data/plato-narrative.ts` contains its editorial first-person voice. UI components must not contain biography or philosophical explanations.

## Adding another philosopher

1. Keep the philosopher's existing catalogue ID. Add a new profile implementing `ImmersivePhilosopher`; use `import type` from `plato-types.ts` (the filename is historical, the types are generic).
2. Collect academic and primary sources as stable IDs. Attach `sourceIds` to every chapter, idea, work, school, connection and question. Add passage locators for primary texts where possible. Never use a dramatic dialogue as automatic evidence for a real meeting.
3. Write an explicit `narrativeNotice` that first-person speech is a modern reconstruction. Separate historical qualifications into `note`; use `confidence` to distinguish established, qualified and disputed claims. A reconstructed voice is never a quotation.
4. Supply biography chapters, ideas, works and questions with stable IDs. An idea references a question through `questionId`, works through `workIds`, and its visual configuration through `themeId`. `dilemmaIds` selects questions for the separate scenarios section. Options have individual responses; there is no correct-answer flag or score.
5. Supply themes with local image paths or CSS gradients. Each theme specifies accessible decorative description, text and accent colours, overlay opacity, animation and display order. Components read this configuration instead of checking philosopher names.
6. Add graph people and schools before connections. Every directed connection needs `source`, `target`, `type`, explanation, evidence and confidence. Use separate edges when the same pair has both teaching and criticism. Set `href` only for a page that exists in the catalogue; do not create dead links for external figures.
7. Add a route or catalogue detail integration using the same content-driven components. Update the content checker for the new profile if applicable, then run TypeScript, data validation and the production build. Check mobile reading order, keyboard use and reduced motion.

## Data model

| Entity | Important fields | Purpose |
| --- | --- | --- |
| `ImmersivePhilosopher` | ID, display metadata, sections, sources | One complete page |
| `BiographyChapter` | paragraphs, period, note, confidence, themeId | Fact-aware narrative chapter |
| `PhilosophicalIdea` | paragraphs, questionId, workIds | Explanation and continuation |
| `PhilosophicalWork` | recommendation, questions, keyIdeas, whyRead | Readable book annotation |
| `InteractiveQuestion` | prompt, options with individual responses | Reflective dialogue, without grading |
| `HistoricalSource` | URL, academic/primary kind, passage | Verifiable provenance |
| `VisualTheme` | image, gradient, colours, overlay, animation | Declarative atmosphere |
| `ConnectionPerson` | kind, dates, summary, optional valid href | Graph person or school |
| `PhilosophicalConnection` | directed endpoints, type, evidence, confidence | Distinguishes different relationships |
| `PhilosophicalSchool` | description, sources | A tradition, not a person |

## Plato editorial decisions

- Life dates are approximate: c. 428/427–348/347 BCE. The exact birth year, date of Academy foundation and first encounter with Socrates remain uncertain.
- Plato was not present at Socrates' death: *Phaedo* 59b reports illness. The account is a literary dialogue, not Plato's eyewitness report. *Apology* is not a court transcript.
- The Academy chapter precedes the Syracuse chapter for thematic navigation. The latter explicitly returns to the first Sicilian visit before the Academy, so display order does not pretend to be strict chronology.
- The three Sicilian visits are traditionally placed around 388/387, 367/366 and 361/360 BCE. Details depend partly on the disputed *Seventh Letter*. No invented exact speeches or private emotions are presented as facts. Uncertain Egypt/Cyrene travel and enslavement anecdotes are excluded.
- Socrates' dramatic voice and Diotima's speech are not automatically Plato's autobiography. The cave is an educational allegory; forms are intelligible objects, not personal thoughts. The soul's three parts are a philosophical account, not neuroscience. *Timaeus* is ancient cosmology, not current physics.
- Philosopher-rule is presented alongside the objections to its hierarchy, censorship and restrictions. Love is explained through Diotima; Aristophanes' halves myth is not silently substituted for it.
- Parmenides is an intellectual influence with no asserted personal meeting. Pythagorean influence refers to a tradition, not Plato's personal apprenticeship to Pythagoras. Plotinus develops the tradition centuries later and never met Plato. Aristotle's criticism is distinct from personal hostility.
- Primary reading links are English translations from the MIT Internet Classics Archive. Stephanus locators identify passages independently of translation. The archive's broad composition dates are not treated as secure dates for individual dialogues.

The default page wrapper also accepts `profile={yourProfile}`. The narrator's name, introduction, hero metadata, book recommendation labels and dialogue speaker are supplied from the profile. Existing `plato-*` class names and IDs identify the reusable layout, not philosophy-specific content conditions.
