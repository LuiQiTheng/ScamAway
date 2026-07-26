import React, { useState } from 'react';
import { Award, BookOpen, ShieldAlert, CheckCircle, XCircle, RefreshCw, ChevronRight, Filter, AlertTriangle, Eye, Layers, Flame, Search, ExternalLink } from 'lucide-react';

// 18 Comprehensive Real-World Malaysian Scam Case Studies (3 per category)
const LESSON_CARDS = [
  // --- Category 1: Courier & Delivery ---
  {
    id: 101,
    title: "Pos Malaysia / Courier COD Tax SMS",
    category: "Courier & Delivery",
    isDailyFeatured: true,
    summary: "SMS claiming a parcel is held at sorting hub unless a small RM2.50 tax fee is paid within 30 minutes.",
    exampleMessage: "POS MALAYSIA: Parcel MY8492040 held at sorting hub. Pay RM2.50 processing fee within 30 mins to avoid item disposal: pos-laju.info/claim-fee/2.50",
    psychology: "Creates artificial urgency with a trivial small amount (RM2.50) so victims enter credit card details without double-checking.",
    redFlags: ["Shortened / fake domain (pos-laju.info instead of pos.com.my)", "30-minute countdown pressure", "Unrequested parcel tracking code"],
    advisory: "POS Malaysia will never request payment details via SMS, WhatsApp, or unofficial links. Always use the official Pos Malaysia app or portal."
  },
  {
    id: 102,
    title: "NinjaVan Fake COD Cash Overcharge",
    category: "Courier & Delivery",
    isDailyFeatured: false,
    summary: "Scammer delivers cheap worthless items (e.g. plastic beads) to victims' homes demanding RM150 Cash-On-Delivery.",
    exampleMessage: "NinjaVan Notification: Rider on the way to deliver parcel #NV9912. Cash amount due upon arrival: RM149.90. Prepare exact cash.",
    psychology: "Targets elderly family members staying home who assume their working children ordered something online.",
    redFlags: ["Unannounced COD package", "Rider refuses to let recipient inspect parcel contents before paying cash", "No purchase history in e-commerce apps"],
    advisory: "Advise family members to never accept unannounced COD parcels without calling the purchaser first to verify."
  },
  {
    id: 103,
    title: "DHL Customs Clearance Tax Phishing Email",
    category: "Courier & Delivery",
    isDailyFeatured: false,
    summary: "Phishing email claiming an international shipment requires clearance tax payment before release.",
    exampleMessage: "DHL Express: Your shipment #9410291 is pending customs clearance. A mandatory RM45.00 duty fee is required: dhl-customs-my.net/pay",
    psychology: "Impersonates international courier brands to panic online shoppers waiting for overseas imports.",
    redFlags: ["Non-official email domain (e.g. notice@dhl-customs-my.net)", "Direct link to payment form requesting card CVV"],
    advisory: "Verify shipment status directly on the official dhl.com portal using your master tracking number."
  },

  // --- Category 2: Job & Task Scams ---
  {
    id: 201,
    title: "Shopee/Lazada Cart Click Commission Scam",
    category: "Job & Task Scams",
    isDailyFeatured: true,
    summary: "Promises RM300-RM800 daily for processing e-commerce orders, requiring advancing personal funds for task deposits.",
    exampleMessage: "Shopee HR: Earn RM500/day working 1 hr daily! Task 1: Deposit RM100 to unlock order #1 and receive RM150 commission instantly.",
    psychology: "Pays out small initial commissions to build trust, then demands thousands of Ringgit in deposit top-ups to 'unlock' stuck payouts.",
    redFlags: ["Hired via unsolicited Telegram/WhatsApp messages", "Requires depositing money to unlock work tasks", "Payments routed to personal bank accounts"],
    advisory: "Legitimate e-commerce platforms do not hire workers via Telegram or require advance cash deposits to perform job duties."
  },
  {
    id: 202,
    title: "TikTok / YouTube Video Like Payout Scam",
    category: "Job & Task Scams",
    isDailyFeatured: false,
    summary: "Earn RM5 per video like, then forced into high-tier crypto trading groups to retrieve accumulated earnings.",
    exampleMessage: "Digital Media Marketing: Get paid RM5 for every TikTok video liked! Complete 10 likes to earn RM50. Join VIP Telegram: t.me/media_tasks_my",
    psychology: "Lures victims with fun, effortless tasks before switching to mandatory crypto deposit traps.",
    redFlags: ["Unrealistic compensation for simple clicks", "Task payouts locked behind Telegram crypto investments"],
    advisory: "Never transfer money to unverified Telegram administrators to release promised task earnings."
  },
  {
    id: 203,
    title: "Hotel Rating & Booking Agent Task Scam",
    category: "Job & Task Scams",
    isDailyFeatured: false,
    summary: "Claims travel agencies pay users to write fake 5-star Google/Agoda reviews, requiring prepaid security deposits.",
    exampleMessage: "Agoda Marketing Agent: Review 5 hotels in KL & get RM250 daily. Security deposit RM200 required to activate reviewer badge.",
    psychology: "Exploits brand names of reputable travel companies to make fake job offers appear legitimate.",
    advisory: "Agoda and Google do not hire freelance reviewers via WhatsApp or charge reviewer security deposits."
  },

  // --- Category 3: Threat & Govt Impersonation ---
  {
    id: 301,
    title: "LHDN Tax Audit Penalty & Arrest Warrant SMS",
    category: "Threat & Govt Impersonation",
    isDailyFeatured: true,
    summary: "Threatens an unpaid RM50,000 tax penalty, bank account freeze, and arrest warrant unless settled within 2 hours.",
    exampleMessage: "LHDN AMARAN: Saman Cukai RM50,000 belum dibayar. Akaun bank anda akan dibekukan & waran tangkap dikeluarkan dalam 2 jam: lhdn-cukai-portal.org",
    psychology: "Exploits fear of law enforcement and legal consequences to induce panic and force instant payments.",
    redFlags: ["Short deadline threat (within 2 hours)", "Redirects to non-government portal (lhdn-cukai-portal.org instead of hasil.gov.my)", "Demands payment to personal lawyer account"],
    advisory: "Government tax agencies never send threats of immediate arrest via SMS links or demand payment to personal accounts."
  },
  {
    id: 302,
    title: "PDRM / Court Macao Phone Call Scam",
    category: "Threat & Govt Impersonation",
    isDailyFeatured: false,
    summary: "Scammers spoofing police station hotline numbers claiming your IC is implicated in drug trafficking or money laundering.",
    exampleMessage: "Call from IPK Sabah: 'No Kad Pengenalan anda dikesan terlibat kes cuci wang RM2.3 Juta. Pindahkan simpanan ke akaun audit negara untuk elak lokap.'",
    psychology: "Uses aggressive legal jargon and keeps victims on continuous long phone calls to prevent them from contacting family.",
    advisory: "PDRM and courts will NEVER demand money transfers into 'safe/audit accounts' over phone calls."
  },
  {
    id: 303,
    title: "JPJ Traffic Saman & License Suspension SMS",
    category: "Threat & Govt Impersonation",
    isDailyFeatured: false,
    summary: "Fake JPJ SMS claiming unpaid speed camera summons will result in immediate driving license revocation.",
    exampleMessage: "JPJ NOTIS: Saman AES RM150 tertunggak. Lesen memandu akan digantung dalam 24 jam. Bayar segera di: jpj-saman-online.xyz",
    psychology: "Targets drivers' fear of license suspension using small fine amounts.",
    redFlags: ["Domains ending in .xyz or .club", "Claims license will be revoked automatically within 24 hours"],
    advisory: "Always check and settle official traffic summonses via the official MyBayar PDRM or MySIKAP JPJ portals."
  },

  // --- Category 4: Impossible Investment ---
  {
    id: 401,
    title: "Telegram Syariah 1,000% Profit Multiplier",
    category: "Impossible Investment",
    isDailyFeatured: false,
    summary: "Guarantees 1,000% returns in 3 hours. E.g. 'Invest RM1,000 and receive guaranteed reward payout of RM100,000'.",
    exampleMessage: "Peluang Pelaburan Syariah 100% Sah: Labur RM1,000 dapat pulangan RM100,000 dalam 3 jam! Dijamin 100% tanpa risiko. Hubungi Admin Telegram.",
    psychology: "Promises life-changing financial wealth with zero risk to entice financially stressed individuals.",
    redFlags: ["Guaranteed 1,000% profit in hours", "Claims 100% zero risk", "Conducted entirely inside Telegram private groups"],
    advisory: "No legitimate investment can guarantee astronomical returns without risk. If it sounds too good to be true, it is 100% a scam."
  },
  {
    id: 402,
    title: "Pre-IPO Stock Allocation Insider Scam",
    category: "Impossible Investment",
    isDailyFeatured: false,
    summary: "Poses as a licensed investment broker offering guaranteed allocation of high-profile tech stocks before public listing.",
    exampleMessage: "Bursa Insider Trading: Guaranteed allocation of 10,000 pre-IPO tech shares at 80% discount. Minimum investment RM2,000.",
    psychology: "Creates exclusivity and fear of missing out (FOMO) on major stock market profits.",
    redFlags: ["Claims access to illegal 'insider allocation'", "Requires sending funds to individual mule accounts"],
    advisory: "Check the Securities Commission Malaysia (SC) Investor Alert List before investing in any financial scheme."
  },
  {
    id: 403,
    title: "Automated Crypto Trading Bot Arbitrage Scam",
    category: "Impossible Investment",
    isDailyFeatured: false,
    summary: "Promises automated AI crypto trading bots yielding 5% daily compounding interest.",
    exampleMessage: "CryptoAI Bot: Earn 5% daily profit automatically! Deposit 0.05 BTC to activate automated arbitrage trading engine.",
    psychology: "Uses modern buzzwords like 'AI Arbitrage Bot' to trick tech-enthusiasts into depositing cryptocurrency.",
    advisory: "Unregulated crypto yield platforms carry extreme risks and frequently turn out to be Ponzi rug-pull schemes."
  },

  // --- Category 5: Emergency & Secrecy ---
  {
    id: 501,
    title: "Mum Phone Fell In Water Medical Bill Scam",
    category: "Emergency & Secrecy",
    isDailyFeatured: true,
    summary: "Posing as a child whose phone fell into water, asking for urgent money while strictly forbidding calling them.",
    exampleMessage: "Mak, fon abang jatuh air. Ni nombor baru kawan. Tolong pindahkan RM1,000 segera ke akaun 164228910239 untuk repair. Jgn beritahu sesiapa & jgn telefon.",
    psychology: "Combines emotional panic for family safety with strict secrecy to prevent you from verifying with family members.",
    redFlags: ["Unverified new phone number", "Strictly forbids calling back ('speaker broken')", "Requests money transfer to unknown third-party account"],
    advisory: "Always call your child/relative on their original phone number or verify through mutual family members before transferring money."
  },
  {
    id: 502,
    title: "Fake Kidnapping & Ransom Phone Extortion",
    category: "Emergency & Secrecy",
    isDailyFeatured: false,
    summary: "Scammer calls parents screaming in background, claiming their child has been kidnapped and demanding instant cash transfer.",
    exampleMessage: "Phone call: 'Anak kamu ada dengan kami! Kami dah tangkap dia. Kalau nak dia selamat, kumpul RM20,000 sekarang & jangan hubungi polis!'",
    psychology: "Induces extreme emotional terror and confusion so parents comply before checking where their child actually is.",
    advisory: "Stay calm. Attempt to contact your child's school, workplace, or friends immediately while keeping the scammer on hold."
  },
  {
    id: 503,
    title: "Relative Arrested Police Bail Deposit Scam",
    category: "Emergency & Secrecy",
    isDailyFeatured: false,
    summary: "Poses as a lawyer or police sergeant claiming a cousin/sibling was detained at a roadblock and needs urgent bail money.",
    exampleMessage: "WhatsApp: 'Saya Sarjan Azman. Sepupu anda kini ditahan di balai kerana kesalahan dadah. Sila urus jaminan RM3,000 ke akaun peguam ini serta-merta.'",
    psychology: "Plays on family loyalty and urgency to bypass standard bail procedure verification.",
    advisory: "Bail payments in Malaysia are only processed physically at official court registries, never via instant bank transfers."
  },

  // --- Category 6: Quishing / QR Code Scams ---
  {
    id: 601,
    title: "Hawker Stall QR Sticker Swap Payment Scam",
    category: "Quishing / QR Code",
    isDailyFeatured: false,
    summary: "Scammers secretly paste malicious QR code stickers over authentic hawker stall payment signs, stealing customer payments.",
    exampleMessage: "Scanned QR Code Target: https://maybank-secure-pay.xyz/merchant/transfer-funds?amount=15.00",
    psychology: "Relies on customer habits of quickly scanning QR codes without checking the business merchant name on the payment screen.",
    redFlags: ["QR code is a physical sticker pasted over an original sign", "Payment screen shows an individual's name instead of stall name"],
    advisory: "Always verify the merchant's business name on your e-wallet payment confirmation screen before entering your PIN."
  },
  {
    id: 602,
    title: "Parking Kiosk Fake Touch 'n Go QR Code",
    category: "Quishing / QR Code",
    isDailyFeatured: false,
    summary: "Fake QR stickers pasted on street parking meters leading to phishing portals that harvest credit card numbers.",
    exampleMessage: "Scanned QR Target: https://tng-parking-pay.club/kiosk/kl-zone-1",
    psychology: "Targets drivers in a hurry trying to avoid getting a parking fine.",
    redFlags: ["Points to non-official URLs (.club or .info)", "Asks for full credit card details instead of e-wallet integration"],
    advisory: "Only pay parking using official council apps (e.g. Flexi Parking, Touch 'n Go eWallet) directly."
  },
  {
    id: 603,
    title: "Event Poster Free Voucher QR Malware Scam",
    category: "Quishing / QR Code",
    isDailyFeatured: false,
    summary: "Promotional posters in shopping malls promising free RM50 shopping vouchers via QR code scan, installing malicious APKs.",
    exampleMessage: "Scanned QR Target: https://shopee-voucher-claim.info/download/ShopeeBonus.apk",
    psychology: "Entices users with free gifts to trick them into installing dangerous Android malware apps.",
    redFlags: ["Prompts downloading an .APK file directly", "Requests Android Accessibility and SMS permissions"],
    advisory: "Never install .APK software files downloaded from unknown QR code scans."
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
  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Library State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalCard, setActiveModalCard] = useState(null);

  const categories = [
    'All',
    'Courier & Delivery',
    'Job & Task Scams',
    'Threat & Govt Impersonation',
    'Impossible Investment',
    'Emergency & Secrecy',
    'Quishing / QR Code'
  ];

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1100px', margin: '0 auto', padding: '1rem' }} className={isElderlyMode ? 'elderly-mode' : ''}>
      
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

      {/* Malaysian Scam Pattern Intelligence Library */}

      {/* SECTION B: Categorized Malaysian Scam Pattern Intelligence Library */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} color="var(--primary)" />
              Malaysian Scam Pattern Intelligence Library ({LESSON_CARDS.length} Verified Case Studies)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Explore comprehensive real-world Malaysian scam signatures, psychological traps, and official advisories.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '14px' }} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scam library by keyword (e.g. LHDN, Pos Laju, RM1,000, Telegram, QR code)..."
            className="input-field"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {categories.map(cat => {
            const count = cat === 'All' ? LESSON_CARDS.length : LESSON_CARDS.filter(c => c.category === cat).length;
            return (
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
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Knowledge Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {filteredCards.map(card => (
            <div key={card.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-caution" style={{ fontSize: '0.65rem' }}>{card.category}</span>
                  {card.isDailyFeatured && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600 }}>★ Highlight</span>
                  )}
                </div>
                
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>{card.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  "{card.summary}"
                </p>

                <div style={{ background: '#050810', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#f1f5f9', fontStyle: 'italic', marginBottom: '1rem' }}>
                  "{card.exampleMessage}"
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Official Safety Advisory:</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{card.advisory}</p>

                <button 
                  onClick={() => setActiveModalCard(card)} 
                  className="btn-secondary" 
                  style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}
                >
                  <Eye size={14} /> Read Complete Case Study & Red Flags
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Case Study Deep Dive Modal */}
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
            maxWidth: '680px',
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
                <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>📱 Real-World Text/SMS Evidence Sample:</strong>
                <div style={{ background: '#050810', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginTop: '0.4rem', color: '#f1f5f9', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  "{activeModalCard.exampleMessage}"
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--color-high)', fontSize: '0.85rem' }}>🚩 Identified Red Flag Markers:</strong>
                <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {activeModalCard.redFlags.map((flag, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{flag}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ color: '#f59e0b', fontSize: '0.85rem' }}>🧠 Psychological Strategy Used by Scammer:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: '1.5' }}>
                  {activeModalCard.psychology}
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--color-low)', fontSize: '0.85rem' }}>🛡️ Prevention & Verification Advisory:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: '1.5' }}>
                  {activeModalCard.advisory}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
              <button onClick={() => setActiveModalCard(null)} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                Close Case Study
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
