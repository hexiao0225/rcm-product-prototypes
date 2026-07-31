import { useState } from 'react'
import type { Specialty } from '../specialty'
import { ENCOUNTERS, type Source } from '../clinical'
import { usd } from '../format'
import {
  Callout,
  Card,
  CardHead,
  Code,
  Device,
  KV,
  Pill,
  SectionHead,
  SeverityTag,
  Stat,
} from '../components/ui'

const SOURCES: { id: Source; name: string; owner: string; system: string; detail: string }[] = [
  {
    id: 'note',
    name: 'Clinical documentation',
    owner: 'Physician',
    system: 'EHR',
    detail:
      'The note, plus the results that arrive after it — pathology, imaging reads, operative addenda. The claim is often built before these land.',
  },
  {
    id: 'claim',
    name: 'Coded claim',
    owner: 'Coding team',
    system: 'PM / billing',
    detail:
      'CPT, ICD-10, HCPCS, modifiers, units, place of service, diagnosis pointers. What is actually going to be transmitted on the 837.',
  },
  {
    id: 'policy',
    name: 'Payer policy',
    owner: 'Nobody',
    system: 'PDFs on payer websites',
    detail:
      'Medical policy, precertification lists, LCD/NCD, NCCI and MUE tables — each versioned by effective date, each changing without notice.',
  },
  {
    id: 'contract',
    name: 'Contract',
    owner: 'Finance / managed care',
    system: 'A spreadsheet, usually',
    detail:
      'Rate sheets, carve-outs, escalators, multiple-procedure rules. The only document that says what a claim was supposed to pay.',
  },
]

export default function DataEngine({ specialty }: { specialty: Specialty }) {
  const enc = ENCOUNTERS[specialty.id]
  const [active, setActive] = useState<Source[]>(['note', 'claim'])

  const has = (s: Source) => active.includes(s)
  const toggle = (s: Source) =>
    setActive((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const visible = enc.findings.filter((f) => f.needs.every(has))
  const missed = enc.findings.filter((f) => !f.needs.every(has))
  const recovered = visible.reduce((sum, f) => sum + f.delta, 0)
  const forfeited = missed.reduce((sum, f) => sum + f.delta, 0)

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Engine 1 of 3 — Foundation"
        title="Data Engine"
        lede="Four documents decide whether a claim is right. They live in four systems, are owned by four teams, and one of them is not owned by anyone. Nothing downstream is possible until they share a key — which is why the least demo-able engine is the one the other two are built on."
      />

      <Card>
        <CardHead
          title="Turn the inputs off and watch the audit degrade"
          aside={<Pill plain>{active.length} of 4 connected</Pill>}
        />
        <div className="grid grid-4">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="finding"
              aria-pressed={has(s.id)}
              onClick={() => toggle(s.id)}
              style={{ height: '100%' }}
            >
              <span className="finding-head">
                <span className="finding-title">{s.name}</span>
              </span>
              <span className="note" style={{ display: 'block', marginBottom: 6 }}>
                Owned by {s.owner} · lives in {s.system}
              </span>
              <span className="small muted">{s.detail}</span>
              <span className="note strong" style={{ display: 'block', marginTop: 8 }}>
                {has(s.id) ? 'Connected' : 'Disconnected'}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-4">
        <Stat
          value={`${visible.length} / ${enc.findings.length}`}
          label="Findings still reachable"
          note="What the Coding Engine can see with only the connected inputs."
        />
        <Stat
          value={usd(recovered, 2)}
          label="Net correction captured"
          note="Dollar effect of the findings that survive."
        />
        <Stat
          value={usd(forfeited, 2)}
          label="Net correction forfeited"
          note="Left on the table because an input is missing."
        />
        <Stat
          value={String(missed.filter((f) => f.severity === 'blocker').length)}
          label="Blockers missed"
          note="Findings that would have denied the claim outright."
        />
      </div>

      <Device crumb={`Data Engine / Encounter ${enc.id}`} actor="Join result">
        <div className="split">
          <div className="stack stack-4">
            <h3 style={{ margin: 0 }}>Reachable</h3>
            {visible.length === 0 && (
              <div className="empty">
                With nothing connected there is no audit — only a claim, going out as typed.
              </div>
            )}
            {visible.map((f) => (
              <Card key={f.id}>
                <div className="finding-head">
                  <SeverityTag severity={f.severity} />
                  <span className="finding-title">{f.action}</span>
                </div>
                <span className="citation">{f.citation}</span>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  {f.needs.map((n) => (
                    <Code key={n} tone="add">
                      {n}
                    </Code>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="stack stack-4">
            <h3 style={{ margin: 0 }}>Invisible</h3>
            {missed.length === 0 && (
              <div className="empty">
                All four inputs connected. Every finding on this encounter is reachable.
              </div>
            )}
            {missed.map((f) => (
              <Card key={f.id} className="finding-resolved">
                <div className="finding-head">
                  <SeverityTag severity={f.severity} />
                  <span className="finding-title">{f.action}</span>
                </div>
                <span className="citation">{f.citation}</span>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  {f.needs.map((n) => (
                    <Code key={n} tone={has(n) ? 'add' : 'remove'}>
                      {n}
                    </Code>
                  ))}
                </div>
                <p className="note" style={{ marginTop: 8 }}>
                  Missing: {f.needs.filter((n) => !has(n)).join(', ')}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Device>

      <div className="split">
        <Card>
          <CardHead title="What this demonstrates" />
          <div className="stack stack-3">
            <p className="small muted">
              An ambient scribe has the note. A billing system has the claim. A clearinghouse has
              neither the policy nor the contract. Each of those products is real and useful, and
              each of them is structurally blind to a category of finding on this page.
            </p>
            <p className="small muted">
              Connect only <strong>documentation</strong> and <strong>claim</strong> — the default
              state of most practices — and the engine catches the arithmetic errors but none of
              the policy or contract ones. Those are the expensive category, because they are
              invisible by construction: they do not produce a denial, they produce a payment.
            </p>
            <Callout>
              The four-way join is not a feature. It is the moat, and it is also the reason
              onboarding is a data problem rather than a modelling one.
            </Callout>
          </div>
        </Card>

        <Card>
          <CardHead title="Joining is the unglamorous part" />
          <div className="stack stack-2">
            <KV
              k="Entity resolution"
              v=""
              hint="One encounter, four identifiers: EHR encounter ID, claim control number, authorization number, remittance claim ID. None of them agree."
            />
            <KV
              k="Temporal alignment"
              v=""
              hint="The pathology addendum arrives two days after the note and three days before the claim. The policy version that matters is the one in force on the date of service, not today."
            />
            <KV
              k="Policy versioning"
              v=""
              hint="A payer policy PDF has no version field. Effective dates must be extracted, and the corpus must be queryable as of an arbitrary past date."
            />
            <KV
              k="Contract parsing"
              v=""
              hint="Rate sheets are PDFs and spreadsheets with carve-outs written in prose. Turning §4.2 into an expected allowed amount per line is the least AI-shaped and most valuable step here."
            />
            <KV
              k="Write-back"
              v=""
              hint="A finding is worth nothing in a dashboard. It has to land in the EHR or PM system as a corrected line before submission."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
