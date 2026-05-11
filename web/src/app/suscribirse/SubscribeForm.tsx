'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef<number>(0);

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || formState === 'loading') return;

    setFormState('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          website,
          ts: renderedAt.current,
        }),
      });

      if (res.ok) {
        setFormState('success');
        return;
      }

      if (res.status === 409) {
        setErrorMessage('Este correo ya está suscrito.');
      } else if (res.status === 400) {
        setErrorMessage('Email inválido.');
      } else {
        setErrorMessage('Algo salió mal. Intenta de nuevo.');
      }
      setFormState('error');
    } catch {
      setErrorMessage('Error de conexión. Intenta de nuevo.');
      setFormState('error');
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {formState === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="py-6"
          >
            <div
              className="flex items-start gap-3 rounded-lg px-5 py-4"
              style={{ background: '#EFF4EC', borderLeft: '3px solid #5A8A6A' }}
            >
              <span className="mt-0.5 text-lg" aria-hidden="true">✓</span>
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: '#2D5A3D', fontFamily: 'var(--font-geist-sans)' }}
                >
                  Ya estás suscrito
                </p>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: '#3D6B4D', fontFamily: 'var(--font-geist-sans)' }}
                >
                  Recibirás tu primer correo el próximo día hábil a las 9am.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
            >
              <label>
                No llenar este campo
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formState === 'error') setFormState('idle');
                }}
                placeholder="tu@correo.com"
                disabled={formState === 'loading'}
                className="flex-1 rounded-md px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${formState === 'error' ? '#C0392B' : '#D8D4CC'}`,
                  color: '#1A1A1A',
                  fontFamily: 'var(--font-geist-sans)',
                  boxShadow: formState === 'error'
                    ? 'none'
                    : '0 1px 2px rgba(0,0,0,0.04)',
                }}
                onFocus={(e) => {
                  if (formState !== 'error') {
                    e.currentTarget.style.borderColor = '#4A6FA5';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,111,165,0.12)';
                  }
                }}
                onBlur={(e) => {
                  if (formState !== 'error') {
                    e.currentTarget.style.borderColor = '#D8D4CC';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                  }
                }}
              />
              <motion.button
                type="submit"
                disabled={formState === 'loading' || !email.trim()}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-md px-6 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                style={{
                  background: '#4A6FA5',
                  fontFamily: 'var(--font-geist-sans)',
                  minWidth: '128px',
                  cursor: formState === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {formState === 'loading' ? (
                  <>
                    <span className="invisible">Suscribirme</span>
                    {/* Shimmer overlay */}
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span
                        className="h-4 w-20 rounded-sm"
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.1) 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.2s infinite',
                        }}
                      />
                    </span>
                  </>
                ) : (
                  'Suscribirme'
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {formState === 'error' && errorMessage && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs pl-1 overflow-hidden"
                  style={{
                    color: '#C0392B',
                    fontFamily: 'var(--font-geist-sans)',
                    borderLeft: '2px solid #C0392B',
                    paddingLeft: '8px',
                  }}
                  role="alert"
                >
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>

            <p
              className="text-xs"
              style={{ color: '#9E9A94', fontFamily: 'var(--font-geist-sans)' }}
            >
              Sin spam. Cancela cuando quieras.
            </p>
          </motion.form>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
