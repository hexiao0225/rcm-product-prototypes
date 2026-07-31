import { useState } from 'react'
import type { Specialty } from '../specialty'
import { DENIALS, type Denial } from '../clinical'
import { CARC_CATALOG } from '../data'
import { pct, usd } from '../format'
import {
  Bar,
  Callout,
  Card,
  CardHead,
  Code,
  Device,
  KV,
  Pill,
  SectionHead,
  Stat,
  Table,
} from '../components/ui'

const STAGE_LABEL: Record<Denial['stage'], string> = {
  queued: 'Queued',
  drafted: 'Drafted',
  filed: 'Filed',
  overturned: 'Overturned',
  upheld: 'Upheld',
}

/**
 * The appeal is only worth filing if the expected recovery clears the cost of
 * filing it. That arithmetic is why 60% of denials are never worked at all — and
 * automating the drafting is what moves the break-even, not the win rate.
 */
const COST_TO_APPEAL_MANUAL = 43.84

export default function AppealEngine({ specialty }: { specialty: Specialty }) {
  const denials = DENIALS[specialty.id]
  const [selectedClaim, setSelectedClaim] = useState(denials[0].claim)
  const selected = denials.find((d) => d.claim === selectedClaim) ?? denials[0]

  const open = denials.filter((d) => d.stage !== 'overturned' && d.stage !== 'upheld')
  const atRisk = open.reduce((s, d) => s + d.billed, 0)
  const expected = open.reduce((s, d) => s + d.billed * d.winRate, 0)
  const won = denials.filter((d) => d.stage === 'overturned').length
  const decided = denials.filter((d) => d.stage === 'overturned' || d.stage === 'upheld').length

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Engine 3 of 3 — Recovery"
        title="Appeal Engine"
        lede="A denial arrives as two opaque codes on an 835. Turning that into a filed appeal means resolving what actually went wrong, finding the policy that says otherwise, assembling the chart, writing the argument and tracking it to adjudication. Most practices do the first step and stop."
      />

      <div className="grid grid-4">
        <Stat value={String(open.length)} label="Open denials" note="In the worklist, not yet adjudicated." />
        <Stat value={usd(atRisk)} label="Dollars at risk" note="Billed amount on open denials." />
        <Stat value={usd(expected)} label="Expected recovery" note="Weighted by the model's assessed win rate." />
        <Stat
          value={decided ? pct(won / decided, 0) : '—'}
          label="Overturn rate"
          note={`${won} of ${decided} adjudicated appeals overturned.`}
        />
      </div>

      <Device crumb="Denials / Worklist" actor="A/R specialist">
        <div className="stack stack-6">
          <Table head={['Claim', 'Payer', 'CARC', 'Reason', 'Billed', 'Win', 'Stage']}>
            {denials.map((d) => (
              <tr
                key={d.claim}
                onClick={() => setSelectedClaim(d.claim)}
                style={{
                  cursor: 'pointer',
                  background: d.claim === selected.claim ? 'var(--tint)' : undefined,
                }}
              >
                <td>
                  <Code>{d.claim}</Code>
                </td>
                <td>{d.payer}</td>
                <td>
                  <Code tone={d.winRate >= 0.5 ? 'change' : 'remove'}>{d.carc}</Code>
                  {d.rarc && (
                    <>
                      {' '}
                      <Code>{d.rarc}</Code>
                    </>
                  )}
                </td>
                <td className="small">{d.reason}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(d.billed)}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <Bar value={d.winRate} max={1} tone={d.winRate < 0.5 ? 'muted' : undefined} />
                    <span className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pct(d.winRate, 0)}
                    </span>
                  </div>
                </td>
                <td>
                  <Pill plain>{STAGE_LABEL[d.stage]}</Pill>
                </td>
              </tr>
            ))}
          </Table>

          <div className="split">
            <div className="stack stack-4">
              <Card>
                <CardHead
                  title="Root cause"
                  aside={<Code tone="change">{selected.carc}</Code>}
                />
                <div className="stack stack-3">
                  <p className="small">{selected.rootCause}</p>
                  <Callout>
                    The denial code says <strong>{selected.reason.toLowerCase()}</strong>. That is a
                    category, not a cause. The recoverable version of this claim depends entirely on
                    which of a dozen things inside that category actually happened.
                  </Callout>
                </div>
              </Card>

              <Card>
                <CardHead title="Appeal economics" />
                <div className="stack stack-2">
                  <KV k="Billed amount" v={usd(selected.billed)} />
                  <KV k="Assessed win rate" v={pct(selected.winRate, 0)} />
                  <KV k="Expected recovery" v={usd(selected.billed * selected.winRate)} />
                  <KV
                    k="Cost to appeal, manually"
                    v={usd(COST_TO_APPEAL_MANUAL, 2)}
                    hint="Industry-typical staff cost per appeal touched by a human."
                  />
                  <KV
                    k="Worth filing?"
                    v={selected.billed * selected.winRate > COST_TO_APPEAL_MANUAL ? 'Yes' : 'Not manually'}
                    total
                  />
                </div>
                <p className="note" style={{ marginTop: 12 }}>
                  Automating the draft does not raise the win rate. It lowers the cost of filing,
                  which changes <em>which</em> denials are worth filing at all — and the long tail of
                  small claims is where most of the abandoned money sits.
                </p>
              </Card>

              <Card>
                <CardHead title="Evidence packet" />
                <div className="stack stack-2">
                  <KV k="Policy cited" v={<span className="citation">{selected.citation}</span>} />
                  <KV k="Chart" v="Operative / encounter note, date of service" />
                  <KV k="Remittance" v={`835 segment, CARC ${selected.carc}${selected.rarc ? ` / RARC ${selected.rarc}` : ''}`} />
                  <KV k="Contract" v="Rate sheet excerpt for the disputed line" />
                  <KV k="Filed via" v="Payer portal, with confirmation number captured" />
                </div>
              </Card>
            </div>

            <div className="stack stack-4">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Drafted appeal</h3>
                <span className="note">
                  Day {selected.age} of the filing window
                </span>
              </div>

              <div className="letter">
                <h4>Appeal of claim {selected.claim}</h4>
                <p>
                  <strong>Re:</strong> {selected.patient} · Date of service {selected.dos} ·{' '}
                  {selected.payer} · Denial code {selected.carc}
                  {selected.rarc ? ` / ${selected.rarc}` : ''}
                </p>
                <p>
                  This claim was denied as <strong>{selected.reason.toLowerCase()}</strong>. We
                  respectfully request reconsideration on the following basis.
                </p>
                <p>{selected.argument}</p>
                <p>
                  This determination is governed by <strong>{selected.citation}</strong>, which was
                  the policy in force on the date of service. The documentation enclosed establishes
                  that the criteria set out in that policy are met on the face of the record.
                </p>
                <p>
                  Enclosed: the encounter note for the date of service, the applicable policy
                  excerpt, and the remittance advice identifying the denial. We ask that the claim be
                  reprocessed for payment at the contracted rate.
                </p>
                <p className="note">
                  Drafted by the Appeal Engine · pending {selected.stage === 'queued' ? 'review' : 'submission'} ·
                  every factual assertion above traces to an attached document
                </p>
              </div>

              <div className="annotation">
                <strong>Why the letter is the easy part.</strong> Language models write plausible
                appeal letters trivially. The work is in the four inputs above it — knowing which
                policy version applied on the date of service, whether the contract says something
                different, what the chart actually supports, and whether this denial is winnable at
                all. A confident letter arguing the wrong policy is worse than no letter, because it
                burns one of a small number of appeal levels.
              </div>
            </div>
          </div>
        </div>
      </Device>

      <Card>
        <CardHead
          title="Denial codes worth knowing"
          aside={<Pill plain>Where the appealable dollars are</Pill>}
        />
        <Table head={['Code', 'Meaning', 'Appealable', 'Note']}>
          {CARC_CATALOG.map((c) => (
            <tr key={c.code}>
              <td>
                <Code tone={c.appealable ? 'change' : 'remove'}>{c.code}</Code>
              </td>
              <td className="small">{c.label}</td>
              <td className="small">{c.appealable ? 'Yes' : 'No'}</td>
              <td className="small muted">{c.note}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
