'use client';

import {useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import {AnimatePresence, motion, useIsPresent, useReducedMotion} from 'motion/react';
import {ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, Compass, ExternalLink, MessageCircle, Sparkles} from 'lucide-react';
import {platoProfile} from '@/data/plato';
import type {BiographyChapter, HistoricalSource, ImmersivePhilosopher, InteractiveQuestion, PhilosophicalIdea, VisualTheme} from '@/data/plato-types';
import './plato.css';

const PhilosophyConnectionsMap = dynamic(() => import('./PhilosophyConnectionsMap'), {
  ssr: false,
  loading: () => <div className="plato-map-loading" role="status"><Compass size={26}/><p>Собираем круг собеседников…</p><span>Учителя, собеседники и продолжатели идей</span></div>,
});

type PlatoPageProps = {
  profile?: ImmersivePhilosopher;
  onBack: () => void;
  onOpenPhilosopher: (id: string) => void;
  saved: boolean;
  onToggleSaved: () => void;
};

function scrollToSection(id: string, reduced: boolean | null) {
  document.getElementById(id)?.scrollIntoView({behavior: reduced ? 'instant' : 'smooth', block: 'start'});
}

function themeStyle(theme: VisualTheme): CSSProperties {
  return {'--scene-text': theme.text, '--scene-accent': theme.accent, '--scene-gradient': theme.gradient, '--scene-overlay': theme.overlay} as CSSProperties;
}

export function DynamicBackground({theme, className = ''}: {theme: VisualTheme; className?: string}) {
  const reduced = useReducedMotion();
  const [scenes, setScenes] = useState<{current: VisualTheme; previous?: VisualTheme}>({current: theme});
  useEffect(() => {
    setScenes(value => value.current.id === theme.id ? value : {current: theme, previous: value.current});
  }, [theme]);
  useEffect(() => {
    if (!scenes.previous) return;
    const timer = window.setTimeout(() => setScenes(value => ({current: value.current})), reduced ? 0 : 720);
    return () => window.clearTimeout(timer);
  }, [scenes.current.id, scenes.previous, reduced]);
  return <div className={`plato-dynamic-background ${className}`} aria-hidden="true" data-theme-id={theme.id}>
    {[scenes.previous, scenes.current].filter((scene): scene is VisualTheme => !!scene).map(scene =>
      <motion.div key={scene.id} className="plato-scene-layer" initial={{opacity: 0}} animate={{opacity: scene.id === scenes.current.id ? 1 : 0}}
        transition={{duration: reduced || scene.animation === 'still' ? 0 : .7}} style={{background: scene.gradient}}>
        {scene.image && <img src={scene.image} alt="" loading="lazy" decoding="async"/>}
        <div className="plato-scene-shade" style={{opacity: scene.overlay}}/>
      </motion.div>
    )}
  </div>;
}

function CollapsiblePanel({id, labelledBy, className, children}: {id: string; labelledBy: string; className: string; children: ReactNode}) {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  return <motion.div id={id} role="region" aria-labelledby={labelledBy} aria-hidden={!present} inert={!present} className={className}
    initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} transition={{duration: reduced ? 0 : .28}}>{children}</motion.div>;
}

function SourceLinks({ids, sources}: {ids: string[]; sources: HistoricalSource[]}) {
  const matches = ids.map(id => sources.find(source => source.id === id)).filter((source): source is HistoricalSource => !!source);
  return <div className="plato-inline-sources" aria-label="Источники этого раздела">{matches.map(source =>
    <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title}{source.passage && <span> · {source.passage}</span>}<ArrowUpRight size={13}/></a>
  )}</div>;
}

export function PhilosopherHero({profile, saved, onToggleSaved}: {profile: ImmersivePhilosopher; saved: boolean; onToggleSaved: () => void}) {
  const reduced = useReducedMotion();
  return <section className="plato-hero" aria-labelledby="plato-title">
    <div className="plato-hero-copy">
      <div className="eyebrow"><span className="plato-live-dot"/>{profile.subtitle}</div>
      <p className="plato-hero-greeting">Давай познакомимся.</p>
      <h1 id="plato-title">Я — <em>{profile.name}.</em></h1>
      <div className="plato-hero-meta"><span>{profile.latinName}</span><span>{profile.dates}</span></div>
      <p className="plato-hero-intro">{profile.introduction}</p>
      <div className="plato-hero-actions"><button className="button button-dark" onClick={() => scrollToSection('plato-biography', reduced)}>Послушать мою историю<ArrowRight size={18}/></button>
        <button className="plato-save" aria-pressed={saved} onClick={onToggleSaved}>{saved ? <Check size={18}/> : <Bookmark size={18}/>}<span>{saved ? 'В избранном' : 'Сохранить'}</span></button></div>
      <p className="plato-narrative-notice"><Compass size={16}/>{profile.narrativeNotice}</p>
    </div>
    <div className="plato-hero-art">
      <span className="plato-art-label">ПОРТРЕТ СОБЕСЕДНИКА / 01</span>
      <div className="plato-portrait-orbit"/><div className="plato-portrait-orbit secondary"/>
      <div className="plato-portrait"><img src={profile.portrait} alt={`Портрет: ${profile.name}`} fetchPriority="high"/></div>
      <span className="plato-art-star" aria-hidden="true">✳</span>
      <div className="plato-portrait-caption"><span>НЕ НАСТОЯЩАЯ ЦИТАТА. НАЧАЛО РАЗГОВОРА.</span><p>{profile.subtitle}</p></div>
    </div>
  </section>;
}

export function BiographyAccordion({profile, activeId, onChange}: {profile: ImmersivePhilosopher; activeId: string | null; onChange: (chapter: BiographyChapter | null) => void}) {
  const reduced = useReducedMotion();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = profile.chapters.findIndex(chapter => chapter.id === activeId);
  const sceneChapter = profile.chapters[Math.max(0, activeIndex)];
  const theme = profile.themes.find(item => item.id === sceneChapter.themeId) ?? profile.themes[0];
  const focusChapter = (index: number) => {const chapter = profile.chapters[index]; onChange(chapter); buttons.current[index]?.focus({preventScroll: true});};
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = (index + 1) % profile.chapters.length;
    if (event.key === 'ArrowUp') next = (index + profile.chapters.length - 1) % profile.chapters.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = profile.chapters.length - 1;
    if (next !== undefined) {event.preventDefault(); buttons.current[next]?.focus();}
  };
  return <section id="plato-biography" className="plato-section" aria-labelledby="plato-biography-title">
    <SectionTitle number="01" eyebrow="ПЯТЬ ГЛАВ ОДНОЙ ЖИЗНИ" title="Сначала — моя история." id="plato-biography-title" description="Не ищи здесь безупречного мудреца. Я тоже менял планы, ошибался и начинал заново."/>
    <div className="plato-biography-stage" style={themeStyle(theme)}>
      <DynamicBackground theme={theme}/>
      <div className="plato-biography-scene-caption" aria-hidden="true"><span>МЕСТО ДЕЙСТВИЯ</span><strong>{sceneChapter.period}</strong><p>{theme.imageAlt}</p><span className="plato-scene-reconstruction">Художественная иллюстрация</span></div>
      <div className="plato-chapters">
        {profile.chapters.map((chapter, index) => {const active = chapter.id === activeId; return <article className={`plato-chapter ${active ? 'is-open' : ''}`} key={chapter.id} data-testid={`chapter-${chapter.id}`}>
          <h3><button ref={element => {buttons.current[index] = element;}} id={`chapter-trigger-${chapter.id}`} aria-expanded={active} aria-controls={active ? `chapter-panel-${chapter.id}` : undefined}
            onClick={() => onChange(active ? null : chapter)} onKeyDown={event => handleKey(event, index)}>
            <span className="plato-chapter-number">{chapter.number}</span><span className="plato-chapter-heading"><small>{chapter.period}</small><strong>{chapter.title}</strong><span>{chapter.teaser}</span></span><ChevronDown size={20} className="plato-disclosure-icon"/>
          </button></h3>
          <AnimatePresence initial={false}>{active && <CollapsiblePanel id={`chapter-panel-${chapter.id}`} labelledBy={`chapter-trigger-${chapter.id}`} className="plato-chapter-panel">
            <div className="plato-chapter-prose">{chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
              {chapter.note && <p className="plato-editor-note"><span>ПРИМЕЧАНИЕ</span>{chapter.note}</p>}
              <SourceLinks ids={chapter.sourceIds} sources={profile.sources}/>
            </div>
          </CollapsiblePanel>}</AnimatePresence>
        </article>;})}
        <div className="plato-chapter-navigation" aria-label="Переход между главами"><button onClick={() => focusChapter(Math.max(0, activeIndex - 1))} disabled={activeIndex <= 0}><ChevronLeft size={17}/>Назад</button><span>{activeIndex < 0 ? 'Выбери главу' : `${activeIndex + 1} / ${profile.chapters.length}`}</span><button onClick={() => focusChapter(Math.min(profile.chapters.length - 1, activeIndex + 1))} disabled={activeIndex === profile.chapters.length - 1}>Дальше<ChevronRight size={17}/></button></div>
      </div>
    </div>
  </section>;
}

function SectionTitle({number, eyebrow, title, description, id}: {number: string; eyebrow: string; title: string; description: string; id: string}) {
  return <div className="plato-section-heading"><div><div className="eyebrow"><span>{number} /</span>{eyebrow}</div><h2 id={id}>{title}</h2></div><p>{description}</p></div>;
}

export function IdeaDialogue({question, sources, speaker = 'Платон'}: {question: InteractiveQuestion; sources?: HistoricalSource[]; speaker?: string}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const firstOption = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();
  const selected = question.options.find(option => option.id === selectedId);
  return <div className="plato-dialogue" data-testid={`dialogue-${question.id}`}>
    <div className="plato-dialogue-label"><MessageCircle size={16}/><span>ТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ</span></div>
    <h4 id={`question-${question.id}`}>{question.title}</h4>{question.prompt !== question.title && <p>{question.prompt}</p>}
    <div className="plato-dialogue-options" role="group" aria-labelledby={`question-${question.id}`}>{question.options.map((option, index) => <button ref={index === 0 ? firstOption : undefined} key={option.id} aria-pressed={selectedId === option.id} onClick={() => setSelectedId(option.id)}><span>0{index + 1}</span>{option.label}<ArrowUpRight size={15}/></button>)}</div>
    <div className="plato-dialogue-response" aria-live="polite" aria-atomic="true"><AnimatePresence mode="wait" initial={false}>{selected && <motion.div key={selected.id} initial={{opacity: 0, y: reduced ? 0 : 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{duration: reduced ? 0 : .18}}><span className="plato-response-name">{speaker.toLocaleUpperCase('ru-RU')} ОТВЕЧАЕТ</span><p>{selected.response}</p><button className="plato-small-link" onClick={() => {setSelectedId(null); firstOption.current?.focus({preventScroll: true});}}>Подумать заново</button></motion.div>}</AnimatePresence></div>
    {sources && <SourceLinks ids={question.sourceIds} sources={sources}/>}
  </div>;
}

function RevealedIdea({idea, profile}: {idea: PhilosophicalIdea; profile: ImmersivePhilosopher}) {
  const reduced = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(reduced ? idea.paragraphs.length : 1);
  useEffect(() => {
    if (reduced) {setVisibleCount(idea.paragraphs.length); return;}
    if (visibleCount >= idea.paragraphs.length) return;
    const timer = window.setTimeout(() => setVisibleCount(count => count + 1), 170);
    return () => window.clearTimeout(timer);
  }, [visibleCount, reduced, idea.paragraphs.length]);
  const question = profile.questions.find(item => item.id === idea.questionId);
  return <div className="plato-idea-content">
    <div className="plato-idea-reading-tools"><span>ОБЪЯСНЕНИЕ ОТ ПЕРВОГО ЛИЦА</span><button onClick={() => setVisibleCount(idea.paragraphs.length)} disabled={visibleCount >= idea.paragraphs.length}><Sparkles size={14}/>{visibleCount >= idea.paragraphs.length ? 'Весь рассказ открыт' : 'Показать весь рассказ'}</button></div>
    <div className="plato-idea-prose">{idea.paragraphs.slice(0, visibleCount).map((paragraph, index) => <motion.p key={index} initial={{opacity: reduced ? 1 : 0, y: reduced ? 0 : 6}} animate={{opacity: 1, y: 0}} transition={{duration: reduced ? 0 : .2}}>{paragraph}</motion.p>)}</div>
    {idea.note && <p className="plato-idea-note">{idea.note}</p>}
    <div className="plato-work-references"><BookOpen size={15}/><span>{idea.workIds.map(id => profile.works.find(work => work.id === id)?.title).filter(Boolean).join(' · ')}</span></div>
    {question && <IdeaDialogue question={question} speaker={profile.name}/>}
    <SourceLinks ids={idea.sourceIds} sources={profile.sources}/>
  </div>;
}

export function PhilosophyIdeaCard({idea, profile, active, onToggle}: {idea: PhilosophicalIdea; profile: ImmersivePhilosopher; active: boolean; onToggle: () => void}) {
  const reduced = useReducedMotion();
  const theme = profile.themes.find(item => item.id === idea.themeId) ?? profile.themes[0];
  return <article className={`plato-idea-card ${active ? 'is-open' : ''}`} style={themeStyle(theme)} data-testid={`idea-${idea.id}`}>
    {active && <DynamicBackground theme={theme}/>}
    <h3><button id={`idea-trigger-${idea.id}`} aria-expanded={active} aria-controls={active ? `idea-panel-${idea.id}` : undefined} onClick={onToggle}>
      <span className="plato-idea-symbol" aria-hidden="true">{idea.symbol}</span><span className="plato-idea-number">{idea.number} / ИДЕЯ</span><strong>{idea.title}</strong><span className="plato-idea-teaser">{idea.teaser}</span><span className="plato-idea-action">{active ? 'Закрыть разговор' : 'Давай разберёмся'}<ChevronDown size={17}/></span>
    </button></h3>
    <AnimatePresence initial={false}>{active && <CollapsiblePanel id={`idea-panel-${idea.id}`} labelledBy={`idea-trigger-${idea.id}`} className="plato-idea-panel"><RevealedIdea idea={idea} profile={profile}/></CollapsiblePanel>}</AnimatePresence>
  </article>;
}

export function BooksGallery({profile}: {profile: ImmersivePhilosopher}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const reduced = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = profile.works[selectedIndex];
  const selectWithKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % profile.works.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + profile.works.length) % profile.works.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = profile.works.length - 1;
    else return;
    event.preventDefault(); setSelectedIndex(next); tabs.current[next]?.focus();
  };
  return <section id="plato-books" className="plato-section" aria-labelledby="plato-books-title">
    <SectionTitle number="03" eyebrow="ДИАЛОГИ, А НЕ ГОТОВЫЕ ОТВЕТЫ" title="Мои книги." id="plato-books-title" description="Почти везде я прячусь за голосами собеседников. Читать меня лучше с готовностью возразить."/>
    <div className="plato-books-tabs" role="tablist" aria-label="Выбрать произведение">{profile.works.map((work, index) => <motion.button role="tab" id={`book-tab-${work.id}`} aria-controls="plato-book-panel" aria-selected={selectedIndex === index} tabIndex={selectedIndex === index ? 0 : -1} ref={element => {tabs.current[index] = element;}} onKeyDown={event => selectWithKey(event, index)} key={work.id} onClick={() => setSelectedIndex(index)} className={`plato-book ${selectedIndex === index ? 'is-selected' : ''}`} style={{'--book-color': work.color} as CSSProperties} whileHover={reduced ? undefined : {y: -7}} transition={{duration: .18}}>
      <span className="plato-book-number">ДИАЛОГ / 0{index + 1}</span><BookOpen size={23} strokeWidth={1}/><strong>{work.title}</strong><span className="plato-book-subtitle">{work.subtitle}</span><span className="plato-book-open">{selectedIndex === index ? 'На твоём столе' : 'Открыть книгу'}<ArrowUpRight size={15}/></span>
    </motion.button>)}</div>
    <div id="plato-book-panel" role="tabpanel" aria-labelledby={`book-tab-${selected.id}`} className="plato-book-panel" tabIndex={0}><AnimatePresence mode="wait" initial={false}><motion.div key={selected.id} initial={{opacity: 0, y: reduced ? 0 : 7}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{duration: reduced ? 0 : .18}} className="plato-book-detail">
      <div className="plato-book-recommendation"><span className="eyebrow">{profile.name.toLocaleUpperCase('ru-RU')} РЕКОМЕНДУЕТ</span><h3>{selected.title}</h3><p>{selected.recommendation}</p><a className="text-link" href={selected.readingUrl} target="_blank" rel="noreferrer">Читать первоисточник<ExternalLink size={16}/></a></div>
      <div className="plato-book-description"><h4>О чём разговор</h4><p>{selected.description}</p><h4>Вопросы, которые останутся</h4><ul>{selected.questions.map(question => <li key={question}>{question}</li>)}</ul><h4>Ключевые идеи</h4><div className="plato-book-tags">{selected.keyIdeas.map(idea => <span key={idea}>{idea}</span>)}</div><h4>Зачем читать</h4><p>{selected.whyRead}</p><SourceLinks ids={selected.sourceIds} sources={profile.sources}/></div>
    </motion.div></AnimatePresence></div>
  </section>;
}

export default function PlatoPage({profile = platoProfile, onBack, onOpenPhilosopher, saved, onToggleSaved}: PlatoPageProps) {
  const reduced = useReducedMotion();
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [activeIdea, setActiveIdea] = useState<string | null>(null);
  const [themeId, setThemeId] = useState(profile.chapters[0].themeId);
  const theme = profile.themes.find(item => item.id === themeId) ?? profile.themes[0];
  const sectionLinks = [['plato-biography', 'Моя история'], ['plato-ideas', 'Пять идей'], ['plato-books', 'Мои книги'], ['plato-connections', 'Мой круг'], ['plato-conversations', 'Поспорим?']];
  return <div className="plato-page" style={themeStyle(theme)} data-testid="plato-page" data-active-theme={themeId}>
    <DynamicBackground theme={theme} className="plato-page-atmosphere"/>
    <div className="page-shell plato-shell"><button className="back-link" onClick={onBack}><ArrowLeft size={17}/>Все философы</button>
      <PhilosopherHero profile={profile} saved={saved} onToggleSaved={onToggleSaved}/>
      <nav className="plato-section-nav" aria-label={`Разделы: ${profile.name}`}>{sectionLinks.map(([id, title], index) => <button key={id} onClick={() => scrollToSection(id, reduced)}><span>0{index + 1}</span>{title}<ArrowUpRight size={14}/></button>)}</nav>
      <BiographyAccordion profile={profile} activeId={activeChapter} onChange={chapter => {setActiveChapter(chapter?.id ?? null); if (chapter) setThemeId(chapter.themeId);}}/>
      <section id="plato-ideas" className="plato-section" aria-labelledby="plato-ideas-title"><SectionTitle number="02" eyebrow="ПЯТЬ ПОВОДОВ ПОСМОТРЕТЬ ИНАЧЕ" title="А теперь представь…" id="plato-ideas-title" description="Пещеру, справедливый город, спор внутри собственной души. Начнём с простого — а там посмотрим."/>
        <div className="plato-ideas-grid">{profile.ideas.map(idea => <PhilosophyIdeaCard key={idea.id} idea={idea} profile={profile} active={activeIdea === idea.id} onToggle={() => {setActiveIdea(activeIdea === idea.id ? null : idea.id); if (activeIdea !== idea.id) setThemeId(idea.themeId);}}/>)}</div>
      </section>
      <BooksGallery profile={profile}/>
      <section id="plato-connections" className="plato-section" aria-labelledby="plato-connections-title"><SectionTitle number="04" eyebrow="МЫСЛЬ ВСЕГДА С КЕМ-ТО СПОРИТ" title="Мой круг. И не только мой." id="plato-connections-title" description="Здесь есть учителя, ученики и люди, которых я никогда не встречал. Влияние не всегда начинается со знакомства."/>
        <PhilosophyConnectionsMap profile={profile} onOpenPhilosopher={onOpenPhilosopher}/>
      </section>
      <section id="plato-conversations" className="plato-section" aria-labelledby="plato-conversations-title"><SectionTitle number="05" eyebrow="БЕЗ ОЦЕНОК И ПРАВИЛЬНЫХ ОТВЕТОВ" title="Хорошо. А ты бы как поступил?" id="plato-conversations-title" description="Три коротких разговора. Выбери ответ, послушай возражение и попробуй другой путь."/>
        <div className="plato-dilemmas">{profile.dilemmaIds.map((id, index) => {const question = profile.questions.find(item => item.id === id); return question ? <article key={id}><span className="plato-dilemma-number">РАЗГОВОР / 0{index + 1}</span><IdeaDialogue question={question} sources={profile.sources} speaker={profile.name}/></article> : null;})}</div>
      </section>
      <section className="plato-sources-section" aria-labelledby="plato-sources-title"><div><div className="eyebrow">ПОСЛЕ РАЗГОВОРА — К ИСТОЧНИКАМ</div><h2 id="plato-sources-title">Не верь мне на слово.</h2><p>Рассказ от первого лица — современная образовательная реконструкция. Академические источники и тексты диалогов помогут проверить факты и продолжить спор.</p><a href="/portraits/attribution.json" target="_blank" rel="noreferrer">Сведения о портрете<ArrowUpRight size={14}/></a></div><div className="plato-source-list">{profile.sources.map(source => <a href={source.url} key={source.id} target="_blank" rel="noreferrer"><span>{source.kind === 'primary' ? 'ПЕРВОИСТОЧНИК' : 'АКАДЕМИЧЕСКИЙ ОБЗОР'}</span><strong>{source.title}</strong>{source.passage && <small>{source.passage}</small>}<ArrowUpRight size={17}/></a>)}</div></section>
    </div>
  </div>;
}
