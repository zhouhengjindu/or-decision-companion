'use client';

import Link from '@/components/PageLink';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { mockAI } from '@/lib/ai/mock-provider';
import { fetchDecisions, saveDecision } from '@/lib/client-api';
import type { CreateDecisionPayload } from '@/db/queries';
import type {
  ClarifyingQuestion,
  DecisionClassification,
  DecisionRecord,
  ModePreference,
  Recommendation,
} from '@/lib/types';
import { DecisionCard } from '@/components/journal/DecisionCard';

type Phase = 'input' | 'questions' | 'ritual' | 'result' | 'saved';
const modes: Array<{ id: ModePreference; label: string; note: string }> = [
  { id: 'auto', label: 'Auto', note: 'Or decides' },
  { id: 'fast', label: 'Fast', note: 'Just choose' },
  { id: 'think', label: 'Think', note: 'Ask what matters' },
  { id: 'deep', label: 'Deep', note: 'For the big ones' },
];
const ritualWords = ['listening', 'weighing', 'letting go'];
const subscribeToClientReady = () => () => undefined;
const getClientReady = () => true;
const getServerReady = () => false;

interface SpeechRecognitionEventLike { results: ArrayLike<{ 0: { transcript: string } }> }
interface SpeechRecognitionLike {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
}

async function imageToDataUrl(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('That image is too large. Try one under 10 MB.');
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image preview is unavailable.');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL('image/jpeg', .74);
}

export function DecisionExperience() {
  const [phase, setPhase] = useState<Phase>('input');
  const [options, setOptions] = useState(['', '']);
  const [images, setImages] = useState<Array<string | null>>([null, null]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const optionA = options[0];
  const optionB = options[1];
  const setOptionA = (value: string) => setOptions((items) => items.map((item, index) => index === 0 ? value : item));
  const [context, setContext] = useState('');
  const [mode, setMode] = useState<ModePreference>('auto');
  const [mood, setMood] = useState('torn');
  const [classification, setClassification] = useState<DecisionClassification | null>(null);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [savedDecision, setSavedDecision] = useState<DecisionRecord | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [ritualWord, setRitualWord] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const ready = useSyncExternalStore(subscribeToClientReady, getClientReady, getServerReady);
  const startedAt = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    fetchDecisions().then(setHistory).catch((caught) => {
      if (!(caught instanceof Error && caught.message.includes('Sign in'))) setNotice('Memory is taking a moment. You can still decide; saving will retry it.');
    });
  }, []);

  const resolvedInput = { options: options.map((option) => option.trim()), optionA: optionA.trim(), optionB: optionB.trim(), context: context.trim(), preferredMode: mode };

  function parseNaturalLanguage(input = resolvedInput) {
    if (input.options.length !== 2 || input.optionB.trim()) return input;
    const parts = input.optionA.split(/\s+(?:or|OR|或者|还是)\s+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 2) {
      return { ...input, options: parts, optionA: parts[0], optionB: parts[1] };
    }
    return input;
  }

  async function runRitual(nextClassification: DecisionClassification, nextAnswers: Record<string, string>, input = resolvedInput) {
    setClassification(nextClassification);
    setPhase('ritual');
    setRitualWord(0);
    const interval = window.setInterval(() => setRitualWord((value) => Math.min(2, value + 1)), 430);
    await new Promise((resolve) => window.setTimeout(resolve, 1420));
    window.clearInterval(interval);
    const nextRecommendation = await mockAI.recommend({ ...input, classification: nextClassification, answers: nextAnswers, history });
    setRecommendation(nextRecommendation);
    setPhase('result');
  }

  async function beginDecision(submitted?: { options: string[]; context: string }) {
    setError('');
    setNotice('');
    const input = parseNaturalLanguage(submitted
      ? { options: submitted.options.map((option) => option.trim()), optionA: submitted.options[0].trim(), optionB: submitted.options[1].trim(), context: submitted.context.trim(), preferredMode: mode }
      : resolvedInput);
    setOptions(input.options);
    setContext(input.context);
    if (input.options.some((option) => !option)) {
      setError('Fill each option, or remove the ones you do not need.');
      return;
    }
    if (new Set(input.options.map((option) => option.toLowerCase())).size !== input.options.length) {
      setError('These options look the same. Make each possibility distinct.');
      return;
    }
    const nextClassification = await mockAI.classifyDecision(input);
    const nextQuestions = await mockAI.generateClarifyingQuestions(input, nextClassification);
    setClassification(nextClassification);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setAnswers({});
    if (nextQuestions.length) setPhase('questions');
    else await runRitual(nextClassification, {}, input);
  }

  async function answerQuestion(value: string) {
    if (!classification) return;
    const question = questions[questionIndex];
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    if (questionIndex < questions.length - 1) setQuestionIndex((index) => index + 1);
    else await runRitual(classification, nextAnswers);
  }

  async function choose(finalChoiceIndex: number) {
    if (!classification || !recommendation) return;
    setSaving(true);
    setError('');
    const accepted = finalChoiceIndex === recommendation.chosenIndex;
    const finalChoice = options[finalChoiceIndex];
    const finishedAt = Date.now();
    const beganAt = startedAt.current ?? finishedAt;
    let pendingPayload: CreateDecisionPayload | null = null;
    try {
      const reflection = await mockAI.generateReflection({ finalChoice, accepted, mode: classification.mode, category: classification.category });
      pendingPayload = {
        question: `${options.join(' or ')}?`, context, optionA, optionB, options, images,
        mode: classification.mode, category: classification.category, reversible: classification.reversible,
        recommendationIndex: recommendation.chosenIndex, confidence: recommendation.confidence, reason: recommendation.reason,
        tradeoff: recommendation.tradeoff, regretEstimate: recommendation.regretEstimate, finalChoiceIndex, accepted,
        durationSeconds: Math.max(1, Math.round((finishedAt - beganAt) / 1000)), mood, reflection,
      };
      const record = await saveDecision(pendingPayload);
      setSavedDecision(record);
      setHistory((items) => [record, ...items]);
      setPhase('saved');
    } catch (caught) {
      if (caught instanceof Error && caught.message.includes('Sign in')) {
        try {
          if (!pendingPayload) throw new Error('The current decision is no longer available to save.');
          const pending = JSON.stringify(pendingPayload);
          if (pending.length <= 3_000_000) sessionStorage.setItem('or-pending-decision', pending);
        } catch { /* The visitor can still sign in and repeat the decision if browser storage is full. */ }
        window.location.assign(`/login?next=${encodeURIComponent('/auth/complete')}`);
        return;
      }
      setError(caught instanceof Error ? caught.message : 'Or could not save this decision. Try once more.');
    } finally { setSaving(false); }
  }

  function reset() {
    setPhase('input'); setOptions(['', '']); setImages([null, null]); setContext(''); setShowAlternatives(false);
    setClassification(null); setQuestions([]); setAnswers({}); setRecommendation(null); setSavedDecision(null);
    setShowWhy(false); setError(''); setNotice(''); setMood('torn'); startedAt.current = Date.now();
  }

  function speakInput() {
    setNotice('');
    const SpeechRecognitionCtor = (window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }).SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setNotice("Voice isn't supported here — type instead.");
      return;
    }
    if (listening) { recognitionRef.current?.stop(); return; }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setOptionA(transcript);
      setNotice('Voice captured. Put the two options on either side of “or,” or fill B below.');
    };
    recognition.onerror = () => setNotice("I couldn't catch that — type it instead.");
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  async function loadPhoto(file: File | undefined, index: number) {
    if (!file) return;
    try {
      const value = await imageToDataUrl(file);
      setImages((items) => items.map((image, position) => position === index ? value : image));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'That photo could not be opened.'); }
  }

  function hearOr() {
    if (!recommendation || !('speechSynthesis' in window)) {
      setNotice('Voice playback is not supported here.'); return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${recommendation.choice}. ${recommendation.reason}`);
    utterance.rate = .92; utterance.pitch = .92;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className={`decision-stage phase-${phase}`} id="decide" aria-live="polite">
      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .32 }}>
            <p className="eyebrow"><span /> A little space between maybe and done</p>
            <h1>What are you deciding?</h1>
            <p className="intro">Give Or your possibilities, then add what matters to you.</p>

            <form className="decision-paper" onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void beginDecision({ options: data.getAll('options').map(String), context: String(data.get('context') ?? '') });
            }}>
              {options.map((option, index) => (
                <div key={index}>
                  {index > 0 && <div className="or-divider" aria-hidden="true"><span />or<span /></div>}
                  <OptionInput side={String.fromCharCode(65 + index)} value={option}
                    setValue={(value) => setOptions((items) => items.map((item, position) => position === index ? value : item))}
                    image={images[index]} removeImage={() => setImages((items) => items.map((image, position) => position === index ? null : image))}
                    loadPhoto={(file) => void loadPhoto(file, index)} placeholder={index === 0 ? 'Stay home tonight' : index === 1 ? 'Go out with friends' : 'Another possibility'} />
                  {options.length > 2 && <button type="button" className="text-button remove-option" aria-label={`Remove option ${String.fromCharCode(65 + index)}`} onClick={() => {
                    setOptions((items) => items.filter((_, position) => position !== index));
                    setImages((items) => items.filter((_, position) => position !== index));
                  }}>Remove option</button>}
                </div>
              ))}
              <button type="button" className="secondary-button add-option" disabled={options.length >= 10} onClick={() => {
                setOptions((items) => [...items, '']); setImages((items) => [...items, null]);
              }}>＋ Add option {options.length >= 10 && '(maximum 10)'}</button>

              <label className="context-field decision-background">
                <span>Decision background <small>Optional</small></span>
                <textarea name="context" value={context} onChange={(event) => setContext(event.target.value)} rows={4} maxLength={2000}
                  placeholder="What is the situation? Add your goals, constraints, budget, deadline, or concerns beyond the options." />
                <small>{context.length} / 2000 · Used for decision classification and saved with your entry.</small>
              </label>

              <div className="paper-footer final-footer">
                <button className={`voice-button ${listening ? 'is-listening' : ''}`} type="button" onClick={speakInput}>
                  <span className="mic" aria-hidden="true" /> {listening ? 'Listening… tap to stop' : 'Tap to speak'}
                </button>
                <fieldset className="mode-picker">
                  <legend className="sr-only">Decision mode</legend>
                  {modes.map((item) => (
                    <button key={item.id} className={mode === item.id ? 'mode-button is-selected' : 'mode-button'} type="button" onClick={() => setMode(item.id)} aria-pressed={mode === item.id} title={item.note}>
                      <strong>{item.label}</strong><span>{item.note}</span>
                    </button>
                  ))}
                </fieldset>
                <button className="choose-button" type="button" disabled={!ready} onClick={(event) => {
                  const form = event.currentTarget.closest('form');
                  if (!form) return;
                  const data = new FormData(form);
                  void beginDecision({ options: data.getAll('options').map(String), context: String(data.get('context') ?? '') });
                }}>Choose for me <span aria-hidden="true">→</span></button>
              </div>
              <div className="mood-row" aria-label="Current mood">
                <span>I feel</span>
                {['torn', 'curious', 'tired', 'calm'].map((item) => <button key={item} type="button" className={mood === item ? 'is-selected' : ''} onClick={() => setMood(item)}>{item}</button>)}
              </div>
            </form>
            <Feedback error={error} notice={notice} />
            <p className="privacy-note">Private by account · saved only when you choose</p>
          </motion.div>
        )}

        {phase === 'questions' && classification && (
          <motion.div className="question-stage" key={`question-${questionIndex}`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .3 }}>
            <button className="back-button" type="button" onClick={() => questionIndex ? setQuestionIndex((index) => index - 1) : setPhase('input')}>← Back</button>
            <p className="mode-kicker">{classification.mode} Or · {questionIndex + 1} of {questions.length}</p>
            <h2>{questions[questionIndex].prompt}</h2>
            <div className="question-choices">
              {questions[questionIndex].choices.map((choice, index) => (
                <button key={choice.value} type="button" onClick={() => void answerQuestion(choice.value)}>
                  <span>{String.fromCharCode(65 + index)}</span>{choice.label}<i>→</i>
                </button>
              ))}
            </div>
            <p className="classification-note">{classification.explanation}</p>
          </motion.div>
        )}

        {phase === 'ritual' && (
          <motion.div className="ritual-stage" key="ritual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="ritual-orbit" aria-hidden="true">{options.map((option, index) => <span key={index}>{option}</span>)}</div>
            <p>{ritualWords[ritualWord]}</p>
            <small>Or is choosing</small>
          </motion.div>
        )}

        {phase === 'result' && recommendation && classification && (
          <motion.div className="result-stage" key="result" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .42 }}>
            <p className="mode-kicker">{classification.mode} Or chose</p>
            <h2>{recommendation.choice}<span>.</span></h2>
            <p className="result-reason">{recommendation.reason}</p>
            {recommendation.memoryNote && <p className="memory-note">↳ {recommendation.memoryNote}</p>}
            <div className="confidence-row"><span>Confidence</span><div><i style={{ width: `${recommendation.confidence}%` }} /></div><strong>{recommendation.confidence}%</strong></div>
            <AnimatePresence>
              {showWhy && (
                <motion.div className="why-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div><span>Trade-off</span><p>{recommendation.tradeoff}</p></div>
                  <div><span>Regret check</span><p>{recommendation.regretEstimate}</p></div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="result-actions">
              <button className="choose-button" type="button" disabled={saving} onClick={() => void choose(recommendation.chosenIndex)}>{saving ? 'Saving…' : "I'll do it"}<span>→</span></button>
              <button className="secondary-button" type="button" disabled={saving} onClick={() => options.length === 2 ? void choose(recommendation.chosenIndex === 0 ? 1 : 0) : setShowAlternatives((value) => !value)}>Not this time</button>
              <button className="text-button" type="button" onClick={() => setShowWhy((value) => !value)}>{showWhy ? 'Less' : 'Why?'}</button>
              <button className="text-button" type="button" onClick={hearOr}>Hear Or</button>
            </div>
            {showAlternatives && <div className="question-choices alternative-choices" aria-label="Choose another option">
              {options.map((option, index) => index !== recommendation.chosenIndex && <button key={index} type="button" disabled={saving} onClick={() => void choose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}<i>→</i></button>)}
            </div>}
            <Feedback error={error} notice={notice} />
          </motion.div>
        )}

        {phase === 'saved' && savedDecision && (
          <motion.div className="saved-stage" key="saved" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mode-kicker">It’s decided.</p>
            <h2>{savedDecision.finalChoice}</h2>
            <p className="today-note"><span>Today’s note</span>{savedDecision.reflection}</p>
            <DecisionCard record={savedDecision} featured exportable />
            <div className="saved-actions">
              <button className="secondary-button" type="button" onClick={reset}>Make another decision</button>
              <Link className="choose-button link-button" href="/diary">Open my decisions <span>→</span></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function OptionInput({ side, value, setValue, image, removeImage, loadPhoto, placeholder }: {
  side: string; value: string; setValue: (value: string) => void; image: string | null;
  removeImage: () => void; loadPhoto: (file?: File) => void; placeholder: string;
}) {
  return (
    <div className={`option-field ${image ? 'has-image' : ''}`}>
      <span className={`option-index ${side === 'B' ? 'option-b' : ''}`}>{side}</span>
      {image && <div className="photo-preview"><img src={image} alt="" /><button type="button" onClick={removeImage} aria-label={`Remove photo from option ${side}`}>×</button></div>}
      <label className="option-text"><span className="sr-only">Option {side}</span><input name="options" aria-label={`Option ${side}`} maxLength={500} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} /></label>
      <label className="photo-button">＋ photo<input type="file" accept="image/*" onChange={(event) => { loadPhoto(event.target.files?.[0]); event.target.value = ''; }} /></label>
    </div>
  );
}

function Feedback({ error, notice }: { error: string; notice: string }) {
  if (!error && !notice) return null;
  return <p className={error ? 'feedback is-error' : 'feedback'} role={error ? 'alert' : 'status'}>{error || notice}</p>;
}
