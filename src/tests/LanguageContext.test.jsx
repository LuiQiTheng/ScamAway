import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

// A simple test component to consume the context
const TestComponent = () => {
  const { t, toggleLanguage, lang } = useLanguage();
  return (
    <div>
      <span data-testid="lang-indicator">{lang}</span>
      <h1 data-testid="heading">{t('nav.scanner')}</h1>
      <button data-testid="toggle-btn" onClick={toggleLanguage}>Toggle</button>
    </div>
  );
};

describe('LanguageContext', () => {
  it('should default to English and translate to English keys', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('lang-indicator')).toHaveTextContent('en');
    expect(screen.getByTestId('heading')).toHaveTextContent('Scanner');
  });

  it('should toggle to Malay and translate correctly', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const button = screen.getByTestId('toggle-btn');
    fireEvent.click(button); // Toggle to ms

    expect(screen.getByTestId('lang-indicator')).toHaveTextContent('ms');
    expect(screen.getByTestId('heading')).toHaveTextContent('Pengimbas'); // Malay for Scanner
  });
});
