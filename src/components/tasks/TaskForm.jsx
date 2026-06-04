import { useState } from 'react'
import { Button, Label, Select, baseInput } from '../ui/index.jsx'
import { SECTIONS, TOPICS, TASK_TYPES, STATUS_OPTS, PRIORITY, DIFFICULTY } from '../../data/constants.js'
import { uid } from '../../utils/helpers.js'

export function TaskForm({ initial={}, onSave, onCancel, allDayNames=[] }) {
  const def = { id:uid(), title:'', section:'Quant', topic:'Arithmetic', type:'Practice Questions', estTime:45, difficulty:'Medium', priority:'Medium', status:'Not Started', notes:'', locked:false }
  const [t, setT] = useState({...def,...initial})
  const u = (k,v) => setT(p=>({...p,[k]:v}))
  const valid = t.title.trim().length>0

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div style={{gridColumn:'1/-1'}}>
          <Label text="Task title *"/>
          <input style={{...baseInput,borderColor:valid?'#E2E8F0':'#FCA5A5'}} value={t.title} onChange={e=>u('title',e.target.value)} placeholder="e.g. Algebra — 20 practice questions" autoFocus/>
          {!valid&&<div style={{fontSize:11,color:'#EF4444',marginTop:2}}>Title is required.</div>}
        </div>
        <div><Label text="Section"/><Select value={t.section} onChange={v=>{u('section',v);u('topic',TOPICS[v][0])}} options={SECTIONS}/></div>
        <div><Label text="Topic"/><Select value={t.topic} onChange={v=>u('topic',v)} options={TOPICS[t.section]||[]}/></div>
        <div><Label text="Task type"/><Select value={t.type} onChange={v=>u('type',v)} options={TASK_TYPES}/></div>
        <div><Label text="Status"/><Select value={t.status} onChange={v=>u('status',v)} options={STATUS_OPTS}/></div>
        <div><Label text="Est. time (min)"/><input type="number" min="5" max="300" style={baseInput} value={t.estTime} onChange={e=>u('estTime',+e.target.value)}/></div>
        <div><Label text="Priority"/><Select value={t.priority} onChange={v=>u('priority',v)} options={PRIORITY}/></div>
        <div><Label text="Difficulty"/><Select value={t.difficulty} onChange={v=>u('difficulty',v)} options={DIFFICULTY}/></div>
        {allDayNames.length>0&&<div><Label text="Move to day"/><Select value={t._moveDay||''} onChange={v=>u('_moveDay',v)} options={[{value:'',label:'— same day —'},...allDayNames.map(n=>({value:n,label:n}))]}/></div>}
        <div style={{display:'flex',gap:8,alignItems:'center',paddingTop:18}}>
          <input type="checkbox" checked={!!t.locked} onChange={e=>u('locked',e.target.checked)}/>
          <label style={{fontSize:13,color:'#475569',cursor:'pointer'}}>🔒 Lock — skip rebalancing</label>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <Label text="Notes"/>
        <textarea style={{...baseInput,resize:'vertical',minHeight:55}} value={t.notes} onChange={e=>u('notes',e.target.value)} placeholder="Optional..."/>
      </div>
      <div style={{display:'flex',gap:8}}>
        <Button variant="primary" onClick={()=>valid&&onSave(t)} disabled={!valid}>Save task</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
