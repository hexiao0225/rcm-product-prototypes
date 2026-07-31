import { useState } from 'react'
import type { Specialty } from '../specialty'
import { ENCOUNTERS, type Finding } from '../clinical'
import { usd } from '../format'
import {
  Callout,
  Card,
  CardHead,
  Code,
  Confidence,
  Device,
  KV,
  NoteBody,
  Pill,
  SectionHead,
  SeverityTag,
  Slider,
  Stat,
} from '../components/ui'

type Decision = 'accepted' | 'rejected'

export default function CodingEngine({ specialty }: { specialty: Specialty }) {
  const enc = ENCOUNTERS[specialty.id]
  const [threshold, setThreshold] = useState(0.95)
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Re-derive against the current encounter rather than keying state on it, so
  // switching specialty starts the audit clean instead of carrying stale IDs.
  const selected = enc.findings.find((f) => f.id === selectedId) ?? null

  const isAuto = (f: Finding) => f.confidence >= threshold
  const statusOf = (f: Finding): 'auto' | 'accepted' | 'rejected' | 'pending' => {
    const explicit = decisions[f.id]
    if (explicit) return explicit
    return isAuto(f) ? 'auto' : 'pending'
  }
  const isApplied = (f: Finding) => {
    const s = statusOf(f)
    return s === 'auto' || s === 'accepted'
  }

  const applied = enc.findings.filter(isApplied)
  const corrected = enc.baseAllowed + applied.reduce((sum, f) => sum + f.delta, 0)
  const pending = enc.findings.filter((f) => statusOf(f) === 'pending').length
  const touched = enc.findings.filter((f) => !isAuto(f)).length
  const upside = applied.filter((f) => f.delta > 0).reduce((s, f) => s + f.delta, 0)
  const exposure = applied.filter((f) => f.delta < 0).reduce((s, f) => s + f.delta, 0)

  /** Clicking the active decision clears it, returning the finding to the queue. */
  const decide = (id: string, d: Decision) =>
    setDecisions((prev) => {
      const next = { ...prev }
      if (next[id] === d) delete next[id]
      else next[id] = d
      return next
    })

  const blockers = enc.findings.filter((f) => f.severity === 'blocker')
  const ready = pending === 0 && blockers.every(isApplied)

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Engine 2 of 3 — Audit"
        title="Coding Engine"
        lede="Every encounter is checked before the claim leaves the building. Not a 3% retrospective sample — the whole population, against national edits, the payer's own policy, and the contract. Each finding carries the sentence in the chart that produced it."
      />

      <div className="grid grid-4">
        <Stat value={usd(enc.baseAllowed, 2)} label="As coded" note="Expected allowed on the claim the coder built." />
        <Stat
          value={usd(corrected, 2)}
          label="After audit"
          note={`${upside > 0 ? `+${usd(upside, 2)} recovered` : 'No upside found'}${exposure < 0 ? `, ${usd(exposure, 2)} removed` : ''}.`}
        />
        <Stat value={String(enc.findings.length)} label="Findings" note={`${blockers.length} would have denied outright.`} />
        <Stat
          value={String(touched)}
          label="Need a human"
          note={`Below the ${threshold.toFixed(2)} auto-apply line. The rest post themselves.`}
        />
      </div>

      <Card>
        <CardHead
          title="Auto-apply threshold"
          aside={<Pill plain>The only knob that matters</Pill>}
        />
        <div className="split">
          <Slider
            label="Post without human review above"
            value={threshold}
            min={0.8}
            max={1}
            step={0.01}
            display={threshold.toFixed(2)}
            onChange={setThreshold}
            hint="Drag it left and the queue empties but the practice inherits the model's mistakes. Drag it right and you have rebuilt the coding department you were replacing."
          />
          <div className="stack stack-3">
            <p className="small muted">
              This is the entire commercial argument in one number. A coding model that is 98%
              accurate is not 98% useful — what matters is whether it knows <em>which</em> 2% it is
              wrong about. A well-calibrated model at {threshold.toFixed(2)} sends{' '}
              <strong>{touched}</strong> of {enc.findings.length} findings to a person; a poorly
              calibrated one at the same threshold sends the wrong {touched}.
            </p>
            <Callout>
              Calibration, not raw accuracy, is what makes the auto-apply line safe to move. It is
              also the thing a pilot can measure in three days and a marketing page cannot.
            </Callout>
          </div>
        </div>
      </Card>

      <Device crumb={`Pre-bill audit / Encounter ${enc.id}`} actor="Coder queue">
        <div className="stack stack-6">
          <div className="grid grid-4">
            <KV k="Patient" v={`${enc.patient}, ${enc.age}`} />
            <KV k="Date of service" v={enc.dos} />
            <KV k="Payer" v={`${enc.payer} — ${enc.plan}`} />
            <KV k="Setting" v={enc.setting} />
          </div>

          <div className="split">
            {/* ---------------- findings ---------------- */}
            <div className="stack stack-4">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Findings</h3>
                <span className="note">Select one to see its evidence in the chart</span>
              </div>

              {enc.findings.map((f) => {
                const status = statusOf(f)
                const applied = isApplied(f)
                return (
                  <div key={f.id} className="stack stack-2">
                    <button
                      type="button"
                      className={['finding', !applied && 'finding-resolved'].filter(Boolean).join(' ')}
                      aria-pressed={selectedId === f.id}
                      onClick={() => setSelectedId(selectedId === f.id ? null : f.id)}
                    >
                      <span className="finding-head">
                        <SeverityTag severity={f.severity} />
                        <span className="finding-title">{f.action}</span>
                      </span>
                      <span className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
                        <span className="citation">{f.citation}</span>
                        <span
                          className={
                            f.delta > 0 ? 'delta-pos' : f.delta < 0 ? 'delta-neg' : 'delta-zero'
                          }
                        >
                          {f.delta === 0 ? '—' : `${f.delta > 0 ? '+' : ''}${usd(f.delta, 2)}`}
                        </span>
                      </span>
                      <span className="row" style={{ justifyContent: 'space-between', marginTop: 8, gap: 12 }}>
                        <Confidence value={f.confidence} threshold={threshold} />
                        <span className="note">
                          {status === 'auto' && 'auto-applied'}
                          {status === 'accepted' && 'accepted by coder'}
                          {status === 'rejected' && 'rejected by coder'}
                          {status === 'pending' && 'awaiting review'}
                        </span>
                      </span>
                    </button>

                    {selectedId === f.id && (
                      <Card tint>
                        <div className="stack stack-3">
                          <p className="small">{f.detail}</p>
                          <KV k="If the claim goes out as coded" v="" hint={f.ifIgnored} />
                          <div className="row" style={{ gap: 8 }}>
                            <button
                              type="button"
                              className={status === 'accepted' || status === 'auto' ? 'btn btn-accent' : 'btn'}
                              onClick={() => decide(f.id, 'accepted')}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className={status === 'rejected' ? 'btn btn-accent' : 'btn btn-ghost'}
                              onClick={() => decide(f.id, 'rejected')}
                            >
                              Reject
                            </button>
                            {isAuto(f) && (
                              <span className="note" style={{ alignSelf: 'center' }}>
                                Above threshold — applied unless you override.
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ---------------- chart ---------------- */}
            <div className="stack stack-4">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Clinical documentation</h3>
                <span className="note">{enc.provider}</span>
              </div>

              <div className="note-doc">
                {enc.note.map((s) => (
                  <div key={s.label} className="note-section">
                    <span className="note-label">{s.label}</span>
                    <NoteBody text={s.body} evidence={selected?.evidence} />
                  </div>
                ))}
              </div>

              {selected ? (
                selected.evidence ? (
                  <div className="annotation">
                    <strong>Grounding.</strong> The highlighted span is the whole basis for this
                    finding. If a coder disagrees, they are arguing with a sentence in the chart,
                    not with a model — which is the only version of this workflow that survives an
                    audit.
                  </div>
                ) : (
                  <div className="annotation">
                    <strong>No chart evidence.</strong> This finding comes from payer policy and the
                    contract rather than the note, so there is nothing to highlight. It is also the
                    category a documentation-only tool cannot see at all.
                  </div>
                )
              ) : (
                <div className="annotation">
                  Select a finding to highlight the text that produced it.
                </div>
              )}

              <Card>
                <CardHead title="Claim as submitted" />
                <div className="stack stack-2">
                  {enc.submitted.map((l) => (
                    <div key={l.code} className="row" style={{ gap: 10, alignItems: 'baseline' }}>
                      <Code>{l.code}</Code>
                      <span className="small muted" style={{ flex: 1 }}>
                        {l.desc}
                        {l.units && l.units > 1 ? ` ×${l.units}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <Card tint>
            <CardHead
              title="Disposition"
              aside={<Pill>{ready ? 'Ready to submit' : `${pending} finding${pending === 1 ? '' : 's'} pending`}</Pill>}
            />
            <div className="grid grid-3">
              <KV k="Expected allowed, as coded" v={usd(enc.baseAllowed, 2)} />
              <KV k="Expected allowed, after audit" v={usd(corrected, 2)} />
              <KV
                k="Net change"
                v={`${corrected - enc.baseAllowed >= 0 ? '+' : ''}${usd(corrected - enc.baseAllowed, 2)}`}
                total
              />
            </div>
            <p className="note" style={{ marginTop: 12 }}>
              The net number moves in both directions, and that is the point. Two of these findings
              take money <em>off</em> the claim. A tool that only ever adds codes is not an audit —
              it is an upcoding engine with a compliance problem attached, and the practice carries
              the liability, not the vendor.
            </p>
          </Card>
        </div>
      </Device>

      <div className="split">
        <Card>
          <CardHead title="Why this is the hard part" />
          <div className="stack stack-3">
            <p className="small muted">
              {specialty.thesis}
            </p>
            <p className="small muted">
              Switch specialty in the bar above and every finding on this page changes — not the
              styling, the actual rules. That is the argument for building vertically: the edits
              that carry a cardiology practice&apos;s margin have almost no overlap with the ones
              that carry a behavioural health practice&apos;s.
            </p>
          </div>
        </Card>
        <Card>
          <CardHead title="What the model is checking against" />
          <div className="stack stack-2">
            <KV k="National" v="NCCI PTP pairs, MUE limits, CPT descriptors and parentheticals" />
            <KV k="Coverage" v="LCD / NCD for the MAC jurisdiction on the date of service" />
            <KV k="Payer" v="Plan medical policy and precertification list, versioned by effective date" />
            <KV k="Local" v="Practice-specific guidelines and the payer contract's carve-outs" />
          </div>
        </Card>
      </div>
    </div>
  )
}
