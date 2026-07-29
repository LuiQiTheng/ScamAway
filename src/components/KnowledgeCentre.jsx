import React, { useState, useEffect, useRef } from 'react';
import { Award, BookOpen, ShieldAlert, CheckCircle, XCircle, RefreshCw, ChevronRight, ChevronDown, ChevronUp, Filter, AlertTriangle, Eye, Layers, Flame, Search, ExternalLink } from 'lucide-react';
import { getDailyQuestions } from '../utils/quizDatabase';
import { useLanguage } from '../context/LanguageContext';
import { LESSON_CARDS } from '../utils/lessonCards';

export default function KnowledgeCentre({ userMode = 'normal', isElderlyMode = false, isKidMode = false }) {
  const { t, lang } = useLanguage();

  // Helper to load saved state
  const getInitialState = (key, defaultVal) => {
    try {
      const saved = sessionStorage.getItem(`scamshield_quiz_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  };

  // Quiz State
  const [dailyQuestions, setDailyQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(() => getInitialState('idx', 0));
  const [selectedAnswer, setSelectedAnswer] = useState(() => getInitialState('ans', null));
  const [showExplanation, setShowExplanation] = useState(() => getInitialState('exp', false));
  const [score, setScore] = useState(() => getInitialState('score', 0));
  const [quizFinished, setQuizFinished] = useState(() => getInitialState('finished', false));
  const [isQuizStarted, setIsQuizStarted] = useState(() => getInitialState('started', false));
  
  // Continuous Challenge State
  const [streak, setStreak] = useState(() => getInitialState('streak', 0));
  const [longestStreak, setLongestStreak] = useState(() => getInitialState('longestStreak', 0));
  const [wrongQuestions, setWrongQuestions] = useState(() => getInitialState('wrongQ', []));
  const [isCorrectionPhase, setIsCorrectionPhase] = useState(() => getInitialState('correction', false));

  // Sync to session storage on change
  useEffect(() => {
    sessionStorage.setItem('scamshield_quiz_idx', JSON.stringify(currentQuestionIdx));
    sessionStorage.setItem('scamshield_quiz_ans', JSON.stringify(selectedAnswer));
    sessionStorage.setItem('scamshield_quiz_exp', JSON.stringify(showExplanation));
    sessionStorage.setItem('scamshield_quiz_score', JSON.stringify(score));
    sessionStorage.setItem('scamshield_quiz_finished', JSON.stringify(quizFinished));
    sessionStorage.setItem('scamshield_quiz_started', JSON.stringify(isQuizStarted));
    sessionStorage.setItem('scamshield_quiz_streak', JSON.stringify(streak));
    sessionStorage.setItem('scamshield_quiz_longestStreak', JSON.stringify(longestStreak));
    sessionStorage.setItem('scamshield_quiz_wrongQ', JSON.stringify(wrongQuestions));
    sessionStorage.setItem('scamshield_quiz_correction', JSON.stringify(isCorrectionPhase));
  }, [currentQuestionIdx, selectedAnswer, showExplanation, score, quizFinished, isQuizStarted, streak, longestStreak, wrongQuestions, isCorrectionPhase]);

  useEffect(() => {
    setDailyQuestions(getDailyQuestions());
  }, []);

  // Library State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalCard, setActiveModalCard] = useState(null);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);

  // Collapse library whenever category filters or search queries change
  useEffect(() => {
    setIsLibraryExpanded(false);
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'All', labelKey: 'category.all' },
    { id: 'Courier & Delivery', labelKey: 'category.courier' },
    { id: 'Job & Task Scams', labelKey: 'category.job' },
    { id: 'Threat & Govt Impersonation', labelKey: 'category.threat' },
    { id: 'Impossible Investment', labelKey: 'category.investment' },
    { id: 'Emergency & Secrecy', labelKey: 'category.emergency' },
    { id: 'Quishing / QR Code', labelKey: 'category.qr' }
  ];

  // Helper to translate a category string from a lesson card
  const translateCategory = (catStr) => {
    const found = categories.find(c => c.id === catStr);
    return found ? t(found.labelKey) : catStr;
  };

  // Helper to get bilingual text for card fields
  const getCardText = (card, field) => {
    if (lang === 'ms' && card[`${field}_ms`]) {
      return card[`${field}_ms`];
    }
    return card[field];
  };

  // Daily Featured Highlights
  const dailyFeaturedCards = LESSON_CARDS.filter(card => card.isDailyFeatured);

  // Filtered Cards for Library
  const filteredCards = LESSON_CARDS.filter(card => {
    const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.exampleMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Prioritize Daily Featured Highlights at the top of the list
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (a.isDailyFeatured && !b.isDailyFeatured) return -1;
    if (!a.isDailyFeatured && b.isDailyFeatured) return 1;
    return 0;
  });

  const initialCardCount = isElderlyMode ? 1 : 3;
  const visibleCards = isLibraryExpanded ? sortedCards : sortedCards.slice(0, initialCardCount);

  const currentQList = isCorrectionPhase ? wrongQuestions : dailyQuestions;
  const currentQ = currentQList[currentQuestionIdx];

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);

    if (answer === currentQ.isScam) {
      if (!isCorrectionPhase) {
        setScore(prev => prev + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > longestStreak) setLongestStreak(newStreak);
      }
    } else {
      if (!isCorrectionPhase) {
        setStreak(0); // Reset streak on wrong answer
        setWrongQuestions(prev => [...prev, currentQ]);
      }
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);

    // If user got it wrong in correction phase, they have to repeat it immediately or it stays in the queue.
    // For simplicity, we just move to the next if they got it right in correction phase.
    if (isCorrectionPhase) {
      if (selectedAnswer === currentQ.isScam) {
        // They got it right this time, remove from wrongQuestions
        const updatedWrongList = [...wrongQuestions];
        updatedWrongList.splice(currentQuestionIdx, 1);
        setWrongQuestions(updatedWrongList);

        if (updatedWrongList.length === 0) {
          setQuizFinished(true); // Finally done!
        } else {
          // Stay at current index unless it's out of bounds
          setCurrentQuestionIdx(prev => prev >= updatedWrongList.length ? 0 : prev);
        }
      } else {
        // Still wrong, move to next in the queue to cycle through
        setCurrentQuestionIdx(prev => (prev + 1) % wrongQuestions.length);
      }
      return;
    }

    // Normal phase progression
    if (currentQuestionIdx < dailyQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Reached the end of the 12 daily questions
      if (wrongQuestions.length > 0) {
        setIsCorrectionPhase(true);
        setCurrentQuestionIdx(0);
      } else {
        setQuizFinished(true);
      }
    }
  };

  const handleRestart = () => {
    setDailyQuestions(getDailyQuestions(true));
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setStreak(0);
    setLongestStreak(0);
    setWrongQuestions([]);
    setIsCorrectionPhase(false);
    setQuizFinished(false);
    setIsQuizStarted(false);
  };

  const getRank = () => {
    const pct = score / dailyQuestions.length;
    if (pct === 1) return `🥇 ${t('knowledge.rank_1')}`;
    if (pct >= 0.7) return `🥈 ${t('knowledge.rank_2')}`;
    return `🥉 ${t('knowledge.rank_3')}`;
  };

  const modalRef = useRef(null);

  useEffect(() => {
    if (activeModalCard && modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModalCard) setActiveModalCard(null);
      if (e.key === 'Tab' && activeModalCard && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeModalCard]);

  return (
    <div className={`page-shell knowledge-page mode-${userMode} ${isElderlyMode ? 'elderly-mode' : ''} ${isKidMode ? 'kid-mode' : ''}`}>

      {/* Quiz Section */}
      <div className="glass-panel knowledge-quiz-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: isElderlyMode ? '1.6rem' : '1.35rem', fontWeight: 700, color: '#fff', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} color="var(--primary)" />
            {t('knowledge.quiz_header')}
          </h2>
          {isQuizStarted && !quizFinished && (
            <button 
              onClick={() => setIsQuizStarted(false)} 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'color 0.2s',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-high)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <XCircle size={16} />
              {lang === 'ms' ? "Keluar Cabaran" : "Exit Challenge"}
            </button>
          )}
        </div>

        {!isQuizStarted ? (
          <div className="fade-in quiz-intro" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', padding: '0.5rem 0' }}>
            <div className="quiz-intro-copy" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)',
                padding: '0.85rem',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 15px rgba(31, 38, 135, 0.2)',
                flexShrink: 0
              }}>
                <Award size={28} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 6px var(--primary))' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: isElderlyMode ? '1.4rem' : '1.1rem', color: '#fff', marginBottom: '0.2rem', fontWeight: 600 }}>
                  {lang === 'ms' ? "Sedia untuk Cabaran Harian?" : "Ready for the Daily Challenge?"}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: isElderlyMode ? '1.1rem' : '0.85rem', lineHeight: '1.4' }}>
                  {lang === 'ms' 
                    ? "Uji kepakaran anda menentang taktik penipuan terbaru. Bolehkah anda mengekalkan rentetan kemenangan anda?" 
                    : "Test your skills against the latest scam tactics. Can you identify the red flags and maintain your streak?"}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsQuizStarted(true)} 
              className="btn-primary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.6rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '30px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              {lang === 'ms' ? "Mula Cabaran" : "Start Challenge"}
              <ChevronRight size={16} />
            </button>
          </div>
        ) : quizFinished ? (
          <div className="fade-in" style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <CheckCircle size={64} color="var(--color-low)" />
            <div>
              <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>{t('knowledge.challenge_completed')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                {t('knowledge.score_msg')} <strong>{score} {t('knowledge.out_of')} {dailyQuestions.length}</strong> {t('knowledge.score_msg2')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '150px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('knowledge.longest_streak')}</div>
                <div style={{ fontSize: '1.8rem', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <Flame size={24} /> {longestStreak}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '150px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('knowledge.final_rank')}</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  {getRank()}
                </div>
              </div>
            </div>

            <button onClick={handleRestart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <RefreshCw size={16} /> {t('knowledge.play_another')}
            </button>
          </div>
        ) : currentQ ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Progress and Streak Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isCorrectionPhase ? (
                      <strong style={{ color: 'var(--color-caution)' }}>{t('knowledge.correction_phase').replace('{count}', wrongQuestions.length)}</strong>
                    ) : (
                      t('knowledge.question_count').replace('{current}', currentQuestionIdx + 1).replace('{total}', dailyQuestions.length)
                    )}
                  </span>
                  <span className="badge badge-caution" style={{ textTransform: 'capitalize' }}>
                    {translateCategory(currentQ.category)}
                  </span>
                </div>
                {/* Progress Bar */}
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: isCorrectionPhase ? 'var(--color-caution)' : 'var(--primary)',
                    width: isCorrectionPhase ? '100%' : `${((currentQuestionIdx) / dailyQuestions.length) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {!isCorrectionPhase && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: streak > 2 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                  padding: '0.5rem 1rem', borderRadius: '20px',
                  border: `1px solid ${streak > 2 ? 'rgba(245, 158, 11, 0.3)' : 'transparent'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <Flame size={18} color={streak > 2 ? '#f59e0b' : 'var(--text-muted)'} />
                  <strong style={{ color: streak > 2 ? '#f59e0b' : '#fff' }}>{t('knowledge.streak')}: {streak}</strong>
                </div>
              )}
            </div>

            <div style={{
              background: '#090d16',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem 2rem',
              fontSize: isElderlyMode ? '1.4rem' : '1.1rem',
              fontWeight: 500,
              color: '#f8fafc',
              lineHeight: '1.5'
            }}>
              "{getCardText(currentQ, 'text')}"
            </div>

            {!showExplanation ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleAnswer(true)}
                  className="btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-high), #b91c1c)', color: '#fff', boxShadow: 'none' }}
                >
                  {t('knowledge.quiz_scam_btn')}
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-low), #047857)', color: '#fff', boxShadow: 'none' }}
                >
                  {t('knowledge.quiz_safe_btn')}
                </button>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  background: selectedAnswer === currentQ.isScam ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${selectedAnswer === currentQ.isScam ? 'var(--color-low)' : 'var(--color-high)'}`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem'
                }}>
                  {selectedAnswer === currentQ.isScam ? (
                    <CheckCircle size={24} color="var(--color-low)" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={24} color="var(--color-high)" style={{ flexShrink: 0 }} />
                  )}
                  <div>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>
                      {selectedAnswer === currentQ.isScam ? t('knowledge.correct_decision') : t('knowledge.incorrect_decision')}
                    </strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {getCardText(currentQ, 'explanation')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                >
                  {isCorrectionPhase && selectedAnswer !== currentQ.isScam ? (
                    t('knowledge.next_correction')
                  ) : (
                    <>{t('knowledge.next_question')} <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* SECTION B: Categorized Malaysian Scam Pattern Intelligence Library */}
      <div className="glass-panel knowledge-library-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: isElderlyMode ? '1.6rem' : '1.35rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} color="var(--primary)" />
              {t('knowledge.library_title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: isElderlyMode ? '1.1rem' : '0.85rem', marginTop: '0.25rem' }}>
              {t('knowledge.library_desc')}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <label htmlFor="knowledge-search" className="sr-only">{t('knowledge.search_placeholder')}</label>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '14px' }} />
          <input
            id="knowledge-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('knowledge.search_placeholder')}
            className="input-field"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="knowledge-filter-pills" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {categories.map(cat => {
            const count = cat.id === 'All' ? LESSON_CARDS.length : LESSON_CARDS.filter(c => c.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn-secondary category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  background: selectedCategory === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                  color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                  border: selectedCategory === cat.id ? 'none' : '1px solid var(--border-color)'
                }}
                aria-pressed={selectedCategory === cat.id}
              >
                {t(cat.labelKey)} ({count})
              </button>
            );
          })}
        </div>

        {/* Knowledge Cards Grid */}
        <div className="knowledge-card-grid">
          {visibleCards.map(card => (
            <div key={card.id} className="knowledge-card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div className="knowledge-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-caution" style={{ fontSize: '0.65rem' }}>{translateCategory(card.category)}</span>
                  {card.isDailyFeatured && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600 }}>{t('knowledge.highlight')}</span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>{getCardText(card, 'title')}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  "{getCardText(card, 'summary')}"
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', paddingLeft: '0.25rem', fontWeight: 600 }}>
                  {lang === 'ms' ? 'Contoh Mesej / SMS:' : 'Example Message / SMS:'}
                </div>
                <div style={{ background: '#050810', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#f1f5f9', fontStyle: 'italic', marginBottom: '1rem' }}>
                  "{card.exampleMessage}"
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setActiveModalCard(card)}
                  className="btn-secondary"
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.8rem',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--primary)',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <Eye size={15} /> {t('knowledge.read_case_study')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCards.length > initialCardCount && (
          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <button
              onClick={() => setIsLibraryExpanded(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 1rem',
                transition: 'color 0.2s, transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>
                {isLibraryExpanded 
                  ? (lang === 'ms' ? "Tunjukkan Kurang" : "Show Less")
                  : (lang === 'ms' ? `Tunjukkan Lebih Banyak (${filteredCards.length})` : `Show More (${filteredCards.length})`)}
              </span>
              {isLibraryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Case Study Deep Dive Modal */}
      {activeModalCard && (
        <div className="knowledge-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="knowledge-case-title"
            tabIndex="-1"
            className="knowledge-modal"
            style={{
              background: '#0d1322',
              border: '1px solid var(--primary)',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-caution">{translateCategory(activeModalCard.category)}</span>
              <button
                onClick={() => setActiveModalCard(null)}
                aria-label={lang === 'ms' ? 'Tutup kajian kes' : 'Close case study'}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h2 id="knowledge-case-title" style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '1rem' }}>{getCardText(activeModalCard, 'title')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>📱 {t('knowledge.evidence_sample')}:</strong>
                <div style={{ background: '#050810', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginTop: '0.4rem', color: '#f1f5f9', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  "{activeModalCard.exampleMessage}"
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--color-high)', fontSize: '0.85rem' }}>🚩 {t('knowledge.red_flags')}:</strong>
                <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {(getCardText(activeModalCard, 'redFlags') || []).map((flag, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{flag}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ color: '#f59e0b', fontSize: '0.85rem' }}>🧠 {t('knowledge.psychology')}:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: '1.5' }}>
                  {getCardText(activeModalCard, 'psychology')}
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--color-low)', fontSize: '0.85rem' }}>🛡️ {t('knowledge.advisory')}:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: '1.5' }}>
                  {getCardText(activeModalCard, 'advisory')}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
              <button onClick={() => setActiveModalCard(null)} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                {t('knowledge.close_case')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
