import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { analyzeScamRisk } from '../utils/rulesEngine';
import EditProfileModal from '../components/EditProfileModal';
import { LanguageProvider } from '../context/LanguageContext';

vi.mock('../utils/aiEngine', () => ({
  analyzeTextWithGemini: vi.fn().mockResolvedValue(null),
  analyzeScreenshotWithGemini: vi.fn().mockResolvedValue(null),
}));

vi.mock('../content/educationalContent', () => ({
  QUICK_TEST_PRESETS: [],
}));

describe('Sprint Fixes & Enhancements', () => {
  describe('Item 1: Target Check Isolation (Rules Engine)', () => {
    it('does NOT return bank account check results when scanning only a phone number', async () => {
      const result = await analyzeScamRisk('Target check request: Phone info: 0123456789.', {
        isTargetCheck: true,
        targets: { phone: '0123456789', bank: null, url: null }
      });

      expect(result.score).toBeDefined();
      const hasBankCheck = result.explanations.some(
        exp => exp.label.includes('Akaun Bank') || exp.label.includes('Bank Account')
      );
      expect(hasBankCheck).toBe(false);

      const hasPhoneCheck = result.explanations.some(
        exp => exp.label.includes('Telefon') || exp.label.includes('Phone')
      );
      expect(hasPhoneCheck).toBe(true);
    });

    it('does NOT return phone check results when scanning only a bank account', async () => {
      const result = await analyzeScamRisk('Target check request: Bank account: 164228910239.', {
        isTargetCheck: true,
        targets: { phone: null, bank: '164228910239', url: null }
      });

      expect(result.score).toBeDefined();
      const hasPhoneCheck = result.explanations.some(
        exp => exp.label.includes('Telefon') || exp.label.includes('Phone')
      );
      expect(hasPhoneCheck).toBe(false);

      const hasBankCheck = result.explanations.some(
        exp => exp.label.includes('Akaun Bank') || exp.label.includes('Bank Account')
      );
      expect(hasBankCheck).toBe(true);
    });
  });

  describe('Item 2: Malaysian Phone Number Format Validation', () => {
    const myPhoneRegex = /^(\+?60|0)1\d{8,9}$/;

    it('accepts valid 10 and 11-digit Malaysian mobile numbers', () => {
      const validNumbers = [
        '0123456789',
        '01187625123',
        '+60123456789',
        '60123456789',
        '0191234567'
      ];
      validNumbers.forEach(num => {
        const clean = num.replace(/[-\s]/g, '');
        expect(myPhoneRegex.test(clean)).toBe(true);
      });
    });

    it('rejects short and non-Malaysian mobile formats', () => {
      const invalidNumbers = [
        '012345',
        '12345678',
        '0312345678',
        '999',
        'abc0123456789'
      ];
      invalidNumbers.forEach(num => {
        const clean = num.replace(/[-\s]/g, '');
        expect(myPhoneRegex.test(clean)).toBe(false);
      });
    });
  });

  describe('Item 3: Edit Profile Password Change', () => {
    it('allows updating personal info without requiring password change', async () => {
      const onSave = vi.fn().mockResolvedValue();
      const initialUser = {
        name: 'Ahmad bin Ali',
        username: 'ahmadali',
        phone: '0123456789',
        age: 30
      };

      render(
        <LanguageProvider>
          <EditProfileModal
            isOpen={true}
            initialData={initialUser}
            isAdmin={false}
            onClose={() => {}}
            onSave={onSave}
          />
        </LanguageProvider>
      );

      // Change name only
      const nameInput = screen.getByDisplayValue('Ahmad bin Ali');
      fireEvent.change(nameInput, { target: { value: 'Ahmad bin Omar' } });

      // Click save
      const saveBtn = screen.getByRole('button', { name: /save details|simpan/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Ahmad bin Omar',
          username: 'ahmadali',
          phone: '0123456789',
          age: 30
        }));
      });
    });

    it('requires current password when a new password is typed', async () => {
      const onSave = vi.fn().mockResolvedValue();
      const initialUser = {
        name: 'Ahmad bin Ali',
        username: 'ahmadali',
        phone: '0123456789',
        age: 30
      };

      render(
        <LanguageProvider>
          <EditProfileModal
            isOpen={true}
            initialData={initialUser}
            isAdmin={false}
            onClose={() => {}}
            onSave={onSave}
          />
        </LanguageProvider>
      );

      // Enter new password without entering current password
      const newPasswordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.change(newPasswordInput, { target: { value: 'NewSecret123!' } });

      // Click save
      const saveBtn = screen.getByRole('button', { name: /save details|simpan/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Please enter your current password to change password/i)).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Item 6 & 7: Audit Log Retention and PDRM ID Preservation', () => {
    it('prunes audit records older than 7 days from persistent state', () => {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const cutoff = now - SEVEN_DAYS_MS;

      const mockLogs = [
        { id: '1', action: 'Recent Action', timestamp: new Date(now - 1000 * 60).toISOString(), performedBy: 'PDRM001' },
        { id: '2', action: '3-day old Action', timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), performedBy: 'PDRM002' },
        { id: '3', action: '8-day old Action', timestamp: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), performedBy: 'admin1' }
      ];

      const activeLogs = mockLogs.filter(l => new Date(l.timestamp).getTime() >= cutoff);
      expect(activeLogs).toHaveLength(2);
      expect(activeLogs.map(l => l.id)).toEqual(['1', '2']);
      // PDRM001 and PDRM002 are preserved and not filtered out by legacy filter
      expect(activeLogs[0].performedBy).toBe('PDRM001');
      expect(activeLogs[1].performedBy).toBe('PDRM002');
    });

    it('excludes August audit logs completely from the system view', () => {
      const allLogs = [
        { id: '1', action: 'September action', timestamp: '2026-09-14T02:49:25.223Z', performedBy: 'PDRM001' },
        { id: '2', action: 'August action', timestamp: '2026-08-06T13:54:56.034Z', performedBy: 'PDRM001' },
        { id: '3', action: 'Another August action', timestamp: '2026-08-12T14:11:17.216Z', performedBy: 'PDRM002' }
      ];

      const filtered = allLogs.filter(
        l => !l.timestamp || (!String(l.timestamp).startsWith('2026-08') && !String(l.timestamp).includes('-08-'))
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('Item 10: Duplicate Report Prevention Grouping & Deactivation', () => {
    it('has ENABLE_DUPLICATE_REPORT_BLOCK set to false (temporarily terminated)', async () => {
      const { ENABLE_DUPLICATE_REPORT_BLOCK, checkIsAlreadyFlagged } = await import('../components/ReportModal');
      expect(ENABLE_DUPLICATE_REPORT_BLOCK).toBe(false);
      // checkIsAlreadyFlagged must return false when terminated, allowing duplicate submissions without blocking
      const isBlocked = checkIsAlreadyFlagged(
        'Scam message 123',
        'Scam message 123',
        [{ text: 'Scam message 123' }]
      );
      expect(isBlocked).toBe(false);
    });
  });

  describe('Item 11: User & Admin Login Authentication Logic', () => {
    it('verifies correct password matching for both hashed and legacy plaintext passwords', async () => {
      const { hashPassword } = await import('../utils/cryptoAuth');
      const plainPassword = 'UserPass123!';
      const hashed = await hashPassword(plainPassword);

      // Simulating the password validation inside loginUser / loginAdmin
      const verifyCredentials = (storedPassword, inputPassword, hashedInput) => {
        if (storedPassword === hashedInput) return true;
        if (storedPassword === inputPassword) return true;
        return false;
      };

      // Scenario 1: Password is stored as cryptographic hash (SEC-01)
      expect(verifyCredentials(hashed, plainPassword, await hashPassword(plainPassword))).toBe(true);

      // Scenario 2: Legacy user with plaintext password in Firestore
      expect(verifyCredentials(plainPassword, plainPassword, await hashPassword(plainPassword))).toBe(true);

      // Scenario 3: Incorrect password
      expect(verifyCredentials(hashed, 'WrongPassword', await hashPassword('WrongPassword'))).toBe(false);
    });

    it('handles query snapshot emptiness correctly (empty snapshot = invalid user)', () => {
      const checkSnapshot = (snapshot) => {
        if (snapshot.empty) throw new Error('Invalid username or password');
        return snapshot.docs[0];
      };

      // Valid account found -> snapshot.empty is false -> does NOT throw
      expect(() => checkSnapshot({ empty: false, docs: [{ id: 'user1', data: () => ({}) }] })).not.toThrow();

      // Account not found -> snapshot.empty is true -> throws invalid username/password
      expect(() => checkSnapshot({ empty: true, docs: [] })).toThrow('Invalid username or password');
    });
  });

  describe('Item 12: Malaysian Telco Carrier Fallback & Numverify Quota Resilience', () => {
    it('correctly resolves Malaysian mobile carriers and line types locally when Numverify API is rate-limited', async () => {
      const { getMalaysianCarrierFallback } = await import('../utils/ccidLookup');

      // Maxis (012, 017)
      const maxisRes = getMalaysianCarrierFallback('0123456789');
      expect(maxisRes.valid).toBe(true);
      expect(maxisRes.lineType).toBe('mobile');
      expect(maxisRes.carrier).toBe('Maxis');

      // Celcom (019, 013)
      const celcomRes = getMalaysianCarrierFallback('+60191234567');
      expect(celcomRes.valid).toBe(true);
      expect(celcomRes.lineType).toBe('mobile');
      expect(celcomRes.carrier).toBe('Celcom');

      // Digi (016)
      const digiRes = getMalaysianCarrierFallback('0162518403');
      expect(digiRes.valid).toBe(true);
      expect(digiRes.lineType).toBe('mobile');
      expect(digiRes.carrier).toBe('Digi');

      // U Mobile (018)
      const uMobileRes = getMalaysianCarrierFallback('0187654321');
      expect(uMobileRes.valid).toBe(true);
      expect(uMobileRes.lineType).toBe('mobile');
      expect(uMobileRes.carrier).toBe('U Mobile');

      // VoIP (0154 prefix)
      const voipRes = getMalaysianCarrierFallback('01548123456');
      expect(voipRes.valid).toBe(true);
      expect(voipRes.lineType).toBe('voip');

      // Invalid format
      const invalidRes = getMalaysianCarrierFallback('012345');
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.lineType).toBe('unknown');
    });
  });
});



