import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LuxuryDashboardLayout from '../../../../components/LuxuryDashboardLayout';
import adminService from '../../../../services/api/admin.service';
import { AdminUser, PaginatedResponse } from '../../../../services/api/types';
import { getFileUrl } from '../../../../environment';

// ─── helpers ─────────────────────────────────────────────────────────────────

const avatarSrc = (url?: string) =>
  getFileUrl(url) ?? 'assets/img/user/user-02.jpg';

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div style={{
    background: 'var(--lx-card, #fff)',
    border: '1px solid var(--lx-card-border)',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
  }}>
    <div style={{ padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'var(--lx-primary-mist)' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--lx-border)', animation: 'pulse 1.4s ease infinite' }} />
      <div style={{ width: 120, height: 14, borderRadius: 6, background: 'var(--lx-border)', animation: 'pulse 1.4s ease infinite' }} />
      <div style={{ width: 160, height: 11, borderRadius: 6, background: 'var(--lx-border)', animation: 'pulse 1.4s ease infinite' }} />
    </div>
    <div style={{ padding: '16px 20px' }}>
      <div style={{ width: '90%', height: 11, borderRadius: 6, background: 'var(--lx-border)', marginBottom: 8, animation: 'pulse 1.4s ease infinite' }} />
      <div style={{ width: '60%', height: 11, borderRadius: 6, background: 'var(--lx-border)', marginBottom: 20, animation: 'pulse 1.4s ease infinite' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: 48, borderRadius: 8, background: 'var(--lx-border)', animation: 'pulse 1.4s ease infinite' }} />
        ))}
      </div>
      <div style={{ width: '100%', height: 36, borderRadius: 8, background: 'var(--lx-border)', animation: 'pulse 1.4s ease infinite' }} />
    </div>
  </div>
);

// ─── InstructorCard ───────────────────────────────────────────────────────────

interface CardProps {
  instructor: AdminUser;
  t: (key: string) => string;
  lang: string;
  onBanToggle: (id: string, banned: boolean) => void;
}

const InstructorCard: React.FC<CardProps> = ({ instructor, t, lang, onBanToggle }) => {
  const [hovered,   setHovered]   = useState(false);
  const [actioning, setActioning] = useState(false);
  const isBanned = (instructor as any).isBanned ?? false;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' });

  const handleBanToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setActioning(true);
    try {
      if (isBanned) await adminService.unbanUser(instructor.id);
      else          await adminService.banUser(instructor.id, 'Banned by admin');
      onBanToggle(instructor.id, !isBanned);
    } catch { /* silent */ } finally {
      setActioning(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--lx-card, #fff)',
        border: `1px solid ${hovered ? 'var(--lx-card-border-hover)' : 'var(--lx-card-border)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all .25s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? 'var(--lx-card-shadow-hover)' : 'var(--lx-card-shadow)',
        position: 'relative',
      }}
    >
      {/* Gold top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--lx-gold), transparent)',
        opacity: hovered ? 1 : 0, transition: 'opacity .3s',
      }} />

      {/* Avatar area */}
      <div style={{
        background: 'linear-gradient(135deg, var(--lx-primary-mist) 0%, var(--lx-gold-pale) 100%)',
        padding: '28px 20px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--lx-card-border)',
      }}>
        {instructor.avatarUrl ? (
          <img
            src={avatarSrc(instructor.avatarUrl)}
            alt={instructor.fullName}
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--lx-gold)' }}
            onError={(e) => { (e.target as HTMLImageElement).src = 'assets/img/user/user-02.jpg'; }}
          />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-light) 100%)',
            border: '2px solid var(--lx-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            {initials(instructor.fullName)}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--lx-text)', fontFamily: "'Playfair Display', serif" }}>
            {instructor.fullName}
          </p>
          <span style={{
            display: 'block', fontSize: 11, color: 'var(--lx-text-muted)',
            background: 'var(--lx-primary-mist)', borderRadius: 6, padding: '2px 8px',
            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            margin: '5px auto 0',
          }} title={instructor.email}>
            {instructor.email}
          </span>
          <div style={{ marginTop: 8 }}>
            {isBanned ? (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                background: 'rgba(220,53,69,.1)', color: '#C0392B',
                border: '1px solid rgba(220,53,69,.2)', display: 'inline-block',
              }}>{t('instructorPages.list.banned')}</span>
            ) : (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                background: 'var(--lx-green-pale)', color: 'var(--lx-green)',
                border: '1px solid rgba(45,122,79,.2)', display: 'inline-block',
              }}>{t('instructorPages.list.active')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 20px 20px' }}>

        {/* Bio */}
        <p style={{
          fontSize: 13, color: 'var(--lx-text-muted)', lineHeight: 1.5, marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38,
          fontStyle: instructor.bio ? 'normal' : 'italic',
        }}>
          {instructor.bio || t('instructorPages.list.notProvided')}
        </p>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { val: (instructor as any).totalCourses ?? 0,                        lbl: t('instructorPages.list.courses') },
            { val: (instructor as any).totalStudents ?? (instructor as any).enrollmentsCount ?? 0, lbl: t('instructorPages.list.students') },
            { val: ((instructor as any).averageRating ?? 0).toFixed(1),           lbl: t('instructorPages.list.rating') },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{
              flex: 1, background: 'var(--lx-primary-mist)',
              border: '1px solid var(--lx-border)',
              borderRadius: 8, padding: '8px 4px', textAlign: 'center',
            }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--lx-primary)', fontFamily: "'Playfair Display', serif" }}>{val}</span>
              <span style={{ display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--lx-text-muted)' }}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* Joined */}
        <div style={{ fontSize: 11, color: 'var(--lx-text-soft)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="isax isax-calendar-1" style={{ fontSize: 12, color: 'var(--lx-gold)' }} />
          {t('instructorPages.list.joined')}: {formatDate(instructor.createdAt)}
        </div>

        {/* View Profile */}
        <Link
          to={`/instructor-details/${instructor.id}`}
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            background: 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-dark) 100%)',
            color: '#fff', fontWeight: 600, fontSize: 13,
            padding: '9px 0', borderRadius: 8, textDecoration: 'none',
            border: '1px solid transparent',
            transition: 'opacity .2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {t('instructorPages.list.viewProfile')}
        </Link>

        {/* Ban / Unban */}
        <button
          onClick={handleBanToggle}
          disabled={actioning}
          style={{
            display: 'block', width: '100%', marginTop: 8,
            background: 'transparent',
            border: isBanned ? '1px solid rgba(45,122,79,.4)' : '1px solid rgba(220,53,69,.3)',
            borderRadius: 8,
            color: isBanned ? 'var(--lx-green)' : '#C0392B',
            fontWeight: 600, fontSize: 12, padding: '7px 0', cursor: actioning ? 'wait' : 'pointer',
            transition: 'background .2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = isBanned ? 'var(--lx-green-pale)' : 'rgba(220,53,69,.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {actioning ? '…' : isBanned ? t('instructorPages.list.unbanUser') : t('instructorPages.list.banUser')}
        </button>
      </div>
    </div>
  );
};

// ─── InstructorList ───────────────────────────────────────────────────────────

const InstructorList: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [instructors,    setInstructors]    = useState<AdminUser[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(0);
  const [totalPages,     setTotalPages]     = useState(0);
  const [totalElements,  setTotalElements]  = useState(0);
  const [searchInput,    setSearchInput]    = useState('');
  const [search,         setSearch]         = useState('');
  const [sortBy,         setSortBy]         = useState<'newest' | 'oldest' | 'name'>('newest');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 12;

  const fetchInstructors = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res: PaginatedResponse<AdminUser> = await adminService.getInstructors(p, PAGE_SIZE, q || undefined);
      let content = res.content ?? [];
      if (sortBy === 'oldest') content = [...content].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      else if (sortBy === 'name') content = [...content].sort((a, b) => a.fullName.localeCompare(b.fullName));
      setInstructors(content);
      setTotalPages(res.totalPages ?? 0);
      setTotalElements(res.totalElements ?? content.length);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => { fetchInstructors(page, search); }, [page, search, fetchInstructors]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setPage(0); setSearch(val); }, 400);
  };

  const handleBanToggle = (id: string, newState: boolean) =>
    setInstructors((prev) => prev.map((ins) => ins.id === id ? { ...ins, isBanned: newState } : ins));

  // Pagination renderer
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) { for (let i = 0; i < totalPages; i++) pages.push(i); }
    else {
      pages.push(0);
      if (page > 2) pages.push('…');
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages - 1);
    }
    const btnBase: React.CSSProperties = {
      width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid var(--lx-border-gold)', background: 'transparent', color: 'var(--lx-primary)',
      cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .2s',
    };
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 36 }}>
        <button style={{ ...btnBase, opacity: page === 0 ? .35 : 1 }} disabled={page === 0} onClick={() => page > 0 && setPage(page - 1)}>
          <i className="isax isax-arrow-left-2" style={{ fontSize: 13 }} />
        </button>
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`e${idx}`} style={{ padding: '0 4px', color: 'var(--lx-text-muted)', lineHeight: '34px' }}>…</span>
          ) : (
            <button key={p} style={{
              ...btnBase,
              background: p === page ? 'linear-gradient(135deg, var(--lx-primary) 0%, var(--lx-primary-dark) 100%)' : 'transparent',
              color: p === page ? '#fff' : 'var(--lx-primary)',
              borderColor: p === page ? 'var(--lx-primary)' : 'var(--lx-border-gold)',
            }} onClick={() => setPage(p as number)}>
              {(p as number) + 1}
            </button>
          )
        )}
        <button style={{ ...btnBase, opacity: page >= totalPages - 1 ? .35 : 1 }} disabled={page >= totalPages - 1} onClick={() => page < totalPages - 1 && setPage(page + 1)}>
          <i className="isax isax-arrow-right-2" style={{ fontSize: 13 }} />
        </button>
      </div>
    );
  };

  const activeCount = instructors.filter((i) => !(i as any).isBanned).length;
  const bannedCount = instructors.filter((i) => (i as any).isBanned).length;

  return (
    <LuxuryDashboardLayout>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: .45; }
        }
        .instr-search:focus { border-color: var(--lx-gold) !important; outline: none; }
        .instr-sort:focus   { border-color: var(--lx-gold) !important; outline: none; }
      `}</style>

      {/* ─── Hero banner ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--lx-primary-dark) 0%, var(--lx-primary) 60%, var(--lx-primary-light) 100%)',
        padding: '48px 40px 44px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,145,44,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '25%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {/* Left: title */}
          <div>
            <span style={{ display: 'block', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 13, color: 'var(--lx-gold)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('instructorPages.list.heroScript')}
            </span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
              {t('instructorPages.list.title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 14, margin: 0 }}>
              {t('instructorPages.list.heroSub')}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              {[
                { n: totalElements, lbl: t('instructorPages.list.total') },
                { n: activeCount,   lbl: t('instructorPages.list.active') },
                { n: bannedCount,   lbl: t('instructorPages.list.banned') },
              ].map(({ n, lbl }) => (
                <div key={lbl} style={{
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(197,145,44,.3)',
                  borderRadius: 10, padding: '10px 20px', textAlign: 'center', minWidth: 90,
                  backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ display: 'block', fontSize: 20, fontWeight: 700, color: 'var(--lx-gold)', fontFamily: "'Playfair Display', serif" }}>{n}</span>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,.55)' }}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: search */}
          <div style={{ position: 'relative', minWidth: 280 }}>
            <i className="isax isax-search-normal-1" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--lx-gold)', fontSize: 15, zIndex: 2 }} />
            <input
              type="text"
              className="instr-search"
              style={{
                width: '100%', background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(197,145,44,.35)', borderRadius: 9,
                color: '#fff', padding: '10px 14px 10px 38px', fontSize: 14,
                transition: 'border-color .2s',
              }}
              placeholder={t('instructorPages.list.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 36px 48px', background: 'var(--lx-bg)' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <span style={{ fontSize: 13, color: 'var(--lx-text-muted)' }}>
            {!loading && `${totalElements} ${t('instructorPages.list.total').toLowerCase()}`}
          </span>
          <select
            className="instr-sort"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setPage(0); }}
            style={{
              background: 'var(--lx-card)', border: '1px solid var(--lx-border-gold)',
              borderRadius: 8, color: 'var(--lx-text)', padding: '7px 14px', fontSize: 13,
              cursor: 'pointer', transition: 'border-color .2s',
            }}
          >
            <option value="newest">{t('instructorPages.list.sortNewest')}</option>
            <option value="oldest">{t('instructorPages.list.sortOldest')}</option>
            <option value="name">{t('instructorPages.list.sortName')}</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : instructors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--lx-text-muted)' }}>
            <i className="isax isax-user-search" style={{ fontSize: 52, color: 'var(--lx-gold)', opacity: .35, display: 'block', marginBottom: 14 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{t('instructorPages.list.noInstructors')}</p>
            {search && <p style={{ fontSize: 13, color: 'var(--lx-text-soft)' }}>"{search}"</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {instructors.map((ins) => (
              <InstructorCard
                key={ins.id}
                instructor={ins}
                t={t}
                lang={i18n.language}
                onBanToggle={handleBanToggle}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </LuxuryDashboardLayout>
  );
};

export default InstructorList;
