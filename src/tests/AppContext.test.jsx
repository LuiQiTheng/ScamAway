import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppProvider, useAppContext } from '../context/AppContext';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((ref, callback) => {
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
  getFirestore: vi.fn(() => ({}))
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
});
