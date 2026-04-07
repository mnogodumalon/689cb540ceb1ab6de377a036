import type { Einsatzprotokoll, Bereitschaftsdienst, Personalverwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface EinsatzprotokollViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Einsatzprotokoll | null;
  onEdit: (record: Einsatzprotokoll) => void;
  bereitschaftsdienstList: Bereitschaftsdienst[];
  personalverwaltungList: Personalverwaltung[];
}

export function EinsatzprotokollViewDialog({ open, onClose, record, onEdit, bereitschaftsdienstList, personalverwaltungList }: EinsatzprotokollViewDialogProps) {
  function getBereitschaftsdienstDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return bereitschaftsdienstList.find(r => r.record_id === id)?.fields.standort ?? '—';
  }

  function getPersonalverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return personalverwaltungList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Einsatzprotokoll anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einsatzzeitpunkt</Label>
            <p className="text-sm">{formatDate(record.fields.einsatzzeitpunkt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einsatzort</Label>
            <p className="text-sm">{record.fields.einsatzort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriger Bereitschaftsdienst</Label>
            <p className="text-sm">{getBereitschaftsdienstDisplayName(record.fields.bereitschaftsbezug)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beteiligte Mitglieder</Label>
            <p className="text-sm">{getPersonalverwaltungDisplayName(record.fields.beteiligte_mitglieder)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung des Einsatzes</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto 2</Label>
            {record.fields.foto_2 ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.foto_2} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto 3</Label>
            {record.fields.foto_3 ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.foto_3} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto 1</Label>
            {record.fields.foto_1 ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.foto_1} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}