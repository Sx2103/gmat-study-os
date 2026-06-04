import { useState } from 'react'
import { Badge, baseBtn } from '../ui/index.jsx'
import { sectionC, statusC, prioC, C } from '../../data/constants.js'

export function TaskCard({ task, onToggle, onEdit, onDelete, onDefer, compact=false }) {
  const [hov, setHov] = useState(false)
  const sc   = sectionC(task.section)
  const stc  = statusC(task.status)
  const done = task.status==='Completed'

  return (
    <div
      className="task-card"
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderRadius:10,
        background:done?'#F0FDF4':'#FAFAFA',
        border:`1px solid ${done?'#BBF7D0':'#F1F5F9'}`,
        marginBottom:5,boxShadow:hov?'0 2px 10px rgba(0,0,0,.07)':'none',transition:'box-shadow .15s',
      }}
    >
      <input type="checkbox" checked={done} onChange={onToggle} style={{marginTop:3,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:done?400:500,textDecoration:done?'line-through':'none',color:done?'#94A3B8':'#1E293B',lineHeight:1.4,marginBottom:5}}>
          {task.title||'Untitled task'}
        </div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
          <Badge text={task.section}  color={sc}             sm/>
          <Badge text={task.type}     color={C.neutral}      sm/>
          {!compact&&<Badge text={task.topic} color={{bg:'#F8FAFC',border:'#E2E8F0',text:'#64748B'}} sm/>}
          <Badge text={`${task.estTime}m`} color={C.quant}  sm/>
          <Badge text={task.priority} color={prioC(task.priority)} sm/>
          <Badge text={task.status}   color={stc}            sm/>
          {task.locked&&<Badge text="🔒" color={C.neutral}  sm/>}
        </div>
        {task.notes&&!compact&&<div style={{fontSize:11,color:'#94A3B8',marginTop:4,fontStyle:'italic'}}>{task.notes}</div>}
      </div>
      <div className="task-controls" style={{display:'flex',gap:4,flexShrink:0,opacity:hov?1:0.25,transition:'opacity .2s'}}>
        {onEdit&&<button onClick={onEdit} style={{...baseBtn,padding:'3px 9px',fontSize:11,background:'#F1F5F9',border:'none',color:'#475569'}}>Edit</button>}
        {onDefer&&task.status!=='Deferred'&&<button onClick={onDefer} style={{...baseBtn,padding:'3px 9px',fontSize:11,background:C.amber.bg,border:'none',color:C.amber.text}}>Defer</button>}
        {onDelete&&<button onClick={onDelete} style={{...baseBtn,padding:'3px 9px',fontSize:11,background:C.red.bg,border:'none',color:C.red.text}}>×</button>}
      </div>
    </div>
  )
}
