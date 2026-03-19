import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichBereitschaftsdienst, enrichEinsatzprotokoll } from '@/lib/enrich';
import type { EnrichedBereitschaftsdienst, EnrichedEinsatzprotokoll } from '@/types/enriched';
import type { Bereitschaftsdienst, Einsatzprotokoll } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Pencil, Trash2, Users, Clock, MapPin, FileText, Siren, ShieldCheck, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BereitschaftsdienstDialog } from '@/components/dialogs/BereitschaftsdienstDialog';
import { EinsatzprotokollDialog } from '@/components/dialogs/EinsatzprotokollDialog';

export default function DashboardOverview() {
  const {
    personalverwaltung, bereitschaftsdienst, einsatzprotokoll,
    personalverwaltungMap, bereitschaftsdienstMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // All hooks BEFORE any early returns
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editShift, setEditShift] = useState<EnrichedBereitschaftsdienst | null>(null);
  const [deleteShiftTarget, setDeleteShiftTarget] = useState<EnrichedBereitschaftsdienst | null>(null);

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [editIncident, setEditIncident] = useState<EnrichedEinsatzprotokoll | null>(null);
  const [deleteIncidentTarget, setDeleteIncidentTarget] = useState<EnrichedEinsatzprotokoll | null>(null);
  const [prefilledShiftId, setPrefilledShiftId] = useState<string | undefined>(undefined);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shifts' | 'incidents'>('shifts');

  const enrichedBereitschaftsdienst = enrichBereitschaftsdienst(bereitschaftsdienst, { personalverwaltungMap });
  const enrichedEinsatzprotokoll = enrichEinsatzprotokoll(einsatzprotokoll, { bereitschaftsdienstMap, personalverwaltungMap });

  const now = new Date();

  const sortedShifts = useMemo(() => {
    return [...enrichedBereitschaftsdienst].sort((a, b) => {
      const da = a.fields.dienstbeginn ?? '';
      const db = b.fields.dienstbeginn ?? '';
      return db.localeCompare(da);
    });
  }, [enrichedBereitschaftsdienst]);

  const upcomingShifts = useMemo(() => {
    return sortedShifts.filter(s => {
      const end = s.fields.dienstende;
      if (!end) return true;
      return new Date(end) >= now;
    });
  }, [sortedShifts, now]);

  const pastShifts = useMemo(() => {
    return sortedShifts.filter(s => {
      const end = s.fields.dienstende;
      if (!end) return false;
      return new Date(end) < now;
    });
  }, [sortedShifts, now]);

  const activeShifts = useMemo(() => {
    return enrichedBereitschaftsdienst.filter(s => {
      const start = s.fields.dienstbeginn;
      const end = s.fields.dienstende;
      if (!start || !end) return false;
      return new Date(start) <= now && new Date(end) >= now;
    });
  }, [enrichedBereitschaftsdienst, now]);

  const selectedShift = useMemo(() => {
    if (!selectedShiftId) return null;
    return enrichedBereitschaftsdienst.find(s => s.record_id === selectedShiftId) ?? null;
  }, [selectedShiftId, enrichedBereitschaftsdienst]);

  const incidentsForShift = useMemo(() => {
    if (!selectedShiftId) return enrichedEinsatzprotokoll;
    return enrichedEinsatzprotokoll.filter(i => {
      const id = extractRecordId(i.fields.bereitschaftsbezug);
      return id === selectedShiftId;
    });
  }, [selectedShiftId, enrichedEinsatzprotokoll]);

  const recentIncidents = useMemo(() => {
    return [...enrichedEinsatzprotokoll].sort((a, b) => {
      const da = a.fields.einsatzzeitpunkt ?? '';
      const db = b.fields.einsatzzeitpunkt ?? '';
      return db.localeCompare(da);
    }).slice(0, 10);
  }, [enrichedEinsatzprotokoll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreateShift = async (fields: Bereitschaftsdienst['fields']) => {
    await LivingAppsService.createBereitschaftsdienstEntry(fields);
    fetchAll();
  };

  const handleUpdateShift = async (fields: Bereitschaftsdienst['fields']) => {
    if (!editShift) return;
    await LivingAppsService.updateBereitschaftsdienstEntry(editShift.record_id, fields);
    fetchAll();
  };

  const handleDeleteShift = async () => {
    if (!deleteShiftTarget) return;
    await LivingAppsService.deleteBereitschaftsdienstEntry(deleteShiftTarget.record_id);
    if (selectedShiftId === deleteShiftTarget.record_id) setSelectedShiftId(null);
    setDeleteShiftTarget(null);
    fetchAll();
  };

  const handleCreateIncident = async (fields: Einsatzprotokoll['fields']) => {
    await LivingAppsService.createEinsatzprotokollEntry(fields);
    fetchAll();
  };

  const handleUpdateIncident = async (fields: Einsatzprotokoll['fields']) => {
    if (!editIncident) return;
    await LivingAppsService.updateEinsatzprotokollEntry(editIncident.record_id, fields);
    fetchAll();
  };

  const handleDeleteIncident = async () => {
    if (!deleteIncidentTarget) return;
    await LivingAppsService.deleteEinsatzprotokollEntry(deleteIncidentTarget.record_id);
    setDeleteIncidentTarget(null);
    fetchAll();
  };

  const getShiftStatus = (shift: EnrichedBereitschaftsdienst) => {
    const start = shift.fields.dienstbeginn;
    const end = shift.fields.dienstende;
    if (!start) return 'planned';
    if (new Date(start) > now) return 'upcoming';
    if (!end || new Date(end) >= now) return 'active';
    return 'past';
  };

  const shiftStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/15 text-green-700 border-green-200 text-xs">Aktiv</Badge>;
      case 'upcoming': return <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-xs">Geplant</Badge>;
      case 'past': return <Badge className="bg-muted text-muted-foreground text-xs">Abgeschlossen</Badge>;
      default: return <Badge variant="outline" className="text-xs">Unbekannt</Badge>;
    }
  };

  const shiftsToShow = activeTab === 'shifts' ? (selectedShiftId ? [selectedShift!].filter(Boolean) : sortedShifts) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bereitschaftsübersicht</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Feuerwehr Bereitschaftsmanagement — {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditIncident(null); setPrefilledShiftId(undefined); setIncidentDialogOpen(true); }}
            className="gap-1.5"
          >
            <Siren size={15} className="shrink-0" />
            <span className="hidden sm:inline">Einsatz melden</span>
            <span className="sm:hidden">Einsatz</span>
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditShift(null); setShiftDialogOpen(true); }}
            className="gap-1.5"
          >
            <Plus size={15} className="shrink-0" />
            <span className="hidden sm:inline">Neuer Dienst</span>
            <span className="sm:hidden">Dienst</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Personal"
          value={String(personalverwaltung.length)}
          description="Einsatzkräfte"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktive Dienste"
          value={String(activeShifts.length)}
          description="Jetzt im Einsatz"
          icon={<ShieldCheck size={18} className="text-green-600" />}
        />
        <StatCard
          title="Geplante Dienste"
          value={String(upcomingShifts.length)}
          description="Bevorstehend"
          icon={<CalendarDays size={18} className="text-blue-600" />}
        />
        <StatCard
          title="Einsatzprotokolle"
          value={String(einsatzprotokoll.length)}
          description="Gesamt"
          icon={<FileText size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main workspace: Shift timeline + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Shift list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">Bereitschaftsdienste</h2>
            {selectedShiftId && (
              <button
                className="text-xs text-primary underline underline-offset-2"
                onClick={() => setSelectedShiftId(null)}
              >
                Alle anzeigen
              </button>
            )}
          </div>

          {/* Active shifts highlight */}
          {activeShifts.length > 0 && !selectedShiftId && (
            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-3 space-y-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Jetzt aktiv</p>
              {activeShifts.map(shift => (
                <ShiftCard
                  key={shift.record_id}
                  shift={shift}
                  isSelected={false}
                  incidentCount={enrichedEinsatzprotokoll.filter(i => extractRecordId(i.fields.bereitschaftsbezug) === shift.record_id).length}
                  onSelect={() => setSelectedShiftId(shift.record_id)}
                  onEdit={() => { setEditShift(shift); setShiftDialogOpen(true); }}
                  onDelete={() => setDeleteShiftTarget(shift)}
                  onAddIncident={() => {
                    setEditIncident(null);
                    setPrefilledShiftId(shift.record_id);
                    setIncidentDialogOpen(true);
                  }}
                  highlight
                />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcomingShifts.filter(s => getShiftStatus(s) === 'upcoming').length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Geplant</p>
              {upcomingShifts.filter(s => getShiftStatus(s) === 'upcoming').map(shift => (
                <ShiftCard
                  key={shift.record_id}
                  shift={shift}
                  isSelected={selectedShiftId === shift.record_id}
                  incidentCount={enrichedEinsatzprotokoll.filter(i => extractRecordId(i.fields.bereitschaftsbezug) === shift.record_id).length}
                  onSelect={() => setSelectedShiftId(prev => prev === shift.record_id ? null : shift.record_id)}
                  onEdit={() => { setEditShift(shift); setShiftDialogOpen(true); }}
                  onDelete={() => setDeleteShiftTarget(shift)}
                  onAddIncident={() => {
                    setEditIncident(null);
                    setPrefilledShiftId(shift.record_id);
                    setIncidentDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Past */}
          {pastShifts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Abgeschlossen</p>
              {pastShifts.slice(0, 5).map(shift => (
                <ShiftCard
                  key={shift.record_id}
                  shift={shift}
                  isSelected={selectedShiftId === shift.record_id}
                  incidentCount={enrichedEinsatzprotokoll.filter(i => extractRecordId(i.fields.bereitschaftsbezug) === shift.record_id).length}
                  onSelect={() => setSelectedShiftId(prev => prev === shift.record_id ? null : shift.record_id)}
                  onEdit={() => { setEditShift(shift); setShiftDialogOpen(true); }}
                  onDelete={() => setDeleteShiftTarget(shift)}
                  onAddIncident={() => {
                    setEditIncident(null);
                    setPrefilledShiftId(shift.record_id);
                    setIncidentDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {sortedShifts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border">
              <CalendarDays size={36} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Keine Dienste vorhanden</p>
              <p className="text-xs text-muted-foreground mt-1">Erstellen Sie den ersten Bereitschaftsdienst.</p>
              <Button size="sm" className="mt-4" onClick={() => { setEditShift(null); setShiftDialogOpen(true); }}>
                <Plus size={14} className="mr-1.5" /> Dienst anlegen
              </Button>
            </div>
          )}
        </div>

        {/* Right: Incidents panel */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">
              {selectedShift
                ? <>Einsätze — <span className="text-muted-foreground font-normal">{selectedShift.fields.standort ?? 'Dienst'}</span></>
                : 'Aktuelle Einsatzprotokolle'
              }
            </h2>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-7 px-2 text-xs"
              onClick={() => {
                setEditIncident(null);
                setPrefilledShiftId(selectedShiftId ?? undefined);
                setIncidentDialogOpen(true);
              }}
            >
              <Plus size={13} className="shrink-0" />
              Einsatz
            </Button>
          </div>

          <div className="space-y-2 overflow-x-auto">
            {(selectedShiftId ? incidentsForShift : recentIncidents).map(incident => (
              <IncidentCard
                key={incident.record_id}
                incident={incident}
                onEdit={() => { setEditIncident(incident); setIncidentDialogOpen(true); }}
                onDelete={() => setDeleteIncidentTarget(incident)}
              />
            ))}

            {(selectedShiftId ? incidentsForShift : recentIncidents).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border">
                <Siren size={36} className="text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">
                  {selectedShiftId ? 'Keine Einsätze für diesen Dienst' : 'Keine Einsatzprotokolle'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Einsätze werden hier gelistet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEditIncident(null);
                    setPrefilledShiftId(selectedShiftId ?? undefined);
                    setIncidentDialogOpen(true);
                  }}
                >
                  <Plus size={14} className="mr-1.5" /> Einsatz melden
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BereitschaftsdienstDialog
        open={shiftDialogOpen}
        onClose={() => { setShiftDialogOpen(false); setEditShift(null); }}
        onSubmit={editShift ? handleUpdateShift : handleCreateShift}
        defaultValues={editShift?.fields}
        personalverwaltungList={personalverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Bereitschaftsdienst']}
      />

      <EinsatzprotokollDialog
        open={incidentDialogOpen}
        onClose={() => { setIncidentDialogOpen(false); setEditIncident(null); setPrefilledShiftId(undefined); }}
        onSubmit={editIncident ? handleUpdateIncident : handleCreateIncident}
        defaultValues={
          editIncident
            ? editIncident.fields
            : prefilledShiftId
              ? { bereitschaftsbezug: createRecordUrl(APP_IDS.BEREITSCHAFTSDIENST, prefilledShiftId) }
              : undefined
        }
        bereitschaftsdienstList={bereitschaftsdienst}
        personalverwaltungList={personalverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Einsatzprotokoll']}
      />

      <ConfirmDialog
        open={!!deleteShiftTarget}
        title="Bereitschaftsdienst löschen"
        description={`Dienst "${deleteShiftTarget?.fields.standort ?? ''}" wirklich löschen? Alle zugehörigen Einsätze bleiben erhalten.`}
        onConfirm={handleDeleteShift}
        onClose={() => setDeleteShiftTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteIncidentTarget}
        title="Einsatzprotokoll löschen"
        description={`Einsatz "${deleteIncidentTarget?.fields.einsatzort ?? ''}" wirklich löschen?`}
        onConfirm={handleDeleteIncident}
        onClose={() => setDeleteIncidentTarget(null)}
      />
    </div>
  );
}

// --- Sub-components ---

interface ShiftCardProps {
  shift: EnrichedBereitschaftsdienst;
  isSelected: boolean;
  incidentCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddIncident: () => void;
  highlight?: boolean;
}

function ShiftCard({ shift, isSelected, incidentCount, onSelect, onEdit, onDelete, onAddIncident, highlight }: ShiftCardProps) {
  const now = new Date();
  const start = shift.fields.dienstbeginn;
  const end = shift.fields.dienstende;
  const isActive = start && end && new Date(start) <= now && new Date(end) >= now;
  const isPast = end && new Date(end) < now;

  return (
    <div
      className={`
        rounded-2xl border p-3 cursor-pointer transition-all group
        ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : highlight ? 'border-green-200 bg-white' : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground truncate">
              {shift.fields.standort ?? 'Standort unbekannt'}
            </p>
            {isActive && <Badge className="bg-green-500/15 text-green-700 border-green-200 text-xs shrink-0">Aktiv</Badge>}
            {!isActive && !isPast && start && <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-xs shrink-0">Geplant</Badge>}
            {isPast && <Badge className="bg-muted text-muted-foreground text-xs shrink-0">Abgeschlossen</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            {start && (
              <span className="flex items-center gap-1">
                <Clock size={11} className="shrink-0" />
                {formatDate(start)}
                {end && <> – {formatDate(end)}</>}
              </span>
            )}
            {shift.mitgliederName && (
              <span className="flex items-center gap-1">
                <Users size={11} className="shrink-0" />
                <span className="truncate max-w-[120px]">{shift.mitgliederName}</span>
              </span>
            )}
            {incidentCount > 0 && (
              <span className="flex items-center gap-1 text-orange-600">
                <Siren size={11} className="shrink-0" />
                {incidentCount} Einsatz{incidentCount !== 1 ? 'e' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            title="Einsatz melden"
            className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-500 transition-colors"
            onClick={onAddIncident}
          >
            <Siren size={13} />
          </button>
          <button
            title="Bearbeiten"
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={onEdit}
          >
            <Pencil size={13} />
          </button>
          <button
            title="Löschen"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface IncidentCardProps {
  incident: EnrichedEinsatzprotokoll;
  onEdit: () => void;
  onDelete: () => void;
}

function IncidentCard({ incident, onEdit, onDelete }: IncidentCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 hover:bg-accent/20 transition-all group">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Siren size={14} className="text-orange-600" />
            </div>
            <p className="font-semibold text-sm text-foreground truncate min-w-0">
              {incident.fields.einsatzort ?? 'Einsatzort unbekannt'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground ml-9">
            {incident.fields.einsatzzeitpunkt && (
              <span className="flex items-center gap-1">
                <Clock size={11} className="shrink-0" />
                {formatDate(incident.fields.einsatzzeitpunkt)}
              </span>
            )}
            {incident.bereitschaftsbezugName && (
              <span className="flex items-center gap-1 truncate max-w-[150px]">
                <MapPin size={11} className="shrink-0" />
                {incident.bereitschaftsbezugName}
              </span>
            )}
            {incident.beteiligte_mitgliederName && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <Users size={11} className="shrink-0" />
                {incident.beteiligte_mitgliederName}
              </span>
            )}
          </div>
          {incident.fields.beschreibung && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-9 line-clamp-2">{incident.fields.beschreibung}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            title="Bearbeiten"
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={onEdit}
          >
            <Pencil size={13} />
          </button>
          <button
            title="Löschen"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
