import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import { BookOpen, Users, GraduationCap, DoorOpen, ClipboardList, TrendingUp, Euro, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Stats {
  dozenten: number;
  teilnehmer: number;
  raeume: number;
  kurse: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
  aktiveKurse: number;
  upcomingKurse: Kurse[];
  umsatz: number;
}

const BAR_COLORS = [
  '#7c3aed', '#0891b2', '#059669', '#d97706', '#db2777',
];

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [dozenten, teilnehmer, raeume, kurse, anmeldungen] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);
        const today = startOfToday();
        const aktiveKurse = kurse.filter(k => {
          const start = k.fields.startdatum ? parseISO(k.fields.startdatum) : null;
          const end = k.fields.enddatum ? parseISO(k.fields.enddatum) : null;
          if (!start || !end) return false;
          return isBefore(start, today) && isAfter(end, today);
        });
        const upcoming = kurse
          .filter(k => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today))
          .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
          .slice(0, 5);
        const bezahlt = anmeldungen.filter(a => a.fields.bezahlt === true).length;
        const unbezahlt = anmeldungen.filter(a => a.fields.bezahlt !== true).length;
        const umsatz = kurse.reduce((sum, k) => sum + (k.fields.preis ?? 0), 0);

        setStats({
          dozenten: dozenten.length,
          teilnehmer: teilnehmer.length,
          raeume: raeume.length,
          kurse: kurse.length,
          anmeldungen: anmeldungen.length,
          bezahlt,
          unbezahlt,
          aktiveKurse: aktiveKurse.length,
          upcomingKurse: upcoming,
          umsatz,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpiData = stats ? [
    { label: 'Dozenten', value: stats.dozenten, Icon: GraduationCap, color: '#7c3aed', href: '/dozenten' },
    { label: 'Teilnehmer', value: stats.teilnehmer, Icon: Users, color: '#0891b2', href: '/teilnehmer' },
    { label: 'Räume', value: stats.raeume, Icon: DoorOpen, color: '#059669', href: '/raeume' },
    { label: 'Kurse', value: stats.kurse, Icon: BookOpen, color: '#d97706', href: '/kurse' },
    { label: 'Anmeldungen', value: stats.anmeldungen, Icon: ClipboardList, color: '#db2777', href: '/anmeldungen' },
  ] : [];

  const chartData = stats ? [
    { name: 'Dozenten', wert: stats.dozenten },
    { name: 'Teilnehmer', wert: stats.teilnehmer },
    { name: 'Räume', wert: stats.raeume },
    { name: 'Kurse', wert: stats.kurse },
    { name: 'Anmeldungen', wert: stats.anmeldungen },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-hero)' }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Kursverwaltung
            </p>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'white' }}>
              Willkommen zurück
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: '8px', fontSize: '0.95rem', maxWidth: '420px' }}>
              Verwalten Sie Kurse, Dozenten, Teilnehmer und Räume an einem Ort.
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <TrendingUp size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Aktive Kurse</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {loading ? '—' : (stats?.aktiveKurse ?? 0)}
                </p>
              </div>
            </div>
            <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Euro size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Gesamtpreiswert</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.2 }}>
                  {loading ? '—' : `${(stats?.umsatz ?? 0).toLocaleString('de-DE')} €`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border" style={{ background: 'var(--card)', height: '112px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
          : kpiData.map(kpi => (
            <button
              key={kpi.label}
              onClick={() => navigate(kpi.href)}
              className="group rounded-xl border text-left transition-all"
              style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', padding: '20px', cursor: 'pointer', borderColor: 'var(--border)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.Icon size={17} style={{ color: kpi.color }} />
                </div>
                <ArrowRight size={13} style={{ color: 'var(--muted-foreground)', marginTop: '4px', opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100" />
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 500, marginTop: '3px' }}>{kpi.label}</p>
            </button>
          ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', borderColor: 'var(--border)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>Systemübersicht</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '20px', marginTop: '2px' }}>Einträge je Kategorie</p>
          {loading ? (
            <div style={{ height: '200px', borderRadius: '8px', background: 'var(--muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
                  cursor={{ fill: 'rgba(124,58,237,0.06)' }}
                  formatter={(val: number) => [val, 'Einträge']}
                />
                <Bar dataKey="wert" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Status */}
        <div className="rounded-xl border p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', borderColor: 'var(--border)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>Zahlungsstatus</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '20px', marginTop: '2px' }}>Anmeldungen nach Bezahlung</p>
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} style={{ height: '80px', borderRadius: '10px', background: 'var(--muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderRadius: '12px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>Bezahlt</span>
                  </div>
                  <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#15803d' }}>{stats?.bezahlt ?? 0}</span>
                </div>
                {(stats?.anmeldungen ?? 0) > 0 && (
                  <div style={{ marginTop: '10px', height: '6px', borderRadius: '99px', background: '#bbf7d0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: '#16a34a', width: `${Math.round(((stats?.bezahlt ?? 0) / (stats?.anmeldungen ?? 1)) * 100)}%`, transition: 'width 0.6s ease' }} />
                  </div>
                )}
              </div>
              <div style={{ borderRadius: '12px', padding: '16px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: '#d97706' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>Ausstehend</span>
                  </div>
                  <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b45309' }}>{stats?.unbezahlt ?? 0}</span>
                </div>
                {(stats?.anmeldungen ?? 0) > 0 && (
                  <div style={{ marginTop: '10px', height: '6px', borderRadius: '99px', background: '#fde68a', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: '#d97706', width: `${Math.round(((stats?.unbezahlt ?? 0) / (stats?.anmeldungen ?? 1)) * 100)}%`, transition: 'width 0.6s ease' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Courses */}
      {!loading && (stats?.upcomingKurse.length ?? 0) > 0 && (
        <div className="rounded-xl border p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', borderColor: 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>Kommende Kurse</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Nächste geplante Kurse</p>
            </div>
            <button
              onClick={() => navigate('/kurse')}
              style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Alle anzeigen <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats!.upcomingKurse.map(kurs => (
              <div
                key={kurs.record_id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px', padding: '12px 16px', background: 'var(--muted)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(68,26,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>{kurs.fields.titel ?? '—'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      {kurs.fields.startdatum
                        ? format(parseISO(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de })
                        : 'Kein Datum'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {kurs.fields.preis != null && (
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)' }}>
                      {kurs.fields.preis.toLocaleString('de-DE')} €
                    </span>
                  )}
                  {kurs.fields.max_teilnehmer != null && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', background: 'var(--border)', padding: '2px 8px', borderRadius: '99px' }}>
                      max. {kurs.fields.max_teilnehmer}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
