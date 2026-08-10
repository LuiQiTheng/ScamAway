import React, { useState } from 'react';
import { CheckCircle, RotateCcw, ShieldQuestion, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { QUIZ_SCENARIOS } from '../content/educationalContent';

export default function SpotTheScamQuiz({ scenarios = QUIZ_SCENARIOS }) {
  const { lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [finished, setFinished] = useState(false);

  const currentScenario = scenarios[currentIndex];
  const isCorrect = selectedAnswer === currentScenario?.answer;

  const copy = lang === 'ms'
    ? {
        eyebrow: 'Kuiz 5 soalan',
        title: 'Kesan Scam',
        description: 'Baca mesej dan pilih hanya satu jawapan: Selamat atau Scam.',
        question: 'Soalan',
        score: 'Skor',
        safe: 'Selamat',
        scam: 'Scam',
        correct: 'Betul!',
        incorrect: 'Belum tepat.',
        next: 'Soalan seterusnya',
        results: 'Kuiz selesai',
        resultText: 'Anda mengenal pasti {score} daripada {total} situasi dengan betul.',
        restart: 'Cuba lagi',
      }
    : {
        eyebrow: '5-question quiz',
        title: 'Spot the Scam',
        description: 'Read the message and make one decision: Safe or Scam.',
        question: 'Question',
        score: 'Score',
        safe: 'Safe',
        scam: 'Scam',
        correct: 'Correct!',
        incorrect: 'Not quite.',
        next: 'Next scenario',
        results: 'Quiz complete',
        resultText: 'You identified {score} out of {total} scenarios correctly.',
        restart: 'Try again',
      };

  const chooseAnswer = (answer) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    if (answer === currentScenario.answer) {
      setScore((previousScore) => previousScore + 1);
    }
  };

  const goNext = () => {
    if (currentIndex === scenarios.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer(null);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setFinished(false);
  };

  if (finished) {
    return (
      <section className="quiz-card glass-panel" aria-labelledby="quiz-results-title">
        <div className="quiz-results">
          <CheckCircle size={54} aria-hidden="true" />
          <p className="section-eyebrow">{copy.results}</p>
          <h2 id="quiz-results-title">
            {score}/{scenarios.length}
          </h2>
          <p>
            {copy.resultText
              .replace('{score}', score)
              .replace('{total}', scenarios.length)}
          </p>
          <button type="button" className="btn-primary quiz-restart" onClick={restartQuiz}>
            <RotateCcw size={17} aria-hidden="true" />
            {copy.restart}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-card glass-panel" aria-labelledby="spot-the-scam-title">
      <div className="quiz-heading">
        <div className="quiz-heading-icon" aria-hidden="true">
          <ShieldQuestion size={26} />
        </div>
        <div>
          <p className="section-eyebrow">{copy.eyebrow}</p>
          <h2 id="spot-the-scam-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
      </div>

      <div className="quiz-status" aria-label={`${copy.question} ${currentIndex + 1}`}>
        <span>
          {copy.question} {currentIndex + 1}/{scenarios.length}
        </span>
        <span>
          {copy.score}: {score}
        </span>
      </div>

      <div
        className="quiz-progress"
        role="progressbar"
        aria-valuemin="1"
        aria-valuemax={scenarios.length}
        aria-valuenow={currentIndex + 1}
      >
        <span style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }} />
      </div>

      <blockquote className="quiz-scenario">
        {currentScenario.text[lang] || currentScenario.text.en}
      </blockquote>

      <div className="quiz-answer-buttons" role="group" aria-label="Quiz answers">
        <button
          type="button"
          className={`quiz-answer quiz-answer-safe ${selectedAnswer === 'safe' ? 'selected' : ''}`}
          onClick={() => chooseAnswer('safe')}
          disabled={Boolean(selectedAnswer)}
        >
          {copy.safe}
        </button>
        <button
          type="button"
          className={`quiz-answer quiz-answer-scam ${selectedAnswer === 'scam' ? 'selected' : ''}`}
          onClick={() => chooseAnswer('scam')}
          disabled={Boolean(selectedAnswer)}
        >
          {copy.scam}
        </button>
      </div>

      {selectedAnswer && (
        <div
          className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
          role="status"
          aria-live="polite"
        >
          {isCorrect ? (
            <CheckCircle size={22} aria-hidden="true" />
          ) : (
            <XCircle size={22} aria-hidden="true" />
          )}
          <div>
            <strong>{isCorrect ? copy.correct : copy.incorrect}</strong>
            <p>{currentScenario.explanation[lang] || currentScenario.explanation.en}</p>
            <button type="button" className="btn-secondary quiz-next" onClick={goNext}>
              {copy.next}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
