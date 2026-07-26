import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppProvider, useAppContext } from '../context/AppContext';

const TestComponent = () => {
  const { reportsList, addReport, updateReportStatus } = useAppContext();
  
  return (
    <div>
      <div data-testid="report-count">{reportsList.length}</div>
      <button 
        data-testid="add-report" 
        onClick={() => addReport({ id: 999, text: 'Test report', category: 'spam' }, 50, 'Caution', ['verify'])}
      >
        Add
      </button>
      <button 
        data-testid="update-report" 
        onClick={() => updateReportStatus(1001, 'confirmed', 'Test rationale')}
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

  it('provides default reports list and updates it', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial default reports count is 4
    expect(screen.getByTestId('report-count').textContent).toBe('4');

    act(() => {
      screen.getByTestId('add-report').click();
    });

    expect(screen.getByTestId('report-count').textContent).toBe('5');
  });

  it('updates report status correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('add-report').click();
    });
    
    act(() => {
      screen.getByTestId('update-report').click();
    });

    // Since we updated report 1001
    const stored = JSON.parse(localStorage.getItem('scamshield_reports'));
    const updatedReport = stored.find(r => r.id === 1001 && r.status === 'confirmed' && r.rationale === 'Test rationale');
    expect(updatedReport).toBeDefined();
    expect(updatedReport.status).toBe('confirmed');
  });
});
