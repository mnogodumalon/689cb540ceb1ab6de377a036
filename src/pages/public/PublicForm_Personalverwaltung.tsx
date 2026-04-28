import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { lookupKeys } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '689cb529a2bd8ef1df5d53da';
const SUBMIT_PATH = `/rest/apps/${APP_ID}/records`;
const ALTCHA_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js';

async function submitPublicForm(fields: Record<string, unknown>, captchaToken: string) {
  const res = await fetch(`${PROXY_BASE}/api${SUBMIT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Token': captchaToken,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Submission failed');
  }
  return res.json();
}


function cleanFields(fields: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value) && 'key' in (value as any)) {
      cleaned[key] = (value as any).key;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'object' && item !== null && 'key' in item ? item.key : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export default function PublicFormPersonalverwaltung() {
  const [fields, setFields] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HTMLElement | null>(null);

  // Load the ALTCHA web component script once per page.
  useEffect(() => {
    if (document.querySelector(`script[src="${ALTCHA_SCRIPT_SRC}"]`)) return;
    const s = document.createElement('script');
    s.src = ALTCHA_SCRIPT_SRC;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const prefill: Record<string, any> = {};
    params.forEach((value, key) => { prefill[key] = value; });
    if (Object.keys(prefill).length) setFields(prev => ({ ...prefill, ...prev }));
  }, []);

  function readCaptchaToken(): string | null {
    const el = captchaRef.current as any;
    if (!el) return null;
    return el.value || el.getAttribute('value') || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readCaptchaToken();
    if (!token) {
      setError('Bitte warte auf die Spam-Prüfung und versuche es erneut.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(cleanFields(fields), token);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="text-muted-foreground">Deine Eingabe wurde erfolgreich übermittelt.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setFields({}); }}>
            Weitere Eingabe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Personalverwaltung — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="vorname">Vorname</Label>
            <Input
              id="vorname"
              value={fields.vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefonnummer</Label>
            <Input
              id="telefon"
              value={fields.telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={fields.email ?? ''}
              onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualifikation">Qualifikationen</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="qualifikation_atemschutz"
                  checked={lookupKeys(fields.qualifikation).includes('atemschutz')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.qualifikation);
                      const next = checked ? [...current, 'atemschutz'] : current.filter(k => k !== 'atemschutz');
                      return { ...f, qualifikation: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="qualifikation_atemschutz" className="font-normal">Atemschutzgeräteträger</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="qualifikation_maschinist"
                  checked={lookupKeys(fields.qualifikation).includes('maschinist')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.qualifikation);
                      const next = checked ? [...current, 'maschinist'] : current.filter(k => k !== 'maschinist');
                      return { ...f, qualifikation: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="qualifikation_maschinist" className="font-normal">Maschinist</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="qualifikation_gruppenfuehrer"
                  checked={lookupKeys(fields.qualifikation).includes('gruppenfuehrer')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.qualifikation);
                      const next = checked ? [...current, 'gruppenfuehrer'] : current.filter(k => k !== 'gruppenfuehrer');
                      return { ...f, qualifikation: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="qualifikation_gruppenfuehrer" className="font-normal">Gruppenführer</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="qualifikation_sanitaeter"
                  checked={lookupKeys(fields.qualifikation).includes('sanitaeter')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.qualifikation);
                      const next = checked ? [...current, 'sanitaeter'] : current.filter(k => k !== 'sanitaeter');
                      return { ...f, qualifikation: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="qualifikation_sanitaeter" className="font-normal">Sanitäter</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="qualifikation_funker"
                  checked={lookupKeys(fields.qualifikation).includes('funker')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.qualifikation);
                      const next = checked ? [...current, 'funker'] : current.filter(k => k !== 'funker');
                      return { ...f, qualifikation: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="qualifikation_funker" className="font-normal">Funker</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachname">Nachname</Label>
            <Input
              id="nachname"
              value={fields.nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, nachname: e.target.value }))}
            />
          </div>

          <altcha-widget
            ref={captchaRef as any}
            challengeurl={`${PROXY_BASE}/api/_challenge?path=${encodeURIComponent(SUBMIT_PATH)}`}
            auto="onsubmit"
            hidefooter
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by Klar
        </p>
      </div>
    </div>
  );
}
