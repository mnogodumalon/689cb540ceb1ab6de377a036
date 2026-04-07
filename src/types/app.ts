// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Personalverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    telefon?: string;
    email?: string;
    qualifikation?: LookupValue[];
    nachname?: string;
  };
}

export interface Bereitschaftsdienst {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    standort?: string;
    mitglieder?: string; // applookup -> URL zu 'Personalverwaltung' Record
    dienstbeginn?: string; // Format: YYYY-MM-DD oder ISO String
    dienstende?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Einsatzprotokoll {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    einsatzzeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    einsatzort?: string;
    bereitschaftsbezug?: string; // applookup -> URL zu 'Bereitschaftsdienst' Record
    beteiligte_mitglieder?: string; // applookup -> URL zu 'Personalverwaltung' Record
    beschreibung?: string;
    foto_2?: string;
    foto_3?: string;
    foto_1?: string;
  };
}

export const APP_IDS = {
  PERSONALVERWALTUNG: '689cb529a2bd8ef1df5d53da',
  BEREITSCHAFTSDIENST: '689cb52e3211bd59ce8f6461',
  EINSATZPROTOKOLL: '689cb52fac1e6b256fa808a2',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'personalverwaltung': {
    qualifikation: [{ key: "atemschutz", label: "Atemschutzgeräteträger" }, { key: "maschinist", label: "Maschinist" }, { key: "gruppenfuehrer", label: "Gruppenführer" }, { key: "sanitaeter", label: "Sanitäter" }, { key: "funker", label: "Funker" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'personalverwaltung': {
    'vorname': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'qualifikation': 'multiplelookup/checkbox',
    'nachname': 'string/text',
  },
  'bereitschaftsdienst': {
    'standort': 'string/text',
    'mitglieder': 'applookup/select',
    'dienstbeginn': 'date/datetimeminute',
    'dienstende': 'date/datetimeminute',
  },
  'einsatzprotokoll': {
    'einsatzzeitpunkt': 'date/datetimeminute',
    'einsatzort': 'string/text',
    'bereitschaftsbezug': 'applookup/select',
    'beteiligte_mitglieder': 'applookup/select',
    'beschreibung': 'string/textarea',
    'foto_2': 'file',
    'foto_3': 'file',
    'foto_1': 'file',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreatePersonalverwaltung = StripLookup<Personalverwaltung['fields']>;
export type CreateBereitschaftsdienst = StripLookup<Bereitschaftsdienst['fields']>;
export type CreateEinsatzprotokoll = StripLookup<Einsatzprotokoll['fields']>;