'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, RotateCcw } from 'lucide-react';
import { TOPICS, type TopicId } from '@/data/types';
import { philosophers } from '@/data/philosophers';

type Choice = { title: string; reading: string; question: string };
type Experiment = { title: string; setting: string; prompt: string; choices: Choice[]; thinkers: string[] };

/** Original, nonhistorical teaching scenarios. These are not attributed to the philosophers. */
export const EXPERIMENTS: Record<TopicId, Experiment> = {
  freedom: {
    title: 'Развилка в саду',
    setting: 'Вы выросли в семье садовников. Каждое утро идёте к розам по знакомой дорожке. Сегодня у развилки вы замечаете заросшую тропу и решаете свернуть. Любопытство тоже воспитали в вас родители.',
    prompt: 'Что делает этот выбор свободным?',
    choices: [
      { title: 'Я действительно мог пойти иначе', reading: 'Для вас важна открытость возможностей. Но остаётся трудный вопрос: достаточно ли представить другой путь, чтобы он был возможен при тех же обстоятельствах?', question: 'Что отличает реальную возможность от ощущения возможности?' },
      { title: 'Решение выражает мои собственные желания', reading: 'Такой ответ позволяет считать выбор своим, даже если у желаний есть причины. Теперь нужно понять, какие влияния помогают формировать собственную волю, а какие подчиняют её.', question: 'В какой момент желание, усвоенное от других, становится вашим?' },
      { title: 'Я осознаю причины и могу их обдумать', reading: 'Здесь свобода связана со способностью понимать себя. Однако знание причин само по себе ещё не показывает, можете ли вы поступить иначе.', question: 'Прибавляется ли свобода, когда вы лучше понимаете свои мотивы?' },
    ],
    thinkers: ['spinoza', 'epictetus', 'sartre'],
  },
  meaning: {
    title: 'Сад, о котором никто не узнает',
    setting: 'В заброшенной долине вы находите сад. Можно посвятить годы его восстановлению. Плоды будут кормить путников, но ваше имя не сохранится, а однажды сад снова зарастёт.',
    prompt: 'Стоит ли посвятить этому часть жизни?',
    choices: [
      { title: 'Да, сама забота уже имеет смысл', reading: 'Вы находите ценность в самом действии и его отношении к живому миру. Но тогда важно решить, почему именно эта забота заслуживает вашего времени.', question: 'Может ли дело быть осмысленным, если у него нет окончательного результата?' },
      { title: 'Да, если это мой осознанный выбор', reading: 'Смысл здесь рождается из принятого вами обязательства. Сложность в том, чтобы отличить глубокую приверженность от случайного увлечения.', question: 'Нужно ли оправдывать свой выбор перед кем-то ещё?' },
      { title: 'Нет, я ищу дело с более долгим следом', reading: 'Для вас важна связь с будущим. Но любой след когда-нибудь исчезает: придётся определить, какая длительность делает труд достаточно ценным.', question: 'Как долго должен жить результат, чтобы жизнь не казалась потраченной зря?' },
    ],
    thinkers: ['camus', 'aristotle', 'confucius'],
  },
  consciousness: {
    title: 'Путник без прошлого',
    setting: 'После тяжёлой болезни путник не помнит своего имени и прожитых лет. Он по-прежнему любит дождь, узнаёт запах дома и умеет играть знакомую мелодию. Родные уверены, что перед ними тот же человек.',
    prompt: 'Что сохраняет его тождество самому себе?',
    choices: [
      { title: 'Непосредственное переживание: я существую', reading: 'В центре вашего ответа — опыт от первого лица. Но переживание настоящего ещё не объясняет, почему сегодняшнее «я» и человек из прошлого — одно лицо.', question: 'Достаточно ли чувства присутствия, чтобы оставаться тем же человеком?' },
      { title: 'Привычки, тело и отношения с близкими', reading: 'Вы связываете человека с устойчивой жизнью в мире. Это помогает заметить то, что сохраняется без воспоминаний, но граница допустимых изменений остаётся неясной.', question: 'Сколько таких связей должно сохраниться?' },
      { title: 'Возможно, неизменного «я» вообще нет', reading: 'Вы допускаете, что личность — меняющийся процесс. Тогда возникает новая задача: объяснить ответственность и заботу о человеке без неизменного внутреннего ядра.', question: 'Можно ли оставаться ответственным за прошлое, продолжая меняться?' },
    ],
    thinkers: ['descartes', 'hume', 'nagarjuna'],
  },
  happiness: {
    title: 'Два приглашения',
    setting: 'Вам предлагают спокойную жизнь рядом с друзьями: достаточно еды, времени и тишины. Другое приглашение — трудное путешествие, где можно развить талант и принести пользу, но придётся терпеть лишения.',
    prompt: 'Какое приглашение ближе к хорошей жизни?',
    choices: [
      { title: 'Спокойствие и дружба', reading: 'Вы цените устойчивое благополучие без лишней тревоги. Вопрос в том, где проходит граница между разумной достаточностью и отказом от важных возможностей.', question: 'Нужны ли для счастья великие свершения?' },
      { title: 'Развитие способностей и значимое дело', reading: 'Для вас хорошая жизнь включает осуществление возможностей. Но достижения могут потребовать жертв: стоит понять, какие из них оправданы.', question: 'Может ли полноценная жизнь быть при этом несчастливой?' },
      { title: 'Важнее моё отношение к любому пути', reading: 'Вы переносите внимание с обстоятельств на способ жить. Это поддерживает стойкость, хотя не отменяет реальной ценности дружбы, здоровья и безопасности.', question: 'Что зависит от отношения, а что требует изменения обстоятельств?' },
    ],
    thinkers: ['epicurus', 'aristotle', 'epictetus'],
  },
  morality: {
    title: 'Обещание у колодца',
    setting: 'Во время засухи сосед доверил вам кувшин воды и попросил вернуть его нетронутым к вечеру. По дороге вы встречаете обессиленного ребёнка. Другой воды рядом нет, а связаться с соседом невозможно.',
    prompt: 'Как поступить с обещанием?',
    choices: [
      { title: 'Сдержать обещание: доверие нельзя нарушать', reading: 'Вы защищаете правило, на котором держится сотрудничество. Но строгому правилу предстоит выдержать случай, когда его соблюдение причиняет серьёзный вред.', question: 'Существуют ли обязательства, которые действуют без исключений?' },
      { title: 'Дать воду: последствия важнее', reading: 'Вы стремитесь предотвратить ближайший тяжёлый вред. Придётся также учитывать менее заметные последствия: потребности соседа и сохранение доверия.', question: 'Как сравнивать последствия, если известны не все обстоятельства?' },
      { title: 'Помочь, затем объяснить и возместить', reading: 'Вы ищете ответ, учитывающий конкретные отношения и возможность исправить ущерб. Но обещание всё равно нарушено: возмещение не устраняет сам нравственный конфликт.', question: 'Может ли хороший поступок оставлять моральный долг?' },
    ],
    thinkers: ['kant', 'mill', 'confucius'],
  },
  justice: {
    title: 'Последний мешок зерна',
    setting: 'После неурожая деревня делит последний общий мешок зерна. Одни семьи многочисленнее, другие сильнее пострадали, третьи больше работали на общей земле. Всем поровну не хватит до нового урожая.',
    prompt: 'Какое правило распределения вы предложите?',
    choices: [
      { title: 'Поровну на каждого человека', reading: 'Вы выбираете понятное правило равного отношения. Но равные доли не учитывают различия в уязвимости и уже имеющихся запасах.', question: 'Когда одинаковое обращение становится несправедливым?' },
      { title: 'Больше тем, кто сильнее нуждается', reading: 'Вы ставите на первое место защиту от бедствия. Нужно определить нужду и объяснить, почему вклад других семей не должен иметь решающего значения.', question: 'Чем мы обязаны тем, кто оказался в худшем положении?' },
      { title: 'Учесть вклад и вместе обсудить исключения', reading: 'Вы соединяете признание труда с общим обсуждением. Но право голоса и переговорная сила могут быть неравными даже за одним столом.', question: 'Достаточно ли согласия большинства для справедливого решения?' },
    ],
    thinkers: ['plato', 'mill', 'arendt'],
  },
};

export interface EducationalLabProps {
  initialTopic?: TopicId;
  onOpenPhilosopher?: (id: string) => void;
  onCompare?: (a: string, b: string, topic: TopicId) => void;
}

export default function EducationalLab({ initialTopic, onOpenPhilosopher, onCompare }: EducationalLabProps) {
  const [topic, setTopic] = useState<TopicId | null>(initialTopic ?? null);
  const [answer, setAnswer] = useState<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    setTopic(initialTopic ?? null);
    setAnswer(null);
  }, [initialTopic]);

  const openTopic = (id: TopicId) => { setTopic(id); setAnswer(null); };
  const meta = TOPICS.find(item => item.id === topic);
  const experiment = topic ? EXPERIMENTS[topic] : null;
  const thinkers = experiment ? experiment.thinkers.map(id => philosophers.find(p => p.id === id)).filter(p => p !== undefined) : [];
  const reading = experiment && answer !== null ? experiment.choices[answer] : null;
  const enter = reduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const initial = reduced ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <section className="ed-lab" aria-labelledby="ed-title">
      <div className="ed-intro">
        <p className="ed-eyebrow">ВЫБЕРИТЕ ТЕМУ / 06 ВОПРОСОВ</p>
        <h2 id="ed-title">Шесть способов начать.</h2>
        <p className="ed-lead">Шесть небольших историй, чтобы примерить разные взгляды на жизнь. Здесь важнее ход вашей мысли, чем готовый ответ.</p>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {!topic ? (
          <motion.div key="topics" className="ed-topics" initial={initial} animate={enter} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .24 }}>
            {TOPICS.map((item, index) => (
              <button key={item.id} className="ed-topic" onClick={() => openTopic(item.id)}>
                <span className="ed-topic-top"><span className="ed-number">0{index + 1}</span><ArrowUpRight size={23} aria-hidden="true" /></span>
                <span className="ed-topic-label">{item.label}</span>
                <span className="ed-topic-question">{item.question}</span>
                <span className="ed-topic-description">{item.description}</span>
              </button>
            ))}
          </motion.div>
        ) : experiment && meta ? (
          <motion.div key={topic} initial={initial} animate={enter} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .24 }}>
            <div className="ed-toolbar">
              <button className="ed-back" onClick={() => { setTopic(null); setAnswer(null); }}><ArrowLeft size={17} aria-hidden="true" /> Все вопросы</button>
              <span>{meta.label} <span aria-hidden="true">/</span> авторский мысленный эксперимент</span>
            </div>
            <div className="ed-experiment">
              <div className="ed-story">
                <span className="ed-eyebrow">Представьте</span>
                <h2>{experiment.title}</h2>
                <p>{experiment.setting}</p>
                <div className="ed-story-mark" aria-hidden="true">?</div>
              </div>
              <div className="ed-decision">
                <span className="ed-eyebrow">Ваша точка зрения</span>
                <h3 id="ed-prompt">{experiment.prompt}</h3>
                <div className="ed-options" role="group" aria-labelledby="ed-prompt">
                  {experiment.choices.map((choice, index) => (
                    <button key={choice.title} className={`ed-option ${answer === index ? 'ed-option-selected' : ''}`} aria-pressed={answer === index} onClick={() => setAnswer(index)}>
                      <span className="ed-option-number">{answer === index ? <Check size={16} aria-hidden="true" /> : String.fromCharCode(65 + index)}</span>
                      <span>{choice.title}</span><ArrowRight className="ed-option-arrow" size={17} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <p className="ed-help">Можно выбрать другой ответ и посмотреть, как изменится рассуждение.</p>
              </div>
            </div>
            <div className="ed-result" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                {reading ? (
                  <motion.div key={`${topic}-${answer}`} initial={initial} animate={enter} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }} className="ed-reading">
                    <div><span className="ed-eyebrow">Продолжим рассуждение</span><p>{reading.reading}</p></div>
                    <div className="ed-reflection"><span className="ed-eyebrow">Вопрос к себе</span><h3>{reading.question}</h3><span>Единственного правильного ответа здесь нет.</span></div>
                  </motion.div>
                ) : <p className="ed-await">Выберите близкий вам ответ — и исследуйте его сильные стороны и трудности.</p>}
              </AnimatePresence>
            </div>
            {reading && (
              <motion.div initial={initial} animate={enter} transition={{ duration: reduced ? 0 : .3 }} className="ed-thinkers-section">
                <div className="ed-section-heading"><div><span className="ed-eyebrow">Продолжить с философами</span><h2>Один вопрос. Разные оптики.</h2></div><button className="ed-reset" onClick={() => setAnswer(null)}><RotateCcw size={16} aria-hidden="true" /> Обдумать заново</button></div>
                <p className="ed-interpretation">Современные образовательные интерпретации идей. Эти истории придуманы для атласа; философы не отвечали на них напрямую.</p>
                <div className="ed-thinkers">
                  {thinkers.map(p => (
                    <article key={p.id} className="ed-thinker">
                      <span className="ed-thinker-dates">{p.dates}</span><h3>{p.name}</h3><p>{p.positions[topic]}</p>
                      <button className="ed-text-link" onClick={() => onOpenPhilosopher ? onOpenPhilosopher(p.id) : (window.location.hash = `philosopher/${p.id}`)}>Познакомиться с идеями <ArrowUpRight size={17} aria-hidden="true" /></button>
                    </article>
                  ))}
                </div>
                {thinkers.length >= 2 && <button className="ed-compare" onClick={() => onCompare ? onCompare(thinkers[0].id, thinkers[1].id, topic) : (window.location.hash = `compare/${thinkers[0].id}/${thinkers[1].id}/${topic}`)}>Сравнить два взгляда <ArrowRight size={18} aria-hidden="true" /></button>}
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <style jsx>{`
        .ed-lab{color:var(--ink,#20231f);padding:32px 0 72px;--ed-serif:var(--serif,Georgia,serif)}
        .ed-intro{max-width:810px;margin-bottom:48px}.ed-eyebrow{font-size:11px;font-weight:650;letter-spacing:.15em;text-transform:uppercase;color:var(--muted,#70736a);display:block;margin:0 0 18px}
        .ed-intro h2{font-family:var(--ed-serif);font-weight:400;font-size:clamp(30px,3.5vw,46px);line-height:1.08;letter-spacing:-.045em;margin:0 0 24px}.ed-lead{font-size:18px;line-height:1.75;color:var(--muted,#70736a);max-width:620px;margin:0}
        .ed-topics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line,#d8d9cf);border-left:1px solid var(--line,#d8d9cf)}
        .ed-topic{appearance:none;text-align:left;background:transparent;color:inherit;border:0;border-right:1px solid var(--line,#d8d9cf);border-bottom:1px solid var(--line,#d8d9cf);padding:28px;min-height:270px;display:flex;flex-direction:column;cursor:pointer;transition:background .22s,color .22s}
        .ed-topic:hover{background:var(--accent,#dfff62);color:#20231f}.ed-topic-top{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:31px}.ed-number{font-size:11px;letter-spacing:.08em}.ed-topic-label{font-family:var(--ed-serif);font-size:32px;letter-spacing:-.035em;line-height:1.15;margin-bottom:12px}.ed-topic-question{font-size:14px;font-weight:600;line-height:1.5;margin-bottom:8px}.ed-topic-description{font-size:13px;line-height:1.65;opacity:.7;max-width:270px}
        .ed-toolbar{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:22px;font-size:11px;letter-spacing:.025em;color:var(--muted,#70736a)}.ed-back{display:inline-flex;align-items:center;gap:9px;min-height:44px;border:0;padding:0 8px 0 0;background:transparent;color:var(--ink,#20231f);cursor:pointer;font-size:13px;white-space:nowrap}
        .ed-experiment{display:grid;grid-template-columns:1fr 1fr;min-height:425px;border:1px solid var(--line,#d8d9cf)}.ed-story{background:var(--accent,#dfff62);color:#20231f;padding:40px;position:relative;overflow:hidden;isolation:isolate}.ed-story .ed-eyebrow{color:#4c542d}.ed-story h2{font-family:var(--ed-serif);font-size:clamp(31px,3vw,46px);font-weight:400;letter-spacing:-.04em;line-height:1.13;margin:0 0 26px;max-width:420px}.ed-story p{font-size:17px;line-height:1.8;margin:0;max-width:480px;position:relative;z-index:1}.ed-story-mark{position:absolute;font-family:var(--ed-serif);font-size:240px;line-height:.8;right:4px;bottom:-20px;opacity:.055;transform:rotate(-12deg);z-index:0}
        .ed-decision{padding:40px;background:var(--panel,transparent)}.ed-decision h3{font-family:var(--ed-serif);font-size:27px;line-height:1.25;font-weight:400;letter-spacing:-.025em;margin:0 0 24px}.ed-options{display:flex;flex-direction:column;gap:10px}.ed-option{display:flex;align-items:center;gap:12px;min-height:62px;padding:13px 15px;text-align:left;background:transparent;color:inherit;border:1px solid var(--line,#d8d9cf);cursor:pointer;font-size:14px;line-height:1.5;transition:background .18s,border-color .18s}.ed-option:hover{border-color:var(--ink,#20231f)}.ed-option-selected{background:var(--ink,#20231f);border-color:var(--ink,#20231f);color:var(--paper,#f4f1e8)}.ed-option-number{width:24px;height:24px;flex:0 0 24px;display:flex;align-items:center;justify-content:center;font-size:10px;border:1px solid currentColor;border-radius:50%;opacity:.75}.ed-option-arrow{margin-left:auto;flex:0 0 17px}.ed-help{color:var(--muted,#70736a);font-size:11px;line-height:1.7;max-width:360px;margin:18px 0 0}
        .ed-result{margin-top:0}.ed-await{margin:0;padding:22px 0;color:var(--muted,#70736a);font-size:13px;line-height:1.7}.ed-reading{display:grid;grid-template-columns:1fr 1fr;gap:55px;border-bottom:1px solid var(--line,#d8d9cf);padding:35px 0}.ed-reading p{font-size:16px;line-height:1.8;margin:0}.ed-reading .ed-eyebrow{margin-bottom:14px}.ed-reflection{padding-left:25px;border-left:2px solid var(--accent,#dfff62)}.ed-reflection h3{font-family:var(--ed-serif);font-size:26px;font-weight:400;line-height:1.4;margin:0 0 14px;letter-spacing:-.025em}.ed-reflection>span:last-child{font-size:11px;line-height:1.6;color:var(--muted,#70736a)}
        .ed-thinkers-section{padding-top:44px}.ed-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}.ed-section-heading h2{font-family:var(--ed-serif);font-size:clamp(30px,3vw,40px);font-weight:400;letter-spacing:-.035em;margin:0;line-height:1.2}.ed-section-heading .ed-eyebrow{margin-bottom:12px}.ed-reset{display:inline-flex;gap:8px;align-items:center;min-height:44px;background:transparent;border:0;color:var(--muted,#70736a);font-size:12px;cursor:pointer}.ed-interpretation{max-width:740px;font-size:12px;line-height:1.75;color:var(--muted,#70736a);margin:20px 0 28px}.ed-thinkers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.ed-thinker{padding:26px 23px;border:1px solid var(--line,#d8d9cf);display:flex;flex-direction:column}.ed-thinker-dates{color:var(--muted,#70736a);font-size:10px;letter-spacing:.05em;line-height:1.5}.ed-thinker h3{font-family:var(--ed-serif);font-size:28px;font-weight:400;letter-spacing:-.025em;margin:13px 0 18px;line-height:1.2}.ed-thinker p{font-size:14px;line-height:1.85;margin:0 0 24px;flex:1}.ed-text-link{display:inline-flex;justify-content:space-between;align-items:center;gap:9px;width:100%;text-align:left;min-height:44px;padding:10px 0 0;border:0;border-top:1px solid var(--line,#d8d9cf);background:transparent;color:inherit;font-size:11px;cursor:pointer}.ed-compare{display:inline-flex;align-items:center;justify-content:center;gap:28px;min-height:52px;padding:14px 22px;background:var(--ink,#20231f);color:var(--paper,#f4f1e8);border:1px solid var(--ink,#20231f);font-size:13px;margin-top:28px;cursor:pointer}
        button:focus-visible{outline:3px solid var(--accent,#dfff62);outline-offset:4px;box-shadow:0 0 0 5px var(--ink,#20231f)}.ed-topic:focus-visible,.ed-option:focus-visible{position:relative;z-index:1}
        @media(max-width:1000px){.ed-story,.ed-decision{padding:30px}.ed-topics{grid-template-columns:repeat(2,minmax(0,1fr))}.ed-topic{min-height:250px}.ed-thinkers{gap:12px}.ed-thinker{padding:22px 18px}}
        @media(max-width:700px){.ed-lab{padding:22px 0 48px}.ed-intro{margin-bottom:32px}.ed-lead{font-size:16px}.ed-intro h2{margin-bottom:20px}.ed-topic{padding:22px;min-height:245px}.ed-topic-label{font-size:27px}.ed-topic-description{font-size:12px}.ed-topic-top{margin-bottom:24px}.ed-toolbar{align-items:flex-start;gap:14px}.ed-toolbar>span{text-align:right;max-width:190px;line-height:1.6;padding-top:12px}.ed-experiment{grid-template-columns:1fr}.ed-story,.ed-decision{padding:28px}.ed-story p{font-size:16px}.ed-reading{grid-template-columns:1fr;gap:28px;padding:28px 0}.ed-reflection{padding-left:20px}.ed-section-heading{display:block}.ed-reset{margin-top:14px;padding-left:0}.ed-thinkers{grid-template-columns:1fr;gap:12px}.ed-thinker{padding:24px}.ed-thinker p{font-size:14px}.ed-compare{width:100%;margin-top:20px}.ed-thinkers-section{padding-top:32px}}
        @media(max-width:400px){.ed-topics{grid-template-columns:1fr}.ed-topic{min-height:225px}.ed-story,.ed-decision{padding:24px}.ed-option{padding:12px;font-size:13px}}
        @media(prefers-reduced-motion:reduce){.ed-topic,.ed-option{transition:none}.ed-story-mark{transform:none}}
      `}</style>
    </section>
  );
}
