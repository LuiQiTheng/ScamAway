import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppProvider, useAppContext } from '../context/AppContext';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_ref, _callback) => {
    // Return a dummy unsubscribe function and don't trigger the callback so no data is loaded
    return () => {};
  }),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-doc-id' }),
  updateDoc: vi.fn().mockResolvedValue(),
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(),
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  query: vi.fn(),
  where: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(async (_db, fn) => {
    const mockTx = {
      get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ count: 5 }) }),
      set: vi.fn()
    };
    return await fn(mockTx);
  }),
  arrayUnion: vi.fn((val) => val),
  arrayRemove: vi.fn((val) => val),
  getFirestore: vi.fn(() => ({}))
}));

vi.mock('../utils/translateText', () => ({
  translateText: vi.fn(async (text) => text)
}));

const TestComponent = () => {
  const { reportsList, addReport, updateReportStatus } = useAppContext();
  
  return (
    <div>
      <div data-testid="report-count">{reportsList.length}</div>
      <button 
        data-testid="add-report" 
        onClick={() => addReport({ text: 'Test report', category: 'spam' })}
      >
        Add
      </button>
      <button 
        data-testid="update-report" 
        onClick={() => updateReportStatus(reportsList[0]?.id, 'confirmed', 'Test rationale')}
      >
        Update
      </button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default reports list and updates it', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial default reports count is 0
    expect(screen.getByTestId('report-count').textContent).toBe('0');

    await act(async () => {
      screen.getByTestId('add-report').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('report-count').textContent).toBe('1');
    });
  });

  it('updates report status correctly', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await act(async () => {
      screen.getByTestId('add-report').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('report-count').textContent).toBe('1');
    });
    
    await act(async () => {
      screen.getByTestId('update-report').click();
    });

    // Check localStorage
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('scam_away_reports'));
      expect(stored).toBeDefined();
      expect(stored[0]).toBeDefined();
      expect(stored[0].status).toBe('confirmed');
    });
  });

  it('strips originalText on addReport to prevent PII leakage [SEC-02]', async () => {
    let addReportFn;
    const HelperComponent = () => {
      const { addReport } = useAppContext();
      addReportFn = addReport;
      return null;
    };

    render(
      <AppProvider>
        <HelperComponent />
      </AppProvider>
    );

    await act(async () => {
      await addReportFn({
        text: 'Redacted text [REDACTED PHONE]',
        originalText: 'Raw sensitive text 0123456789',
        category: 'phishing'
      });
    });

    const stored = JSON.parse(localStorage.getItem('scam_away_reports'));
    expect(stored[0].text).toBe('Redacted text [REDACTED PHONE]');
    expect(stored[0].originalText).toBeUndefined();
  });

  it('treats hyphenated and non-hyphenated phone numbers as identical and prevents duplicates', async () => {
    let addBlacklistItemFn;
    let removeBlacklistItemFn;
    let currentBlacklist;

    const BlacklistHelper = () => {
      const { addBlacklistItem, removeBlacklistItem, blacklist } = useAppContext();
      addBlacklistItemFn = addBlacklistItem;
      removeBlacklistItemFn = removeBlacklistItem;
      currentBlacklist = blacklist;
      return null;
    };

    render(
      <AppProvider>
        <BlacklistHelper />
      </AppProvider>
    );

    // Initial blacklist should already have normalized phone numbers with dash and country code
    expect(currentBlacklist.phoneNumbers).toContain('+6011-8762512');

    // Attempting to add '011-8762512' (with hyphen) should detect duplicate
    let res1;
    await act(async () => {
      res1 = await addBlacklistItemFn('phoneNumbers', '011-8762512');
    });
    expect(res1.duplicate).toBe(true);
    expect(res1.existingMatch).toBe('+6011-8762512');

    // Attempting to add '0118762512' (without hyphen) should also detect duplicate
    let res2;
    await act(async () => {
      res2 = await addBlacklistItemFn('phoneNumbers', '0118762512');
    });
    expect(res2.duplicate).toBe(true);
    expect(res2.existingMatch).toBe('+6011-8762512');

    // Adding '0123456789' (without hyphen) normalizes to '+6012-3456789'
    let resPhone;
    await act(async () => {
      resPhone = await addBlacklistItemFn('phoneNumbers', '0123456789');
    });
    expect(resPhone.success).toBe(true);
    expect(resPhone.value).toBe('+6012-3456789');
    expect(currentBlacklist.phoneNumbers).toContain('+6012-3456789');

    // Attempting to add '012-3456789' (with hyphen) detects duplicate
    let resPhoneDup;
    await act(async () => {
      resPhoneDup = await addBlacklistItemFn('phoneNumbers', '012-3456789');
    });
    expect(resPhoneDup.duplicate).toBe(true);
    expect(resPhoneDup.existingMatch).toBe('+6012-3456789');

    // Adding a brand new number normalizes and succeeds with dash
    let res3;
    await act(async () => {
      res3 = await addBlacklistItemFn('phoneNumbers', '019-1234567');
    });
    expect(res3.success).toBe(true);
    expect(res3.value).toBe('+6019-1234567');
    expect(currentBlacklist.phoneNumbers).toContain('+6019-1234567');

    // Removing using non-hyphenated format '0118762512' correctly removes '+6011-8762512'
    await act(async () => {
      await removeBlacklistItemFn('phoneNumbers', '0118762512');
    });
    expect(currentBlacklist.phoneNumbers).not.toContain('+6011-8762512');
  });
});

