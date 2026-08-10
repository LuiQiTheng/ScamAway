export const QUICK_TEST_PRESETS = [
  {
    id: 'pos-laju',
    label: {
      en: 'Test Fake Pos Laju Text',
      ms: 'Uji Teks Pos Laju Palsu',
    },
    tone: 'danger',
    text: 'POS LAJU: Your parcel is on hold due to an unpaid RM5.60 customs fee. Pay now at https://poslaju-redelivery.help/verify to avoid return to sender.',
    explanation_en: 'Scam! This is a classic parcel phishing scam. Official couriers will never send a random link via SMS asking for unexpected small customs fees.',
    explanation_ms: 'Scam! Ini ialah penipuan pancingan data bungkusan klasik. Kurier rasmi tidak akan menghantar pautan rawak melalui SMS yang meminta yuran kastam yang tidak dijangka.',
    pattern_label_en: 'Parcel Phishing Attempt',
    pattern_label_ms: 'Percubaan Phishing Bungkusan',
  },
  {
    id: 'telegram-job',
    label: {
      en: 'Test Telegram Job Scam',
      ms: 'Uji Scam Kerja Telegram',
    },
    tone: 'danger',
    text: 'Hi, I am a Shopee hiring manager. Earn RM500 daily by liking products from home. No interview needed. Pay a RM100 activation deposit and WhatsApp 60123456789 now.',
    explanation_en: 'Scam! Unsolicited messages from "Shopee hiring managers" offering easy money for liking products in exchange for an activation deposit are guaranteed job scams.',
    explanation_ms: 'Scam! Mesej yang tidak diminta daripada "pengurus pengambilan pekerja Shopee" yang menawarkan wang mudah untuk menekan tanda suka sebagai pertukaran kepada deposit pengaktifan adalah penipuan kerja.',
    pattern_label_en: 'Advance Fee Job Scam',
    pattern_label_ms: 'Penipuan Kerja Yuran Pendahuluan',
  },
  {
    id: 'job-post-verification',
    label: {
      en: 'Test Job Post to Verify',
      ms: 'Uji Iklan Kerja Untuk Disahkan',
    },
    tone: 'caution',
    text: `Urgent Hiring (Full-time / Part-time)
Penang, Melaka, Negeri Sembilan, KL, Selangor & Johor
WFH / Hybrid / Office
Positions: Admin, Customer Service, Sales, Accountant, Content Creator, UX/UI and Web Developer.
Internship available for Finance, Marketing, Business, Accounting and HR.
Requirements: SPM pass, able to speak/read/write Chinese, Malaysian only.
Send resume to Mingxing: wa.me/60162518403`,
    explanation_en: 'Needs Verification (Caution). While it does not ask for money upfront, sending your resume (which contains your IC, home address, and phone number) to an unverified personal WhatsApp number exposes you to severe identity theft. Legitimate companies use official emails or portals. Verify the company first.',
    explanation_ms: 'Perlu Pengesahan (Awas). Walaupun ia tidak meminta wang pendahuluan, menghantar resume anda (yang mengandungi nombor kad pengenalan, alamat dan nombor telefon) ke nombor WhatsApp peribadi yang tidak disahkan mendedahkan anda kepada kecurian identiti. Syarikat yang sah menggunakan e-mel rasmi. Sahkan syarikat terlebih dahulu.',
    pattern_label_en: 'Unverified Recruitment Channel',
    pattern_label_ms: 'Saluran Pengambilan Tidak Disahkan',
  },
  {
    id: 'lhdn',
    label: {
      en: 'Test Fake LHDN Text',
      ms: 'Uji Teks LHDN Palsu',
    },
    tone: 'danger',
    text: 'LHDN FINAL NOTICE: You have outstanding tax and legal action begins today. Make an immediate transfer to the officer account or open https://lhdn-refund-my.top.',
    explanation_en: 'Scam! LHDN will never threaten immediate legal action via SMS or ask for transfers to individual officer accounts or fake external links.',
    explanation_ms: 'Scam! LHDN tidak akan mengancam tindakan undang-undang segera melalui SMS atau meminta pemindahan ke akaun pegawai individu atau pautan luaran palsu.',
    pattern_label_en: 'Authority Impersonation',
    pattern_label_ms: 'Penyamaran Pihak Berkuasa',
  },
  {
    id: 'safe',
    label: {
      en: 'Test Safe Text',
      ms: 'Uji Teks Selamat',
    },
    tone: 'safe',
    text: 'Hi Aina, our study group will meet at the campus library tomorrow at 3:00 PM. Bring your notes if you can. See you there!',
    explanation_en: 'Safe. This is a normal, everyday message setting up a study group with no requests for money, sensitive information, or suspicious links.',
    explanation_ms: 'Selamat. Ini adalah mesej biasa yang mengatur kumpulan belajar tanpa meminta wang, maklumat sensitif, atau pautan yang mencurigakan.',
    pattern_label_en: 'Normal Communication',
    pattern_label_ms: 'Komunikasi Normal',
  },
];

export const CHEAT_SHEETS = [
  {
    id: 'lhdn-tax',
    icon: 'landmark',
    title: {
      en: 'LHDN Tax Scam',
      ms: 'Scam Cukai LHDN',
    },
    category: {
      en: 'Government impersonation',
      ms: 'Penyamaran agensi kerajaan',
    },
    paragraph: {
      en: 'Scammers impersonate LHDN officers and claim that you owe tax, face arrest, or qualify for a refund. They create fear and ask for an immediate transfer, personal details, or a login through an unofficial link. Do not continue the conversation; check your tax status by opening the official MyTax portal yourself or call LHDN using a number from its official website.',
      ms: 'Penipu menyamar sebagai pegawai LHDN dan mendakwa anda mempunyai cukai tertunggak, akan ditangkap, atau layak menerima bayaran balik. Mereka menimbulkan ketakutan lalu meminta pindahan segera, maklumat peribadi, atau log masuk melalui pautan tidak rasmi. Hentikan perbualan dan semak status cukai dengan membuka portal MyTax rasmi sendiri atau hubungi nombor di laman rasmi LHDN.',
    },
    redFlags: {
      en: ['Threat of arrest or court action', 'Payment to a personal account', 'Unofficial link or caller number'],
      ms: ['Ancaman tangkapan atau mahkamah', 'Bayaran ke akaun peribadi', 'Pautan atau nombor pemanggil tidak rasmi'],
    },
    safeAction: {
      en: 'Pause, save the evidence, and verify through the official MyTax/LHDN channel.',
      ms: 'Berhenti, simpan bukti, dan sahkan melalui saluran rasmi MyTax/LHDN.',
    },
  },
  {
    id: 'pos-laju',
    icon: 'package',
    title: {
      en: 'Pos Laju Parcel Scam',
      ms: 'Scam Bungkusan Pos Laju',
    },
    category: {
      en: 'Parcel phishing',
      ms: 'Phishing bungkusan',
    },
    paragraph: {
      en: 'A parcel scam says that delivery failed or a small customs fee is required, then provides a link that copies a courier website. The small amount makes the request feel harmless, but the fake page may steal card details, passwords, or OTP codes. Track the parcel only by typing the official courier address yourself or by using the courier’s official app.',
      ms: 'Scam bungkusan mendakwa penghantaran gagal atau bayaran kastam kecil diperlukan, kemudian memberikan pautan yang meniru laman kurier. Nilai yang kecil membuat permintaan kelihatan tidak berbahaya, tetapi halaman palsu boleh mencuri butiran kad, kata laluan, atau kod OTP. Jejak bungkusan hanya melalui alamat rasmi kurier yang anda taip sendiri atau aplikasi rasmi kurier.',
    },
    redFlags: {
      en: ['Unexpected delivery notice', 'Small urgent redelivery fee', 'Misspelled or unusual website domain'],
      ms: ['Notis penghantaran yang tidak dijangka', 'Bayaran penghantaran semula yang mendesak', 'Domain laman web pelik atau salah ejaan'],
    },
    safeAction: {
      en: 'Do not open the message link; verify the tracking number in the official courier app.',
      ms: 'Jangan buka pautan mesej; sahkan nombor penjejakan dalam aplikasi rasmi kurier.',
    },
  },
  {
    id: 'telegram-job',
    icon: 'briefcase',
    title: {
      en: 'Telegram Job Scam',
      ms: 'Scam Kerja Telegram',
    },
    category: {
      en: 'Fake job or task',
      ms: 'Kerja atau tugasan palsu',
    },
    paragraph: {
      en: 'Fake recruiters promise high pay for easy online tasks such as liking products, posting reviews, or processing orders. After a small reward builds trust, the victim is asked to deposit increasing amounts to unlock commissions or withdraw earnings. A genuine employer should not require you to pay for a job, so verify the company through its official website and stop if money or crypto is requested.',
      ms: 'Perekrut palsu menjanjikan gaji tinggi untuk tugasan mudah seperti menyukai produk, menulis ulasan, atau memproses pesanan. Selepas ganjaran kecil membina kepercayaan, mangsa diminta mendeposit jumlah yang semakin besar untuk membuka komisen atau mengeluarkan pendapatan. Majikan sebenar tidak meminta anda membayar untuk mendapatkan kerja; sahkan syarikat melalui laman rasminya dan berhenti jika wang atau kripto diminta.',
    },
    redFlags: {
      en: ['High income for very simple tasks', 'Recruitment only through Telegram/WhatsApp', 'Deposit required before withdrawal'],
      ms: ['Pendapatan tinggi untuk tugasan terlalu mudah', 'Pengambilan hanya melalui Telegram/WhatsApp', 'Deposit diperlukan sebelum pengeluaran'],
    },
    safeAction: {
      en: 'Never pay to start work; verify the vacancy on the company’s official careers page.',
      ms: 'Jangan bayar untuk mula bekerja; sahkan jawatan di halaman kerjaya rasmi syarikat.',
    },
  },
];

export const QUIZ_SCENARIOS = [
  {
    id: 1,
    text: {
      en: 'POS LAJU: Your parcel is stuck at customs. Pay RM5 now at poslaju-redelivery.help to prevent cancellation.',
      ms: 'POS LAJU: Bungkusan anda ditahan di kastam. Bayar RM5 sekarang di poslaju-redelivery.help untuk mengelakkan pembatalan.',
    },
    answer: 'scam',
    explanation: {
      en: 'Scam. The unexpected fee, urgency, and unofficial courier domain are common parcel-phishing signs.',
      ms: 'Scam. Bayaran tidak dijangka, desakan, dan domain kurier tidak rasmi ialah tanda biasa phishing bungkusan.',
    },
  },
  {
    id: 2,
    text: {
      en: 'Your lecturer posts in the class group: “Tomorrow’s tutorial is moved to Room B12. Check PutraBLAST for the same announcement.”',
      ms: 'Pensyarah anda menulis dalam kumpulan kelas: “Tutorial esok dipindahkan ke Bilik B12. Semak pengumuman yang sama di PutraBLAST.”',
    },
    answer: 'safe',
    explanation: {
      en: 'Safe. It does not request money or private details and tells you to verify through the normal university platform.',
      ms: 'Selamat. Ia tidak meminta wang atau maklumat peribadi dan menyuruh anda menyemak melalui platform universiti biasa.',
    },
  },
  {
    id: 3,
    text: {
      en: 'A Telegram recruiter offers RM500 per day for liking products and says you must transfer RM100 to activate your worker account.',
      ms: 'Seorang perekrut Telegram menawarkan RM500 sehari untuk menyukai produk dan mengatakan anda perlu memindahkan RM100 untuk mengaktifkan akaun pekerja.',
    },
    answer: 'scam',
    explanation: {
      en: 'Scam. Genuine employers do not charge an activation deposit before you can work.',
      ms: 'Scam. Majikan sebenar tidak mengenakan deposit pengaktifan sebelum anda boleh bekerja.',
    },
  },
  {
    id: 4,
    text: {
      en: 'Your bank app shows a scheduled maintenance notice. The notice asks for no password or OTP and contains no external link.',
      ms: 'Aplikasi bank anda memaparkan notis penyelenggaraan berjadual. Notis itu tidak meminta kata laluan atau OTP dan tidak mempunyai pautan luar.',
    },
    answer: 'safe',
    explanation: {
      en: 'Safe. The notice appears inside the official app and does not ask you to disclose information or take risky action.',
      ms: 'Selamat. Notis muncul dalam aplikasi rasmi dan tidak meminta anda mendedahkan maklumat atau mengambil tindakan berisiko.',
    },
  },
  {
    id: 5,
    text: {
      en: '“LHDN officer” calls and says police will arrest you today unless you transfer the outstanding tax to an account owned by an individual.',
      ms: '“Pegawai LHDN” menelefon dan berkata polis akan menangkap anda hari ini melainkan anda memindahkan cukai tertunggak ke akaun milik individu.',
    },
    answer: 'scam',
    explanation: {
      en: 'Scam. Threats of immediate arrest and payment to a personal bank account are serious impersonation red flags.',
      ms: 'Scam. Ancaman tangkapan segera dan bayaran ke akaun bank peribadi ialah tanda bahaya penyamaran yang serius.',
    },
  },
];
