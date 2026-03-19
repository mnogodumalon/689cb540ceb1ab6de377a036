import type { EnrichedBereitschaftsdienst, EnrichedEinsatzprotokoll } from '@/types/enriched';
import type { Bereitschaftsdienst, Einsatzprotokoll, Personalverwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface BereitschaftsdienstMaps {
  personalverwaltungMap: Map<string, Personalverwaltung>;
}

export function enrichBereitschaftsdienst(
  bereitschaftsdienst: Bereitschaftsdienst[],
  maps: BereitschaftsdienstMaps
): EnrichedBereitschaftsdienst[] {
  return bereitschaftsdienst.map(r => ({
    ...r,
    mitgliederName: resolveDisplay(r.fields.mitglieder, maps.personalverwaltungMap, 'vorname', 'nachname'),
  }));
}

interface EinsatzprotokollMaps {
  bereitschaftsdienstMap: Map<string, Bereitschaftsdienst>;
  personalverwaltungMap: Map<string, Personalverwaltung>;
}

export function enrichEinsatzprotokoll(
  einsatzprotokoll: Einsatzprotokoll[],
  maps: EinsatzprotokollMaps
): EnrichedEinsatzprotokoll[] {
  return einsatzprotokoll.map(r => ({
    ...r,
    bereitschaftsbezugName: resolveDisplay(r.fields.bereitschaftsbezug, maps.bereitschaftsdienstMap, 'standort'),
    beteiligte_mitgliederName: resolveDisplay(r.fields.beteiligte_mitglieder, maps.personalverwaltungMap, 'vorname', 'nachname'),
  }));
}
