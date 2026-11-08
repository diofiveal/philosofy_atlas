/** Content model: BCE years are negative; broad dates are expressed in `dates`. */
export type EpochId = 'antiquity' | 'medieval' | 'early-modern' | 'modern' | 'contemporary';
export type TopicId = 'freedom' | 'meaning' | 'consciousness' | 'happiness' | 'morality' | 'justice';
export type ContentStatus = 'fact' | 'explanation' | 'interpretation';
export type RelationType = 'influence' | 'contrast' | 'affinity';

export interface Source { title: string; url: string }
export interface Idea { title: string; explanation: string; status?: ContentStatus }
export interface Work { title: string; note?: string }
export interface Relationship {
  targetId: string;
  /** Only `influence` asserts a historical connection. Other links are learning comparisons. */
  type: RelationType;
  label: string;
}
export interface Philosopher {
  id: string;
  name: string;
  latinName: string;
  /** Null when no reliable life date is known; never invent a lifespan for a timeline. */
  birthYear: number | null;
  deathYear: number | null;
  dates: string;
  epoch: EpochId;
  tradition: string;
  schools: string[];
  tags: TopicId[];
  summary: string;
  /** Historical biographical facts, expressed in plain language. */
  bio: string;
  /** Plain-language explanations; optionally explicitly classified. */
  ideas: Idea[];
  works: Work[];
  /** Modern educational interpretations, not quotations or claims of direct answers. */
  positions: Record<TopicId, string>;
  sources: Source[];
  relationships?: Relationship[];
  portrait?: string;
}

export const EPOCHS: { id: EpochId; label: string; range: string }[] = [
  { id: 'antiquity', label: 'Древний мир', range: 'до V века' },
  { id: 'medieval', label: 'Средневековье', range: 'V–XV века' },
  { id: 'early-modern', label: 'Раннее Новое время', range: 'XVI–XVIII века' },
  { id: 'modern', label: 'XIX век', range: 'XIX век' },
  { id: 'contemporary', label: 'XX–XXI века', range: 'XX–XXI века' },
];

export const TOPICS: { id: TopicId; label: string; question: string; description: string }[] = [
  { id: 'freedom', label: 'Свобода воли', question: 'Насколько свободен мой выбор?', description: 'Решения, желания и обстоятельства, которые нас формируют.' },
  { id: 'meaning', label: 'Смысл жизни', question: 'Ради чего стоит жить?', description: 'Цели, ценности и способы осмыслять собственную жизнь.' },
  { id: 'consciousness', label: 'Сознание', question: 'Что значит быть собой?', description: 'Опыт, мышление и отношение человека к миру.' },
  { id: 'happiness', label: 'Счастье', question: 'Что делает жизнь хорошей?', description: 'Удовольствие, спокойствие, добродетель и полнота жизни.' },
  { id: 'morality', label: 'Мораль', question: 'Как понять, что правильно?', description: 'Основания поступков, долг и забота о других.' },
  { id: 'justice', label: 'Справедливость', question: 'Как нам жить вместе?', description: 'Равенство, власть, права и устройство общего мира.' },
];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  fact: 'Исторический факт', explanation: 'Простое объяснение', interpretation: 'Интерпретация',
};
export const RELATION_LABELS: Record<RelationType, string> = {
  influence: 'Историческое влияние', contrast: 'Различие взглядов', affinity: 'Сходство идей',
};

export const epochLabel = (id: EpochId) => EPOCHS.find(epoch => epoch.id === id)?.label ?? id;
export const topicLabel = (id: TopicId) => TOPICS.find(topic => topic.id === id)?.label ?? id;
