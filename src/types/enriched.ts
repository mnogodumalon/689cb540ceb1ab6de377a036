import type { Bereitschaftsdienst, Einsatzprotokoll } from './app';

export type EnrichedBereitschaftsdienst = Bereitschaftsdienst & {
  mitgliederName: string;
};

export type EnrichedEinsatzprotokoll = Einsatzprotokoll & {
  bereitschaftsbezugName: string;
  beteiligte_mitgliederName: string;
};
