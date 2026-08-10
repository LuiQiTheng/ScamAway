import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the App and switches roles', () => {
    render(
      <LanguageProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </LanguageProvider>
    );

    // Initial screen should show the login selection
    expect(screen.getAllByText(/SCAM AWAY/i)[0]).toBeInTheDocument();

    // Switch to admin login
    const modButton = screen.queryByText(/Admin/i) || screen.queryByText(/Moderator/i);
    if (modButton) {
      act(() => {
        modButton.click();
      });
      // Should show the Officer ID input for admin login
      expect(screen.getByText(/Officer ID/i)).toBeInTheDocument();
    }
  });
});
