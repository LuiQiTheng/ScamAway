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
});
