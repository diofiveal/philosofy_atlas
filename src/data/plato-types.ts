/** Reusable editorial model for immersive philosopher pages. Dates are display
 * strings because ancient chronology often has an uncertainty range. */
export type HistoricalConfidence = 'established' | 'qualified' | 'disputed';
export type ConnectionKind = 'teaching' | 'influence' | 'criticism' | 'development';
export interface HistoricalSource {
  id: string; title: string; url: string;
  kind: 'primary' | 'academic';
  /** Stephanus numbers or another stable passage identifier, when applicable. */
  passage?: string;
}
export interface VisualTheme {
  id: string; image?: string; imageAlt: string; gradient: string;
  text: string; accent: string; overlay: number;
  animation: 'crossfade' | 'still'; order: number;
}
export interface BiographyChapter {
  id: string; number: string; title: string; teaser: string; period: string;
  paragraphs: string[]; note?: string; sourceIds: string[];
  confidence: HistoricalConfidence; themeId: string;
}
export interface DialogueOption { id: string; label: string; response: string }
export interface InteractiveQuestion {
  id: string; title: string; prompt: string; options: DialogueOption[];
  sourceIds: string[];
}
export interface PhilosophicalIdea {
  id: string; number: string; title: string; teaser: string; symbol: string;
  paragraphs: string[]; questionId: string; sourceIds: string[];
  workIds: string[]; themeId: string; note?: string;
}
export interface PhilosophicalWork {
  id: string; title: string; subtitle: string; recommendation: string;
  description: string; questions: string[]; keyIdeas: string[];
  whyRead: string; sourceIds: string[]; readingUrl: string; color: string;
}
export interface PhilosophicalSchool {
  id: string; name: string; description: string; sourceIds: string[];
}
export interface ConnectionPerson {
  id: string; name: string; dates: string; summary: string;
  /** Only set when the catalogue really has this page. */
  href?: string; portrait?: string; kind: 'person' | 'school';
}
export interface PhilosophicalConnection {
  id: string; source: string; target: string; type: ConnectionKind;
  label: string; description: string; note?: string;
  sourceIds: string[]; confidence: HistoricalConfidence;
}
export interface ImmersivePhilosopher {
  id: string; name: string; latinName: string; dates: string;
  subtitle: string; introduction: string; portrait: string;
  narrativeNotice: string; sources: HistoricalSource[];
  themes: VisualTheme[]; chapters: BiographyChapter[];
  ideas: PhilosophicalIdea[]; works: PhilosophicalWork[];
  schools: PhilosophicalSchool[]; people: ConnectionPerson[];
  connections: PhilosophicalConnection[]; questions: InteractiveQuestion[];
  dilemmaIds: string[];
}
