import type { Specialty } from '../specialty'
import { DENIAL_MIX } from '../clinical'
import { PAYERS } from '../data'
import { pct, usd } from '../format'
import { Bar, Callout, Card, CardHead, KV, Pill, SectionHead, Stat, Table } from '../components/ui'

/**
 * A denial report that lists denied claims is an inbox. A denial report that
 * groups by root cause and marks each group's preventable share is a roadmap —
 * it tells the practice which fix to buy next.
 */
export default function Intelligence({ specialty }: { specialty: Specialty }) {
  const mix = DENIAL_MIX[specialty.id]
  const annualDenied = specialty.encountersPerYear * specialty.baselineDenialRate
  const deniedDollars = annualDenied * specialty.avgAllowed

  const rows = mix.map((m) => ({
    ...m,
    claims: annualDenied * m.share,
    dollars: annualDenied * m.share * specialty.avgAllowed,
    preventableDollars: annualDenied * m.share * specialty.avgAllowed * m.preventable,
  }))
  const totalPreventable = rows.reduce((s, r) => s + r.preventableDollars, 0)
  const maxDollars = Math.max(...rows.map((r) => r.dollars))

  // Provider-level variation is the coaching surface — the same procedure, coded
  // differently by five physicians, is a training problem, not a billing one.
  const providers = [
    { name: 'Provider A', denialRate: specialty.baselineDenialRate * 0.61, volume: 0.22, note: 'Consistently documents the elements the payer asks for.' },
    { name: 'Provider B', denialRate: specialty.baselineDenialRate * 0.84, volume: 0.19, note: 'Near the practice median.' },
    { name: 'Provider C', denialRate: specialty.baselineDenialRate * 0.97, volume: 0.24, note: 'Median. High volume makes small gains material.' },
    { name: 'Provider D', denialRate: specialty.baselineDenialRate * 1.34, volume: 0.21, note: 'Documentation is thorough but omits the specific criteria language.' },
    { name: 'Provider E', denialRate: specialty.baselineDenialRate * 1.71, volume: 0.14, note: 'Outlier. One recurring omission accounts for most of the gap.' },
  ]
  const maxRate = Math.max(...providers.map((p) => p.denialRate))

  return (
    <div className="stack stack-12">
      <SectionHead
        eyebrow="Reporting"
        title="Denial intelligence"
        lede="Every RCM system produces a denial report. Almost none of them answer the only question worth asking: of the money we lost this year, how much was actually preventable, and by changing what? A list of denied claims is an inbox. A root-cause distribution with a preventable share is a plan."
      />

      <div className="grid grid-4">
        <Stat
          value={Math.round(annualDenied).toLocaleString('en-US')}
          label="Denied claims per year"
          note={`${pct(specialty.baselineDenialRate)} of ${specialty.encountersPerYear.toLocaleString('en-US')} encounters.`}
        />
        <Stat value={usd(deniedDollars)} label="Denied dollars" note="At the practice's average allowed amount." />
        <Stat value={usd(totalPreventable)} label="Preventable" note="Addressable before submission rather than after." />
        <Stat
          value={pct(totalPreventable / deniedDollars, 0)}
          label="Preventable share"
          note="The ceiling on what a pre-bill audit can be worth here."
        />
      </div>

      <Card>
        <CardHead title="Root cause distribution" aside={<Pill plain>{specialty.name}</Pill>} />
        <Table head={['Root cause', 'Share', 'Claims', 'Dollars', 'Preventable', 'Recoverable']}>
          {rows.map((r) => (
            <tr key={r.cause}>
              <td className="strong small">{r.cause}</td>
              <td className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {pct(r.share, 0)}
              </td>
              <td className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(r.claims).toLocaleString('en-US')}
              </td>
              <td>
                <div className="row" style={{ gap: 8 }}>
                  <Bar value={r.dollars} max={maxDollars} />
                  <span className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {usd(r.dollars)}
                  </span>
                </div>
              </td>
              <td className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {pct(r.preventable, 0)}
              </td>
              <td className="small strong" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {usd(r.preventableDollars)}
              </td>
            </tr>
          ))}
        </Table>
        <p className="note" style={{ marginTop: 12 }}>
          The preventable column is a judgement, not an observation, and it is where a vendor should
          be pressed hardest. Timely filing is 100% preventable and trivially small. Medical
          necessity is enormous and only partly preventable, because some of those denials are
          simply payers being wrong — which makes them an appeal problem, not a coding one.
        </p>
      </Card>

      <div className="split">
        <Card>
          <CardHead title="Provider variation" aside={<Pill plain>Coaching surface</Pill>} />
          <div className="stack stack-3">
            {providers.map((p) => (
              <div key={p.name} className="queue-row">
                <div className="stack stack-2" style={{ minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
                    <span className="small strong">{p.name}</span>
                    <span className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pct(p.denialRate)}
                    </span>
                  </div>
                  <Bar value={p.denialRate} max={maxRate} tone={p.denialRate < specialty.baselineDenialRate ? 'muted' : undefined} />
                  <span className="note">
                    {pct(p.volume, 0)} of volume · {p.note}
                  </span>
                </div>
              </div>
            ))}
            <Callout>
              The spread between Provider A and Provider E is a factor of{' '}
              {(providers[4].denialRate / providers[0].denialRate).toFixed(1)}. They see the same
              patients, in the same practice, under the same contracts. The difference is what gets
              written down.
            </Callout>
          </div>
        </Card>

        <Card>
          <CardHead title="Payer mix and behaviour" />
          <Table head={['Payer', 'Share', 'Type']}>
            {PAYERS.map((p) => (
              <tr key={p.name}>
                <td className="small strong">{p.name}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <Bar value={p.share} max={0.25} />
                    <span className="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pct(p.share, 0)}
                    </span>
                  </div>
                </td>
                <td className="small muted">{p.kind}</td>
              </tr>
            ))}
          </Table>
          <p className="note" style={{ marginTop: 12 }}>
            Payer mix determines which policies have to be modelled first. A practice that is 40%
            Medicare needs LCD coverage before it needs commercial medical policy; a practice that
            is 60% commercial needs the reverse. This is the single most useful question to ask
            during onboarding scoping.
          </p>
        </Card>
      </div>

      <Card tint>
        <CardHead title="What this view is really for" />
        <div className="stack stack-3">
          <p className="small muted">
            This is the screen the practice administrator or CFO opens, and it is the one that
            renews the contract. The engines are what the product does; this is where a buyer sees
            whether it worked.
          </p>
          <div className="grid grid-3">
            <KV k="Attribution" v="" hint="When the denial rate drops, was it the audit, a payer policy change, or a coder who left? Without attribution the renewal conversation is a matter of faith." />
            <KV k="Counterfactual" v="" hint="The honest measure is the claims that would have denied and did not. That requires holding out a control group, which nobody wants to do with real money." />
            <KV k="Leading indicators" v="" hint="Denial rate lags by 30–60 days. Clean claim rate and finding-acceptance rate move in days, and predict it." />
          </div>
        </div>
      </Card>
    </div>
  )
}
