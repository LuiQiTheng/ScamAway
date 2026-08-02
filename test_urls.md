# Scam Away AI - URL Testing Guide

This document contains a curated list of URLs you can use to test the different security layers of the Scam Away AI system.

## 🛡️ Safe URLs (Expected Score: 12/100 - Caution)
These URLs are legitimate and will pass the DNS check. VirusTotal will confirm they are clean (0 threats), resulting in the baseline 12/100 caution score.
- `https://github.com`
- `https://www.wikipedia.org`
- `https://www.malaysia.gov.my`
- `https://react.dev`
- `https://www.youtube.com`

---

## 🚨 Malicious / Scam URLs (Expected Score: 95/100 - Critical)
These are official, globally recognized test URLs used by cybersecurity professionals. They are safe to click, but VirusTotal's global database is hardcoded to flag them as malicious. The system will escalate these to 95/100.
- **Google Safe Browsing Malware Test:** `http://testsafebrowsing.appspot.com/apiv4/`
- **EICAR Anti-Malware Test:** `https://secure.eicar.org/eicar.com`
- **WICAR Browser Exploit Test:** `http://www.wicar.org/test1.html`
- **AMTSO Phishing Test:** `https://www.amtso.org/check-desktop-phishing-page/`

---

## 🛑 Local Offline Blacklist (Expected Score: 85-95/100 - High/Critical)
These URLs are hardcoded into the local Scam Away AI rules engine as simulated phishing domains. They will instantly trigger high-risk warnings based on local intelligence without needing VirusTotal.
- **Fake Pos Laju:** `https://pos-laju.info`
- **Fake Maybank:** `https://maybank-secure-login.xyz`
- **Fake Shopee:** `https://shopee-rewards-claim.net`
- **Fake TNB:** `https://tnb-bill-payment.club`
- **Fake LHDN:** `https://lhdn-refund.org`

---

## ❌ Invalid & Non-Existent URLs (Expected: Instant Block)
These URLs will fail the initial format validation or the Google/Cloudflare DNS check, stopping the scanner instantly.
- **Non-Existent Domain:** `https://this-is-a-completely-fake-domain-99999.com`
- **Invalid Format:** `hello-world-no-domain`
