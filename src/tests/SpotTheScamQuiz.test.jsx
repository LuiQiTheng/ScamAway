import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SpotTheScamQuiz from '../components/SpotTheScamQuiz';
import { LanguageProvider } from '../context/LanguageContext';

const scenarios = [
  {
    id: 1,
    text: { en: 'Pay a parcel fee using this unknown link.', ms: 'Bayar yuran bungkusan.' },
    answer: 'scam',
    explanation: { en: 'The unknown payment link is risky.', ms: 'Pautan itu berisiko.' },
  },
  {
    id: 2,
    text: { en: 'Meet at the library at 3 PM.', ms: 'Jumpa di perpustakaan.' },
    answer: 'safe',
    explanation: { en: 'No risky request is made.', ms: 'Tiada permintaan berisiko.' },
  },
];

const renderQuiz = () => render(
  <LanguageProvider>
    <SpotTheScamQuiz scenarios={scenarios} />
  </LanguageProvider>,
);

describe('SpotTheScamQuiz', () => {
  it('shows exactly the Safe and Scam decision buttons before an answer', () => {
    renderQuiz();

    const answerGroup = screen.getByRole('group', { name: /quiz answers/i });
    const answerButtons = answerGroup.querySelectorAll('button');

    expect(answerButtons).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Safe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scam' })).toBeInTheDocument();
  });

  it('reveals feedback and updates the score after a correct decision', () => {
    renderQuiz();

    fireEvent.click(screen.getByRole('button', { name: 'Scam' }));

    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText(/Score: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/unknown payment link is risky/i)).toBeInTheDocument();
  });
});
