import { useEffect, useState } from 'react'
import { DEFAULT_SPECIALTY, SPECIALTIES, specialtyVars, type Specialty } from './specialty'
import { SOURCES } from './data'
import Overview from './views/Overview'
import DataEngine from './views/DataEngine'
import CodingEngine from './views/CodingEngine'
import AppealEngine from './views/AppealEngine'
import Underpayments from './views/Underpayments'
import PriorAuth from './views/PriorAuth'
import Intelligence from './views/Intelligence'
import RoiModel from './views/RoiModel'
import Architecture from './views/Architecture'
import Integration from './views/Integration'

export type ViewId =
  | 'overview'
  | 'data-engine'
  | 'coding'
  | 'appeals'
  | 'underpayments'
  | 'prior-auth'
  | 'intelligence'
  | 'roi'
  | 'architecture'
  | 'integration'

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'data-engine', label: 'Data Engine' },
  { id: 'coding', label: 'Coding Engine' },
  { id: 'appeals', label: 'Appeal Engine' },
  { id: 'underpayments', label: 'Underpayments' },
  { id: 'prior-auth', label: 'Prior auth' },
  { id: 'intelligence', label: 'Denial intelligence' },
  { id: 'roi', label: 'ROI model' },
  { id: 'architecture', label: 'Under the hood' },
  { id: 'integration', label: 'Integration' },
]

const isViewId = (v: string): v is ViewId => VIEWS.some((x) => x.id === v)

/** Views that render specialty-specific clinical content. */
const SPECIALTY_VIEWS: ViewId[] = [
  'data-engine',
  'coding',
  'appeals',
  'underpayments',
  'prior-auth',
  'intelligence',
  'roi',
]

export default function App() {
  const [view, setView] = useState<ViewId>(() => {
    const hash = window.location.hash.slice(1)
    return isViewId(hash) ? hash : 'overview'
  })
  const [specialty, setSpecialty] = useState<Specialty>(DEFAULT_SPECIALTY)

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (isViewId(hash)) setView(hash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const go = (id: ViewId) => {
    window.location.hash = id
    setView(id)
    window.scrollTo({ top: 0 })
  }

  const showSpecialtyBar = SPECIALTY_VIEWS.includes(view)

  return (
    <div className="app" style={specialtyVars(specialty)}>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <span className="logo">
            <span className="logo-mark">R</span>
            Revenue integrity teardown
          </span>
          <nav className="nav" aria-label="Prototypes">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-current={v.id === view ? 'page' : undefined}
                onClick={() => go(v.id)}
              >
                {v.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {showSpecialtyBar && (
        <div className="brandbar">
          <div className="wrap brandbar-inner">
            <span className="brandbar-label">Specialty</span>
            <div className="brand-chips">
              {SPECIALTIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="brand-chip"
                  aria-pressed={s.id === specialty.id}
                  onClick={() => setSpecialty(s)}
                >
                  <span className="swatch" style={{ background: s.accent }} />
                  {s.name}
                </button>
              ))}
            </div>
            <span className="note" style={{ flex: 1, minWidth: 240 }}>
              {specialty.setting}
            </span>
          </div>
        </div>
      )}

      <main className="wrap view">
        {view === 'overview' && <Overview onNavigate={go} />}
        {view === 'data-engine' && <DataEngine specialty={specialty} />}
        {view === 'coding' && <CodingEngine specialty={specialty} />}
        {view === 'appeals' && <AppealEngine specialty={specialty} />}
        {view === 'underpayments' && <Underpayments specialty={specialty} />}
        {view === 'prior-auth' && <PriorAuth specialty={specialty} />}
        {view === 'intelligence' && <Intelligence specialty={specialty} />}
        {view === 'roi' && <RoiModel specialty={specialty} />}
        {view === 'architecture' && <Architecture />}
        {view === 'integration' && <Integration />}
      </main>

      <footer className="footer">
        <div className="wrap stack stack-3">
          <p className="note">
            An independent study of Ember&apos;s product line, reconstructed from public material.
            Not affiliated with or endorsed by Ember. Patients, claims, dollar amounts and contract
            sections are invented; the clinical scenarios are composites, not records. The coding
            rules cited are real, but this is a teardown, not a coding reference — do not bill from
            it.
          </p>
          <div className="link-list">
            <span className="note strong">Sources:</span>
            {SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
