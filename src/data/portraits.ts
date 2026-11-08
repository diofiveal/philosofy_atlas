/** Wikimedia portraits; complete provenance in /portraits/attribution.json. */
const portraits = new Set(["socrates","plato","aristotle","epicurus","epictetus","marcus-aurelius","confucius","laozi","zhuangzi","nagarjuna","augustine","avicenna","averroes","aquinas","descartes","spinoza","hume","kant","mill","nietzsche","sartre","beauvoir","arendt","camus"]);
export function getPortrait(id: string): string | undefined { return portraits.has(id) ? `/portraits/${id}.webp` : undefined; }
export const portraitSource = (id: string) => '/portraits/attribution.json';
