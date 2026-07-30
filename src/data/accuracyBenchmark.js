/**
 * Curated, synthetic benchmark messages based on common Malaysian scam themes.
 *
 * These examples do not contain real victims, phone numbers, bank accounts, or
 * active malicious links. They are regression fixtures, not production
 * accuracy evidence.
 */
export const ACCURACY_BENCHMARK = [
  {
    id: 'scam-lhdn-arrest-payment',
    label: 'scam',
    category: 'authority_impersonation',
    language: 'en',
    message:
      'LHDN FINAL NOTICE: Legal action and an arrest warrant begin today. Pay RM2,800 now to the officer account to stop the case.',
  },
  {
    id: 'scam-poslaju-redelivery',
    label: 'scam',
    category: 'courier_phishing',
    language: 'en',
    message:
      'Pos Laju: Your parcel is held because delivery failed. Pay RM5 now at https://poslaju-redelivery.example or it will be returned.',
  },
  {
    id: 'scam-task-job-deposit',
    label: 'scam',
    category: 'job_advance_fee',
    language: 'en',
    message:
      'Part-time online job. Earn RM500 daily for simple product-like tasks. Pay RM100 registration deposit now to unlock your first task.',
  },
  {
    id: 'scam-family-new-number',
    label: 'scam',
    category: 'family_impersonation',
    language: 'en',
    message:
      "Mum, my phone is broken and this is my new number. Transfer RM1,000 to my friend's account now and don't call or tell anyone.",
  },
  {
    id: 'scam-investment-guarantee',
    label: 'scam',
    category: 'investment',
    language: 'en',
    message:
      'Exclusive crypto investment with guaranteed profit and no risk. Deposit RM500 today to activate your allocation.',
  },
  {
    id: 'scam-bank-credential-link',
    label: 'scam',
    category: 'credential_phishing',
    language: 'en',
    message:
      'Maybank alert: Verify now at https://maybank-login.example and enter your OTP or your account will be suspended.',
  },
  {
    id: 'scam-police-safe-account',
    label: 'scam',
    category: 'macau_scam',
    language: 'en',
    message:
      'PDRM investigation notice: You may be arrested for money laundering. Transfer all savings now into our safe account for inspection.',
  },
  {
    id: 'scam-fake-aid-refund',
    label: 'scam',
    category: 'government_aid_phishing',
    language: 'en',
    message:
      'Congratulations, you won RM1,000 government aid. Submit your banking details now at https://bantuan-kerajaan.example to receive it.',
  },
  {
    id: 'scam-kwsp-tac',
    label: 'scam',
    category: 'credential_phishing',
    language: 'en',
    message:
      'KWSP final warning: Your account will be suspended. Verify immediately at https://kwsp-secure.example and provide your TAC code.',
  },
  {
    id: 'scam-parcel-malay',
    label: 'scam',
    category: 'courier_phishing',
    language: 'ms',
    message:
      'Pos Malaysia: Penghantaran bungkusan gagal. Bayar RM3 sekarang di https://pos-bayaran.example untuk elak bungkusan dipulangkan.',
  },
  {
    id: 'scam-job-malay',
    label: 'scam',
    category: 'job_advance_fee',
    language: 'ms',
    message:
      'Kerja sambilan mudah dari rumah, gaji RM600 sehari. Bayar deposit pendaftaran RM80 sekarang untuk aktifkan tugasan pertama.',
  },
  {
    id: 'scam-investment-malay',
    label: 'scam',
    category: 'investment',
    language: 'ms',
    message:
      'Pelaburan crypto dijamin untung 20% setiap hari tanpa risiko. Deposit RM1,000 hari ini untuk mula.',
  },
  {
    id: 'safe-urgent-hiring',
    label: 'safe',
    category: 'job_post',
    language: 'en',
    message:
      'Urgent hiring for an admin internship. Contact wa.me/60111111111. No fees, deposits, OTPs, or banking details are required.',
  },
  {
    id: 'safe-poslaju-warning',
    label: 'safe',
    category: 'safety_advisory',
    language: 'en',
    message:
      'Pos Laju safety reminder: We will never ask you to pay RM2 through an SMS link.',
  },
  {
    id: 'safe-expected-cod',
    label: 'safe',
    category: 'courier_update',
    language: 'en',
    message:
      'Pos Laju delivery update for your expected order: COD RM50 is payable to the courier upon delivery.',
  },
  {
    id: 'safe-pdrm-warning',
    label: 'safe',
    category: 'safety_advisory',
    language: 'en',
    message:
      'PDRM anti-scam reminder: Never transfer money to police and do not share your OTP with anyone.',
  },
  {
    id: 'safe-lhdn-official-reminder',
    label: 'safe',
    category: 'government_notice',
    language: 'en',
    message:
      'LHDN reminder: Payment is not required through this message. Sign in through the official hasil.gov.my website to review your tax balance.',
  },
  {
    id: 'safe-family-update',
    label: 'safe',
    category: 'family_update',
    language: 'en',
    message:
      'Mum is in hospital after an accident. She is stable and no payment or transfer is required. Call her directly.',
  },
  {
    id: 'safe-investment-settlement',
    label: 'safe',
    category: 'financial_notice',
    language: 'en',
    message:
      'Your regulated broker confirms an RM500 investment settlement. No guaranteed return is promised and no payment is requested.',
  },
  {
    id: 'safe-lunch-payment',
    label: 'safe',
    category: 'personal_payment',
    language: 'en',
    message:
      'Please pay RM20 for lunch when you arrive. This is for the meal we ordered together.',
  },
  {
    id: 'safe-tnb-maintenance',
    label: 'safe',
    category: 'service_notice',
    language: 'en',
    message:
      'Tenaga Nasional Berhad maintenance notice: No payments or login credentials are required. For help, use the official TNB app.',
  },
  {
    id: 'safe-bank-security-warning',
    label: 'safe',
    category: 'safety_advisory',
    language: 'en',
    message:
      'Maybank security reminder: We will never ask for your OTP, password, or TAC by message. Do not share them with anyone.',
  },
  {
    id: 'safe-university-event',
    label: 'safe',
    category: 'campus_notice',
    language: 'en',
    message:
      'UPM career workshop registration closes on Friday. Submit the university form if you wish to attend. No payment is required.',
  },
  {
    id: 'safe-company-job-post',
    label: 'safe',
    category: 'job_post',
    language: 'en',
    message:
      'ABC Technology Sdn Bhd is hiring a frontend intern. Apply through careers.abc-technology.example or email hr@abc-technology.example. No fee is required.',
  },
];
