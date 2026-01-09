/**
 * ManagerAuthModal Component
 * 
 * Modal for manager authorization when submitting checklists.
 * Features:
 * - Manager name selection via autocomplete
 * - 4-digit PIN entry with masking
 * - Lockout after 3 failed attempts (5 minutes)
 * - iPad-optimized 44px+ touch targets
 * - Haptic feedback on interactions
 * 
 * Usage:
 * <ManagerAuthModal
 *   isOpen={showAuth}
 *   onClose={() => setShowAuth(false)}
 *   onSuccess={(manager) => handleSubmit(manager)}
 *   managers={managerList}
 * />
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Manager, PinVerificationResult } from '@/types';
import { PIN_SECURITY } from '@/types';
import AutocompleteInput from '@/components/ui/AutocompleteInput';

interface ManagerAuthModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed without success */
  onClose: () => void;
  /** Callback when manager is successfully authenticated */
  onSuccess: (manager: Manager, shiftNotes?: string) => void;
  /** List of managers to select from */
  managers: Manager[];
  /** Title for the modal */
  title?: string;
  /** Whether to show shift notes field */
  showShiftNotes?: boolean;
  /** Callback to verify PIN (provided by parent for actual verification) */
  verifyPin: (managerId: string, pin: string) => Promise<PinVerificationResult>;
}

type AuthStep = 'select_manager' | 'enter_pin' | 'locked';

export function ManagerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  managers,
  title = 'Manager Authorization',
  showShiftNotes = false,
  verifyPin,
}: ManagerAuthModalProps) {
  const [step, setStep] = useState<AuthStep>('select_manager');
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [shiftNotes, setShiftNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(PIN_SECURITY.MAX_ATTEMPTS);
  
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select_manager');
      setSelectedManager(null);
      setPin(['', '', '', '']);
      setShiftNotes('');
      setError(null);
      setIsVerifying(false);
      setAttemptsRemaining(PIN_SECURITY.MAX_ATTEMPTS);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            setStep('select_manager');
            setError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutRemaining]);

  // Focus first PIN input when entering PIN step
  useEffect(() => {
    if (step === 'enter_pin' && pinInputRefs.current[0]) {
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleManagerSelect = useCallback((manager: Manager) => {
    setSelectedManager(manager as Manager);
    setStep('enter_pin');
    setError(null);
    setPin(['', '', '', '']);
  }, []);

  const handlePinChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      if (value && !/^\d$/.test(value)) return;

      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError(null);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }

      // Auto-focus next input
      if (value && index < 3) {
        pinInputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits entered
      if (value && index === 3 && newPin.every((d) => d !== '')) {
        handleVerifyPin(newPin.join(''));
      }
    },
    [pin]
  );

  const handlePinKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !pin[index] && index > 0) {
        pinInputRefs.current[index - 1]?.focus();
      }
    },
    [pin]
  );

  const handleVerifyPin = useCallback(
    async (pinValue: string) => {
      if (!selectedManager) return;

      setIsVerifying(true);
      setError(null);

      try {
        const result = await verifyPin(selectedManager.id, pinValue);

        if (result.success) {
          // Success haptic
          if ('vibrate' in navigator) {
            navigator.vibrate([10, 50, 10]);
          }
          onSuccess(selectedManager, shiftNotes || undefined);
        } else {
          // Error haptic
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50, 30, 50]);
          }

          if (result.error === 'account_locked') {
            setStep('locked');
            setLockoutRemaining(result.lockoutRemaining || 300);
          } else {
            setAttemptsRemaining(result.attemptsRemaining || 0);
            setError(
              result.attemptsRemaining
                ? `Incorrect PIN. ${result.attemptsRemaining} attempt${
                    result.attemptsRemaining === 1 ? '' : 's'
                  } remaining.`
                : 'Incorrect PIN.'
            );
            setPin(['', '', '', '']);
            pinInputRefs.current[0]?.focus();
          }
        }
      } catch (err) {
        setError('Verification failed. Please try again.');
        setPin(['', '', '', '']);
      } finally {
        setIsVerifying(false);
      }
    },
    [selectedManager, verifyPin, onSuccess, shiftNotes]
  );

  const handleBackToSelect = useCallback(() => {
    setStep('select_manager');
    setSelectedManager(null);
    setPin(['', '', '', '']);
    setError(null);
  }, []);

  const formatLockoutTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Manager */}
          {step === 'select_manager' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Select your name to authorize this submission.
              </p>
              <AutocompleteInput
                staffList={managers}
                onSelect={(staff) => handleManagerSelect(staff as Manager)}
                placeholder="Search manager name..."
                roleFilter="manager"
                label="Manager Name"
                size="large"
              />
            </div>
          )}

          {/* Step 2: Enter PIN */}
          {step === 'enter_pin' && selectedManager && (
            <div className="space-y-6">
              {/* Selected manager display */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedManager.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {selectedManager.name}
                  </p>
                  <p className="text-sm text-purple-600">Manager</p>
                </div>
                <button
                  onClick={handleBackToSelect}
                  className="px-3 py-2 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors touch-manipulation"
                >
                  Change
                </button>
              </div>

              {/* PIN input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter your 4-digit PIN
                </label>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => { pinInputRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={pin[index]}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      disabled={isVerifying}
                      className={`
                        w-14 h-16 text-center text-2xl font-mono font-bold
                        border-2 rounded-xl transition-all duration-200
                        focus:outline-none focus:ring-4 touch-manipulation
                        ${
                          error
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                        }
                        ${isVerifying ? 'bg-gray-100' : 'bg-white'}
                      `}
                      aria-label={`PIN digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Shift notes (optional) */}
              {showShiftNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift Notes (optional)
                  </label>
                  <textarea
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="Any notes for the next shift..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                             focus:border-purple-500 focus:ring-4 focus:ring-purple-200
                             focus:outline-none resize-none transition-all duration-200"
                  />
                </div>
              )}

              {/* Loading indicator */}
              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Verifying...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Locked */}
          {step === 'locked' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Temporarily Locked
                </h3>
                <p className="text-gray-600 mt-1">
                  Too many incorrect attempts. Please wait before trying again.
                </p>
              </div>
              <div className="text-3xl font-mono font-bold text-red-600">
                {formatLockoutTime(lockoutRemaining)}
              </div>
              <button
                onClick={onClose}
                className="w-full h-12 bg-gray-200 text-gray-700 rounded-xl font-medium
                         hover:bg-gray-300 transition-colors touch-manipulation"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render outside of DOM hierarchy
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

export default ManagerAuthModal;
