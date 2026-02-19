import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, Users, GraduationCap, DoorOpen, ClipboardList, TrendingUp, Euro, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  dozenten: number;
  teilnehmer: number;
  raeume: number;
  kurse: number;
  anmeldungen: number;
  aktiveKurse: number;
  bezahltRate: number;
  gesamtUmsatz: number;
  kurseByStatus: { name: string; count: number; key: string }[];
  naechsteKurse: Kurse[];
}

const STATUS_COLORS: Record<string, string> = {
  geplant: 'oklch(0.62 0.16 210)',
  aktiv: 'oklch(0.62 0.15 148)',
  abgeschlossen: 'oklch(0.52 0.02 258)',
  abgesagt: 'oklch(0.58 0.22 27)',
};

const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
};

function KpiCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: accent ? 'var(--gradient-primary)' : 'var(--gradient-card)',
        boxShadow: accent ? 'var(--shadow-primary)' : 'var(--shadow-card)',
        border: accent ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: accent ? 'oklch(0.85 0.06 264)' : 'var(--color-muted-foreground)' }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: accent ? 'oklch(1 0 0 / 0.15)' : 'oklch(0.46 0.18 264 / 0.08)' }}
        >
          <Icon size={15} style={{ color: accent ? 'oklch(0.95 0 0)' : 'oklch(0.46 0.18 264)' }} />
        </div>
      </div>
      <div>
        <p
          className="text-3xl font-bold tracking-tight"
          style={{ color: accent ? 'oklch(1 0 0)' : 'var(--color-foreground)' }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: accent ? 'oklch(0.8 0.05 264)' : 'var(--color-muted-foreground)' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [doz, teil, raeume, kurse, anmeldungen] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);

        const aktiveKurse = kurse.filter(k => k.fields.status === 'aktiv').length;
        const bezahlt = (anmeldungen as Anmeldungen[]).filter(a => a.fields.bezahlt).length;
        const bezahltRate = anmeldungen.length > 0 ? Math.round((bezahlt / anmeldungen.length) * 100) : 0;

        const kurseByStatus = ['geplant', 'aktiv', 'abgeschlossen', 'abgesagt'].map(s => ({
          key: s,
          name: STATUS_LABELS[s],
          count: kurse.filter(k => k.fields.status === s).length,
        })).filter(s => s.count > 0);

        const today = new Date().toISOString().split('T')[0];
        const naechsteKurse = (kurse as Kurse[])
          .filter(k => k.fields.startdatum && k.fields.startdatum >= today)
          .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
          .slice(0, 5);

        const gesamtUmsatz = (anmeldungen as Anmeldungen[]).reduce((sum, a) => {
          if (!a.fields.bezahlt) return sum;
          const kursId = a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1];
          const kurs = kurse.find(k => k.record_id === kursId);
          return sum + (kurs?.fields.preis ?? 0);
        }, 0);

        setStats({ dozenten: doz.length, teilnehmer: teil.length, raeume: raeume.length, kurse: kurse.length, anmeldungen: anmeldungen.length, aktiveKurse, bezahltRate, gesamtUmsatz, kurseByStatus, naechsteKurse });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'oklch(0.46 0.18 264)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Daten werden geladen…</p>
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="rounded-3xl p-8 lg:p-10 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 75% 40%, oklch(0.62 0.20 264), transparent 60%)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'oklch(0.65 0.12 264)' }}>Kursverwaltung</p>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: 'oklch(0.97 0 0)' }}>Willkommen zurück</h1>
            <p className="mt-2 text-base" style={{ color: 'oklch(0.72 0.04 264)' }}>
              {s.kurse} Kurse · {s.anmeldungen} Anmeldungen · {s.teilnehmer} Teilnehmer
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl px-5 py-4 text-center" style={{ background: 'oklch(1 0 0 / 0.08)', border: '1px solid oklch(1 0 0 / 0.12)' }}>
              <p className="text-2xl font-bold" style={{ color: 'oklch(0.97 0 0)' }}>{s.aktiveKurse}</p>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.72 0.04 264)' }}>Aktive Kurse</p>
            </div>
            <div className="rounded-2xl px-5 py-4 text-center" style={{ background: 'oklch(1 0 0 / 0.08)', border: '1px solid oklch(1 0 0 / 0.12)' }}>
              <p className="text-2xl font-bold" style={{ color: 'oklch(0.97 0 0)' }}>{s.bezahltRate}%</p>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.72 0.04 264)' }}>Bezahlrate</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={BookOpen} label="Kurse" value={s.kurse} sub="Gesamt" accent />
        <KpiCard icon={Users} label="Teilnehmer" value={s.teilnehmer} sub="Registriert" />
        <KpiCard icon={GraduationCap} label="Dozenten" value={s.dozenten} sub="Aktiv" />
        <KpiCard icon={DoorOpen} label="Räume" value={s.raeume} sub="Verfügbar" />
        <KpiCard icon={ClipboardList} label="Anmeldungen" value={s.anmeldungen} sub="Gesamt" />
      </div>

      {/* CHARTS + CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-6" style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-foreground)' }}>Kurse nach Status</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--color-muted-foreground)' }}>Verteilung aller Kurse</p>
          {s.kurseByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-40 rounded-xl" style={{ background: 'var(--color-muted)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Noch keine Kurse</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={s.kurseByStatus} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 258)' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'oklch(0.22 0.04 264)', border: 'none', borderRadius: '12px', color: 'oklch(0.97 0 0)', fontSize: 12 }} cursor={{ fill: 'oklch(0.46 0.18 264 / 0.06)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {s.kurseByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.key] ?? 'oklch(0.46 0.18 264)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Bevorstehende Kurse</h2>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Nächste Termine</p>
            </div>
            <TrendingUp size={16} style={{ color: 'oklch(0.46 0.18 264)' }} />
          </div>
          {s.naechsteKurse.length === 0 ? (
            <div className="flex items-center justify-center h-40 rounded-xl" style={{ background: 'var(--color-muted)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Keine bevorstehenden Kurse</p>
            </div>
          ) : (
            <div className="space-y-3">
              {s.naechsteKurse.map((kurs, i) => (
                <div key={kurs.record_id} className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ background: i === 0 ? 'oklch(0.46 0.18 264 / 0.06)' : 'var(--color-muted)', border: i === 0 ? '1px solid oklch(0.46 0.18 264 / 0.15)' : '1px solid transparent' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: i === 0 ? 'oklch(0.46 0.18 264)' : 'oklch(0.46 0.18 264 / 0.12)', color: i === 0 ? 'oklch(0.99 0 0)' : 'oklch(0.46 0.18 264)' }}>
                    {kurs.fields.startdatum ? format(parseISO(kurs.fields.startdatum), 'dd', { locale: de }) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{kurs.fields.titel ?? '–'}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {kurs.fields.startdatum ? format(parseISO(kurs.fields.startdatum), 'dd. MMMM yyyy', { locale: de }) : '–'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {kurs.fields.preis != null && <p className="text-sm font-semibold" style={{ color: 'oklch(0.46 0.18 264)' }}>{kurs.fields.preis.toFixed(0)} €</p>}
                    {kurs.fields.max_teilnehmer != null && <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>max. {kurs.fields.max_teilnehmer} TN</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 flex items-center gap-6" style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.62 0.15 148 / 0.12)' }}>
            <Euro size={22} style={{ color: 'oklch(0.52 0.15 148)' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted-foreground)' }}>Bezahlter Umsatz</p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-foreground)' }}>
              {s.gesamtUmsatz.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Aus bezahlten Anmeldungen</p>
          </div>
        </div>
        <div className="rounded-2xl p-6 flex items-center gap-6" style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.46 0.18 264 / 0.08)' }}>
            <CheckCircle size={22} style={{ color: 'oklch(0.46 0.18 264)' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted-foreground)' }}>Zahlungsstatus</p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-foreground)' }}>{s.bezahltRate}%</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-muted)' }}>
              <div className="h-full rounded-full" style={{ width: `${s.bezahltRate}%`, background: 'oklch(0.46 0.18 264)' }} />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Bezahlte Anmeldungen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
