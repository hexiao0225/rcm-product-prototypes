import { useState } from 'react'
import type { Specialty } from '../specialty'
import { UNDERPAYMENTS } from '../clinical'
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

export default function Underpayments({ specialty }: { specialty: Specialty }) {
  const rows = UNDERPAYMENTS[specialty.id]
  const [selectedClaim, setSelectedClaim] = useState(rows[0].claim)
  const selected = rows.find((r) => r.claim === selectedClaim) ?? rows[0]

  const withTotals = rows.map((r) => ({
    ...r,
    perClaim: r.expected - r.paid,
    total: (r.expected - r.paid) * r.units,
    variance: r.expected > 0 ? (r.expected - r.paid) / r.expected : 0,
  }))
  const recoverable = withTotals.reduce((s, r) => s + r.total, 0)
  const maxTotal = Math.max(...withTotals.map((r) => r.total))
  const worst = withTotals.reduce((a, b) => (b.variance > a.variance ? b : a))
  const sel = withTotals.find((r) => r.claim === selected.claim)!

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Revenue recovery"
        title="Underpayments"
        lede="These claims were not denied. They were paid, posted, and closed — at the wrong rate. There is no work queue for this, no denial code, no alert. The only way to notice is to hold the contract and the remittance in the same hand, which is precisely the join nobody has."
      />

      <div className="grid grid-4">
        <Stat value={usd(recoverable)} label="Recoverable, trailing 12 months" note="Across the variance patterns below." />
        <Stat value={String(rows.length)} label="Distinct variance patterns" note="Each one repeats across every affected claim." />
        <Stat value={pct(worst.variance, 0)} label="Worst variance" note={`On ${worst.code} — ${worst.payer}.`} />
        <Stat
          value={usd(recoverable / specialty.encountersPerYear, 2)}
          label="Per encounter"
          note="Spread across the practice's annual volume. Individually invisible."
        />
      </div>

      <Callout>
        Note the shape of the loss. No single claim here is dramatic — the largest per-claim gap is{' '}
        {usd(Math.max(...withTotals.map((r) => r.perClaim)), 2)}. It becomes material only when
        multiplied by units, and units are the one thing a human reviewing claims one at a time
        never sees.
      </Callout>

      <Device crumb="Contract intelligence / Variance report" actor="Revenue analyst">
        <div className="stack stack-6">
          <Table head={['Claim', 'Code', 'Payer', 'Expected', 'Paid', 'Per claim', 'Units', 'Total']}>
            {withTotals.map((r) => (
              <tr
                key={r.claim}
                onClick={() => setSelectedClaim(r.claim)}
                style={{
                  cursor: 'pointer',
                  background: r.claim === selected.claim ? 'var(--tint)' : undefined,
                }}
              >
                <td>
                  <Code>{r.claim}</Code>
                </td>
                <td>
                  <Code tone="change">{r.code}</Code>
                </td>
                <td className="small">{r.payer}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(r.expected, 2)}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(r.paid, 2)}</td>
                <td className="delta-neg">−{usd(r.perClaim, 2)}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.units.toLocaleString('en-US')}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <Bar value={r.total} max={maxTotal} />
                    <span className="small strong" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {usd(r.total)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="split">
            <Card>
              <CardHead title="Why it paid wrong" aside={<Code tone="change">{sel.code}</Code>} />
              <div className="stack stack-3">
                <p className="small">{sel.cause}</p>
                <div className="stack stack-2">
                  <KV k="Contract reference" v={<span className="citation">{sel.contractRef}</span>} />
                  <KV k="Expected allowed" v={usd(sel.expected, 2)} />
                  <KV k="Actually paid" v={usd(sel.paid, 2)} />
                  <KV k="Variance" v={pct(sel.variance, 1)} />
                  <KV k="Affected claims" v={sel.units.toLocaleString('en-US')} />
                  <KV k="Total recoverable" v={usd(sel.total)} total />
                </div>
              </div>
            </Card>

            <Card>
              <CardHead title="What recovery actually requires" />
              <div className="stack stack-2">
                <KV
                  k="1 — An expected value per line"
                  v=""
                  hint="Not a fee schedule. The contracted rate for this code, this payer, this site of service, this date, after every carve-out and multiple-procedure rule."
                />
                <KV
                  k="2 — Automated reconciliation"
                  v=""
                  hint="Every 835 line compared to that expected value on posting, not in a quarterly review."
                />
                <KV
                  k="3 — Pattern grouping"
                  v=""
                  hint="One claim paying $114 short is noise. 148 claims paying $114 short is a loaded-rate error worth a phone call and a project."
                />
                <KV
                  k="4 — A recovery path"
                  v=""
                  hint="Reprocessing request, or a contract-compliance escalation. Different from an appeal — nothing was denied, so there is nothing to appeal."
                />
                <KV
                  k="5 — Prevention"
                  v=""
                  hint="The same expected value, checked before submission. This is where the Coding Engine and Contract Intelligence become one product rather than two."
                />
              </div>
            </Card>
          </div>
        </div>
      </Device>

      <div className="split">
        <Card>
          <CardHead title="Underpayment vs denial" aside={<Pill plain>Different products</Pill>} />
          <Table head={['', 'Denial', 'Underpayment']}>
            <tr>
              <td className="strong small">Signal</td>
              <td className="small">CARC on the 835</td>
              <td className="small muted">None. It looks like payment.</td>
            </tr>
            <tr>
              <td className="strong small">Work queue</td>
              <td className="small">Exists by default</td>
              <td className="small muted">Has to be manufactured</td>
            </tr>
            <tr>
              <td className="strong small">Detection needs</td>
              <td className="small">The remittance</td>
              <td className="small muted">The remittance and the contract</td>
            </tr>
            <tr>
              <td className="strong small">Remedy</td>
              <td className="small">Appeal</td>
              <td className="small muted">Reprocessing request or contract escalation</td>
            </tr>
            <tr>
              <td className="strong small">Typical age when found</td>
              <td className="small">Days</td>
              <td className="small muted">Never</td>
            </tr>
          </Table>
        </Card>

        <Card>
          <CardHead title="The negotiation lever" />
          <div className="stack stack-3">
            <p className="small muted">
              The published knowledge base leans hard on benchmarking and payer negotiation, and
              this table is why. Once a practice can state that a payer underpaid a specific code by
              a specific percentage across a specific number of claims, the annual contract
              conversation stops being a request and becomes an invoice.
            </p>
            <p className="small muted">
              It also explains the interest in price transparency data. The variance above is
              measured against your own contract; the more valuable comparison is against what the
              same payer pays a peer practice three miles away for the same code.
            </p>
            <Callout>
              Detection is a product. Benchmarking is a data network — harder to build, much harder
              to copy, and it only works once enough practices are on the platform.
            </Callout>
          </div>
        </Card>
      </div>
    </div>
  )
}
