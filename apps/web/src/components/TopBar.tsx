'use client';

import { Building2, Search, Bell, ChevronDown } from 'lucide-react';

interface TopBarProps {
  nomOrganisation?: string;
}

export function TopBar({ nomOrganisation }: TopBarProps) {
  return (
    <header
      style={{
        height: 64,
        background: 'var(--batione-surface)',
        borderBottom: `1px solid var(--batione-ink-100)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--batione-space-5)',
        padding: '0 var(--batione-space-5)',
      }}
    >
      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--batione-space-2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--batione-ink-900)',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        <Building2 size={18} color="var(--batione-primary)" aria-hidden />
        {nomOrganisation ?? 'Mon entreprise'}
        <ChevronDown size={16} color="var(--batione-ink-500)" aria-hidden />
      </button>

      <div style={{ position: 'relative', flex: 1, maxWidth: 520 }}>
        <Search
          size={16}
          color="var(--batione-ink-500)"
          aria-hidden
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          className="bo-input"
          placeholder="Rechercher un projet, un client, un document…"
          style={{ paddingLeft: 36, background: 'var(--batione-bg)', border: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-4)', flexShrink: 0 }}>
        <span style={{ position: 'relative', display: 'inline-flex' }} aria-label="Notifications">
          <Bell size={20} color="var(--batione-ink-700)" aria-hidden />
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--batione-danger)',
              border: '1.5px solid var(--batione-surface)',
            }}
          />
        </span>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--batione-ink-700)',
            fontWeight: 600,
            fontSize: 'var(--batione-font-size-sm)',
          }}
        >
          FR
          <ChevronDown size={14} color="var(--batione-ink-500)" aria-hidden />
        </button>

        <button
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--batione-primary-soft)',
              color: 'var(--batione-primary-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            U
          </span>
          <ChevronDown size={14} color="var(--batione-ink-500)" aria-hidden />
        </button>
      </div>
    </header>
  );
}
