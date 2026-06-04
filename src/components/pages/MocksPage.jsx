import { useState, useMemo } from 'react'
import { Button, MetricCard, ProgressBar, Badge, SearchBar, Select, Label,
         EmptyState, cardStyle, baseInput } from '../ui/index.jsx'
import { calcReadiness } from '../../utils/scoring.js'
import { pct, fmtH, uid, todayStr } from '../../utils/helpers.js'
import {
  SECTIONS, ERROR_TYPES, TOPICS, DIFFICULTY, PRIORITY, sectionC, diffC, prioC, C
} from '../../data/constants.js'
import { mkDefaultTopics, mkSampleWeek, mkSampleMocks, mkSampleErrors, mkDefaultSettings } from '../../data/sampleData.js'

// ═══════════════════════════════════════════════════════════════════════════
// MocksPage
// ═══════════════════════════════════════════════════════════════════════════
const emptyMockForm = () => ({
  name:'', date:todayStr(), total:0, quant:0, verbal:0, di:0, percentile:'',
  timingNotes:'', guessed:0, sillyMistakes:0, conceptErrors:0, timingErrors:0,
  weakAreas:'', reviewed:false, actionItems:'',
})

export function MocksPage({ mocks, setMocks, settings }) {
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(emptyMockForm())
  const [editingId,  setEditingId]  = useState(null)
  const [search,     setSearch]     = useState('')
  const u = (k, v) => setForm(f => ({ ...f, [k]:v }))

  const save = () => {
    if (!form.total) { alert('Total score is required.'); return }
    editingId
      ? setMocks(ms => ms.map(m => m.id===editingId ? { ...form, id:editingId } : m))
      : setMocks(ms => [...ms, { ...form, id:uid() }])
    setForm(emptyMockForm()); setShowForm(false); setEditingId(null)
  }

  const sorted = [...mocks]
    .sort((a,b) => new Date(b.date)-new Date(a.date))
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))

  const bestMock  = mocks.length ? Math.max(...mocks.map(m=>parseInt(m.total)||0)) : 0
  const latestMock= sorted[0]
  const avgMock   = mocks.length ? Math.round(mocks.reduce((a,m)=>a+(parseInt(m.total)||0),0)/mocks.length) : 0

  return (
    <div style={{ maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:8 }}>
        <div><div style={{ fontSize:20, fontWeight:700, color:'#1E293B' }}>Mock Test Tracker</div><div style={{ fontSize:12, color:'#64748B' }}>{mocks.length} test{mocks.length!==1?'s':''} logged</div></div>
        <div style={{ display:'flex', gap:8 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search mocks..." />
          <Button variant="amber" onClick={() => { setShowForm(s=>!s); setEditingId(null); setForm(emptyMockForm()) }}>+ Log mock</Button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:'1.5rem' }}>
        <MetricCard label="Mocks taken"   value={mocks.length}   color="#F59E0B" icon="📋" />
        <MetricCard label="Best score"    value={bestMock||'—'}  color="#10B981" icon="🏆" />
        <MetricCard label="Latest"        value={latestMock?.total||'—'} color="#7C3AED" icon="📅" />
        <MetricCard label="Average"       value={avgMock||'—'}   color="#2563EB" icon="📊" />
        <MetricCard label="Gap to target" value={bestMock?Math.max(0,settings.targetScore-bestMock):'—'} color={bestMock>=settings.targetScore?'#10B981':'#EF4444'} sub="from best" />
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom:'1.5rem', border:`2px solid ${C.mock.solid}` }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{editingId?'Edit':'Log new'} mock test</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8 }}>
            {[['name','Mock name','text'],['date','Date','date'],['total','Total score *','number'],['quant','Quant','number'],['verbal','Verbal','number'],['di','Data Insights','number'],['percentile','Percentile','text'],['guessed','Guessed','number'],['sillyMistakes','Silly errors','number'],['conceptErrors','Concept errors','number'],['timingErrors','Timing errors','number']].map(([k,l,type]) => (
              <div key={k}>
                <Label text={l} />
                <input type={type} style={{ ...baseInput, borderColor:k==='total'&&!form.total?'#FCA5A5':'#E2E8F0' }} value={form[k]} onChange={e=>u(k,e.target.value)} />
              </div>
            ))}
            <div><Label text="Review done?" /><Select value={form.reviewed?'Yes':'No'} onChange={v=>u('reviewed',v==='Yes')} options={['No','Yes']} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
            <div><Label text="Weak areas"   /><input style={baseInput} value={form.weakAreas}   onChange={e=>u('weakAreas',e.target.value)}   placeholder="e.g. Number Properties, CR Inference" /></div>
            <div><Label text="Timing notes" /><input style={baseInput} value={form.timingNotes} onChange={e=>u('timingNotes',e.target.value)} /></div>
            <div style={{ gridColumn:'1/-1' }}><Label text="Action items" /><textarea style={{ ...baseInput, resize:'vertical', minHeight:50 }} value={form.actionItems} onChange={e=>u('actionItems',e.target.value)} /></div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Button variant="amber" onClick={save}>Save mock</Button>
            <Button onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
          </div>
        </div>
      )}

      {mocks.length===0 && <EmptyState icon="🎯" title="No mocks logged yet" sub="Log your first mock test to track score progression." action={<Button variant="amber" onClick={()=>setShowForm(true)}>+ Log first mock</Button>} />}

      {sorted.map(m => (
        <div key={m.id} style={{ ...cardStyle, marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{m.name||'Mock Test'}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Badge text={m.date} color={C.neutral} />
                {m.percentile && <Badge text={`${m.percentile}th pct`} color={C.quant} />}
                {m.reviewed ? <Badge text="✓ Reviewed" color={C.green} /> : <Badge text="Review pending" color={C.amber} />}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ fontSize:30, fontWeight:800, color:parseInt(m.total)>=settings.targetScore?'#10B981':'#7C3AED' }}>{m.total}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <Button style={{ fontSize:11, padding:'3px 9px' }} onClick={() => { setForm({...m}); setEditingId(m.id); setShowForm(true) }}>Edit</Button>
                <Button style={{ fontSize:11, padding:'3px 9px', background:C.red.bg, borderColor:C.red.border, color:C.red.text }} onClick={() => setMocks(ms=>ms.filter(x=>x.id!==m.id))}>Delete</Button>
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))', gap:7, marginBottom:8 }}>
            {[['Quant',m.quant,C.quant],['Verbal',m.verbal,C.verbal],['Data Insights',m.di,C.di],['Guessed',m.guessed,C.amber],['Silly',m.sillyMistakes,C.red],['Concept err',m.conceptErrors,C.error]].map(([l,v,c]) => (
              <div key={l} style={{ background:c.bg, borderRadius:8, padding:'5px 9px', border:`1px solid ${c.border}` }}>
                <div style={{ fontSize:9, color:c.text, fontWeight:700, marginBottom:1, textTransform:'uppercase', letterSpacing:.4 }}>{l}</div>
                <div style={{ fontSize:15, fontWeight:700, color:c.text }}>{v||'—'}</div>
              </div>
            ))}
          </div>
          {(m.weakAreas||m.actionItems) && (
            <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {m.weakAreas   && <div><div style={{ fontSize:10, fontWeight:700, color:C.red.text,    marginBottom:2 }}>WEAK AREAS</div><div style={{ fontSize:12, color:'#64748B' }}>{m.weakAreas}</div></div>}
              {m.actionItems && <div><div style={{ fontSize:10, fontWeight:700, color:'#7C3AED',     marginBottom:2 }}>ACTIONS</div><div style={{ fontSize:12, color:'#64748B' }}>{m.actionItems}</div></div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// ErrorsPage
// ═══════════════════════════════════════════════════════════════════════════
const emptyErrForm = () => ({
  date:todayStr(), section:'Quant', topic:'Arithmetic', source:'', qid:'',
  errorType:'Concept Gap', difficulty:'Medium', correctAnswer:'', myAnswer:'',
  explanation:'', lesson:'', reattemptDate:'', resolved:false,
})

export function ErrorsPage({ errors, setErrors }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(emptyErrForm())
  const [editId, setEditId]     = useState(null)
  const [filters, setFilters]   = useState({ section:'All', type:'All', resolved:'All' })
  const [search,  setSearch]    = useState('')
  const u  = (k,v) => setForm(f=>({...f,[k]:v}))
  const uf = (k,v) => setFilters(f=>({...f,[k]:v}))

  const save = () => {
    if (!form.topic||!form.errorType) { alert('Topic and error type are required.'); return }
    editId ? setErrors(es=>es.map(e=>e.id===editId?{...form,id:editId}:e))
           : setErrors(es=>[...es,{...form,id:uid()}])
    setForm(emptyErrForm()); setShowForm(false); setEditId(null)
  }

  const filtered = useMemo(() => errors.filter(e => {
    if (filters.section!=='All'&&e.section!==filters.section) return false
    if (filters.type!=='All'&&e.errorType!==filters.type)      return false
    if (filters.resolved==='Resolved'&&!e.resolved)             return false
    if (filters.resolved==='Unresolved'&&e.resolved)            return false
    if (search&&!e.topic.toLowerCase().includes(search.toLowerCase())&&!(e.lesson||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [errors, filters, search])

  const typeBreak = ERROR_TYPES.map(t=>({t,n:errors.filter(e=>e.errorType===t).length})).sort((a,b)=>b.n-a.n)
  const maxE      = Math.max(...typeBreak.map(x=>x.n), 1)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:8 }}>
        <div><div style={{ fontSize:20, fontWeight:700, color:'#1E293B' }}>Error Log</div><div style={{ fontSize:12, color:'#64748B' }}>{errors.filter(e=>!e.resolved).length} unresolved · {errors.filter(e=>e.resolved).length} resolved</div></div>
        <Button variant="red" onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm(emptyErrForm())}}>+ Log error</Button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Error types</div>
          {typeBreak.filter(x=>x.n>0).length===0 && <EmptyState icon="✅" title="No errors yet" sub="" />}
          {typeBreak.filter(x=>x.n>0).map(x => (
            <div key={x.t} style={{ marginBottom:7 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span style={{ fontSize:12 }}>{x.t}</span><span style={{ fontSize:12, fontWeight:700, color:C.red.solid }}>{x.n}</span></div>
              <ProgressBar value={pct(x.n,maxE)} color="#EF4444" height={4} />
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>By section</div>
          {SECTIONS.map(s => {
            const n = errors.filter(e=>e.section===s).length; const sc=sectionC(s)
            return (
              <div key={s} style={{ marginBottom:7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span style={{ fontSize:12, color:sc.text, fontWeight:600 }}>{s}</span><span style={{ fontSize:12, fontWeight:700, color:sc.solid }}>{n}</span></div>
                <ProgressBar value={pct(n,errors.length||1)} color={sc.solid} height={4} />
              </div>
            )
          })}
          <div style={{ marginTop:8, fontSize:12, color:'#94A3B8' }}>Resolution: <strong style={{ color:'#10B981' }}>{errors.length?pct(errors.filter(e=>e.resolved).length,errors.length):0}%</strong></div>
        </div>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom:'1.5rem', border:`2px solid ${C.error.solid}` }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{editId?'Edit':'Log new'} error</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8 }}>
            <div><Label text="Date"     /><input type="date" style={baseInput} value={form.date}     onChange={e=>u('date',e.target.value)} /></div>
            <div><Label text="Section"  /><Select value={form.section}  onChange={v=>{u('section',v);u('topic',TOPICS[v][0])}} options={SECTIONS} /></div>
            <div><Label text="Topic"    /><Select value={form.topic}    onChange={v=>u('topic',v)}    options={TOPICS[form.section]||[]} /></div>
            <div><Label text="Error type"/><Select value={form.errorType} onChange={v=>u('errorType',v)} options={ERROR_TYPES} /></div>
            <div><Label text="Difficulty"/><Select value={form.difficulty} onChange={v=>u('difficulty',v)} options={DIFFICULTY} /></div>
            <div><Label text="Source"   /><input style={baseInput} value={form.source}  onChange={e=>u('source',e.target.value)}  placeholder="OG, GMATPrep..." /></div>
            <div><Label text="Q ID"     /><input style={baseInput} value={form.qid}     onChange={e=>u('qid',e.target.value)} /></div>
            <div><Label text="My answer"/><input style={baseInput} value={form.myAnswer}onChange={e=>u('myAnswer',e.target.value)} /></div>
            <div><Label text="Correct"  /><input style={baseInput} value={form.correctAnswer} onChange={e=>u('correctAnswer',e.target.value)} /></div>
            <div><Label text="Reattempt"/><input type="date" style={baseInput} value={form.reattemptDate} onChange={e=>u('reattemptDate',e.target.value)} /></div>
            <div style={{ display:'flex', gap:6, alignItems:'center', paddingTop:18 }}><input type="checkbox" checked={form.resolved} onChange={e=>u('resolved',e.target.checked)} /><label style={{ fontSize:13 }}>Mark resolved</label></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
            <div><Label text="Explanation"/><textarea style={{ ...baseInput, resize:'vertical', minHeight:55 }} value={form.explanation} onChange={e=>u('explanation',e.target.value)} /></div>
            <div><Label text="Lesson learned"/><textarea style={{ ...baseInput, resize:'vertical', minHeight:55 }} value={form.lesson} onChange={e=>u('lesson',e.target.value)} /></div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <Button variant="red" onClick={save}>Save error</Button>
            <Button onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</Button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem', alignItems:'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search errors..." />
        <Select value={filters.section} onChange={v=>uf('section',v)} options={[{value:'All',label:'All sections'},...SECTIONS.map(s=>({value:s,label:s}))]} style={{ width:150 }} />
        <Select value={filters.type}    onChange={v=>uf('type',v)}    options={[{value:'All',label:'All types'},...ERROR_TYPES.map(t=>({value:t,label:t}))]} style={{ width:175 }} />
        <Select value={filters.resolved}onChange={v=>uf('resolved',v)} options={['All','Resolved','Unresolved']} style={{ width:135 }} />
      </div>

      {filtered.length===0 && <EmptyState icon="✅" title="No errors match filters" sub="Adjust filters or log a new error." />}

      {filtered.map(e => (
        <div key={e.id} style={{ ...cardStyle, marginBottom:8, borderLeft:`3px solid ${e.resolved?C.green.solid:C.error.solid}`, opacity:e.resolved?.72:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:5 }}>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              <Badge text={e.section}   color={sectionC(e.section)} sm />
              <Badge text={e.topic}     color={C.neutral} sm />
              <Badge text={e.errorType} color={C.error}   sm />
              <Badge text={e.difficulty}color={diffC(e.difficulty)} sm />
              {e.resolved ? <Badge text="✓ Resolved" color={C.green} sm /> : <Badge text="Unresolved" color={C.error} sm />}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <Button style={{ fontSize:11, padding:'3px 9px', background:'#F1F5F9', border:'none' }} onClick={()=>setErrors(es=>es.map(x=>x.id===e.id?{...x,resolved:!x.resolved}:x))}>{e.resolved?'Unresolve':'Resolve'}</Button>
              <Button style={{ fontSize:11, padding:'3px 9px', background:'#EDE9FE', border:'none', color:'#6D28D9' }} onClick={()=>{setForm({...e});setEditId(e.id);setShowForm(true)}}>Edit</Button>
              <Button style={{ fontSize:11, padding:'3px 9px', background:C.red.bg, border:'none', color:C.red.text }} onClick={()=>setErrors(es=>es.filter(x=>x.id!==e.id))}>×</Button>
            </div>
          </div>
          <div style={{ fontSize:11, color:'#94A3B8', marginBottom:3 }}>
            {e.date}{e.source?` · ${e.source}`:''}{e.qid?` · Q${e.qid}`:''}{e.reattemptDate?` · Reattempt: ${e.reattemptDate}`:''}
          </div>
          {e.lesson && <div style={{ fontSize:12, color:'#1E293B', fontStyle:'italic' }}>💡 {e.lesson}</div>}
        </div>
      ))}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// AnalyticsPage
// ═══════════════════════════════════════════════════════════════════════════
export function AnalyticsPage({ weeks, mocks, topics, errors, settings }) {
  const allTasks   = weeks.flatMap(w=>w.days.flatMap(d=>d.tasks))
  const done       = allTasks.filter(t=>t.status==='Completed').length
  const totalHrs   = weeks.reduce((a,w)=>a+w.days.reduce((b,d)=>b+(d.hoursLogged||0),0),0)
  const plannedHrs = weeks.reduce((a,w)=>a+(w.goals?.hours||0),0)
  const avgDailyHrs= weeks.length>0 ? Math.round(totalHrs/(weeks.length*7)*10)/10 : 0
  const {score:readiness,breakdown,overallAcc,avgMock} =
    useMemo(()=>calcReadiness({topics,mocks,weeks,errors,settings}),[topics,mocks,weeks,errors,settings])
  const latestMock   = [...mocks].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const unresolvedE  = errors.filter(e=>!e.resolved).length
  const mostCommonE  = ERROR_TYPES.map(t=>({t,n:errors.filter(e=>e.errorType===t).length})).sort((a,b)=>b.n-a.n)[0]
  const deferred     = allTasks.filter(t=>t.status==='Deferred').length
  const burnout      = Math.min(100,Math.round((deferred/Math.max(allTasks.length,1)*40)+(avgDailyHrs>5?40:avgDailyHrs>4?20:0)+(unresolvedE>8?20:unresolvedE>4?10:0)))
  const weakTopics   = [...topics].filter(t=>t.attempted>0).sort((a,b)=>a.accuracy-b.accuracy).slice(0,6)
  const strongTopics = [...topics].filter(t=>t.attempted>0).sort((a,b)=>b.accuracy-a.accuracy).slice(0,6)
  const wData        = weeks.map(w=>({ label:w.label.split(' ').slice(0,2).join(' '), planned:w.goals?.hours||0, actual:w.days.reduce((a,d)=>a+(d.hoursLogged||0),0) }))

  // Smart insights
  const insights = []
  if(done<allTasks.length*.5&&allTasks.length>5) insights.push({type:'warn',msg:`Only ${pct(done,allTasks.length)}% of planned tasks completed. Use the Rebalancing Engine to catch up.`})
  if(latestMock&&settings.targetScore>0){const gap=settings.targetScore-parseInt(latestMock.total);insights.push({type:gap<=0?'good':'warn',msg:gap<=0?`Latest mock (${latestMock.total}) meets your target! 🎉`:`Latest mock (${latestMock.total}) is ${gap} pts below target.`})}
  if(weakTopics.length>0) insights.push({type:'info',msg:`Weakest area: ${weakTopics[0].topic} at ${Math.round(weakTopics[0].accuracy)}%. Schedule focused practice.`})
  if(unresolvedE>5) insights.push({type:'warn',msg:`${unresolvedE} unresolved error log entries. Schedule a review session.`})
  if(mostCommonE&&mostCommonE.n>2) insights.push({type:'info',msg:`Most frequent error: "${mostCommonE.t}" (${mostCommonE.n} entries). Review strategy.`})
  if(burnout>50) insights.push({type:'warn',msg:`Burnout risk ${burnout}%. ${deferred} deferred tasks. Scale back load.`})
  if(avgDailyHrs>0&&avgDailyHrs<1.5) insights.push({type:'warn',msg:`Avg daily study: ${avgDailyHrs}h — below target. Aim for 2–3h/day.`})
  if(mocks.length>=2){const s=[...mocks].sort((a,b)=>new Date(a.date)-new Date(b.date));const delta=parseInt(s[s.length-1].total)-parseInt(s[0].total);if(delta>0)insights.push({type:'good',msg:`Mock score up +${delta} pts since first attempt!`})}

  const iStyles = { warn:{bg:'#FFFBEB',border:'#FDE68A',text:'#92400E',icon:'⚠'}, good:{bg:'#F0FDF4',border:'#86EFAC',text:'#14532D',icon:'✓'}, info:{bg:'#EFF6FF',border:'#BFDBFE',text:'#1E40AF',icon:'ℹ'} }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:'1.5rem' }}>
        <MetricCard label="Readiness"    value={`${readiness}%`} color={readiness>=75?'#10B981':readiness>=50?'#7C3AED':'#EF4444'} sub="estimated" />
        <MetricCard label="Completion"   value={`${pct(done,allTasks.length)}%`} color="#7C3AED" />
        <MetricCard label="Avg accuracy" value={`${overallAcc}%`} color={overallAcc>=70?'#10B981':overallAcc>=50?'#F59E0B':'#EF4444'} />
        <MetricCard label="Avg daily hrs"value={`${avgDailyHrs}h`} color="#2563EB" />
        <MetricCard label="Hours planned"value={`${Math.round(plannedHrs)}h`} color="#64748B" sub={`Actual: ${Math.round(totalHrs)}h`} />
        <MetricCard label="Burnout risk" value={`${burnout}%`} color={burnout>60?'#EF4444':burnout>30?'#F59E0B':'#10B981'} />
      </div>

      {/* Insights */}
      <div style={{ ...cardStyle, marginBottom:'1.5rem' }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Smart insights</div>
        {insights.length===0 && <EmptyState icon="📊" title="Keep studying" sub="Insights appear as you log more data, mocks, and errors." />}
        {insights.map((ins,i) => { const st=iStyles[ins.type]; return (
          <div key={i} style={{ background:st.bg, border:`1px solid ${st.border}`, borderLeft:`3px solid ${st.border}`, borderRadius:8, padding:'9px 14px', marginBottom:8, color:st.text, fontSize:13, display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ flexShrink:0, fontWeight:700, marginTop:1 }}>{st.icon}</span><span>{ins.msg}</span>
          </div>
        )})}
      </div>

      {/* Planned vs Actual */}
      <div style={{ ...cardStyle, marginBottom:'1.5rem' }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Planned vs actual study hours per week</div>
        <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:90, marginBottom:8 }}>
          {wData.map((w,i) => {
            const maxH = Math.max(...wData.map(x=>Math.max(x.planned,x.actual)),1)
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <div style={{ display:'flex', gap:2, alignItems:'flex-end', width:'100%', height:70 }}>
                  <div title={`Planned: ${w.planned}h`} style={{ flex:1, borderRadius:'3px 3px 0 0', background:'#E2E8F0', height:`${(w.planned/maxH)*65}px`, minHeight:2 }} />
                  <div title={`Actual: ${w.actual}h`}   style={{ flex:1, borderRadius:'3px 3px 0 0', background:'#7C3AED',  height:`${(w.actual/maxH)*65}px`,  minHeight:2 }} />
                </div>
                <span style={{ fontSize:8, color:'#94A3B8', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{w.label}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:16, fontSize:11 }}>
          <span style={{ display:'flex', gap:5, alignItems:'center' }}><span style={{ width:10,height:10,borderRadius:2,background:'#E2E8F0',display:'inline-block' }}></span>Planned</span>
          <span style={{ display:'flex', gap:5, alignItems:'center' }}><span style={{ width:10,height:10,borderRadius:2,background:'#7C3AED',display:'inline-block' }}></span>Actual</span>
        </div>
      </div>

      {/* Weak / Strong */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, color:C.error.text, marginBottom:10 }}>Weakest topics</div>
          {weakTopics.length===0 && <EmptyState icon="📉" title="Attempt questions" sub="" />}
          {weakTopics.map(t => (
            <div key={t.topic} style={{ marginBottom:7 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span style={{ fontSize:12, fontWeight:500 }}>{t.topic}</span><span style={{ fontSize:12, fontWeight:700, color:C.error.solid }}>{Math.round(t.accuracy)}%</span></div>
              <ProgressBar value={t.accuracy} color="#EF4444" height={4} />
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, color:C.green.text, marginBottom:10 }}>Strongest topics</div>
          {strongTopics.length===0 && <EmptyState icon="📈" title="Attempt questions" sub="" />}
          {strongTopics.map(t => (
            <div key={t.topic} style={{ marginBottom:7 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span style={{ fontSize:12, fontWeight:500 }}>{t.topic}</span><span style={{ fontSize:12, fontWeight:700, color:C.green.solid }}>{Math.round(t.accuracy)}%</span></div>
              <ProgressBar value={t.accuracy} color="#22C55E" height={4} />
            </div>
          ))}
        </div>
      </div>

      {/* Readiness breakdown */}
      <div style={cardStyle}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Readiness factor breakdown</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>
          {[['Mock proximity',breakdown.mockProx,'#F59E0B','30%'],['Accuracy',breakdown.overallAcc,'#10B981','25%'],['Syllabus',breakdown.syllabus,'#7C3AED','20%'],['Consistency',breakdown.consistency,'#2563EB','15%'],['Error resolution',breakdown.errRate,'#EF4444','10%']].map(([l,v,c,w])=>(
            <div key={l} style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:11, color:'#475569', fontWeight:600 }}>{l}</span><span style={{ fontSize:10, color:'#94A3B8' }}>{w} weight</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><ProgressBar value={v} color={c} height={6} style={{ flex:1 }}/><span style={{ fontSize:12, fontWeight:700, color:c }}>{v}%</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// SettingsPage
// ═══════════════════════════════════════════════════════════════════════════
export function SettingsPage({ settings, setSettings, weeks, setWeeks, setMocks, setErrors, setTopics }) {
  const u = (k,v) => setSettings(s=>({...s,[k]:v}))
  const [importErr, setImportErr] = useState('')
  const [importOk,  setImportOk]  = useState('')

  const exportData = () => {
    const payload = {
      schemaVersion: 2,
      exportDate: new Date().toISOString(),
      weeks:    JSON.parse(localStorage.getItem('gmat4_weeks')    || '[]'),
      topics:   JSON.parse(localStorage.getItem('gmat4_topics')   || '[]'),
      mocks:    JSON.parse(localStorage.getItem('gmat4_mocks')    || '[]'),
      errors:   JSON.parse(localStorage.getItem('gmat4_errors')   || '[]'),
      settings: JSON.parse(localStorage.getItem('gmat4_settings') || '{}'),
    }
    const a = document.createElement('a')
    a.href     = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    a.download = `gmat_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const importData = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.json')) { setImportErr('Please select a .json file.'); return }
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result)
        if (!d.weeks && !d.topics && !d.mocks && !d.errors) { setImportErr('Invalid backup file — missing expected keys.'); return }
        if (d.weeks)    setWeeks(d.weeks)
        if (d.topics)   setTopics(d.topics)
        if (d.mocks)    setMocks(d.mocks)
        if (d.errors)   setErrors(d.errors)
        if (d.settings) setSettings(d.settings)
        setImportErr(''); setImportOk(`Imported (schema v${d.schemaVersion||1}) at ${new Date().toLocaleTimeString()}.`)
      } catch(ex) { setImportErr('Failed to parse: ' + ex.message) }
    }
    r.onerror = () => setImportErr('Could not read file.')
    r.readAsText(file)
    e.target.value = ''
  }

  const resetAll = () => {
    if (!window.confirm('Reset ALL data to sample data? Cannot be undone.')) return
    setWeeks([mkSampleWeek()])
    setSettings(mkDefaultSettings())
    setTopics(mkDefaultTopics())
    setMocks(mkSampleMocks())
    setErrors(mkSampleErrors())
    setImportOk('Sample data restored.')
  }

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ fontSize:20, fontWeight:700, color:'#1E293B', marginBottom:'1.5rem' }}>Settings & Data</div>

      <div style={{ ...cardStyle, marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Exam configuration</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[['targetScore','Target GMAT score','number'],['examDate','Exam date','date'],['startDate','Study start date','date'],['weeklyHours','Weekly hour target','number'],['maxDailyHours','Max daily hours','number']].map(([k,l,type]) => (
            <div key={k}><Label text={l}/><input type={type} style={baseInput} value={settings[k]||''} onChange={e=>u(k,type==='number'?+e.target.value:e.target.value)} /></div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Preferences</div>
        {[['autoRebalance','Suggest rebalance after saving daily log'],['showCompleted','Show completed tasks in lists']].map(([k,l]) => (
          <label key={k} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, cursor:'pointer', fontSize:13, color:'#475569' }}>
            <input type="checkbox" checked={!!settings[k]} onChange={e=>u(k,e.target.checked)} style={{ width:15, height:15 }} />
            {l}
          </label>
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Data management</div>
        {importErr && <div style={{ background:C.red.bg,  border:`1px solid ${C.red.border}`,  borderRadius:8, padding:'8px 12px', marginBottom:10, color:C.red.text,   fontSize:12 }}>⚠ {importErr}</div>}
        {importOk  && <div style={{ background:C.green.bg,border:`1px solid ${C.green.border}`,borderRadius:8, padding:'8px 12px', marginBottom:10, color:C.green.text, fontSize:12 }}>✓ {importOk}</div>}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          <Button variant="primary" onClick={exportData}>⬇ Export JSON</Button>
          <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', background:'#10B981', color:'#fff', border:'1px solid #10B981' }}>
            ⬆ Import JSON
            <input type="file" accept=".json" style={{ display:'none' }} onChange={importData} />
          </label>
          <Button variant="amber" onClick={()=>{setWeeks([mkSampleWeek()]);setMocks(mkSampleMocks());setErrors(mkSampleErrors());setTopics(mkDefaultTopics());setImportOk('Sample data loaded.')}}>🔄 Load sample data</Button>
        </div>
        <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:12 }}>
          <div style={{ fontSize:12, color:'#94A3B8', marginBottom:8 }}>Danger zone — cannot be undone</div>
          <Button variant="red" onClick={resetAll}>⚠ Reset all data</Button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Quick reference</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {[
            ['📅 Today','Daily workflow — tasks, hours, quick rebalance'],
            ['📋 Weekly Planner','Set up weeks, auto-generate from goals'],
            ['✏️ Daily Progress','Log questions, accuracy, energy'],
            ['⚖️ Rebalancing','Priority-aware capacity-respecting redistribution'],
            ['📊 GMAT Progress','Readiness score with factor breakdown'],
            ['🗂️ Topics','Mastery per topic — click any row to edit'],
            ['🎯 Mock Tests','Full mock tracking with section scores'],
            ['🔴 Error Log','Capture, filter, and resolve every mistake'],
            ['💡 Analytics','Planned vs actual, insights, burnout risk'],
            ['⚙️ Settings','Config, export/import, sample data'],
          ].map(([t,d]) => (
            <div key={t} style={{ background:'#F8FAFC', borderRadius:8, padding:'7px 10px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#1E293B', marginBottom:2 }}>{t}</div>
              <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.4 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
