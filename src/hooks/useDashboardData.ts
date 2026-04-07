import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Personalverwaltung, Bereitschaftsdienst, Einsatzprotokoll } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [personalverwaltung, setPersonalverwaltung] = useState<Personalverwaltung[]>([]);
  const [bereitschaftsdienst, setBereitschaftsdienst] = useState<Bereitschaftsdienst[]>([]);
  const [einsatzprotokoll, setEinsatzprotokoll] = useState<Einsatzprotokoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [personalverwaltungData, bereitschaftsdienstData, einsatzprotokollData] = await Promise.all([
        LivingAppsService.getPersonalverwaltung(),
        LivingAppsService.getBereitschaftsdienst(),
        LivingAppsService.getEinsatzprotokoll(),
      ]);
      setPersonalverwaltung(personalverwaltungData);
      setBereitschaftsdienst(bereitschaftsdienstData);
      setEinsatzprotokoll(einsatzprotokollData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [personalverwaltungData, bereitschaftsdienstData, einsatzprotokollData] = await Promise.all([
          LivingAppsService.getPersonalverwaltung(),
          LivingAppsService.getBereitschaftsdienst(),
          LivingAppsService.getEinsatzprotokoll(),
        ]);
        setPersonalverwaltung(personalverwaltungData);
        setBereitschaftsdienst(bereitschaftsdienstData);
        setEinsatzprotokoll(einsatzprotokollData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const personalverwaltungMap = useMemo(() => {
    const m = new Map<string, Personalverwaltung>();
    personalverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [personalverwaltung]);

  const bereitschaftsdienstMap = useMemo(() => {
    const m = new Map<string, Bereitschaftsdienst>();
    bereitschaftsdienst.forEach(r => m.set(r.record_id, r));
    return m;
  }, [bereitschaftsdienst]);

  return { personalverwaltung, setPersonalverwaltung, bereitschaftsdienst, setBereitschaftsdienst, einsatzprotokoll, setEinsatzprotokoll, loading, error, fetchAll, personalverwaltungMap, bereitschaftsdienstMap };
}