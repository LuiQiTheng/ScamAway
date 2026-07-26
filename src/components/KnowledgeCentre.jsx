import React, { useState } from 'react';
import { Award, BookOpen, ShieldAlert, CheckCircle, XCircle, RefreshCw, ChevronRight } from 'lucide-react';

const LESSON_CARDS = [
  {
    id: 1,
    title: "Pos Malaysia / Courier COD Scams",
    category: "Courier Impersonation",
    summary: "Receiving SMS claiming a package cannot be delivered unless a small tax or fee (e.g. RM2.50) is paid immediately.",
    advisory: "POS Malaysia will never request payment details via SMS, Whatsapp, or unofficial URLs like pos-laju.info. Always use the official tracking portal."
  },
  {
    id: 2,
    title: "Shopee/Lazada Part-Time Job Clicks",
    category: "Task Scam",
    summary: "Offers to earn RM300-RM800 daily by simply adding items to carts or processing small deposits to unlock tasks.",
    advisory: "Legitimate merchant platforms do not hire via Telegram/WhatsApp or require advance payment deposits to unlock job commissions."
  },
  {
    id: 3,
    title: "LHDN Tax Refund SMS Phishing",
    category: "Government Impersonation",
    summary: "Claims you have an outstanding refund from Inland Revenue Board (LHDN) and redirects to a fake banking login portal.",
    advisory: "Government agencies never process refunds via standard web links or request bank login credentials through message notifications."
  }
];

const QUIZ_QUESTIONS = [
  {
    text: "SMS from JPJ-Alert: 'Anda mempunyai saman tertunggak RM150. Sila bayar dalam 24 jam di jpj-saman-online.xyz untuk mengelak lesen digantung.'",
    isScam: true,
    category: "Impersonation",
    explanation: "Scam! JPJ does not use .xyz domains or pressure you with a 24-hour license suspension threat via SMS."
  },
  {
    text: "WhatsApp message: 'Mum, my phone fell into water. This is my friend's new number. Send RM800 immediately to account 164228910239 to pay my rent, don't call me now.'",
    isScam: true,
    category: "Family Impersonation",
    explanation: "Scam! The classic 'phone damaged' scam requests immediate transfer to unknown bank accounts and blocks you from voice verification."
  },
  {
    text: "Official email from Maybank (maybank2u.com.my) listing your monthly banking credit card statement summary in a password-locked PDF.",
    isScam: false,
    category: "Legitimate",
    explanation: "Safe! The domain matches the registered official bank site, and statements are secured without requesting you to click and log in."
  },
  {
    text: "Telegram: 'Congrats! You have won RM2,500 Shopee Birthday Draw. Chat with customer service to verify your phone number and OTP to receive cash.'",
    isScam: true,
    category: "Prize Scam",
    explanation: "Scam! Shopee never notifies winners via random Telegram groups or asks for your bank transaction OTP codes."
  }
];

export default function KnowledgeCentre({ isElderlyMode }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true = scam, false = safe
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    const currentQ = QUIZ_QUESTIONS[currentQuestionIdx];
    if (answer === currentQ.isScam) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizFinished(false);
  };

  const getRank = () => {
    const pct = score / QUIZ_QUESTIONS.length;
    if (pct === 1) return "🥇 Digital Safety Champion";
    if (pct >= 0.7) return "🥈 Scam Protection Expert";
    return "🥉 Scam Protection Cadet";
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1000px', margin: '0 auto', padding: '1rem' }} className={isElderlyMode ? 'elderly-mode' : ''}>
      
      {/* Quiz Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={24} color="var(--primary)" />
          Spot the Scam! Awareness Quiz
        </h2>

        {quizFinished ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <CheckCircle size={56} color="var(--color-low)" />
            <div>
              <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>Quiz Completed!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                You scored <strong>{score} out of {QUIZ_QUESTIONS.length}</strong> correct answers.
              </p>
              <h4 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginTop: '1rem' }}>Rank: {getRank()}</h4>
            </div>

            <button onClick={handleRestart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} /> Retake Quiz
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Question {currentQuestionIdx + 1} of {QUIZ_QUESTIONS.length}</span>
              <span className="badge badge-caution" style={{ textTransform: 'capitalize' }}>
                {QUIZ_QUESTIONS[currentQuestionIdx].category}
              </span>
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
              "{QUIZ_QUESTIONS[currentQuestionIdx].text}"
            </div>

            {!showExplanation ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleAnswer(true)} 
                  className="btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-high), #b91c1c)', color: '#fff', boxShadow: 'none' }}
                >
                  🔴 It's a Scam / Phishing
                </button>
                <button 
                  onClick={() => handleAnswer(false)} 
                  className="btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-low), #047857)', color: '#fff', boxShadow: 'none' }}
                >
                  🟢 It's Legitimate / Safe
                </button>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ 
                  background: selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].isScam ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].isScam ? 'var(--color-low)' : 'var(--color-high)'}`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem'
                }}>
                  {selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].isScam ? (
                    <CheckCircle size={24} color="var(--color-low)" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={24} color="var(--color-high)" style={{ flexShrink: 0 }} />
                  )}
                  <div>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>
                      {selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].isScam ? 'Correct Decision!' : 'Wrong Decision!'}
                    </strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {QUIZ_QUESTIONS[currentQuestionIdx].explanation}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleNext} 
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                >
                  Next Question <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advisory Cheat Sheets */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={24} color="var(--primary)" />
          Malaysian Scam Pattern Intelligence (SDG 4)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {LESSON_CARDS.map(card => (
            <div key={card.id} style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span className="badge badge-caution" style={{ fontSize: '0.65rem', marginBottom: '0.5rem', display: 'inline-block' }}>{card.category}</span>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>{card.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>"{card.summary}"</p>
              </div>
              <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Safety Advisory:</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{card.advisory}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
