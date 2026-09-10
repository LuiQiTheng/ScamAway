import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import UserChecker from '../components/UserChecker';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';

vi.mock('../utils/rulesEngine', () => ({
  analyzeScamRisk: vi.fn().mockResolvedValue({
    score: 85,
    riskBand: 'Critical',
    bandColor: 'critical',
    explanations: [],
    recommendedActions: [],
    indicators: { urls: [], phones: [] }
  }),
  findMatchingVerifiedReports: vi.fn().mockReturnValue([]),
  analyzeScreenshotRisk: vi.fn().mockResolvedValue({
    score: 88,
    riskBand: 'Critical',
    bandColor: 'critical',
    explanations: [
      { category: 'impersonation', label: 'Visual Red Flags Detected', text: 'Forged crest', weight: 25 }
    ],
    recommendedActions: ['Do not send money'],
    indicators: { urls: [], phones: [] },
    visionForensics: {
      platform: 'WhatsApp',
      sender: '+2348012345678',
      senderIsOverseas: true,
      visualRedFlags: ['Forged police crest'],
      extractedText: 'Extracted police warning message',
      explanation: 'Suspicious screenshot'
    }
  })
}));

describe('UserChecker Image Paste and Upload', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <AppProvider>
          <UserChecker />
        </AppProvider>
      </LanguageProvider>
    );
  };

  it('renders Upload Image button and textarea accepting paste', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /Upload Image/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type, paste text, or paste a screenshot/i)).toBeInTheDocument();
  });

  it('handles image paste via clipboard event and displays image preview badge', async () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText(/Type, paste text, or paste a screenshot/i);
    const mockFile = new File(['mock-binary-data'], 'scam-chat.png', { type: 'image/png' });

    // Simulate clipboard paste with image file
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => mockFile
          }
        ]
      }
    });

    await act(async () => {
      textarea.dispatchEvent(pasteEvent);
    });

    await waitFor(() => {
      expect(screen.getByText(/scam-chat.png/i)).toBeInTheDocument();
      expect(screen.getByText(/Screenshot attached/i)).toBeInTheDocument();
    });

    // Remove button should clear the image
    const removeBtn = screen.getByTitle(/Remove image/i);
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    expect(screen.queryByText(/scam-chat.png/i)).not.toBeInTheDocument();
  });

  it('allows switching to Phone, Bank & URL Check tab and accepts bank account input', async () => {
    renderComponent();

    const targetTabBtn = screen.getByRole('tab', { name: /Phone, Bank & URL Check/i });
    expect(targetTabBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(targetTabBtn);
    });

    const bankInput = screen.getByPlaceholderText(/1234567890/i);
    expect(bankInput).toBeInTheDocument();

    fireEvent.change(bankInput, { target: { value: '164128990123' } });
    expect(bankInput.value).toBe('164128990123');
  });

  it('renders Status: Clean and Advisory Notice badges for safe explanations', async () => {
    const { analyzeScamRisk } = await import('../utils/rulesEngine');
    analyzeScamRisk.mockResolvedValueOnce({
      score: 10,
      riskBand: 'Low evidence',
      bandColor: 'low',
      explanations: [
        {
          category: 'safe',
          label: 'PDRM SemakMule Check: Clean (Bank Account)',
          text: 'No scam records reported.',
          weight: 0
        },
        {
          category: 'safe_advisory',
          label: 'Precautionary Advisory: Financial & Identity Details',
          text: 'Double check before sending money.',
          weight: 10
        }
      ],
      recommendedActions: ['Verify beneficiary name'],
      indicators: { urls: [], phones: [] }
    });

    renderComponent();

    const targetTabBtn = screen.getByRole('tab', { name: /Phone, Bank & URL Check/i });
    await act(async () => {
      fireEvent.click(targetTabBtn);
    });

    const bankInput = screen.getByPlaceholderText(/1234567890/i);
    fireEvent.change(bankInput, { target: { value: '114228990123' } });

    const scanBtn = screen.getByRole('button', { name: /Scan & Analyze|Scan Target/i });
    await act(async () => {
      fireEvent.click(scanBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Risk Index: 10\/100/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Clean/i)).toBeInTheDocument();
      expect(screen.getByText(/Advisory Notice/i)).toBeInTheDocument();
    });
  });
});


