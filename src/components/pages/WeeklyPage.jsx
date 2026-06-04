// ═══════════════════════════════════════════════════════════════════════════
// WeeklyPage.jsx
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useMemo } from 'react'
import { Button, MetricCard, ProgressBar, EmptyState, Modal, Label, Select, cardStyle, baseInput } from '../ui/index.jsx'
import { TaskCard } from '../tasks/TaskCard.jsx'
import { TaskForm } from '../tasks/TaskForm.jsx'
import { pct, fmtH, uid, todayStr, todayName } from '../../utils/helpers.js'
import { DAYS, TOPICS, INTENSITY } from '../../data/constants.js'

export function WeeklyPage({ weeks, setWeeks, activeWk, setActiveWk, updateWeek, week, settings, topics }) {
  const [editTask,    setEditTask]    = useState(null)
  const [addDay,      setAddDay]      = useState(null)
  const [showNewWeek, setShowNewWeek] = useState(false)
  const [newWkLabel,  setNewWkLabel]  = useState('')
  const [showGoals,   setShowGoals]   = useState(false)

  const updDayTasks = (di, fn) =>
    updateWeek(w => ({ ...w, days: w.days.map((d, i) => i === di ? { ...d, tasks: fn(d.tasks) } : d) }))

  const toggleTask  = (di, ti) => updDayTasks(di, ts => ts.map((t, j) => j === ti ? { ...t, status: t.status === 'Completed' ? 'Not Started' : 'Completed' } : t))
  const deleteTask  = (di, ti) => updDayTasks(di, ts => ts.filter((_, j) => j !== ti))

  const saveTask = t => {
    if (t._moveDay && t._moveDay !== '') {
      updateWeek(w => {
        const fromDi = w.days.findIndex(d => d.tasks.find(x => x.id === t.id))
        const toDi   = w.days.findIndex(d => d.name === t._moveDay)
        const { _moveDay, ...clean } = t
        return {
          ...w, days: w.days.map((d, i) => {
            if (i === fromDi) return { ...d, tasks: d.tasks.filter(x => x.id !== t.id) }
            if (i === toDi)   return { ...d, tasks: [...d.tasks, clean] }
            return d
          }),
        }
      })
    } else {
      updateWeek(w => ({ ...w, days: w.days.map(d => ({ ...d, tasks: d.tasks.map(x => x.id === t.id ? t : x) })) }))
    }
    setEditTask(null)
  }

  const addTask = (di, t) => { updDayTasks(di, ts => [...ts, t]); setAddDay(null) }

  // Auto-generate tasks distributed across available days from weekly goals
  const autoGenerate = () => {
    const g = week.goals
    const avail = week.days.filter(d => d.available)
    if (!avail.length) return
    const pool = []
    TOPICS.Quant.slice(0, g.quant).forEach(tp =>
      pool.push({ section:'Quant', title:`Quant Practice — ${tp}`, topic:tp, type:'Practice Questions', estTime:40, difficulty:'Medium', priority:'High' })
    )
    TOPICS.Verbal.slice(0, g.verbal).forEach(tp =>
      pool.push({ section:'Verbal', title:`Verbal Practice — ${tp}`, topic:tp, type:'Practice Questions', estTime:35, difficulty:'Medium', priority:'High' })
    )
    TOPICS['Data Insights'].slice(0, g.di).forEach(tp =>
      pool.push({ section:'Data Insights', title:`DI Practice — ${tp}`, topic:tp, type:'Practice Questions', estTime:40, difficulty:'Medium', priority:'Medium' })
    )
    for (let i = 0; i < g.mocks; i++)
      pool.push({ section:'Quant', title:`Mock Test ${i+1}`, topic:'Arithmetic', type:'Mock Test', estTime:180, difficulty:'Hard', priority:'Critical', locked:true })
    for (let i = 0; i < g.revision; i++)
      pool.push({ section:'Quant', title:`Revision ${i+1}`, topic:'Arithmetic', type:'Revision', estTime:60, difficulty:'Medium', priority:'Medium' })
    for (let i = 0; i < g.errorLog; i++)
      pool.push({ section:'Quant', title:`Error Log Review ${i+1}`, topic:'Number Properties', type:'Error Log', estTime:30, difficulty:'Medium', priority:'High' })

    const newDays = week.days.map(d => ({ ...d, tasks: [...d.tasks] }))
    pool.forEach((td, i) => {
      const di = week.days.indexOf(avail[i % avail.length])
      if (di >= 0)
        newDays[di].tasks.push({ ...td, id: uid(), status: 'Not Started', notes: '', date: todayStr(), locked: td.locked || false })
    })
    updateWeek(w => ({ ...w, days: newDays }))
  }

  const totT  = week.days.reduce((a, d) => a + d.tasks.length, 0)
  const doneT = week.days.reduce((a, d) => a + d.tasks.filter(t => t.status === 'Completed').length, 0)
  const logH  = week.days.reduce((a, d) => a + (d.hoursLogged || 0), 0)

  return (
    <div>
      {/* Week selector bar */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {weeks.map((w, i) => (
            <button key={w.id} onClick={() => setActiveWk(i)} style={{
              padding:'6px 14px', borderRadius:8, border:'1px solid', fontSize:13, cursor:'pointer',
              fontWeight: i===activeWk ? 700 : 400,
              borderColor: i===activeWk ? '#7C3AED' : '#E2E8F0',
              background: i===activeWk ? '#EDE9FE' : '#fff',
              color: i===activeWk ? '#6D28D9' : '#475569',
              fontFamily:'inherit',
            }}>{w.label}</button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setShowNewWeek(s => !s)}>+ New week</Button>
        <Button variant="green"   onClick={autoGenerate}>⟳ Auto-generate</Button>
        <Button                   onClick={() => setShowGoals(s => !s)}>⚙ Goals</Button>
      </div>

      {showNewWeek && (
        <div style={{ ...cardStyle, marginBottom:'1rem', display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div>
            <Label text="Week label" />
            <input
              style={{ ...baseInput, width:240 }}
              placeholder="e.g. Week 4 — Verbal Focus"
              value={newWkLabel}
              onChange={e => setNewWkLabel(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => {
            const w = {
              id: uid(), label: newWkLabel || `Week ${weeks.length + 1}`,
              start: todayStr(), end: '',
              goals: { hours:20, quant:8, verbal:6, di:4, mocks:1, questions:80, revision:2, errorLog:2 },
              days: DAYS.map(n => ({
                name:n, available:true, hours:3, intensity:'Medium',
                allowMock:false, preferRevision:false, tasks:[],
                hoursLogged:0, notes:'', attempted:0, correct:0,
                energy:'Medium', confidence:'Medium', wellNotes:'', hardNotes:'',
              })),
              locked: false,
            }
            setWeeks(ws => [...ws, w])
            setActiveWk(weeks.length)
            setNewWkLabel('')
            setShowNewWeek(false)
          }}>Create</Button>
          <Button onClick={() => setShowNewWeek(false)}>Cancel</Button>
        </div>
      )}

      {showGoals && (
        <div style={{ ...cardStyle, marginBottom:'1.25rem' }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Weekly goals</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:14 }}>
            {[['hours','Target hours'],['quant','Quant tasks'],['verbal','Verbal tasks'],['di','DI tasks'],['mocks','Mock tests'],['questions','Questions'],['revision','Revision'],['errorLog','Error log reviews']].map(([k, l]) => (
              <div key={k}>
                <Label text={l} />
                <input type="number" min="0" style={baseInput} value={week.goals[k] || 0}
                  onChange={e => updateWeek(w => ({ ...w, goals: { ...w.goals, [k]: +e.target.value } }))} />
              </div>
            ))}
          </div>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Day availability</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(115px,1fr))', gap:8 }}>
            {week.days.map((d, i) => (
              <div key={d.name} style={{ ...cardStyle, padding:'0.75rem', boxShadow:'none', opacity:d.available?1:.55 }}>
                <label style={{ display:'flex', gap:6, alignItems:'center', cursor:'pointer', fontWeight:700, fontSize:12, marginBottom:7 }}>
                  <input type="checkbox" checked={d.available}
                    onChange={e => updateWeek(w => ({ ...w, days: w.days.map((dd, j) => j===i ? { ...dd, available:e.target.checked } : dd) }))} />
                  {d.name}
                </label>
                {d.available && (
                  <>
                    <Label text="Hours" />
                    <input type="number" min="0" max="12" step=".5" style={{ ...baseInput, marginBottom:6 }}
                      value={d.hours}
                      onChange={e => updateWeek(w => ({ ...w, days: w.days.map((dd, j) => j===i ? { ...dd, hours:+e.target.value } : dd) }))} />
                    <Select value={d.intensity}
                      onChange={v => updateWeek(w => ({ ...w, days: w.days.map((dd, j) => j===i ? { ...dd, intensity:v } : dd) }))}
                      options={INTENSITY} />
                    <label style={{ fontSize:11, cursor:'pointer', display:'flex', gap:4, marginTop:5, alignItems:'center' }}>
                      <input type="checkbox" checked={!!d.allowMock}
                        onChange={e => updateWeek(w => ({ ...w, days: w.days.map((dd, j) => j===i ? { ...dd, allowMock:e.target.checked } : dd) }))} />
                      Allow mock
                    </label>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:'1.25rem' }}>
        <MetricCard label="Tasks"     value={`${doneT}/${totT}`} />
        <MetricCard label="Hours"     value={fmtH(logH)} color="#10B981" sub={`Target: ${week.goals.hours}h`} />
        <MetricCard label="Completion" value={`${pct(doneT, totT)}%`} />
        <MetricCard label="Available" value={week.days.filter(d => d.available).length} color="#2563EB" sub="days" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:14 }}>
        {week.days.map((day, di) => {
          const done2 = day.tasks.filter(t => t.status === 'Completed').length
          const estH  = (day.tasks.reduce((a, t) => a + t.estTime, 0) / 60).toFixed(1)
          return (
            <div key={day.name} style={{ ...cardStyle, opacity: day.available ? 1 : 0.5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{day.name}{day.name === todayName() ? ' ★' : ''}</div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>{day.available ? `${day.hours}h · ${day.intensity}` : ''}</div>
                </div>
                <div style={{ textAlign:'right', fontSize:11, color:'#64748B' }}>{done2}/{day.tasks.length} ({estH}h)</div>
              </div>
              {day.tasks.length > 0 && <ProgressBar value={pct(done2, day.tasks.length)} style={{ marginBottom:10 }} />}
              <div style={{ maxHeight:260, overflowY:'auto' }}>
                {day.tasks.map((task, ti) => (
                  <TaskCard key={task.id || ti} task={task} compact
                    onToggle={() => toggleTask(di, ti)}
                    onEdit={() => setEditTask({ ...task })}
                    onDelete={() => deleteTask(di, ti)} />
                ))}
              </div>
              {day.tasks.length === 0 && day.available && (
                <div style={{ textAlign:'center', padding:'1rem 0', color:'#94A3B8', fontSize:12 }}>No tasks</div>
              )}
              {day.available && (
                addDay === di
                  ? <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:10, marginTop:6 }}>
                      <TaskForm initial={{ date: todayStr() }} onSave={t => addTask(di, t)} onCancel={() => setAddDay(null)} />
                    </div>
                  : <Button style={{ width:'100%', marginTop:8, justifyContent:'center', color:'#7C3AED', borderColor:'#DDD6FE', background:'#FAFAFE' }} onClick={() => setAddDay(di)}>
                      + Add task
                    </Button>
              )}
            </div>
          )
        })}
      </div>

      {editTask && (
        <Modal title="Edit task" onClose={() => setEditTask(null)} width={560}>
          <TaskForm initial={editTask} allDayNames={week.days.map(d => d.name)} onSave={saveTask} onCancel={() => setEditTask(null)} />
        </Modal>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// DailyPage.jsx
// ═══════════════════════════════════════════════════════════════════════════
import { pct as pctD, todayName as tdName, deriveMastery } from '../../utils/helpers.js'

export function DailyPage({ week, updateWeek, topics, setTopics }) {
  const [sel,  setSel]  = useState(tdName())
  const [form, setForm] = useState({ attempted:0, correct:0, energy:'Medium', confidence:'Medium', wellNotes:'', hardNotes:'' })
  const u = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const di  = week.days.findIndex(d => d.name === sel)
  const day = week.days[di >= 0 ? di : 0]
  const acc = form.attempted > 0 ? pctD(form.correct, form.attempted) : 0
  const updDay = fn => updateWeek(w => ({ ...w, days: w.days.map((d, i) => i === di ? fn(d) : d) }))

  const saveLog = () => {
    updDay(d => ({
      ...d,
      attempted: (d.attempted || 0) + form.attempted,
      correct:   (d.correct || 0) + form.correct,
      energy: form.energy, confidence: form.confidence,
      wellNotes: form.wellNotes, hardNotes: form.hardNotes,
    }))
    const completedTopics = (day?.tasks || []).filter(t => t.status === 'Completed').map(t => t.topic)
    const perT = completedTopics.length ? Math.round(form.attempted / completedTopics.length) : 0
    const perC = completedTopics.length ? Math.round(form.correct   / completedTopics.length) : 0
    setTopics(ts => ts.map(t => {
      if (!completedTopics.includes(t.topic)) return t
      const nA   = t.attempted + perT
      const nC   = t.correct + perC
      const nAcc = nA > 0 ? pctD(nC, nA) : t.accuracy
      return { ...t, attempted: nA, correct: nC, accuracy: nAcc, mastery: deriveMastery({ ...t, accuracy: nAcc, attempted: nA }), lastStudied: new Date().toISOString().split('T')[0] }
    }))
    setForm({ attempted:0, correct:0, energy:'Medium', confidence:'Medium', wellNotes:'', hardNotes:'' })
    alert('Progress saved! Topic mastery updated.')
  }

  const tasks = day?.tasks || []

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display:'flex', gap:8, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {week.days.map(d => {
          const dk = d.tasks.filter(t => t.status === 'Completed').length
          const dt = d.tasks.length
          const isT = d.name === tdName()
          return (
            <button key={d.name} onClick={() => setSel(d.name)} style={{
              padding:'6px 14px', borderRadius:8, border:'1px solid', fontSize:12, cursor:'pointer',
              fontWeight: sel === d.name ? 700 : 400,
              borderColor: sel === d.name ? '#7C3AED' : '#E2E8F0',
              background: sel === d.name ? '#EDE9FE' : isT ? '#F5F3FF' : '#fff',
              color: sel === d.name ? '#6D28D9' : '#475569',
              fontFamily:'inherit',
            }}>
              {d.name.slice(0,3)}{isT ? ' ★' : ' '}
              <span style={{ fontSize:10, color:'#94A3B8' }}>{pctD(dk, dt)}%</span>
            </button>
          )
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Task status — {sel}</div>
          {tasks.length === 0 && <EmptyState icon="📋" title="No tasks" sub="No tasks planned for this day." />}
          {tasks.map((t, i) => (
            <div key={t.id || i} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ flex:1, fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
              <Select value={t.status}
                onChange={v => updDay(d => ({ ...d, tasks: d.tasks.map((tk, j) => j===i ? { ...tk, status:v } : tk) }))}
                options={['Not Started','In Progress','Completed','Partial','Deferred']}
                style={{ width:130, height:30, fontSize:12 }}
              />
            </div>
          ))}
          <div style={{ marginTop:12, display:'flex', gap:10, alignItems:'center' }}>
            <Label text="Hours logged:" />
            <input type="number" min="0" max="24" step="0.5"
              style={{ ...baseInput, width:80 }}
              value={day?.hoursLogged || 0}
              onChange={e => updDay(d => ({ ...d, hoursLogged: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Session details</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div><Label text="Questions attempted" /><input type="number" min="0" style={baseInput} value={form.attempted} onChange={e => u('attempted', +e.target.value)} /></div>
            <div><Label text="Correct answers"    /><input type="number" min="0" style={baseInput} value={form.correct}   onChange={e => u('correct',   +e.target.value)} /></div>
            <div><Label text="Accuracy" /><div style={{ ...baseInput, background:'#F8FAFC', fontWeight:700, color: acc>=70?'#10B981':acc>=50?'#F59E0B':'#EF4444' }}>{acc}%</div></div>
            <div><Label text="Energy"   /><Select value={form.energy}     onChange={v => u('energy',     v)} options={['Low','Medium','High']} /></div>
            <div><Label text="Confidence"/><Select value={form.confidence} onChange={v => u('confidence', v)} options={['Low','Medium','High']} /></div>
          </div>
          <div style={{ marginBottom:8 }}><Label text="What went well"  /><textarea style={{ ...baseInput, resize:'vertical', minHeight:48 }} value={form.wellNotes} onChange={e => u('wellNotes', e.target.value)} placeholder="Topics nailed, strategies that clicked..." /></div>
          <div style={{ marginBottom:12 }}><Label text="What was difficult" /><textarea style={{ ...baseInput, resize:'vertical', minHeight:48 }} value={form.hardNotes} onChange={e => u('hardNotes', e.target.value)} placeholder="Areas needing more work..." /></div>
          <Button variant="primary" style={{ width:'100%' }} onClick={saveLog}>Save daily progress</Button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Week at a glance</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
          {week.days.map(d => {
            const dk = d.tasks.filter(t => t.status === 'Completed').length
            const dt = d.tasks.length
            return (
              <div key={d.name} onClick={() => setSel(d.name)} style={{ ...cardStyle, cursor:'pointer', boxShadow:'none', borderColor: sel===d.name?'#7C3AED':'#E2E8F0', background: d.name===tdName()?'#FAFAFE':'#FAFAFA', padding:'0.75rem 1rem' }}>
                <div style={{ fontWeight:700, fontSize:11, color: d.name===tdName()?'#7C3AED':'#1E293B', marginBottom:4 }}>{d.name.slice(0,3)}</div>
                <ProgressBar value={pctD(dk, dt)} height={4} style={{ marginBottom:4 }} />
                <div style={{ fontSize:10, color:'#94A3B8' }}>{dk}/{dt} · {d.hoursLogged||0}h</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// RebalancePage.jsx
// ═══════════════════════════════════════════════════════════════════════════
import { buildRebalanceProposal as buildProposal } from '../../utils/rebalance.js'
import { Badge } from '../ui/index.jsx'
import { prioC as prioColor, C as Colors } from '../../data/constants.js'

export function RebalancePage({ week, updateWeek, topics, settings }) {
  const [proposal,  setProposal]  = useState(null)
  const [editMode,  setEditMode]  = useState(false)

  const weakTopics = useMemo(() =>
    [...topics].filter(t => t.attempted > 0).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
    [topics]
  )
  const weakNames = weakTopics.map(t => t.topic)

  const analyze = () => {
    setProposal(buildProposal({ week, settings, weakTopicNames: weakNames }))
    setEditMode(false)
  }

  const apply = () => {
    if (!proposal || proposal.error) return
    const tdi = week.days.findIndex(d => d.name === tdName())
    updateWeek(w => ({
      ...w, days: w.days.map((d, i) => {
        const b = proposal.buckets.find(b => b.idx === i)
        if (i <= tdi) return { ...d, tasks: d.tasks.filter(t => t.locked || ['Completed','Deferred'].includes(t.status)) }
        if (b) return {
          ...d, tasks: [
            ...w.days[i].tasks.filter(t => t.locked || ['Completed','Deferred'].includes(t.status)),
            ...b.tasks.map(t => { const { _fromDay, _fromIdx, ...c } = t; return { ...c, status:'Not Started' } }),
          ],
        }
        return d
      }),
    }))
    setProposal(null)
  }

  const removeFromBucket = (bi, taskId) => {
    setProposal(p => ({
      ...p,
      buckets: p.buckets.map((b, i) => i === bi ? {
        ...b,
        tasks: b.tasks.filter(t => t.id !== taskId),
        usedMin: b.usedMin - (b.tasks.find(t => t.id === taskId)?.estTime || 0),
      } : b),
    }))
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#1E293B' }}>Rebalancing Engine</div>
          <div style={{ fontSize:12, color:'#64748B' }}>Priority-aware, capacity-respecting redistribution with weak-topic boost</div>
        </div>
        <Button variant="primary" onClick={analyze}>⚖️ Analyze</Button>
      </div>

      {/* Capacity overview */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:'1.25rem' }}>
        {week.days.map((d, i) => {
          const total = d.tasks.length
          const done  = d.tasks.filter(t => t.status === 'Completed').length
          const pend  = d.tasks.filter(t => !['Completed','Deferred'].includes(t.status) && !t.locked).length
          const estH  = d.tasks.reduce((a, t) => a + t.estTime, 0) / 60
          const isOver = estH > d.hours + 0.3
          return (
            <div key={d.name} style={{ ...cardStyle, padding:'0.75rem', borderColor: isOver ? Colors.red.border : d.name===tdName() ? '#7C3AED' : '#E2E8F0' }}>
              <div style={{ fontWeight:700, fontSize:11, marginBottom:4, color: d.name===tdName() ? '#7C3AED' : '#1E293B' }}>{d.name.slice(0,3)}{d.name===tdName()?' ★':''}</div>
              <div style={{ fontSize:16, fontWeight:700, color: done===total&&total>0 ? '#10B981' : pend>0 ? '#EF4444' : '#64748B' }}>{done}/{total}</div>
              <div style={{ fontSize:10, color:'#94A3B8' }}>{fmtH(estH)} / {d.hours}h</div>
              {isOver && <Badge text="⚠ over" color={Colors.red} sm />}
            </div>
          )
        })}
      </div>

      {/* Weak topics context */}
      <div style={{ ...cardStyle, marginBottom:'1.25rem' }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Weak topics — boosted in redistribution priority</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {weakTopics.length === 0
            ? <span style={{ fontSize:12, color:'#94A3B8' }}>Attempt questions to identify weak topics.</span>
            : weakTopics.map(t => (
              <div key={t.topic} style={{ padding:'6px 12px', borderRadius:8, background: Colors.red.bg, border:`1px solid ${Colors.red.border}` }}>
                <div style={{ fontSize:12, fontWeight:600, color: Colors.red.text }}>{t.topic}</div>
                <div style={{ fontSize:10, color:'#94A3B8' }}>{t.section} · {Math.round(t.accuracy)}%</div>
              </div>
            ))
          }
        </div>
      </div>

      {!proposal && (
        <EmptyState icon="⚖️" title="Click 'Analyze' to rebalance"
          sub="The engine collects pending tasks, sorts by priority and weak-topic status, then distributes across remaining days respecting available hours." />
      )}

      {proposal?.error && (
        <div style={{ ...cardStyle, borderLeft:`4px solid ${Colors.red.solid}`, background: Colors.red.bg, color: Colors.red.text, padding:'0.875rem 1rem', fontSize:13 }}>
          {proposal.error}
        </div>
      )}

      {proposal && !proposal.error && (
        <div>
          {proposal.warnings.map((w, i) => (
            <div key={i} style={{ background: Colors.amber.bg, border:`1px solid ${Colors.amber.border}`, borderLeft:`4px solid ${Colors.amber.solid}`, borderRadius:8, padding:'9px 14px', marginBottom:8, color: Colors.amber.text, fontSize:12 }}>
              ⚠ {w}
            </div>
          ))}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1rem' }}>
            <div style={cardStyle}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Pending ({proposal.pending.length})</div>
              {proposal.pending.length === 0
                ? <div style={{ color:'#94A3B8', fontSize:12 }}>All tasks on track! 🎉</div>
                : <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {proposal.pending.map(t => (
                      <div key={t.id} style={{ padding:'5px 0', borderBottom:'1px solid #F8FAFC' }}>
                        <div style={{ fontSize:12, fontWeight:500 }}>{t.title}</div>
                        <div style={{ display:'flex', gap:5, marginTop:2 }}>
                          <Badge text={t._fromDay} color={Colors.neutral} sm />
                          <Badge text={t.priority}  color={prioColor(t.priority)} sm />
                          {weakNames.includes(t.topic) && <Badge text="⬆ weak" color={Colors.red} sm />}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={cardStyle}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>Redistribution</div>
                <Button onClick={() => setEditMode(s => !s)}>{editMode ? '✓ Done editing' : '✎ Edit'}</Button>
              </div>
              {proposal.buckets.map((b, bi) => {
                const loadPct = pctD(b.usedMin, b.capacityMin)
                return (
                  <div key={b.name} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700 }}>{b.name}</span>
                      <span style={{ fontSize:11, color:'#64748B' }}>{b.tasks.length} tasks · {fmtH(b.usedMin/60)} / {fmtH(b.capacityMin/60)}</span>
                    </div>
                    <ProgressBar value={loadPct} color={loadPct>90?'#EF4444':loadPct>70?'#F59E0B':'#10B981'} height={5} style={{ marginBottom:6 }} />
                    {editMode && b.tasks.map(t => (
                      <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 6px', background:'#F8FAFC', borderRadius:6, marginBottom:3, fontSize:11 }}>
                        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
                        <button onClick={() => removeFromBucket(bi, t.id)} style={{ padding:'1px 6px', fontSize:10, background: Colors.red.bg, border:'none', color: Colors.red.text, cursor:'pointer', borderRadius:4 }}>×</button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {proposal.overflow?.length > 0 && (
                <div style={{ background: Colors.red.bg, borderRadius:8, padding:'8px 10px', marginTop:8 }}>
                  <div style={{ fontWeight:600, fontSize:12, color: Colors.red.text, marginBottom:4 }}>Overflow — could not fit</div>
                  {proposal.overflow.map(t => <div key={t.id} style={{ fontSize:11, color: Colors.red.text }}>{t.title}</div>)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <Button variant="green" onClick={apply} disabled={proposal.pending?.length === 0}>✓ Accept rebalance</Button>
            <Button variant="red"   onClick={() => setProposal(null)}>✗ Reject</Button>
          </div>
        </div>
      )}
    </div>
  )
}
