import { useState, useMemo } from 'react'
import { Button, MetricCard, ProgressBar, EmptyState, Modal, cardStyle, baseInput } from '../ui/index.jsx'
import { TaskCard } from '../tasks/TaskCard.jsx'
import { TaskForm } from '../tasks/TaskForm.jsx'
import { completionPct, todayName, fmtH, uid, todayStr } from '../../utils/helpers.js'
import { buildRebalanceProposal } from '../../utils/rebalance.js'
import { C } from '../../data/constants.js'

const MOTS = [
  'Every session brings you closer to your target. Focus and execute.',
  'Consistency beats intensity. Show up today.',
  "Your next mock will reflect today's effort. Make it count.",
  'Small improvements compound. One good session at a time.',
  'Discipline today, freedom on exam day.',
]

export default function TodayPage({ week, updateWeek, topics, settings }) {
  const [editTask,  setEditTask]  = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [showRebal, setShowRebal] = useState(false)

  const tn    = todayName()
  const di    = week.days.findIndex(d=>d.name===tn)
  const day   = week.days[di>=0?di:0]
  const tasks = day?.tasks||[]
  const cp    = completionPct(tasks)
  const estLeft = tasks.filter(t=>!['Completed','Deferred'].includes(t.status)).reduce((a,t)=>a+t.estTime,0)
  const mot   = MOTS[new Date().getDay()%MOTS.length]
  const weakFocus = useMemo(()=>[...topics].filter(t=>t.attempted>0).sort((a,b)=>a.accuracy-b.accuracy).slice(0,3),[topics])

  const updDay = fn => updateWeek(w=>({...w,days:w.days.map((d,i)=>i===di?fn(d):d)}))
  const toggle = i  => updDay(d=>({...d,tasks:d.tasks.map((t,j)=>j===i?{...t,status:t.status==='Completed'?'Not Started':'Completed'}:t)}))
  const defer  = i  => updDay(d=>({...d,tasks:d.tasks.map((t,j)=>j===i?{...t,status:'Deferred'}:t)}))
  const remove = i  => updDay(d=>({...d,tasks:d.tasks.filter((_,j)=>j!==i)}))

  const saveTask = t => {
    if(t._moveDay&&t._moveDay!==''){
      const toDi=week.days.findIndex(d=>d.name===t._moveDay)
      const {_moveDay,...clean}=t
      updateWeek(w=>({...w,days:w.days.map((d,i)=>{
        if(i===di)   return {...d,tasks:d.tasks.filter(x=>x.id!==t.id)}
        if(i===toDi) return {...d,tasks:[...d.tasks,clean]}
        return d
      })}))
    } else {
      updDay(d=>({...d,tasks:d.tasks.map(x=>x.id===t.id?t:x).concat(d.tasks.find(x=>x.id===t.id)?[]:[t])}))
    }
    setEditTask(null)
  }

  const addTask = t => { updDay(d=>({...d,tasks:[...d.tasks,t]})); setShowAdd(false) }
  const markAll = () => updDay(d=>({...d,tasks:d.tasks.map(t=>({...t,status:'Completed'}))}))
  const moveUnfinished = () => {
    const ni=di+1; if(ni>=week.days.length) return
    updateWeek(w=>{
      const pend=w.days[di].tasks.filter(t=>!['Completed','Deferred'].includes(t.status))
      return {...w,days:w.days.map((d,i)=>{
        if(i===di)  return {...d,tasks:d.tasks.filter(t=>['Completed','Deferred'].includes(t.status))}
        if(i===ni)  return {...d,tasks:[...d.tasks,...pend.map(t=>({...t,status:'Not Started'}))]}
        return d
      })}
    })
  }

  const tomorrow = di<week.days.length-1 ? week.days[di+1] : null

  return (
    <div style={{maxWidth:960}}>
      {/* Banner */}
      <div style={{background:'linear-gradient(135deg,#1E1B4B,#312E81)',borderRadius:14,padding:'1rem 1.5rem',marginBottom:'1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{color:'#A5B4FC',fontSize:11,marginBottom:3}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · {week.label}</div>
          <div style={{color:'#fff',fontSize:14,fontStyle:'italic'}}>{mot}</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Button variant="primary" onClick={()=>setShowAdd(true)}>+ Add task</Button>
          <Button variant="green"   onClick={markAll}>✓ Mark all done</Button>
          <Button                   onClick={moveUnfinished}>→ Move unfinished</Button>
          <Button variant="ghost"   onClick={()=>setShowRebal(true)}>⚖ Quick rebalance</Button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:'1.25rem'}}>
        <MetricCard label="Completion"  value={`${cp}%`} color={cp>=80?'#10B981':cp>=50?'#7C3AED':'#EF4444'} sub={`${tasks.filter(t=>t.status==='Completed').length}/${tasks.length} tasks`}/>
        <MetricCard label="Time left"   value={`${Math.round(estLeft/60*10)/10}h`} color="#2563EB" sub="est. remaining"/>
        <MetricCard label="Hours logged" value={fmtH(day?.hoursLogged||0)} color="#F59E0B"/>
        <MetricCard label="Pending"     value={tasks.filter(t=>!['Completed','Deferred'].includes(t.status)).length} color="#EF4444" sub="active tasks"/>
        <MetricCard label="Deferred"    value={tasks.filter(t=>t.status==='Deferred').length} color="#94A3B8"/>
      </div>

      {/* Progress bar */}
      <div style={{...cardStyle,marginBottom:'1.25rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:13}}>Today's weighted progress</div>
          <div style={{fontSize:12,color:'#64748B'}}>{cp}%</div>
        </div>
        <ProgressBar value={cp} color={cp>=80?'#10B981':cp>=50?'#7C3AED':'#EF4444'} height={12}/>
      </div>

      {/* Log + focus */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.25rem',marginBottom:'1.25rem'}}>
        <div style={cardStyle}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Log today</div>
          <div style={{display:'flex',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
            <div style={{flex:'0 0 100px'}}>
              <div style={{fontSize:12,color:'#64748B',fontWeight:500,marginBottom:4}}>Hours studied</div>
              <input type="number" min="0" max="24" step="0.5"
                style={{...baseInput,width:90}}
                value={day?.hoursLogged||0}
                onChange={e=>updDay(d=>({...d,hoursLogged:parseFloat(e.target.value)||0}))}/>
            </div>
            <div style={{flex:1,minWidth:160}}>
              <div style={{fontSize:12,color:'#64748B',fontWeight:500,marginBottom:4}}>Session notes</div>
              <input style={baseInput} placeholder="How did today go?" value={day?.notes||''} onChange={e=>updDay(d=>({...d,notes:e.target.value}))}/>
            </div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Priority focus</div>
          {weakFocus.length===0
            ? <EmptyState icon="📈" title="No weak topics yet" sub="Attempt questions to see focus areas."/>
            : weakFocus.map(t=>(
              <div key={t.topic} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F8FAFC'}}>
                <div><div style={{fontSize:12,fontWeight:600}}>{t.topic}</div><div style={{fontSize:10,color:'#94A3B8'}}>{t.section}</div></div>
                <div style={{fontSize:13,fontWeight:700,color:t.accuracy<50?'#EF4444':'#F59E0B'}}>{Math.round(t.accuracy)}%</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Task list */}
      <div style={cardStyle}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Tasks — {tn}</div>
        {tasks.length===0
          ? <EmptyState icon="📝" title="No tasks today" sub="Add one above or set up your weekly plan." action={<Button variant="primary" onClick={()=>setShowAdd(true)}>+ Add task</Button>}/>
          : tasks.map((task,i)=>(
            <TaskCard key={task.id||i} task={task}
              onToggle={()=>toggle(i)} onEdit={()=>setEditTask({...task})}
              onDelete={()=>remove(i)} onDefer={()=>defer(i)}/>
          ))
        }
      </div>

      {/* Tomorrow preview */}
      {tomorrow&&(
        <div style={{...cardStyle,marginTop:'1.25rem',borderLeft:'3px solid #7C3AED'}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>Tomorrow — {tomorrow.name}</div>
          <div style={{display:'flex',gap:16,fontSize:12,color:'#64748B',flexWrap:'wrap'}}>
            <span>📋 {tomorrow.tasks?.length||0} tasks planned</span>
            <span>⏱ {fmtH((tomorrow.tasks||[]).reduce((a,t)=>a+t.estTime,0)/60)} estimated</span>
            <span>🕐 {tomorrow.hours||0}h available</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd&&<Modal title="Add task for today" onClose={()=>setShowAdd(false)}><TaskForm initial={{date:todayStr()}} onSave={addTask} onCancel={()=>setShowAdd(false)} allDayNames={week.days.map(d=>d.name).filter(n=>n!==tn)}/></Modal>}
      {editTask&&<Modal title="Edit task" onClose={()=>setEditTask(null)} width={560}><TaskForm initial={editTask} allDayNames={week.days.map(d=>d.name)} onSave={saveTask} onCancel={()=>setEditTask(null)}/></Modal>}
      {showRebal&&<QuickRebalModal week={week} updateWeek={updateWeek} topics={topics} settings={settings} onClose={()=>setShowRebal(false)}/>}
    </div>
  )
}

function QuickRebalModal({week,updateWeek,topics,settings,onClose}) {
  const weakNames=useMemo(()=>[...topics].filter(t=>t.attempted>0).sort((a,b)=>a.accuracy-b.accuracy).slice(0,5).map(t=>t.topic),[topics])
  const p=useMemo(()=>buildRebalanceProposal({week,settings,weakTopicNames:weakNames}),[week,settings,weakNames])
  const apply=()=>{
    if(p.error) return
    const tdi=week.days.findIndex(d=>d.name===todayName())
    updateWeek(w=>({...w,days:w.days.map((d,i)=>{
      const b=p.buckets.find(b=>b.idx===i)
      if(i<=tdi) return {...d,tasks:d.tasks.filter(t=>t.locked||['Completed','Deferred'].includes(t.status))}
      if(b) return {...d,tasks:[...w.days[i].tasks.filter(t=>t.locked||['Completed','Deferred'].includes(t.status)),...b.tasks.map(t=>{const{_fromDay,_fromIdx,...c}=t;return{...c,status:'Not Started'}})]}
      return d
    })}))
    onClose()
  }
  return (
    <Modal title="Quick rebalance" onClose={onClose}>
      {p.error
        ? <div style={{color:'#991B1B',padding:'1rem'}}>{p.error}</div>
        : <>
          {p.warnings.map((w,i)=><div key={i} style={{background:C.amber.bg,border:`1px solid ${C.amber.border}`,borderRadius:8,padding:'8px 12px',marginBottom:8,color:C.amber.text,fontSize:12}}>⚠ {w}</div>)}
          <div style={{marginBottom:12}}>
            {p.buckets.map(b=>(
              <div key={b.name} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F8FAFC',fontSize:13}}>
                <span style={{fontWeight:600}}>{b.name}</span>
                <span style={{color:'#64748B'}}>{b.tasks.length} tasks · {fmtH(b.usedMin/60)} / {fmtH(b.capacityMin/60)}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <Button variant="green" onClick={apply} disabled={p.pending?.length===0}>✓ Apply</Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </>
      }
    </Modal>
  )
}
