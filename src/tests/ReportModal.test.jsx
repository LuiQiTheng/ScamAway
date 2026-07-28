import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReportModal from '../components/ReportModal';
import { LanguageProvider } from '../context/LanguageContext';
import { redactSensitiveInformation } from '../utils/redaction';

const renderModal = (props = {}) => {
  const onClose = vi.fn();
  const onSubmitReport = vi.fn();

  render(
    <LanguageProvider>
      <ReportModal
        isOpen
        onClose={onClose}
        originalText="Call me at 60123456789 about this job."
        scanResult={{ score: 72, riskBand: 'High risk' }}
        onSubmitReport={onSubmitReport}
        {...props}
      />
    </LanguageProvider>,
  );

  return { onClose, onSubmitReport };
};

describe('ReportModal', () => {
  it('renders an editable scam message, category dropdown, and submit button', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/scam message or evidence/i)).toHaveValue(
      'Call me at 60123456789 about this job.',
    );
    expect(screen.getByRole('combobox', { name: /scam category/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
  });

  it('submits the edited message and a privacy-redacted community copy', () => {
    const { onSubmitReport } = renderModal();
    const message = screen.getByLabelText(/scam message or evidence/i);

    fireEvent.change(message, {
      target: { value: 'Telegram job. WhatsApp 60162518403 and pay account 123456789012.' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'job' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    expect(onSubmitReport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'job',
        originalText: 'Telegram job. WhatsApp 60162518403 and pay account 123456789012.',
        text: expect.stringContaining('[REDACTED PHONE]'),
        score: 72,
        status: 'unverified',
      }),
    );
  });

  it('redacts Malaysian phone numbers and long account numbers', () => {
    expect(
      redactSensitiveInformation('Phone 60162518403, account 123456789012'),
    ).toBe('Phone [REDACTED PHONE], account [REDACTED BANK ACCOUNT]');
  });
});
