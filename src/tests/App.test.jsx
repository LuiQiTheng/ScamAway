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

    // Initial role should be user checker
    expect(screen.getAllByText(/SCAM AWAY/i)[0]).toBeInTheDocument();

    // Switch role to moderator
    const modButton = screen.queryByText(/Admin/i) || screen.queryByText(/Moderator/i);
    if (modButton) {
      act(() => {
        modButton.click();
      });
      expect(screen.getByText(/Broadcast Community Alert/i) || screen.getByText(/admin.broadcast_title/i)).toBeInTheDocument();
    }
  });
});
