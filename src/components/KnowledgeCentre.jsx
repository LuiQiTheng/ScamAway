import React, { useState } from 'react';
import { Award, BookOpen, ShieldAlert, CheckCircle, XCircle, RefreshCw, ChevronRight, Filter, AlertTriangle, Eye, Layers } from 'lucide-react';

const LESSON_CARDS = [
  {
    id: 1,
    title: "Pos Malaysia / Courier COD Scams",
    category: "Courier & Delivery",
    isDailyFeatured: true,
    summary: "Receiving SMS claiming a package cannot be delivered unless a small tax or fee (e.g. RM2.50) is paid immediately.",
    exampleMessage: "POS MALAYSIA: Your parcel MY8492040 is held at sorting hub. Pay RM2.50 processing tax within 30 mins to avoid package disposal: pos-laju.info/pay",
    psychology: "Creates mild urgency with a trivial small amount (RM2.50) so victims don't think twice before entering credit card details.",
    advisory: "POS Malaysia will never request payment details via SMS, WhatsApp, or unofficial URLs like pos-laju.info. Always use the official tracking portal."
  },
  {
    id: 2,
    title: "Shopee/Lazada Part-Time Job Task Scam",
    category: "Job & Task Scams",
    isDailyFeatured: false,
    summary: "Offers to earn RM300-RM800 daily by simply adding items to carts or processing small deposits to unlock higher tasks.",
    exampleMessage: "Shopee HR: Earn RM500/day working 1 hour from home! Task 1: Transfer RM100 deposit to unlock task 1 commission payout of RM150.",
    psychology: "Uses 'bait & switch'—starts with small payouts to build trust, then demands thousands of Ringgit in deposits to 'release' stuck funds.",
    advisory: "Legitimate merchant platforms do not hire via Telegram/WhatsApp or require advance payment deposits to unlock job commissions."
  },
  {
    id: 3,
    title: "LHDN Tax Refund & Tax Penalty Phishing",
    category: "Threat & Govt Impersonation",
    isDailyFeatured: true,
    summary: "Claims you have an outstanding refund from LHDN or threatens a RM100,000 fine / jail time for unpaid tax debt unless paid now.",
    exampleMessage: "LHDN AMARAN: Saman Cukai RM50,000 belum dibayar. Akaun bank anda akan dibekukan & waran tangkap dikeluarkan dalam 24 jam: lhdn-cukai-portal.org",
    psychology: "Exploits fear of law enforcement, court action, and arrest to paralyze critical thinking and force immediate panic payments.",
    advisory: "Government agencies never process refunds or demand immediate fine payments via SMS links or personal bank transfers."
  },
  {
    id: 4,
    title: "Impossible Investment Payout / Money Multiplier",
    category: "Impossible Investment",
    isDailyFeatured: false,
    summary: "Guarantees 1,000% returns in 3 hours. E.g. 'Lend/transfer RM1,000 and receive guaranteed reward payout of RM100,000'.",
    exampleMessage: "Peluang Pelaburan Syariah 100% Sah: Labur RM1,000 dapat pulangan RM100,000 dalam 3 jam! Dijamin 100% tanpa risiko. Hubungi Admin Telegram.",
    psychology: "Targets financial desperation or greed by promising life-changing returns with zero risk.",
    advisory: "No legitimate investment can guarantee astronomical returns without risk. If it sounds too good to be true, it is 100% a scam."
  },
  {
    id: 5,
    title: "Family Emergency & Secrecy Isolation",
    category: "Emergency & Secrecy",
    isDailyFeatured: true,
    summary: "Posing as a child or relative whose phone fell into water, asking for urgent money while strictly forbidding you from calling them.",
    exampleMessage: "Mak, fon abang jatuh air. Ni nombor baru kawan. Tolong pindahkan RM1,000 segera ke akaun 164228910239 untuk repair. Jgn beritahu sesiapa & jgn telefon.",
    psychology: "Combines emotional panic for family safety with strict secrecy to prevent you from verifying with family members.",
    advisory: "Always call your child/relative on their original phone number or verify through mutual family members before transferring any money."
  },
  {
    id: 6,
    title: "PDRM / Court Macao Phone Scam",
    category: "Threat & Govt Impersonation",
    isDailyFeatured: false,
    summary: "Scammers spoofing police station hotline numbers claiming your IC was implicated in money laundering or drug trafficking operations.",
    exampleMessage: "Panggilan dari IPK: Kad Pengenalan anda dikesan terlibat kes cuci wang RM2.3 Juta. Sila pindah semua simpanan ke akaun audit negara untuk siasatan.",
    psychology: "Impersonates senior police officers and uses aggressive legal jargon to isolate victims on long continuous phone calls.",
    advisory: "PDRM and courts will NEVER ask you to transfer money into a 'safe/audit account' over the phone."
  }
];

const QUIZ_QUESTIONS = [
  {
    text: "WhatsApp message: 'Transfer me RM1,000 now, I will give u guaranteed rewards RM1,000,000 within 2 hours, 100% true and no risk!'",
    isScam: true,
    category: "Impossible Investment",
    explanation: "Scam! Promising an impossible 1,000x financial return with zero risk is a classic Money Multiplier / Investment Scam."
  },
  {
    text: "SMS from LHDN-ALERT: 'Cukai tertunggak RM50,000. Bayar ke akaun personal peguam dalam 2 jam atau waran tangkap & penjara dikeluarkan: lhdn-bayar.club'",
    isScam: true,
    category: "Fear & Threat",
    explanation: "Scam! LHDN never sends text messages threatening jail within hours or asking for payment to personal accounts or unofficial websites."
  },
  {
    text: "Telegram: 'Mum, my phone broke. Send RM800 to account 164228910239 for medical bill. Keep it secret and don't tell anyone or call me.'",
    isScam: true,
    category: "Secrecy & Impersonation",
    explanation: "Scam! Instructing secrecy ('don't tell anyone', 'don't call') is designed to isolate you so you can't verify with family."
  },
  {
    text: "SMS from JPJ-Alert: 'Anda mempunyai saman tertunggak RM150. Sila bayar dalam 24 jam di jpj-saman-online.xyz untuk mengelak lesen digantung.'",
    isScam: true,
    category: "Government Impersonation",
    explanation: "Scam! JPJ does not use .xyz domains or pressure you with a 24-hour license suspension threat via SMS."
  },
  {
    text: "Official email notification from Maybank (maybank2u.com.my) containing your monthly e-Statement in a password-protected PDF file.",
    isScam: false,
    category: "Legitimate",
    explanation: "Safe! The domain matches Maybank's official registered URL, and statement PDFs are sent without asking for your password."
  },
  {
    text: "Shopee HR WhatsApp: 'Earn RM500 daily by liking products! Just deposit RM50 first to unlock your first VIP task payout.'",
    isScam: true,
    category: "Job & Task Scam",
    explanation: "Scam! Legitimate e-commerce platforms do not require job applicants to pay advance deposit fees to unlock work tasks."
  }
];

export default function KnowledgeCentre({ isElderlyMode }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true = scam, false = safe
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Knowledge Base State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalCard, setActiveModalCard] = useState(null);

  const categories = ['All', 'Courier & Delivery', 'Job & Task Scams', 'Threat & Govt Impersonation', 'Impossible Investment', 'Emergency & Secrecy'];

  const filteredCards = selectedCategory === 'All' 
    ? LESSON_CARDS 
    : LESSON_CARDS.filter(card => card.category === selectedCategory);

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
    if (pct === 1) return "🥇 Digital Safety Master";
    if (pct >= 0.7) return "🥈 Scam Defense Specialist";
    return "🥉 Safety Guardian Cadet";
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1000px', margin: '0 auto', padding: '1rem' }} className={isElderlyMode ? 'elderly-mode' : ''}>
      
      {/* Quiz Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={24} color="var(--primary)" />
          Interactive Scam Pattern Detection Quiz
        </h2>

        {quizFinished ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <CheckCircle size={56} color="var(--color-low)" />
            <div>
              <h3 style={{ fontSize: '1.5rem', color: '#fff' }}>Quiz Completed!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                You identified <strong>{score} out of {QUIZ_QUESTIONS.length}</strong> scam patterns correctly.
              </p>
              <h4 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginTop: '1rem' }}>Rank: {getRank()}</h4>
            </div>

            <button onClick={handleRestart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} /> Retake Pattern Quiz
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
                      {selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].isScam ? 'Correct Decision!' : 'Incorrect Decision!'}
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

      {/* Categorized Knowledge Base & Daily Intelligence */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} color="var(--primary)" />
              Malaysian Scam Pattern Intelligence Library
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Explore categorised scam signatures, psychological tactics, and preventative measures.
            </p>
          </div>
          <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem' }}>
            <RefreshCw size={14} className="spin-slow" /> Daily Rotating Intelligence Updated
          </span>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn-secondary ${selectedCategory === cat ? 'active' : ''}`}
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                background: selectedCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: selectedCategory === cat ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Knowledge Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
          {filteredCards.map(card => (
            <div key={card.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: card.isDailyFeatured ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {card.isDailyFeatured && (
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  fontSize: '0.65rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  ★ Daily Highlight
                </span>
              )}
              <div>
                <span className="badge badge-caution" style={{ fontSize: '0.65rem', marginBottom: '0.5rem', display: 'inline-block' }}>{card.category}</span>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>{card.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.75rem' }}>"{card.summary}"</p>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Safety Advisory:</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{card.advisory}</p>

                <button 
                  onClick={() => setActiveModalCard(card)} 
                  className="btn-secondary" 
                  style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}
                >
                  <Eye size={14} /> View Pattern Details & Examples
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Deep Dive into Specific Scam Category */}
      {activeModalCard && (
        <div style={{
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
          <div style={{
            background: '#0d1322',
            border: '1px solid var(--primary)',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-caution">{activeModalCard.category}</span>
              <button 
                onClick={() => setActiveModalCard(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '1rem' }}>{activeModalCard.title}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Real-World Text Sample:</strong>
                <div style={{ background: '#050810', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginTop: '0.4rem', color: '#f1f5f9', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  "{activeModalCard.exampleMessage}"
                </div>
              </div>

              <div>
                <strong style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Psychological Tactic Used:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: '1.5' }}>
                  {activeModalCard.psychology}
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--color-low)', fontSize: '0.85rem' }}>Prevention & Action Steps:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: '1.5' }}>
                  {activeModalCard.advisory}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
              <button onClick={() => setActiveModalCard(null)} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

