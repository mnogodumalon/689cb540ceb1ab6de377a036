import type { Bereitschaftsdienst, Personalverwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface BereitschaftsdienstViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bereitschaftsdienst | null;
  onEdit: (record: Bereitschaftsdienst) => void;
  personalverwaltungList: Personalverwaltung[];
}

export function BereitschaftsdienstViewDialog({ open, onClose, record, onEdit, personalverwaltungList }: BereitschaftsdienstViewDialogProps) {
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
          <DialogTitle>Bereitschaftsdienst anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Standort</Label>
            <p className="text-sm">{record.fields.standort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Teilnehmende Mitglieder</Label>
            <p className="text-sm">{getPersonalverwaltungDisplayName(record.fields.mitglieder)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dienstbeginn (Datum & Uhrzeit)</Label>
            <p className="text-sm">{formatDate(record.fields.dienstbeginn)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dienstende (Datum & Uhrzeit)</Label>
            <p className="text-sm">{formatDate(record.fields.dienstende)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}