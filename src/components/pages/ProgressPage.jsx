// ═══════════════════════════════════════════════════════════════════════════
// ProgressPage.jsx — Overall GMAT Progress dashboard
// ═══════════════════════════════════════════════════════════════════════════
import { useMemo } from 'react'
import { MetricCard, ProgressBar, EmptyState, cardStyle } from '../ui/index.jsx'
import { calcReadiness } from '../../utils/scoring.js'
import { pct, fmtH } from '../../utils/helpers.js'
import { SECTIONS, sectionC } from '../../data/constants.js'

export function ProgressPage({ weeks, mocks, topics, settings, errors }) {
  const allTasks  = weeks.flatMap(w => w.days.flatMap(d => d.tasks))
  const done      = allTasks.filter(t => t.status === 'Completed').length
  const totalHrs  = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + (d.hoursLogged || 0), 0), 0)
  const resolved  = errors.filter(e => e.resolved).length

  const { score: readiness, breakdown, avgMock, latestMock, overallAcc } =
    useMemo(() => calcReadiness({ topics, mocks, weeks, errors, settings }), [topics, mocks, weeks, errors, settings])

  const secData = SECTIONS.map(s => {
    const st = topics.filter(t => t.section === s)
    return {
      s,
      comp: pct(st.filter(t => ['Strong','Mastered'].includes(t.mastery)).length, st.length),
      avgAcc: Math.round(st.reduce((a, t) => a + t.accuracy, 0) / (st.length || 1)),
      hrs: st.reduce((a, t) => a + t.timeSpent, 0),
      mastered: st.filter(t => ['Strong','Mastered'].includes(t.mastery)).length,
      total: st.length,
    }
  })

  return (
    <div>
      {/* Readiness hero */}
      <div style={{
        background: 'linear-gradient(135deg,#1E1B4B,#1E3A8A)',
        borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ color:'#A5B4FC', fontSize:11, marginBottom:3 }}>
            Estimated readiness — {new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}
          </div>
          <div style={{ color:'#fff', fontSize:36, fontWeight:800, lineHeight:1 }}>{readiness}%</div>
          <div style={{ color:'#93C5FD', fontSize:13, marginTop:5 }}>
            Target: {settings.targetScore}{settings.examDate ? ` · Exam: ${settings.examDate}` : ''}
          </div>
          <div style={{ color:'rgba(255,255,255,.35)', fontSize:10, marginTop:4 }}>
            * Composite estimate — see factor breakdown below
          </div>
        </div>
        {/* Radial ring */}
        <div style={{ position:'relative', width:90, height:90, flexShrink:0 }}>
          <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)', width:'100%', height:'100%' }}>
            <circle r="16" cx="18" cy="18" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3"/>
            <circle r="16" cx="18" cy="18" fill="none"
              stroke={readiness>=75?'#34D399':readiness>=50?'#A78BFA':'#F87171'}
              strokeWidth="3"
              strokeDasharray={`${readiness} 100`}
              strokeLinecap="round"/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15 }}>
            {readiness}%
          </div>
        </div>
      </div>

      {/* Readiness factor breakdown */}
      <div style={{ ...cardStyle, marginBottom:'1.5rem' }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Readiness factor breakdown</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>
          {[
            ['Mock proximity',    breakdown.mockProx,    '#F59E0B', '30%'],
            ['Accuracy',          breakdown.overallAcc,  '#10B981', '25%'],
            ['Syllabus',          breakdown.syllabus,    '#7C3AED', '20%'],
            ['Consistency',       breakdown.consistency, '#2563EB', '15%'],
            ['Error resolution',  breakdown.errRate,     '#EF4444', '10%'],
          ].map(([l, v, c, w]) => (
            <div key={l} style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'#475569', fontWeight:600 }}>{l}</span>
                <span style={{ fontSize:10, color:'#94A3B8' }}>{w} weight</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <ProgressBar value={v} color={c} height={6} style={{ flex:1 }} />
                <span style={{ fontSize:12, fontWeight:700, color:c, minWidth:32 }}>{v}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:'1.5rem' }}>
        <MetricCard label="Tasks done"   value={`${done}/${allTasks.length}`} color="#7C3AED" icon="✅" />
        <MetricCard label="Hours studied" value={`${Math.round(totalHrs)}h`}  color="#2563EB" icon="⏱" />
        <MetricCard label="Accuracy"     value={`${overallAcc}%`} color={overallAcc>=70?'#10B981':overallAcc>=50?'#F59E0B':'#EF4444'} icon="🎯" />
        <MetricCard label="Best mock"    value={mocks.length?Math.max(...mocks.map(m=>parseInt(m.total)||0)):'—'} color="#F59E0B" icon="🏆" sub={`Avg: ${avgMock||'—'}`} />
        <MetricCard label="Mocks taken"  value={mocks.length} color="#EF4444" icon="📝" />
        <MetricCard label="Errors resolved" value={`${resolved}/${errors.length}`} color="#10B981" icon="🔴" />
      </div>

      {/* Section cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:'1.25rem', marginBottom:'1.5rem' }}>
        {secData.map(({ s, comp, avgAcc, hrs, mastered, total }) => {
          const sc = sectionC(s)
          return (
            <div key={s} style={{ ...cardStyle, borderTop:`3px solid ${sc.solid}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:sc.text, marginBottom:10 }}>{s}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12, textAlign:'center' }}>
                <div><div style={{ fontSize:18, fontWeight:700, color:sc.solid }}>{comp}%</div><div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4 }}>Mastered</div></div>
                <div><div style={{ fontSize:18, fontWeight:700, color:avgAcc>=70?'#10B981':avgAcc>=50?'#F59E0B':'#EF4444' }}>{avgAcc}%</div><div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4 }}>Accuracy</div></div>
                <div><div style={{ fontSize:18, fontWeight:700, color:'#475569' }}>{Math.round(hrs)}h</div><div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4 }}>Studied</div></div>
              </div>
              <ProgressBar value={comp} color={sc.solid} height={8} />
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:5 }}>{mastered}/{total} topics mastered</div>
            </div>
          )
        })}
      </div>

      {/* Planned vs Actual hours chart */}
      <div style={{ ...cardStyle, marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Planned vs actual hours per week</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100 }}>
          {weeks.map(w => {
            const actual  = w.days.reduce((a, d) => a + (d.hoursLogged || 0), 0)
            const planned = w.goals?.hours || 0
            const maxH    = Math.max(...weeks.map(wk => Math.max(wk.goals?.hours||0, wk.days.reduce((a,d)=>a+(d.hoursLogged||0),0))), 1)
            return (
              <div key={w.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ display:'flex', gap:2, alignItems:'flex-end', width:'100%' }}>
                  <div title={`Planned: ${planned}h`}
                    style={{ flex:1, borderRadius:'4px 4px 0 0', background:'#E2E8F0', height:`${(planned/maxH)*75}px`, minHeight:2 }} />
                  <div title={`Actual: ${actual}h`}
                    style={{ flex:1, borderRadius:'4px 4px 0 0', background:'#7C3AED', height:`${(actual/maxH)*75}px`, minHeight:2 }} />
                </div>
                <span style={{ fontSize:9, color:'#94A3B8', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
                  {w.label.split(' ').slice(0,2).join(' ')}
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10,height:10,borderRadius:2,background:'#E2E8F0',display:'inline-block' }}></span>Planned</span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10,height:10,borderRadius:2,background:'#7C3AED',display:'inline-block' }}></span>Actual</span>
        </div>
      </div>

      {/* Mock trend */}
      {mocks.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Mock score progression</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:90, marginBottom:6 }}>
            {[...mocks].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(m => {
              const score = parseInt(m.total) || 0
              const all   = mocks.map(mk => parseInt(mk.total)||0)
              const maxS  = Math.max(...all, settings.targetScore+50)
              const minS  = Math.min(...all, 400) - 20
              const h     = Math.max(4, ((score-minS)/(maxS-minS||1))*74)
              const hit   = score >= settings.targetScore
              return (
                <div key={m.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <span style={{ fontSize:10, fontWeight:700, color: hit?'#10B981':'#7C3AED' }}>{score}</span>
                  <div style={{ width:'100%', borderRadius:4, background:hit?'#10B981':'#7C3AED', height:`${h}px`, transition:'height .4s' }} />
                  <span style={{ fontSize:9, color:'#94A3B8' }}>{new Date(m.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize:12, color:'#64748B', display:'flex', gap:16 }}>
            <span>Target: <strong>{settings.targetScore}</strong></span>
            <span style={{ color: parseInt(latestMock?.total)>=settings.targetScore?'#10B981':'#EF4444' }}>
              Gap: {Math.max(0, settings.targetScore-(parseInt(latestMock?.total)||0))} pts
            </span>
          </div>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// TopicsPage.jsx — Topic-level mastery tracker
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { Badge, ProgressBar as PBar, SearchBar, Select as Sel, EmptyState as Empty, cardStyle as cs, Label as Lbl, baseInput as bInp } from '../ui/index.jsx'
import { Button as Btn } from '../ui/index.jsx'
import { pct as p2 } from '../../utils/helpers.js'
import { deriveMastery as dm } from '../../utils/helpers.js'
import { SECTIONS as SECS, MASTERY_LEVELS as ML, PRIORITY as PRIO, sectionC as sc2, masteryC as mc2 } from '../../data/constants.js'

export function TopicsPage({ topics, setTopics }) {
  const [filter,  setFilter]  = useState('All')
  const [sort,    setSort]    = useState('accuracy')
  const [search,  setSearch]  = useState('')
  const [editing, setEditing] = useState(null)
  const upd = (idx, k, v) => setTopics(ts => ts.map((t, i) => i===idx ? { ...t, [k]:v } : t))
  const recalc = idx => setTopics(ts => ts.map((t, i) => i===idx ? { ...t, mastery: dm(t) } : t))

  const filtered = useMemo(() => {
    let ts = [...topics]
    if (filter !== 'All') ts = ts.filter(t => t.section === filter)
    if (search)           ts = ts.filter(t => t.topic.toLowerCase().includes(search.toLowerCase()))
    const sm = {
      accuracy:    (a,b) => a.accuracy - b.accuracy,
      masteryAsc:  (a,b) => ML.indexOf(a.mastery) - ML.indexOf(b.mastery),
      attempted:   (a,b) => b.attempted - a.attempted,
      lastStudied: (a,b) => new Date(b.lastStudied||0) - new Date(a.lastStudied||0),
      section:     (a,b) => a.section.localeCompare(b.section) || a.topic.localeCompare(b.topic),
    }
    return ts.sort(sm[sort] || sm.section)
  }, [topics, filter, sort, search])

  return (
    <div>
      {/* Section summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12, marginBottom:'1.5rem' }}>
        {SECS.map(s => {
          const st      = topics.filter(t => t.section === s)
          const sc      = sc2(s)
          const mastered = st.filter(t => ['Mastered','Strong'].includes(t.mastery)).length
          const avgAcc  = Math.round(st.reduce((a,t)=>a+t.accuracy,0)/(st.length||1))
          return (
            <div key={s} style={{ ...cs, borderTop:`3px solid ${sc.solid}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:sc.text, marginBottom:8 }}>{s}</div>
              <div style={{ display:'flex', gap:12, marginBottom:8 }}>
                <div><div style={{ fontSize:17, fontWeight:700, color:sc.solid }}>{p2(mastered,st.length)}%</div><div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4 }}>Mastered</div></div>
                <div><div style={{ fontSize:17, fontWeight:700, color:avgAcc>=70?'#10B981':avgAcc>=50?'#F59E0B':'#EF4444' }}>{avgAcc}%</div><div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4 }}>Avg acc</div></div>
                <div><div style={{ fontSize:17, fontWeight:700, color:'#475569' }}>{st.length}</div><div style={{ fontSize:9, color:'#94A3B8', textTransform:'uppercase', letterSpacing:.4 }}>Topics</div></div>
              </div>
              <PBar value={p2(mastered,st.length)} color={sc.solid} height={5} />
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search topics..." />
        {['All',...SECS].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'5px 12px', borderRadius:8, border:'1px solid', fontSize:12, cursor:'pointer',
            fontWeight: filter===f?700:400,
            borderColor: filter===f?'#7C3AED':'#E2E8F0',
            background: filter===f?'#EDE9FE':'#fff',
            color: filter===f?'#6D28D9':'#475569',
            fontFamily:'inherit',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <Sel value={sort} onChange={setSort} style={{ width:170 }}
            options={[
              {value:'accuracy',    label:'Weakest first'},
              {value:'masteryAsc',  label:'Mastery ↑'},
              {value:'attempted',   label:'Most attempted'},
              {value:'lastStudied', label:'Recently studied'},
              {value:'section',     label:'Section A–Z'},
            ]} />
        </div>
      </div>

      {/* Topics table */}
      <div style={cs}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:720 }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Topic','Section','Mastery','Accuracy','Attempts','Time','Last Studied',''].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:'#475569', whiteSpace:'nowrap', borderBottom:'1px solid #E2E8F0', fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const ri = topics.findIndex(x => x.section===t.section && x.topic===t.topic)
                const sc = sc2(t.section)
                const mc = mc2(t.mastery)
                return editing === ri ? (
                  <tr key={t.topic+t.section} style={{ background:'#F0F4FF' }}>
                    <td colSpan={8} style={{ padding:12 }}>
                      <div style={{ fontWeight:700, fontSize:12, marginBottom:10 }}>Editing: {t.topic}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:8 }}>
                        <div><Lbl text="Mastery"    /><Sel value={t.mastery}    onChange={v => upd(ri,'mastery',v)}    options={ML} /></div>
                        <div><Lbl text="Accuracy %" /><input type="number" min="0" max="100" style={bInp} value={t.accuracy}   onChange={e => upd(ri,'accuracy',+e.target.value)} /></div>
                        <div><Lbl text="Attempted"  /><input type="number" min="0"         style={bInp} value={t.attempted} onChange={e => upd(ri,'attempted',+e.target.value)} /></div>
                        <div><Lbl text="Correct"    /><input type="number" min="0"         style={bInp} value={t.correct}   onChange={e => upd(ri,'correct',+e.target.value)} /></div>
                        <div><Lbl text="Time (hrs)" /><input type="number" min="0" step=".5" style={bInp} value={t.timeSpent} onChange={e => upd(ri,'timeSpent',+e.target.value)} /></div>
                        <div><Lbl text="Concept done?"/><Sel value={t.conceptDone?'Yes':'No'} onChange={v => upd(ri,'conceptDone',v==='Yes')} options={['No','Yes']} /></div>
                        <div><Lbl text="Last studied"/><input type="date" style={bInp} value={t.lastStudied||''} onChange={e => upd(ri,'lastStudied',e.target.value)} /></div>
                        <div><Lbl text="Notes"      /><input style={bInp} value={t.notes||''} onChange={e => upd(ri,'notes',e.target.value)} /></div>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        <Btn onClick={() => recalc(ri)}>Recalculate mastery</Btn>
                        <Btn variant="primary" onClick={() => setEditing(null)}>Done</Btn>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={t.topic+t.section}
                    style={{ borderBottom:'1px solid #F1F5F9', cursor:'pointer', transition:'background .1s' }}
                    onClick={() => setEditing(ri)}
                    onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'9px 10px', fontWeight:600, color:'#1E293B' }}>{t.topic}</td>
                    <td style={{ padding:'9px 10px' }}><Badge text={t.section} color={sc} sm /></td>
                    <td style={{ padding:'9px 10px' }}><Badge text={t.mastery} color={mc} sm /></td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <PBar value={t.accuracy} color={t.accuracy>=70?'#10B981':t.accuracy>=50?'#F59E0B':'#EF4444'} height={4} style={{ width:50 }} />
                        <span style={{ fontWeight:700, color:t.accuracy>=70?'#10B981':t.accuracy>=50?'#F59E0B':'#EF4444' }}>{Math.round(t.accuracy)}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px', color:'#64748B' }}>{t.attempted}</td>
                    <td style={{ padding:'9px 10px', color:'#64748B' }}>{t.timeSpent}h</td>
                    <td style={{ padding:'9px 10px', color:'#94A3B8', fontSize:11 }}>{t.lastStudied||'—'}</td>
                    <td style={{ padding:'9px 10px' }}><span style={{ color:'#7C3AED', fontSize:11, fontWeight:600 }}>Edit ↗</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <Empty icon="🔍" title="No topics match" sub="Try a different search or filter." />}
        </div>
      </div>
    </div>
  )
}
