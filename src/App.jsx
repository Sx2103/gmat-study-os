import { useState, useEffect, useCallback, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TASK_TYPES = ["Concept Learning","Practice Questions","Timed Set","Mock Test","Review","Error Log","Flashcards","Revision","Video Lesson","Formula Review","Custom"];
const STATUS_OPTS = ["Not Started","In Progress","Completed","Partial","Deferred"];
const DIFFICULTY = ["Easy","Medium","Hard"];
const PRIORITY = ["Low","Medium","High","Critical"];
const ERROR_TYPES = ["Concept Gap","Misread Question","Calculation Mistake","Timing Issue","Trap Answer","Guess","Careless Mistake","Strategy Issue"];
const MASTERY_LEVELS = ["Not Started","Learning","Practicing","Improving","Strong","Mastered"];
const TOPICS = {
  Quant: ["Arithmetic","Algebra","Word Problems","Number Properties","Geometry","Coordinate Geometry","Statistics","Probability","Combinatorics","Rates and Work","Ratios and Proportions","Inequalities","Functions","Sequences"],
  Verbal: ["Reading Comprehension","Critical Reasoning","Sentence Correction","Assumption Questions","Strengthen/Weaken","Inference","Main Idea","Boldface","Evaluate the Argument","Logical Structure"],
  "Data Insights": ["Data Sufficiency","Multi-Source Reasoning","Table Analysis","Graphics Interpretation","Two-Part Analysis","Integrated Reasoning","Charts and Graphs","Quant-Verbal Hybrid"]
};
const SECTIONS = Object.keys(TOPICS);

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  quant:   {bg:"#EFF6FF",border:"#BFDBFE",text:"#1D4ED8",solid:"#3B82F6"},
  verbal:  {bg:"#F5F3FF",border:"#DDD6FE",text:"#6D28D9",solid:"#7C3AED"},
  di:      {bg:"#ECFDF5",border:"#A7F3D0",text:"#065F46",solid:"#10B981"},
  neutral: {bg:"#F8FAFC",border:"#E2E8F0",text:"#475569",solid:"#64748B"},
  amber:   {bg:"#FFFBEB",border:"#FDE68A",text:"#92400E",solid:"#F59E0B"},
  red:     {bg:"#FEF2F2",border:"#FECACA",text:"#991B1B",solid:"#EF4444"},
  green:   {bg:"#F0FDF4",border:"#BBF7D0",text:"#14532D",solid:"#22C55E"},
};
const sectionColor  = s => s==="Quant"?C.quant:s==="Verbal"?C.verbal:C.di;
const priorityColor = p => ({Critical:C.red,High:C.amber,Medium:C.quant,Low:C.neutral}[p]||C.neutral);
const statusColor   = s => ({Completed:C.green,"In Progress":C.quant,"Not Started":C.neutral,Partial:C.amber,Deferred:C.red}[s]||C.neutral);
const masteryColor  = m => ({Mastered:C.green,Strong:C.di,Improving:C.quant,Practicing:C.verbal,Learning:C.amber,"Not Started":C.neutral}[m]||C.neutral);

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid         = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const todayStr    = () => new Date().toISOString().split("T")[0];
const todayDayName= () => DAYS[new Date().getDay()===0?6:new Date().getDay()-1];
const pct         = (a,b) => b>0?Math.min(100,Math.round(a/b*100)):0;
const clamp       = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const fmtH        = h => `${(Math.round(h*10)/10).toFixed(1)}h`;

// ─── LOCALSTORAGE HOOK ────────────────────────────────────────────────────────
function useLS(key, init) {
  const [v, sv] = useState(() => {
    try {
      const r = localStorage.getItem(key);
      return r!==null ? JSON.parse(r) : (typeof init==="function"?init():init);
    } catch { return typeof init==="function"?init():init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, sv];
}

// ─── EMPTY FACTORIES — zero data, nothing pre-filled ─────────────────────────
const emptySettings = () => ({
  targetScore:"", examDate:"", startDate:todayStr(),
  weeklyHours:"", maxDailyHours:"", name:"",
});

const emptyTopics = () =>
  SECTIONS.flatMap(s => TOPICS[s].map(topic => ({
    id:uid(), section:s, topic,
    mastery:"Not Started", accuracy:0, attempted:0, correct:0,
    timeSpent:0, lastStudied:"", notes:"", conceptDone:false,
  })));

const emptyWeek = (label="") => ({
  id:uid(),
  label: label || `Week of ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}`,
  start:todayStr(), end:"",
  goals:{hours:"",quant:"",verbal:"",di:"",mocks:"",questions:"",revision:"",errorLog:""},
  days: DAYS.map(name => ({
    name, available:true, hours:"", intensity:"Medium",
    allowMock:false, tasks:[], hoursLogged:"", notes:"",
    attempted:"", correct:"", energy:"", confidence:"",
    wellNotes:"", hardNotes:"",
  })),
});

// ─── BASE STYLES ──────────────────────────────────────────────────────────────
const inp = {
  display:"block", width:"100%", boxSizing:"border-box",
  padding:"7px 11px", border:"1px solid #E2E8F0", borderRadius:8,
  fontSize:13, background:"#fff", color:"#1E293B", outline:"none", fontFamily:"inherit",
};
const card = {
  background:"#fff", border:"1px solid #E2E8F0", borderRadius:12,
  padding:"1rem 1.25rem", boxShadow:"0 1px 4px rgba(0,0,0,.05)",
};
const btnBase = {
  display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
  padding:"7px 14px", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer",
  border:"1px solid #E2E8F0", background:"#fff", color:"#475569",
  fontFamily:"inherit", whiteSpace:"nowrap",
};

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Btn({ch,onClick,disabled,v="default",style={}}) {
  const vs={
    default:{},
    primary:{background:"#7C3AED",color:"#fff",border:"1px solid #7C3AED"},
    green:  {background:"#10B981",color:"#fff",border:"1px solid #10B981"},
    amber:  {background:"#F59E0B",color:"#fff",border:"1px solid #F59E0B"},
    red:    {background:"#EF4444",color:"#fff",border:"1px solid #EF4444"},
    ghost:  {background:"#F5F3FF",color:"#7C3AED",border:"1px solid #DDD6FE"},
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{...btnBase,...(vs[v]||{}),...style,opacity:disabled?.5:1}}>
      {ch}
    </button>
  );
}

function Lbl({t}) {
  return (
    <div style={{fontSize:11,color:"#64748B",fontWeight:600,marginBottom:3,
      textTransform:"uppercase",letterSpacing:.3}}>
      {t}
    </div>
  );
}

function Bdg({text,color=C.neutral,sm}) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      padding:sm?"2px 7px":"3px 9px", borderRadius:20,
      fontSize:sm?10:11, fontWeight:500,
      background:color.bg, color:color.text, border:`1px solid ${color.border}`,
    }}>
      {text}
    </span>
  );
}

function PBar({value,color="#7C3AED",h=6,style={}}) {
  return (
    <div style={{height:h,borderRadius:h,background:"#F1F5F9",overflow:"hidden",...style}}>
      <div style={{height:"100%",borderRadius:h,background:color,
        width:`${clamp(value,0,100)}%`,transition:"width .5s ease"}}/>
    </div>
  );
}

function MCard({label,value,sub,color="#7C3AED",icon,style={}}) {
  return (
    <div style={{...card,padding:"1rem",...style}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <div style={{fontSize:10,color:"#94A3B8",fontWeight:700,
          textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
        {icon&&<span>{icon}</span>}
      </div>
      <div style={{fontSize:22,fontWeight:700,color,lineHeight:1.2}}>
        {value===null||value===""||value===undefined?"—":value}
      </div>
      {sub&&<div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>{sub}</div>}
    </div>
  );
}

function Empty({icon="📭",title,sub,action}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      padding:"3rem 1.5rem",textAlign:"center",color:"#94A3B8"}}>
      <div style={{fontSize:40,marginBottom:10,opacity:.5}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:600,color:"#475569",marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,maxWidth:300,lineHeight:1.6,
        marginBottom:action?14:0}}>{sub}</div>
      {action}
    </div>
  );
}

function Modal({title,onClose,children,width=540}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",
      alignItems:"flex-start",justifyContent:"center",paddingTop:50,
      background:"rgba(15,23,42,.5)"}}>
      <div style={{background:"#fff",borderRadius:16,width,maxWidth:"94vw",
        maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"1rem 1.25rem",borderBottom:"1px solid #F1F5F9",
          position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1E293B"}}>{title}</div>
          <button onClick={onClose}
            style={{...btnBase,border:"none",background:"transparent",
              fontSize:20,color:"#94A3B8",padding:"2px 8px"}}>×</button>
        </div>
        <div style={{padding:"1.25rem"}}>{children}</div>
      </div>
    </div>
  );
}

function Sel({value,onChange,options,style={}}) {
  return (
    <select style={{...inp,height:34,...style}} value={value}
      onChange={e=>onChange(e.target.value)}>
      {options.map(o=>(
        <option key={o.value??o} value={o.value??o}>{o.label??o}</option>
      ))}
    </select>
  );
}

// ─── TASK FORM ────────────────────────────────────────────────────────────────
function TaskForm({initial={},onSave,onCancel,dayNames=[]}) {
  const def = {
    id:uid(), title:"", section:"Quant", topic:"Arithmetic",
    type:"Practice Questions", estTime:45, difficulty:"Medium",
    priority:"Medium", status:"Not Started", notes:"", locked:false,
  };
  const [t,st] = useState({...def,...initial});
  const u = (k,v) => st(p=>({...p,[k]:v}));
  const valid = t.title.trim().length>0;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div style={{gridColumn:"1/-1"}}>
          <Lbl t="Task title *"/>
          <input style={{...inp,borderColor:valid?"#E2E8F0":"#FCA5A5"}}
            value={t.title} onChange={e=>u("title",e.target.value)}
            placeholder="e.g. Algebra — 20 practice questions" autoFocus/>
          {!valid&&<div style={{fontSize:11,color:"#EF4444",marginTop:2}}>Title is required.</div>}
        </div>
        <div>
          <Lbl t="Section"/>
          <Sel value={t.section} onChange={v=>{u("section",v);u("topic",TOPICS[v][0]);}}
            options={SECTIONS}/>
        </div>
        <div>
          <Lbl t="Topic"/>
          <Sel value={t.topic} onChange={v=>u("topic",v)}
            options={TOPICS[t.section]||[]}/>
        </div>
        <div>
          <Lbl t="Task type"/>
          <Sel value={t.type} onChange={v=>u("type",v)} options={TASK_TYPES}/>
        </div>
        <div>
          <Lbl t="Status"/>
          <Sel value={t.status} onChange={v=>u("status",v)} options={STATUS_OPTS}/>
        </div>
        <div>
          <Lbl t="Est. time (min)"/>
          <input type="number" min="5" max="300" style={inp}
            value={t.estTime} onChange={e=>u("estTime",+e.target.value)}/>
        </div>
        <div>
          <Lbl t="Priority"/>
          <Sel value={t.priority} onChange={v=>u("priority",v)} options={PRIORITY}/>
        </div>
        <div>
          <Lbl t="Difficulty"/>
          <Sel value={t.difficulty} onChange={v=>u("difficulty",v)} options={DIFFICULTY}/>
        </div>
        {dayNames.length>0&&(
          <div>
            <Lbl t="Move to day"/>
            <Sel value={t._moveDay||""} onChange={v=>u("_moveDay",v)}
              options={[{value:"",label:"— same day —"},
                ...dayNames.map(n=>({value:n,label:n}))]}/>
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"center",paddingTop:16}}>
          <input type="checkbox" checked={!!t.locked}
            onChange={e=>u("locked",e.target.checked)}/>
          <label style={{fontSize:13,color:"#475569",cursor:"pointer"}}>
            🔒 Lock — skip rebalancing
          </label>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <Lbl t="Notes"/>
        <textarea style={{...inp,resize:"vertical",minHeight:55}}
          value={t.notes} onChange={e=>u("notes",e.target.value)}
          placeholder="Optional..."/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn ch="Save task" v="primary" onClick={()=>valid&&onSave(t)} disabled={!valid}/>
        <Btn ch="Cancel" onClick={onCancel}/>
      </div>
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({task,onToggle,onEdit,onDelete,onDefer,compact}) {
  const [hov,sh] = useState(false);
  const done = task.status==="Completed";
  return (
    <div onMouseEnter={()=>sh(true)} onMouseLeave={()=>sh(false)}
      style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",
        borderRadius:10,background:done?"#F0FDF4":"#FAFAFA",
        border:`1px solid ${done?"#BBF7D0":"#F1F5F9"}`,marginBottom:5,
        boxShadow:hov?"0 2px 10px rgba(0,0,0,.07)":"none",transition:"box-shadow .15s"}}>
      <input type="checkbox" checked={done} onChange={onToggle}
        style={{marginTop:3,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:done?400:500,
          textDecoration:done?"line-through":"none",
          color:done?"#94A3B8":"#1E293B",lineHeight:1.4,marginBottom:5}}>
          {task.title||"Untitled"}
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <Bdg text={task.section} color={sectionColor(task.section)} sm/>
          {!compact&&<Bdg text={task.topic} color={C.neutral} sm/>}
          <Bdg text={task.type} color={C.neutral} sm/>
          <Bdg text={`${task.estTime}m`} color={C.quant} sm/>
          <Bdg text={task.priority} color={priorityColor(task.priority)} sm/>
          <Bdg text={task.status} color={statusColor(task.status)} sm/>
          {task.locked&&<Bdg text="🔒" color={C.neutral} sm/>}
        </div>
        {task.notes&&!compact&&(
          <div style={{fontSize:11,color:"#94A3B8",marginTop:4,fontStyle:"italic"}}>
            {task.notes}
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:4,flexShrink:0,
        opacity:hov?1:.15,transition:"opacity .2s"}}>
        {onEdit&&(
          <button onClick={onEdit}
            style={{...btnBase,padding:"3px 9px",fontSize:11,
              background:"#F1F5F9",border:"none",color:"#475569"}}>
            Edit
          </button>
        )}
        {onDefer&&task.status!=="Deferred"&&(
          <button onClick={onDefer}
            style={{...btnBase,padding:"3px 9px",fontSize:11,
              background:C.amber.bg,border:"none",color:C.amber.text}}>
            Defer
          </button>
        )}
        {onDelete&&(
          <button onClick={onDelete}
            style={{...btnBase,padding:"3px 9px",fontSize:11,
              background:C.red.bg,border:"none",color:C.red.text}}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV = [
  {k:"setup",    icon:"🎯", label:"My Setup"},
  {k:"today",    icon:"📅", label:"Today"},
  {k:"weekly",   icon:"📋", label:"Weekly Planner"},
  {k:"daily",    icon:"✏️", label:"Daily Progress"},
  {k:"rebalance",icon:"⚖️", label:"Rebalancing"},
  {k:"progress", icon:"📊", label:"GMAT Progress"},
  {k:"topics",   icon:"🗂️", label:"Topic Tracker"},
  {k:"mocks",    icon:"🎯", label:"Mock Tests"},
  {k:"errors",   icon:"🔴", label:"Error Log"},
  {k:"analytics",icon:"💡", label:"Analytics"},
];

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [nav,      setNav]      = useState("setup");
  const [sideOpen, setSideOpen] = useState(true);

  // All state starts empty — user fills everything
  const [settings, setSettings] = useLS("gmatZ_settings",  emptySettings);
  const [weeks,    setWeeks]    = useLS("gmatZ_weeks",      ()=>[]);
  const [activeWk, setActiveWk] = useLS("gmatZ_activeWk",  0);
  const [topics,   setTopics]   = useLS("gmatZ_topics",     emptyTopics);
  const [mocks,    setMocks]    = useLS("gmatZ_mocks",      ()=>[]);
  const [errors,   setErrors]   = useLS("gmatZ_errors",     ()=>[]);

  const week = weeks.length>0
    ? (weeks[clamp(activeWk,0,weeks.length-1)]||weeks[0])
    : null;

  const updateWeek = useCallback(
    fn => setWeeks(ws=>ws.map((w,i)=>i===activeWk?fn(w):w)),
    [activeWk,setWeeks]
  );

  // Derived — only from real logged data
  const allTasks   = useMemo(()=>weeks.flatMap(w=>w.days.flatMap(d=>d.tasks)),[weeks]);
  const totalHrs   = useMemo(()=>weeks.reduce((a,w)=>
    a+w.days.reduce((b,d)=>b+(parseFloat(d.hoursLogged)||0),0),0),[weeks]);
  const totalQ     = useMemo(()=>topics.reduce((a,t)=>a+t.attempted,0),[topics]);
  const totalCor   = useMemo(()=>topics.reduce((a,t)=>a+t.correct,0),[topics]);
  const overallAcc = pct(totalCor,totalQ);
  const latestMock = useMemo(()=>
    [...mocks].sort((a,b)=>new Date(b.date)-new Date(a.date))[0],[mocks]);
  const daysLeft   = settings.examDate
    ? Math.max(0,Math.ceil((new Date(settings.examDate)-new Date())/864e5))
    : null;

  // Readiness — only computed once user has real data
  const readiness = useMemo(()=>{
    if(!mocks.length&&!totalQ&&!weeks.length) return null;
    const avgMock  = mocks.length
      ? Math.round(mocks.reduce((a,m)=>a+(parseInt(m.total)||0),0)/mocks.length) : 0;
    const mockProx = (mocks.length&&settings.targetScore)
      ? Math.min(100,pct(avgMock,parseInt(settings.targetScore))) : 0;
    const syllabus = pct(
      topics.filter(t=>["Improving","Strong","Mastered"].includes(t.mastery)).length,
      topics.length
    );
    const active   = weeks.filter(w=>
      w.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0)>=3).length;
    const consistency = pct(active,Math.max(weeks.length,1));
    const errRate  = errors.length
      ? pct(errors.filter(e=>e.resolved).length,errors.length) : 0;
    return clamp(
      Math.round(mockProx*.30+overallAcc*.25+syllabus*.20+consistency*.15+errRate*.10),
      0,100
    );
  },[mocks,totalQ,topics,weeks,errors,settings,overallAcc]);

  const isSetup = !settings.targetScore||!settings.examDate;

  const sp = {
    weeks,setWeeks,activeWk,setActiveWk,week,updateWeek,
    topics,setTopics,mocks,setMocks,errors,setErrors,settings,setSettings,
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#F8FAFC",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",fontSize:14}}>

      {/* ── Sidebar ── */}
      <div style={{width:sideOpen?220:54,flexShrink:0,background:"#1E1B4B",
        display:"flex",flexDirection:"column",transition:"width .2s",
        overflow:"hidden",position:"sticky",top:0,height:"100vh",zIndex:10}}>
        <div style={{padding:"1rem 14px",display:"flex",alignItems:"center",gap:10,
          borderBottom:"1px solid rgba(255,255,255,.08)",minHeight:56}}>
          <div style={{width:28,height:28,borderRadius:7,
            background:"linear-gradient(135deg,#7C3AED,#2563EB)",
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"#fff",fontWeight:800,fontSize:13,flexShrink:0}}>G</div>
          {sideOpen&&(
            <div style={{color:"#fff",fontWeight:700,fontSize:12.5,
              lineHeight:1.4,whiteSpace:"nowrap"}}>
              GMAT OS
              <br/>
              <span style={{color:"#818CF8",fontSize:10,fontWeight:400}}>
                Study Command Center
              </span>
            </div>
          )}
          <button onClick={()=>setSideOpen(s=>!s)}
            style={{marginLeft:"auto",background:"none",border:"none",
              cursor:"pointer",color:"rgba(255,255,255,.4)",fontSize:12,padding:4}}>
            {sideOpen?"◀":"▶"}
          </button>
        </div>

        <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
          {NAV.map(({k,icon,label})=>(
            <button key={k} onClick={()=>setNav(k)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"9px 14px",border:"none",
                borderLeft:nav===k?"3px solid #7C3AED":"3px solid transparent",
                background:nav===k?"rgba(124,58,237,.22)":"transparent",
                cursor:"pointer",
                color:nav===k?"#C4B5FD":"rgba(255,255,255,.55)",
                fontSize:12.5,fontWeight:nav===k?700:400,
                textAlign:"left",boxSizing:"border-box",
                whiteSpace:"nowrap",fontFamily:"inherit"}}>
              <span style={{fontSize:15,flexShrink:0,width:20,textAlign:"center"}}>
                {icon}
              </span>
              {sideOpen&&<span>{label}</span>}
            </button>
          ))}
        </nav>

        {sideOpen&&(
          <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,.08)",
            fontSize:11,color:"rgba(255,255,255,.35)",lineHeight:2}}>
            {settings.name&&<div>👤 {settings.name}</div>}
            {daysLeft!==null&&<div>📅 {daysLeft} days to exam</div>}
            {settings.targetScore&&<div>🎯 Target: {settings.targetScore}</div>}
            {latestMock&&<div>📋 Last mock: {latestMock.total}</div>}
            {readiness!==null&&<div>💪 Readiness: {readiness}%</div>}
          </div>
        )}
      </div>

      {/* ── Main panel ── */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>

        {/* Top bar */}
        <div style={{background:"#fff",borderBottom:"1px solid #E2E8F0",
          padding:"0 1.5rem",display:"flex",alignItems:"center",
          gap:10,height:52,flexShrink:0,boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#1E293B",marginRight:4}}>
            {NAV.find(n=>n.k===nav)?.label}
          </div>
          <div style={{flex:1,display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
            {weeks.length>0&&(
              <span style={{padding:"3px 10px",background:"#F8FAFC",borderRadius:20,
                border:"1px solid #E2E8F0",fontSize:11,color:"#7C3AED",fontWeight:600}}>
                📊 {pct(allTasks.filter(t=>t.status==="Completed").length,allTasks.length)}% done
              </span>
            )}
            {totalHrs>0&&(
              <span style={{padding:"3px 10px",background:"#F8FAFC",borderRadius:20,
                border:"1px solid #E2E8F0",fontSize:11,color:"#2563EB",fontWeight:600}}>
                ⏱ {fmtH(totalHrs)} logged
              </span>
            )}
            {latestMock&&(
              <span style={{padding:"3px 10px",background:"#F8FAFC",borderRadius:20,
                border:"1px solid #E2E8F0",fontSize:11,color:"#F59E0B",fontWeight:600}}>
                🎯 Last mock: {latestMock.total}
              </span>
            )}
            {overallAcc>0&&(
              <span style={{padding:"3px 10px",background:"#F8FAFC",borderRadius:20,
                border:"1px solid #E2E8F0",fontSize:11,color:"#10B981",fontWeight:600}}>
                📈 Acc: {overallAcc}%
              </span>
            )}
            {readiness!==null&&(
              <span style={{padding:"3px 10px",background:"#F8FAFC",borderRadius:20,
                border:"1px solid #E2E8F0",fontSize:11,color:"#6D28D9",fontWeight:600}}>
                🏁 {readiness}% ready
              </span>
            )}
          </div>
          {daysLeft!==null&&(
            <div style={{fontSize:12,color:daysLeft<14?"#EF4444":"#64748B",fontWeight:700}}>
              ⏳ {daysLeft}d left
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{flex:1,overflowY:"auto",padding:"1.5rem"}}>
          {isSetup&&nav!=="setup"&&(
            <div style={{...card,borderLeft:"4px solid #F59E0B",background:"#FFFBEB",
              color:"#92400E",marginBottom:"1.25rem",fontSize:13,
              display:"flex",gap:10,alignItems:"center"}}>
              ⚠ Complete your <strong>My Setup</strong> first — enter your target score
              and exam date so the app can calculate analytics for you.
              <button onClick={()=>setNav("setup")}
                style={{...btnBase,marginLeft:"auto",background:"#F59E0B",
                  color:"#fff",border:"none",padding:"5px 14px",fontSize:12}}>
                Go to Setup →
              </button>
            </div>
          )}

          {nav==="setup"     &&<SetupPage settings={settings} setSettings={setSettings}/>}
          {nav==="today"     &&<TodayPage {...sp}/>}
          {nav==="weekly"    &&<WeeklyPage {...sp}/>}
          {nav==="daily"     &&<DailyPage {...sp}/>}
          {nav==="rebalance" &&<RebalancePage {...sp}/>}
          {nav==="progress"  &&(
            <ProgressPage {...sp} readiness={readiness}
              overallAcc={overallAcc} totalHrs={totalHrs} allTasks={allTasks}/>
          )}
          {nav==="topics"    &&<TopicsPage topics={topics} setTopics={setTopics}/>}
          {nav==="mocks"     &&<MocksPage mocks={mocks} setMocks={setMocks} settings={settings}/>}
          {nav==="errors"    &&<ErrorsPage errors={errors} setErrors={setErrors}/>}
          {nav==="analytics" &&(
            <AnalyticsPage {...sp} readiness={readiness}
              overallAcc={overallAcc} totalHrs={totalHrs}
              allTasks={allTasks} daysLeft={daysLeft}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function SetupPage({settings,setSettings}) {
  const u = (k,v) => setSettings(s=>({...s,[k]:v}));
  const complete = settings.targetScore&&settings.examDate;
  return (
    <div style={{maxWidth:560}}>
      <div style={{fontSize:20,fontWeight:700,color:"#1E293B",marginBottom:4}}>
        Welcome to GMAT Study OS
      </div>
      <div style={{fontSize:13,color:"#64748B",marginBottom:"1.5rem"}}>
        Everything starts blank — you enter your data, and the app builds insights
        around it. Start by filling in your exam details below.
      </div>

      <div style={{...card,marginBottom:"1rem"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Your exam details</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}>
            <Lbl t="Your name (optional)"/>
            <input style={inp} value={settings.name||""} onChange={e=>u("name",e.target.value)}
              placeholder="e.g. Arjun"/>
          </div>
          <div>
            <Lbl t="Target GMAT score *"/>
            <input type="number" style={inp} value={settings.targetScore||""}
              onChange={e=>u("targetScore",e.target.value)} placeholder="e.g. 705"/>
            <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>
              GMAT Focus: 205–805
            </div>
          </div>
          <div>
            <Lbl t="Exam date *"/>
            <input type="date" style={inp} value={settings.examDate||""}
              onChange={e=>u("examDate",e.target.value)}/>
          </div>
          <div>
            <Lbl t="Study start date"/>
            <input type="date" style={inp} value={settings.startDate||todayStr()}
              onChange={e=>u("startDate",e.target.value)}/>
          </div>
          <div>
            <Lbl t="Weekly hour target"/>
            <input type="number" style={inp} value={settings.weeklyHours||""}
              onChange={e=>u("weeklyHours",e.target.value)} placeholder="e.g. 20"/>
          </div>
          <div>
            <Lbl t="Max daily study hours"/>
            <input type="number" style={inp} value={settings.maxDailyHours||""}
              onChange={e=>u("maxDailyHours",e.target.value)} placeholder="e.g. 6"/>
          </div>
        </div>
      </div>

      {complete ? (
        <div style={{...card,background:"#F0FDF4",borderColor:"#BBF7D0",
          color:"#14532D",fontSize:13}}>
          <strong>✓ Setup complete!</strong> Go to{" "}
          <strong>Weekly Planner</strong> to create your first week.
        </div>
      ) : (
        <div style={{...card,background:"#FFFBEB",borderColor:"#FDE68A",
          color:"#92400E",fontSize:13}}>
          Fill in your <strong>target score</strong> and{" "}
          <strong>exam date</strong> to unlock analytics and readiness scoring.
        </div>
      )}

      <div style={{...card,marginTop:"1rem"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>How this app works</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            ["📋 Weekly Planner","Create a week and add tasks day by day."],
            ["📅 Today","Check off tasks. Log hours studied."],
            ["✏️ Daily Progress","Log questions attempted and accuracy per session."],
            ["⚖️ Rebalancing","Incomplete tasks get redistributed to remaining days."],
            ["📊 GMAT Progress","Readiness score builds as you log real data."],
            ["🗂️ Topic Tracker","Update mastery per topic. Accuracy tracked automatically."],
            ["🎯 Mock Tests","Log mock scores. Score trend calculated automatically."],
            ["🔴 Error Log","Log every mistake. Mark resolved after reattempting."],
            ["💡 Analytics","Planned vs actual, burnout risk — all from your real data."],
          ].map(([t,d])=>(
            <div key={t} style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontWeight:600,fontSize:12,color:"#1E293B",marginBottom:2}}>{t}</div>
              <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.4}}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{...card,marginTop:"1rem"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Data & backup</div>
        <div style={{fontSize:12,color:"#64748B",lineHeight:1.7,marginBottom:10}}>
          All data is stored <strong>only in your browser</strong>. Nothing goes to any
          server. Export a JSON backup regularly so you don't lose your progress.
        </div>
        <Btn ch="⬇ Export backup JSON" v="ghost" onClick={()=>{
          const d={
            settings:JSON.parse(localStorage.getItem("gmatZ_settings")||"{}"),
            weeks:JSON.parse(localStorage.getItem("gmatZ_weeks")||"[]"),
            topics:JSON.parse(localStorage.getItem("gmatZ_topics")||"[]"),
            mocks:JSON.parse(localStorage.getItem("gmatZ_mocks")||"[]"),
            errors:JSON.parse(localStorage.getItem("gmatZ_errors")||"[]"),
            exportDate:new Date().toISOString(),
          };
          const a=document.createElement("a");
          a.href="data:application/json;charset=utf-8,"+
            encodeURIComponent(JSON.stringify(d,null,2));
          a.download=`gmat_backup_${todayStr()}.json`;
          a.click();
        }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TODAY PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function TodayPage({week,updateWeek,topics,settings}) {
  const [editTask, setEditTask] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  if(!week) return (
    <Empty icon="📋" title="No week set up yet"
      sub="Go to Weekly Planner and create your first week to start planning tasks."/>
  );

  const tn   = todayDayName();
  const di   = week.days.findIndex(d=>d.name===tn);
  const day  = week.days[di>=0?di:0];
  const tasks= day?.tasks||[];
  const done = tasks.filter(t=>t.status==="Completed").length;
  const total= tasks.length;
  const estLeft = tasks
    .filter(t=>!["Completed","Deferred"].includes(t.status))
    .reduce((a,t)=>a+t.estTime,0);
  const weakFocus = [...topics]
    .filter(t=>t.attempted>0)
    .sort((a,b)=>a.accuracy-b.accuracy)
    .slice(0,3);
  const tomorrow = di<week.days.length-1?week.days[di+1]:null;

  const updDay = fn => updateWeek(w=>({...w,days:w.days.map((d,i)=>i===di?fn(d):d)}));
  const toggle = i  => updDay(d=>({...d,tasks:d.tasks.map((t,j)=>
    j===i?{...t,status:t.status==="Completed"?"Not Started":"Completed"}:t)}));
  const defer  = i  => updDay(d=>({...d,tasks:d.tasks.map((t,j)=>
    j===i?{...t,status:"Deferred"}:t)}));
  const remove = i  => updDay(d=>({...d,tasks:d.tasks.filter((_,j)=>j!==i)}));

  const saveTask = t => {
    if(t._moveDay&&t._moveDay!=="") {
      const toDi=week.days.findIndex(d=>d.name===t._moveDay);
      const {_moveDay,...clean}=t;
      updateWeek(w=>({...w,days:w.days.map((d,i)=>{
        if(i===di)   return {...d,tasks:d.tasks.filter(x=>x.id!==t.id)};
        if(i===toDi) return {...d,tasks:[...d.tasks,clean]};
        return d;
      })}));
    } else {
      updDay(d=>({...d,tasks:
        d.tasks.map(x=>x.id===t.id?t:x)
               .concat(d.tasks.find(x=>x.id===t.id)?[]:[t])}));
    }
    setEditTask(null);
  };

  const addTask = t => { updDay(d=>({...d,tasks:[...d.tasks,t]})); setShowAdd(false); };
  const markAll = () => updDay(d=>({...d,tasks:d.tasks.map(t=>({...t,status:"Completed"}))}));
  const moveUnfinished = () => {
    const ni=di+1;
    if(ni>=week.days.length) {
      alert("No more days this week. Use Rebalancing to carry tasks to next week.");
      return;
    }
    updateWeek(w=>{
      const pend=w.days[di].tasks.filter(t=>!["Completed","Deferred"].includes(t.status));
      return {...w,days:w.days.map((d,i)=>{
        if(i===di)  return {...d,tasks:d.tasks.filter(t=>["Completed","Deferred"].includes(t.status))};
        if(i===ni)  return {...d,tasks:[...d.tasks,...pend.map(t=>({...t,status:"Not Started"}))]};
        return d;
      })};
    });
  };

  return (
    <div style={{maxWidth:960}}>
      {/* Banner */}
      <div style={{background:"linear-gradient(135deg,#1E1B4B,#312E81)",
        borderRadius:14,padding:"1rem 1.5rem",marginBottom:"1.25rem",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{color:"#A5B4FC",fontSize:11,marginBottom:3}}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            {" "}· {week.label}
          </div>
          <div style={{color:"#fff",fontSize:15,fontWeight:500}}>
            {tasks.length===0
              ? `Today is ${tn}. No tasks yet — add one below.`
              : done===total&&total>0
                ? `All ${total} tasks done today! Great session. 🎉`
                : `${done} of ${total} tasks done today.`
            }
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn ch="+ Add task" v="primary" onClick={()=>setShowAdd(true)}/>
          {tasks.length>0&&<Btn ch="✓ Mark all done" v="green" onClick={markAll}/>}
          {tasks.some(t=>!["Completed","Deferred"].includes(t.status))&&(
            <Btn ch="→ Move unfinished" onClick={moveUnfinished}/>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
        gap:12,marginBottom:"1.25rem"}}>
        <MCard label="Tasks done"
          value={total>0?`${done}/${total}`:"—"}
          color={done===total&&total>0?"#10B981":"#7C3AED"}/>
        <MCard label="Hours logged"
          value={day?.hoursLogged?fmtH(parseFloat(day.hoursLogged)):"—"}
          color="#F59E0B"/>
        <MCard label="Est. time left"
          value={estLeft>0?fmtH(estLeft/60):done===total&&total>0?"✓":"—"}
          color="#2563EB"/>
        <MCard label="Deferred"
          value={tasks.filter(t=>t.status==="Deferred").length}
          color="#94A3B8"/>
      </div>

      {/* Progress bar */}
      {total>0&&(
        <div style={{...card,marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:13}}>Today's progress</div>
            <div style={{fontSize:12,color:"#64748B"}}>{pct(done,total)}%</div>
          </div>
          <PBar value={pct(done,total)}
            color={done===total?"#10B981":"#7C3AED"} h={10}/>
          <div style={{display:"flex",gap:16,marginTop:8,fontSize:11,flexWrap:"wrap"}}>
            {STATUS_OPTS.map(s=>{
              const n=tasks.filter(t=>t.status===s).length;
              return n>0
                ? <span key={s} style={{color:statusColor(s).solid}}>● {s}: {n}</span>
                : null;
            })}
          </div>
        </div>
      )}

      {/* Log + focus */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",
        gap:"1.25rem",marginBottom:"1.25rem"}}>
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>
            Log today's session
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <div style={{flex:"0 0 110px"}}>
              <Lbl t="Hours studied"/>
              <input type="number" min="0" max="24" step="0.5"
                style={{...inp,width:100}}
                value={day?.hoursLogged||""}
                onChange={e=>updDay(d=>({...d,hoursLogged:e.target.value}))}
                placeholder="0"/>
            </div>
            <div style={{flex:1,minWidth:160}}>
              <Lbl t="Session notes"/>
              <input style={inp}
                placeholder="What did you study? How did it feel?"
                value={day?.notes||""}
                onChange={e=>updDay(d=>({...d,notes:e.target.value}))}/>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Your weak areas</div>
          {weakFocus.length===0
            ? <div style={{fontSize:12,color:"#94A3B8"}}>
                Log accuracy in Daily Progress to see weak areas here.
              </div>
            : weakFocus.map(t=>(
              <div key={t.topic}
                style={{display:"flex",justifyContent:"space-between",
                  padding:"5px 0",borderBottom:"1px solid #F8FAFC"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600}}>{t.topic}</div>
                  <div style={{fontSize:10,color:"#94A3B8"}}>{t.section}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,
                  color:t.accuracy<50?"#EF4444":"#F59E0B"}}>
                  {Math.round(t.accuracy)}%
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Task list */}
      <div style={card}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
          Tasks for {tn}
        </div>
        {tasks.length===0
          ? <Empty icon="📝" title="No tasks for today"
              sub="Add tasks below, or go to Weekly Planner to set up your week."
              action={<Btn ch="+ Add task" v="primary" onClick={()=>setShowAdd(true)}/>}/>
          : tasks.map((task,i)=>(
            <TaskCard key={task.id||i} task={task}
              onToggle={()=>toggle(i)}
              onEdit={()=>setEditTask({...task})}
              onDelete={()=>remove(i)}
              onDefer={()=>defer(i)}/>
          ))
        }
      </div>

      {/* Tomorrow preview */}
      {tomorrow&&(
        <div style={{...card,marginTop:"1.25rem",borderLeft:"3px solid #7C3AED"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:5}}>
            Tomorrow — {tomorrow.name}
          </div>
          <div style={{fontSize:12,color:"#64748B",display:"flex",gap:16,flexWrap:"wrap"}}>
            <span>📋 {tomorrow.tasks?.length||0} tasks planned</span>
            <span>⏱ {fmtH((tomorrow.tasks||[]).reduce((a,t)=>a+t.estTime,0)/60)} estimated</span>
            <span>🕐 {tomorrow.hours||"?"} h available</span>
          </div>
        </div>
      )}

      {showAdd&&(
        <Modal title="Add task for today" onClose={()=>setShowAdd(false)}>
          <TaskForm initial={{date:todayStr()}} onSave={addTask}
            onCancel={()=>setShowAdd(false)}
            dayNames={week.days.map(d=>d.name).filter(n=>n!==tn)}/>
        </Modal>
      )}
      {editTask&&(
        <Modal title="Edit task" onClose={()=>setEditTask(null)} width={560}>
          <TaskForm initial={editTask} dayNames={week.days.map(d=>d.name)}
            onSave={saveTask} onCancel={()=>setEditTask(null)}/>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY PLANNER
// ═══════════════════════════════════════════════════════════════════════════════
function WeeklyPage({weeks,setWeeks,activeWk,setActiveWk,updateWeek,week,settings}) {
  const [editTask,  setEditTask]  = useState(null);
  const [addDay,    setAddDay]    = useState(null);
  const [showGoals, setShowGoals] = useState(false);
  const [newLabel,  setNewLabel]  = useState("");
  const [showNew,   setShowNew]   = useState(false);

  const updDayTasks = (di,fn) =>
    updateWeek(w=>({...w,days:w.days.map((d,i)=>i===di?{...d,tasks:fn(d.tasks)}:d)}));
  const toggle = (di,ti) => updDayTasks(di,ts=>ts.map((t,j)=>
    j===ti?{...t,status:t.status==="Completed"?"Not Started":"Completed"}:t));
  const del    = (di,ti) => updDayTasks(di,ts=>ts.filter((_,j)=>j!==ti));
  const addTask= (di,t)  => { updDayTasks(di,ts=>[...ts,t]); setAddDay(null); };

  const saveEdit = t => {
    if(t._moveDay&&t._moveDay!=="") {
      updateWeek(w=>{
        const fDi=w.days.findIndex(d=>d.tasks.find(x=>x.id===t.id));
        const tDi=w.days.findIndex(d=>d.name===t._moveDay);
        const {_moveDay,...clean}=t;
        return {...w,days:w.days.map((d,i)=>{
          if(i===fDi) return {...d,tasks:d.tasks.filter(x=>x.id!==t.id)};
          if(i===tDi) return {...d,tasks:[...d.tasks,clean]};
          return d;
        })};
      });
    } else {
      updateWeek(w=>({...w,days:w.days.map(d=>({...d,tasks:d.tasks.map(x=>x.id===t.id?t:x)}))}));
    }
    setEditTask(null);
  };

  const createWeek = () => {
    const w = emptyWeek(newLabel.trim()||`Week ${weeks.length+1}`);
    setWeeks(ws=>[...ws,w]);
    setActiveWk(weeks.length);
    setNewLabel(""); setShowNew(false);
  };

  // First-time empty state
  if(!week&&weeks.length===0) return (
    <div>
      <div style={{fontSize:20,fontWeight:700,color:"#1E293B",marginBottom:"1rem"}}>
        Weekly Planner
      </div>
      <div style={{...card,maxWidth:480}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>
          Create your first week
        </div>
        <div style={{fontSize:13,color:"#64748B",marginBottom:12}}>
          Each week you plan tasks day by day. Incomplete tasks carry forward
          automatically via the Rebalancing Engine.
        </div>
        <Lbl t="Week label"/>
        <input style={{...inp,marginBottom:10}} value={newLabel}
          onChange={e=>setNewLabel(e.target.value)}
          placeholder="e.g. Week 1 — Quant Focus"/>
        <Btn ch="Create first week" v="primary" onClick={createWeek}/>
      </div>
    </div>
  );

  const totT  = week?.days.reduce((a,d)=>a+d.tasks.length,0)||0;
  const doneT = week?.days.reduce((a,d)=>a+d.tasks.filter(t=>t.status==="Completed").length,0)||0;
  const logH  = week?.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0)||0;

  return (
    <div>
      {/* Week selector */}
      <div style={{display:"flex",gap:8,alignItems:"center",
        marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
          {weeks.map((w,i)=>(
            <button key={w.id} onClick={()=>setActiveWk(i)}
              style={{...btnBase,borderColor:i===activeWk?"#7C3AED":"#E2E8F0",
                background:i===activeWk?"#EDE9FE":"#fff",
                color:i===activeWk?"#6D28D9":"#475569",
                fontWeight:i===activeWk?700:400}}>
              {w.label}
            </button>
          ))}
        </div>
        <Btn ch={showNew?"Cancel":"+ New week"} v={showNew?"default":"primary"}
          onClick={()=>setShowNew(s=>!s)}/>
        <Btn ch={showGoals?"Hide goals":"⚙ Goals"}
          onClick={()=>setShowGoals(s=>!s)}/>
      </div>

      {showNew&&(
        <div style={{...card,marginBottom:"1rem",display:"flex",
          gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <Lbl t="Week label"/>
            <input style={inp} placeholder="e.g. Week 2 — Verbal Focus"
              value={newLabel} onChange={e=>setNewLabel(e.target.value)}/>
          </div>
          <Btn ch="Create" v="primary" onClick={createWeek}/>
        </div>
      )}

      {showGoals&&week&&(
        <div style={{...card,marginBottom:"1.25rem"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>
            Weekly targets
          </div>
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
            gap:10,marginBottom:14}}>
            {[
              ["hours","Target study hours"],
              ["quant","Quant tasks"],
              ["verbal","Verbal tasks"],
              ["di","DI tasks"],
              ["mocks","Mock tests"],
              ["questions","Practice questions"],
              ["revision","Revision sessions"],
              ["errorLog","Error log reviews"],
            ].map(([k,l])=>(
              <div key={k}>
                <Lbl t={l}/>
                <input type="number" min="0" style={inp}
                  value={week.goals[k]||""}
                  onChange={e=>updateWeek(w=>({...w,goals:{...w.goals,[k]:e.target.value}}))}
                  placeholder="0"/>
              </div>
            ))}
          </div>

          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>
            Day availability & hours
          </div>
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))",gap:8}}>
            {week.days.map((d,i)=>(
              <div key={d.name}
                style={{...card,padding:"0.75rem",boxShadow:"none",
                  opacity:d.available?1:.55}}>
                <label style={{display:"flex",gap:6,alignItems:"center",
                  cursor:"pointer",fontWeight:700,fontSize:12,marginBottom:7}}>
                  <input type="checkbox" checked={d.available}
                    onChange={e=>updateWeek(w=>({...w,days:w.days.map((dd,j)=>
                      j===i?{...dd,available:e.target.checked}:dd)}))}/>
                  {d.name.slice(0,3)}
                </label>
                {d.available&&(
                  <>
                    <Lbl t="Hours"/>
                    <input type="number" min="0" max="16" step=".5"
                      style={{...inp,marginBottom:4}}
                      value={d.hours||""}
                      onChange={e=>updateWeek(w=>({...w,days:w.days.map((dd,j)=>
                        j===i?{...dd,hours:e.target.value}:dd)}))}
                      placeholder="3"/>
                    <label style={{fontSize:11,cursor:"pointer",
                      display:"flex",gap:4,alignItems:"center",marginTop:4}}>
                      <input type="checkbox" checked={!!d.allowMock}
                        onChange={e=>updateWeek(w=>({...w,days:w.days.map((dd,j)=>
                          j===i?{...dd,allowMock:e.target.checked}:dd)}))}/>
                      Mock day
                    </label>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {week&&(
        <div style={{display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
          gap:12,marginBottom:"1.25rem"}}>
          <MCard label="Tasks planned" value={totT||0}/>
          <MCard label="Tasks done" value={doneT||0} color="#10B981"/>
          <MCard label="Hours logged" value={fmtH(logH)} color="#F59E0B"
            sub={week.goals.hours?`Target: ${week.goals.hours}h`:undefined}/>
          <MCard label="Completion"
            value={totT>0?`${pct(doneT,totT)}%`:"—"}/>
        </div>
      )}

      {/* Day cards */}
      {week&&(
        <div style={{display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>
          {week.days.map((day,di)=>{
            const d2=day.tasks.filter(t=>t.status==="Completed").length;
            const t2=day.tasks.length;
            const isToday=day.name===todayDayName();
            return (
              <div key={day.name}
                style={{...card,opacity:day.available?1:.5,
                  borderColor:isToday?"#7C3AED":"#E2E8F0"}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,
                      color:isToday?"#7C3AED":"#1E293B"}}>
                      {day.name}{isToday?" ★":""}
                    </div>
                    <div style={{fontSize:11,color:"#94A3B8"}}>
                      {day.available?`${day.hours||"?"}h available`:"Off"}
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#64748B"}}>{d2}/{t2}</div>
                </div>
                {t2>0&&<PBar value={pct(d2,t2)} style={{marginBottom:10}}/>}
                <div style={{maxHeight:260,overflowY:"auto"}}>
                  {day.tasks.map((task,ti)=>(
                    <TaskCard key={task.id||ti} task={task} compact
                      onToggle={()=>toggle(di,ti)}
                      onEdit={()=>setEditTask({...task})}
                      onDelete={()=>del(di,ti)}/>
                  ))}
                </div>
                {day.tasks.length===0&&day.available&&(
                  <div style={{textAlign:"center",padding:"0.75rem 0",
                    color:"#94A3B8",fontSize:12}}>
                    No tasks yet
                  </div>
                )}
                {day.available&&(
                  addDay===di
                    ? <div style={{borderTop:"1px solid #F1F5F9",
                        paddingTop:10,marginTop:6}}>
                        <TaskForm initial={{date:todayStr()}}
                          onSave={t=>addTask(di,t)}
                          onCancel={()=>setAddDay(null)}/>
                      </div>
                    : <Btn ch="+ Add task"
                        style={{width:"100%",marginTop:8,justifyContent:"center",
                          color:"#7C3AED",borderColor:"#DDD6FE",background:"#FAFAFE"}}
                        onClick={()=>setAddDay(di)}/>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editTask&&(
        <Modal title="Edit task" onClose={()=>setEditTask(null)} width={560}>
          <TaskForm initial={editTask} dayNames={week?.days.map(d=>d.name)||[]}
            onSave={saveEdit} onCancel={()=>setEditTask(null)}/>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════
function DailyPage({week,updateWeek,topics,setTopics}) {
  const [sel,  setSel]  = useState(todayDayName());
  const [form, setForm] = useState({
    attempted:"",correct:"",energy:"Medium",
    confidence:"Medium",wellNotes:"",hardNotes:"",
  });
  const u = (k,v) => setForm(f=>({...f,[k]:v}));

  if(!week) return (
    <Empty icon="📋" title="No week created yet"
      sub="Create a week in Weekly Planner first."/>
  );

  const di  = week.days.findIndex(d=>d.name===sel);
  const day = week.days[di>=0?di:0];
  const acc = parseFloat(form.attempted)>0
    ? pct(parseFloat(form.correct||0),parseFloat(form.attempted)) : 0;
  const updDay = fn =>
    updateWeek(w=>({...w,days:w.days.map((d,i)=>i===di?fn(d):d)}));

  const saveLog = () => {
    const att=parseInt(form.attempted)||0;
    const cor=parseInt(form.correct)||0;
    if(att===0) { alert("Enter the number of questions attempted."); return; }
    updDay(d=>({...d,
      attempted:(parseInt(d.attempted)||0)+att,
      correct:(parseInt(d.correct)||0)+cor,
      energy:form.energy, confidence:form.confidence,
      wellNotes:form.wellNotes, hardNotes:form.hardNotes,
    }));
    // Update topic accuracy for tasks completed today
    const completedTopics=(day?.tasks||[])
      .filter(t=>t.status==="Completed").map(t=>t.topic);
    if(completedTopics.length>0) {
      const perT=Math.round(att/completedTopics.length);
      const perC=Math.round(cor/completedTopics.length);
      setTopics(ts=>ts.map(t=>{
        if(!completedTopics.includes(t.topic)) return t;
        const nA=t.attempted+perT, nC=t.correct+perC;
        const nAcc=nA>0?pct(nC,nA):t.accuracy;
        return {...t,attempted:nA,correct:nC,accuracy:nAcc,lastStudied:todayStr()};
      }));
    }
    setForm({attempted:"",correct:"",energy:"Medium",
      confidence:"Medium",wellNotes:"",hardNotes:""});
    alert("Progress saved!");
  };

  const tasks=day?.tasks||[];

  return (
    <div style={{maxWidth:960}}>
      {/* Day selector */}
      <div style={{display:"flex",gap:8,marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {week.days.map(d=>{
          const dk=d.tasks.filter(t=>t.status==="Completed").length;
          const dt=d.tasks.length;
          const isT=d.name===todayDayName();
          return (
            <button key={d.name} onClick={()=>setSel(d.name)}
              style={{...btnBase,
                borderColor:sel===d.name?"#7C3AED":"#E2E8F0",
                background:sel===d.name?"#EDE9FE":isT?"#F5F3FF":"#fff",
                color:sel===d.name?"#6D28D9":"#475569",
                fontWeight:sel===d.name?700:400}}>
              {d.name.slice(0,3)}{isT?" ★":" "}
              <span style={{fontSize:10,color:"#94A3B8"}}>
                {dt>0?`${pct(dk,dt)}%`:""}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
        gap:"1.25rem",marginBottom:"1.25rem"}}>
        {/* Task status */}
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
            Task status — {sel}
          </div>
          {tasks.length===0&&(
            <Empty icon="📋" title="No tasks this day"
              sub="Add tasks from Weekly Planner."/>
          )}
          {tasks.map((t,i)=>(
            <div key={t.id||i}
              style={{display:"flex",gap:8,alignItems:"center",
                padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
              <div style={{flex:1,fontSize:12,fontWeight:500,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {t.title}
              </div>
              <Sel value={t.status}
                onChange={v=>updDay(d=>({...d,tasks:d.tasks.map((tk,j)=>
                  j===i?{...tk,status:v}:tk)}))}
                options={STATUS_OPTS}
                style={{width:130,height:30,fontSize:12}}/>
            </div>
          ))}
          <div style={{marginTop:12,display:"flex",gap:10,alignItems:"center"}}>
            <Lbl t="Hours logged"/>
            <input type="number" min="0" max="24" step="0.5"
              style={{...inp,width:90}}
              value={day?.hoursLogged||""}
              onChange={e=>updDay(d=>({...d,hoursLogged:e.target.value}))}
              placeholder="0"/>
          </div>
        </div>

        {/* Accuracy log */}
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
            Log session accuracy
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
            gap:8,marginBottom:10}}>
            <div>
              <Lbl t="Questions attempted"/>
              <input type="number" min="0" style={inp}
                value={form.attempted}
                onChange={e=>u("attempted",e.target.value)}
                placeholder="e.g. 25"/>
            </div>
            <div>
              <Lbl t="Correct answers"/>
              <input type="number" min="0" style={inp}
                value={form.correct}
                onChange={e=>u("correct",e.target.value)}
                placeholder="e.g. 17"/>
            </div>
            <div>
              <Lbl t="Accuracy"/>
              <div style={{...inp,background:"#F8FAFC",fontWeight:700,
                color:acc>=70?"#10B981":acc>=50?"#F59E0B":"#EF4444"}}>
                {form.attempted?`${acc}%`:"—"}
              </div>
            </div>
            <div>
              <Lbl t="Energy level"/>
              <Sel value={form.energy} onChange={v=>u("energy",v)}
                options={["Low","Medium","High"]}/>
            </div>
            <div>
              <Lbl t="Confidence"/>
              <Sel value={form.confidence} onChange={v=>u("confidence",v)}
                options={["Low","Medium","High"]}/>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <Lbl t="What went well"/>
            <textarea style={{...inp,resize:"vertical",minHeight:48}}
              value={form.wellNotes} onChange={e=>u("wellNotes",e.target.value)}
              placeholder="Topics you nailed, strategies that clicked..."/>
          </div>
          <div style={{marginBottom:12}}>
            <Lbl t="What was difficult"/>
            <textarea style={{...inp,resize:"vertical",minHeight:48}}
              value={form.hardNotes} onChange={e=>u("hardNotes",e.target.value)}
              placeholder="Areas that need more work..."/>
          </div>
          <Btn ch="✓ Save daily progress" v="primary"
            style={{width:"100%"}} onClick={saveLog}/>
        </div>
      </div>

      {/* Week glance */}
      <div style={card}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
          Week at a glance — {week.label}
        </div>
        <div style={{display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>
          {week.days.map(d=>{
            const dk=d.tasks.filter(t=>t.status==="Completed").length;
            const dt=d.tasks.length;
            return (
              <div key={d.name} onClick={()=>setSel(d.name)}
                style={{...card,cursor:"pointer",boxShadow:"none",
                  borderColor:sel===d.name?"#7C3AED":"#E2E8F0",
                  padding:"0.75rem 1rem"}}>
                <div style={{fontWeight:700,fontSize:11,
                  color:d.name===todayDayName()?"#7C3AED":"#1E293B",marginBottom:4}}>
                  {d.name.slice(0,3)}{d.name===todayDayName()?" ★":""}
                </div>
                <PBar value={pct(dk,dt)} h={4} style={{marginBottom:4}}/>
                <div style={{fontSize:10,color:"#94A3B8"}}>
                  {dk}/{dt} · {d.hoursLogged||0}h
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REBALANCING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
function RebalancePage({week,updateWeek,topics,settings}) {
  const [proposal, setProposal] = useState(null);
  const [editMode, setEditMode] = useState(false);

  if(!week) return (
    <Empty icon="⚖️" title="No week to rebalance"
      sub="Create a week in Weekly Planner first."/>
  );

  const todayIdx  = week.days.findIndex(d=>d.name===todayDayName());
  const weakNames = [...topics].filter(t=>t.attempted>0)
    .sort((a,b)=>a.accuracy-b.accuracy).slice(0,8).map(t=>t.topic);
  const weakTopics= [...topics].filter(t=>t.attempted>0)
    .sort((a,b)=>a.accuracy-b.accuracy).slice(0,5);

  const analyze = () => {
    const maxH=parseFloat(settings.maxDailyHours)||6;
    const pending=[];
    week.days.forEach((d,i)=>{
      if(i>todayIdx) return;
      d.tasks.filter(t=>!t.locked&&!["Completed","Deferred"].includes(t.status))
        .forEach(t=>pending.push({...t,_fromDay:d.name,_fromIdx:i}));
    });
    const pScore={Critical:400,High:300,Medium:200,Low:100};
    pending.sort((a,b)=>{
      const wa=weakNames.includes(a.topic)?50:0;
      const wb=weakNames.includes(b.topic)?50:0;
      return(pScore[b.priority]+wb)-(pScore[a.priority]+wa);
    });
    const buckets=week.days
      .map((d,i)=>({...d,idx:i}))
      .filter((_,i)=>i>todayIdx)
      .filter(d=>d.available)
      .map(d=>({
        name:d.name, idx:d.idx, allowMock:d.allowMock,
        capacityMin:Math.min(parseFloat(d.hours)||3,maxH)*60,
        usedMin:d.tasks.filter(t=>t.locked||["Completed","Deferred"].includes(t.status))
          .reduce((a,t)=>a+t.estTime,0),
        tasks:[],
      }));

    if(!buckets.length) {
      setProposal({
        error:"No remaining available days this week. Create a new week and carry tasks forward.",
        pending,buckets:[],overflow:[],
      });
      return;
    }

    const overflow=[];
    pending.forEach(task=>{
      const isMock=task.type==="Mock Test";
      const bucket=
        buckets.find(b=>(!isMock||b.allowMock)&&b.usedMin+task.estTime<=b.capacityMin+15)
        ||(!isMock?buckets.reduce((best,b)=>(!best||b.usedMin<best.usedMin)?b:best,null):null);
      if(bucket){bucket.tasks.push(task);bucket.usedMin+=task.estTime;}
      else overflow.push(task);
    });

    const warnings=[];
    if(overflow.length) warnings.push(`${overflow.length} task(s) couldn't fit — listed as overflow.`);
    buckets.forEach(b=>{
      const l=b.usedMin/(b.capacityMin||1);
      if(l>.95) warnings.push(`${b.name} is at ${Math.round(l*100)}% capacity.`);
    });
    if(pending.length===0) warnings.push("Nothing to rebalance — you're on schedule! 🎉");

    setProposal({pending,buckets,overflow,warnings,error:null});
    setEditMode(false);
  };

  const apply = () => {
    if(!proposal||proposal.error) return;
    updateWeek(w=>({...w,days:w.days.map((d,i)=>{
      const b=proposal.buckets.find(b=>b.idx===i);
      if(i<=todayIdx)
        return {...d,tasks:d.tasks.filter(t=>t.locked||["Completed","Deferred"].includes(t.status))};
      if(b) return {
        ...d,tasks:[
          ...w.days[i].tasks.filter(t=>t.locked||["Completed","Deferred"].includes(t.status)),
          ...b.tasks.map(t=>{const{_fromDay,_fromIdx,...c}=t;return{...c,status:"Not Started"};}),
        ],
      };
      return d;
    })}));
    setProposal(null);
  };

  const removeFromBucket=(bi,taskId)=>setProposal(p=>({...p,
    buckets:p.buckets.map((b,i)=>i===bi?{
      ...b,
      tasks:b.tasks.filter(t=>t.id!==taskId),
      usedMin:b.usedMin-(b.tasks.find(t=>t.id===taskId)?.estTime||0),
    }:b),
  }));

  return (
    <div style={{maxWidth:960}}>
      <div style={{display:"flex",justifyContent:"space-between",
        alignItems:"center",marginBottom:"1.25rem",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:"#1E293B"}}>
            Rebalancing Engine
          </div>
          <div style={{fontSize:12,color:"#64748B"}}>
            Redistributes incomplete tasks across remaining days — priority and weak-topic aware
          </div>
        </div>
        <Btn ch="⚖️ Analyze & propose" v="primary" onClick={analyze}/>
      </div>

      {/* Day capacity overview */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",
        gap:10,marginBottom:"1.25rem"}}>
        {week.days.map((d,i)=>{
          const pend=d.tasks.filter(t=>!["Completed","Deferred"].includes(t.status)&&!t.locked).length;
          const done=d.tasks.filter(t=>t.status==="Completed").length;
          const tot=d.tasks.length;
          const estH=d.tasks.reduce((a,t)=>a+t.estTime,0)/60;
          const avH=parseFloat(d.hours)||3;
          const isOver=estH>avH+.3;
          return (
            <div key={d.name}
              style={{...card,padding:"0.75rem",
                borderColor:isOver?C.red.border:d.name===todayDayName()?"#7C3AED":"#E2E8F0"}}>
              <div style={{fontWeight:700,fontSize:11,marginBottom:4,
                color:d.name===todayDayName()?"#7C3AED":"#1E293B"}}>
                {d.name.slice(0,3)}{d.name===todayDayName()?" ★":""}
              </div>
              <div style={{fontSize:16,fontWeight:700,
                color:done===tot&&tot>0?"#10B981":pend>0?"#EF4444":"#64748B"}}>
                {done}/{tot}
              </div>
              <div style={{fontSize:10,color:"#94A3B8"}}>{d.hours||"?"}h</div>
              {isOver&&<Bdg text="⚠ over" color={C.red} sm/>}
            </div>
          );
        })}
      </div>

      {/* Weak areas context */}
      {weakTopics.length>0&&(
        <div style={{...card,marginBottom:"1.25rem"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>
            Your weak areas — given priority in redistribution
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {weakTopics.map(t=>(
              <div key={t.topic}
                style={{padding:"6px 12px",borderRadius:8,
                  background:C.red.bg,border:`1px solid ${C.red.border}`}}>
                <div style={{fontSize:12,fontWeight:600,color:C.red.text}}>{t.topic}</div>
                <div style={{fontSize:10,color:"#94A3B8"}}>
                  {t.section} · {Math.round(t.accuracy)}% acc
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!proposal&&(
        <Empty icon="⚖️" title="Click 'Analyze' to get a proposal"
          sub="The engine collects pending tasks from today and earlier, sorts by priority (boosting your weak topics), then distributes across remaining available days within your daily hour limits."/>
      )}

      {proposal?.error&&(
        <div style={{...card,borderLeft:`4px solid ${C.red.solid}`,
          background:C.red.bg,color:C.red.text,padding:"0.875rem 1rem",fontSize:13}}>
          {proposal.error}
        </div>
      )}

      {proposal&&!proposal.error&&(
        <div>
          {proposal.warnings.map((w,i)=>(
            <div key={i}
              style={{background:C.amber.bg,border:`1px solid ${C.amber.border}`,
                borderLeft:`4px solid ${C.amber.solid}`,borderRadius:8,
                padding:"9px 14px",marginBottom:8,color:C.amber.text,fontSize:12}}>
              ⚠ {w}
            </div>
          ))}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
            gap:"1.25rem",marginBottom:"1rem"}}>
            {/* Pending list */}
            <div style={card}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>
                Pending tasks ({proposal.pending.length})
              </div>
              {proposal.pending.length===0
                ? <div style={{color:"#94A3B8",fontSize:12}}>All tasks on track! 🎉</div>
                : <div style={{maxHeight:320,overflowY:"auto"}}>
                    {proposal.pending.map(t=>(
                      <div key={t.id}
                        style={{padding:"5px 0",borderBottom:"1px solid #F8FAFC"}}>
                        <div style={{fontSize:12,fontWeight:500}}>{t.title}</div>
                        <div style={{display:"flex",gap:5,marginTop:2}}>
                          <Bdg text={t._fromDay} color={C.neutral} sm/>
                          <Bdg text={t.priority} color={priorityColor(t.priority)} sm/>
                          {weakNames.includes(t.topic)&&(
                            <Bdg text="⬆ weak area" color={C.red} sm/>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Proposed distribution */}
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:13}}>Proposed plan</div>
                <Btn ch={editMode?"✓ Done":"✎ Edit"}
                  onClick={()=>setEditMode(s=>!s)}/>
              </div>
              {proposal.buckets.map((b,bi)=>{
                const lp=pct(b.usedMin,b.capacityMin);
                return (
                  <div key={b.name} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:700}}>{b.name}</span>
                      <span style={{fontSize:11,color:"#64748B"}}>
                        {b.tasks.length} tasks · {fmtH(b.usedMin/60)}/{fmtH(b.capacityMin/60)}
                      </span>
                    </div>
                    <PBar value={lp}
                      color={lp>90?"#EF4444":lp>70?"#F59E0B":"#10B981"}
                      h={5} style={{marginBottom:editMode?6:0}}/>
                    {editMode&&b.tasks.map(t=>(
                      <div key={t.id}
                        style={{display:"flex",justifyContent:"space-between",
                          alignItems:"center",padding:"3px 6px",background:"#F8FAFC",
                          borderRadius:6,marginBottom:3,fontSize:11}}>
                        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",
                          whiteSpace:"nowrap"}}>{t.title}</span>
                        <button onClick={()=>removeFromBucket(bi,t.id)}
                          style={{...btnBase,padding:"1px 6px",fontSize:10,
                            background:C.red.bg,border:"none",color:C.red.text}}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              {proposal.overflow?.length>0&&(
                <div style={{background:C.red.bg,borderRadius:8,
                  padding:"8px 10px",marginTop:8}}>
                  <div style={{fontWeight:600,fontSize:12,color:C.red.text,marginBottom:4}}>
                    Overflow — couldn't fit
                  </div>
                  {proposal.overflow.map(t=>(
                    <div key={t.id} style={{fontSize:11,color:C.red.text}}>{t.title}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{display:"flex",gap:8}}>
            <Btn ch="✓ Accept & apply" v="green" onClick={apply}
              disabled={proposal.pending?.length===0}/>
            <Btn ch="✗ Reject" v="red" onClick={()=>setProposal(null)}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GMAT PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════
function ProgressPage({weeks,mocks,topics,errors,settings,readiness,overallAcc,totalHrs,allTasks}) {
  const done     = allTasks.filter(t=>t.status==="Completed").length;
  const resolved = errors.filter(e=>e.resolved).length;
  const latestMock=[...mocks].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const bestMock = mocks.length?Math.max(...mocks.map(m=>parseInt(m.total)||0)):0;
  const avgMock  = mocks.length
    ?Math.round(mocks.reduce((a,m)=>a+(parseInt(m.total)||0),0)/mocks.length):0;
  const target   = parseInt(settings.targetScore)||0;

  const secData=SECTIONS.map(s=>{
    const st=topics.filter(t=>t.section===s);
    const mastered=st.filter(t=>["Strong","Mastered"].includes(t.mastery)).length;
    const withData=st.filter(t=>t.attempted>0);
    const avgAcc=withData.length
      ?Math.round(withData.reduce((a,t)=>a+t.accuracy,0)/withData.length):0;
    const hrs=st.reduce((a,t)=>a+t.timeSpent,0);
    return {s,comp:pct(mastered,st.length),avgAcc,hrs,mastered,total:st.length};
  });

  if(!weeks.length&&!mocks.length&&!allTasks.length) return (
    <Empty icon="📊" title="No data yet"
      sub="Create a week, log tasks, and save daily progress. Your dashboard builds up here as you study."/>
  );

  return (
    <div>
      {/* Readiness hero */}
      {readiness!==null&&(
        <div style={{background:"linear-gradient(135deg,#1E1B4B,#1E3A8A)",
          borderRadius:14,padding:"1.25rem 1.5rem",marginBottom:"1.5rem",
          display:"flex",justifyContent:"space-between",
          alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{color:"#A5B4FC",fontSize:11,marginBottom:3}}>
              Estimated readiness
            </div>
            <div style={{color:"#fff",fontSize:36,fontWeight:800,lineHeight:1}}>
              {readiness}%
            </div>
            <div style={{color:"#93C5FD",fontSize:13,marginTop:5}}>
              Target: {settings.targetScore}
              {settings.examDate?` · Exam: ${settings.examDate}`:""}
            </div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:10,marginTop:4}}>
              * Based on your actual logged data only
            </div>
          </div>
          <div style={{position:"relative",width:90,height:90,flexShrink:0}}>
            <svg viewBox="0 0 36 36"
              style={{transform:"rotate(-90deg)",width:"100%",height:"100%"}}>
              <circle r="16" cx="18" cy="18" fill="none"
                stroke="rgba(255,255,255,.1)" strokeWidth="3"/>
              <circle r="16" cx="18" cy="18" fill="none"
                stroke={readiness>=75?"#34D399":readiness>=50?"#A78BFA":"#F87171"}
                strokeWidth="3" strokeDasharray={`${readiness} 100`}
                strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",
              alignItems:"center",justifyContent:"center",
              color:"#fff",fontWeight:800,fontSize:15}}>
              {readiness}%
            </div>
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
        gap:12,marginBottom:"1.5rem"}}>
        <MCard label="Tasks done" value={`${done}/${allTasks.length}`}
          color="#7C3AED" icon="✅"/>
        <MCard label="Hours studied" value={fmtH(totalHrs)}
          color="#2563EB" icon="⏱"/>
        <MCard label="Overall acc." value={overallAcc>0?`${overallAcc}%`:"—"}
          color={overallAcc>=70?"#10B981":overallAcc>=50?"#F59E0B":"#EF4444"} icon="🎯"/>
        <MCard label="Best mock" value={bestMock||"—"}
          color="#F59E0B" icon="🏆"
          sub={avgMock?`Avg: ${avgMock}`:undefined}/>
        <MCard label="Mocks taken" value={mocks.length} color="#EF4444" icon="📝"/>
        <MCard label="Errors resolved"
          value={errors.length?`${resolved}/${errors.length}`:"—"}
          color="#10B981" icon="🔴"/>
      </div>

      {/* Gap to target */}
      {target>0&&latestMock&&(
        <div style={{...card,marginBottom:"1.25rem",
          borderLeft:`4px solid ${parseInt(latestMock.total)>=target?"#10B981":"#7C3AED"}`}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>Gap to target</div>
          <div style={{display:"flex",gap:24,flexWrap:"wrap",fontSize:13}}>
            <span>Target: <strong>{target}</strong></span>
            <span>Latest mock:{" "}
              <strong style={{color:parseInt(latestMock.total)>=target?"#10B981":"#EF4444"}}>
                {latestMock.total}
              </strong>
            </span>
            <span>Gap:{" "}
              <strong style={{color:parseInt(latestMock.total)>=target?"#10B981":"#EF4444"}}>
                {Math.max(0,target-(parseInt(latestMock.total)||0))} pts
              </strong>
            </span>
          </div>
          <PBar value={pct(parseInt(latestMock.total)||0,target)}
            color={parseInt(latestMock.total)>=target?"#10B981":"#7C3AED"}
            h={8} style={{marginTop:8}}/>
        </div>
      )}

      {/* Section breakdown */}
      <div style={{display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",
        gap:"1.25rem",marginBottom:"1.5rem"}}>
        {secData.map(({s,comp,avgAcc,hrs,mastered,total})=>{
          const sc=sectionColor(s);
          return (
            <div key={s} style={{...card,borderTop:`3px solid ${sc.solid}`}}>
              <div style={{fontWeight:700,fontSize:13,color:sc.text,marginBottom:10}}>{s}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
                gap:8,marginBottom:12,textAlign:"center"}}>
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:sc.solid}}>{comp}%</div>
                  <div style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase"}}>
                    Mastered
                  </div>
                </div>
                <div>
                  <div style={{fontSize:18,fontWeight:700,
                    color:avgAcc>0?(avgAcc>=70?"#10B981":avgAcc>=50?"#F59E0B":"#EF4444"):"#94A3B8"}}>
                    {avgAcc>0?`${avgAcc}%`:"—"}
                  </div>
                  <div style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase"}}>
                    Accuracy
                  </div>
                </div>
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:"#475569"}}>
                    {hrs>0?`${hrs}h`:"—"}
                  </div>
                  <div style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase"}}>
                    Studied
                  </div>
                </div>
              </div>
              <PBar value={comp} color={sc.solid} h={8}/>
              <div style={{fontSize:10,color:"#94A3B8",marginTop:5}}>
                {mastered}/{total} topics mastered
              </div>
            </div>
          );
        })}
      </div>

      {/* Planned vs actual chart */}
      {weeks.length>0&&(
        <div style={{...card,marginBottom:"1.25rem"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
            Planned vs actual hours — by week
          </div>
          {weeks.every(w=>w.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0)===0)
            ? <div style={{fontSize:12,color:"#94A3B8"}}>
                Log hours in Today or Daily Progress to see this chart.
              </div>
            : <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
                {weeks.map(w=>{
                  const actual=w.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0);
                  const planned=parseFloat(w.goals?.hours)||0;
                  const maxH=Math.max(...weeks.map(wk=>
                    Math.max(parseFloat(wk.goals?.hours)||0,
                      wk.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0))),1);
                  return (
                    <div key={w.id}
                      style={{flex:1,display:"flex",flexDirection:"column",
                        alignItems:"center",gap:3}}>
                      <div style={{display:"flex",gap:2,alignItems:"flex-end",width:"100%"}}>
                        {planned>0&&(
                          <div title={`Planned: ${planned}h`}
                            style={{flex:1,borderRadius:"3px 3px 0 0",
                              background:"#E2E8F0",
                              height:`${(planned/maxH)*75}px`,minHeight:2}}/>
                        )}
                        <div title={`Actual: ${actual}h`}
                          style={{flex:1,borderRadius:"3px 3px 0 0",background:"#7C3AED",
                            height:`${(actual/maxH)*75}px`,minHeight:2}}/>
                      </div>
                      <span style={{fontSize:9,color:"#94A3B8",overflow:"hidden",
                        textOverflow:"ellipsis",whiteSpace:"nowrap",
                        maxWidth:"100%",textAlign:"center"}}>
                        {w.label.split(" ").slice(0,2).join(" ")}
                      </span>
                    </div>
                  );
                })}
              </div>
          }
          <div style={{display:"flex",gap:16,marginTop:8,fontSize:11}}>
            <span style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{width:10,height:10,borderRadius:2,background:"#E2E8F0",
                display:"inline-block"}}></span>Planned
            </span>
            <span style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{width:10,height:10,borderRadius:2,background:"#7C3AED",
                display:"inline-block"}}></span>Actual
            </span>
          </div>
        </div>
      )}

      {/* Mock trend */}
      {mocks.length>1&&(
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Mock score trend</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
            {[...mocks].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(m=>{
              const score=parseInt(m.total)||0;
              const all=mocks.map(mk=>parseInt(mk.total)||0);
              const maxS=Math.max(...all,target+50);
              const minS=Math.min(...all,400)-20;
              const h=Math.max(4,((score-minS)/(maxS-minS||1))*74);
              return (
                <div key={m.id}
                  style={{flex:1,display:"flex",flexDirection:"column",
                    alignItems:"center",gap:3}}>
                  <span style={{fontSize:10,fontWeight:700,
                    color:score>=(target||999)?"#10B981":"#7C3AED"}}>
                    {score}
                  </span>
                  <div style={{width:"100%",borderRadius:4,
                    background:score>=(target||999)?"#10B981":"#7C3AED",
                    height:`${h}px`}}/>
                  <span style={{fontSize:9,color:"#94A3B8"}}>
                    {new Date(m.date).toLocaleDateString("en-US",
                      {month:"short",day:"numeric"})}
                  </span>
                </div>
              );
            })}
          </div>
          {target>0&&(
            <div style={{fontSize:12,color:"#64748B",marginTop:6}}>
              Target: {target}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOPIC TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
function TopicsPage({topics,setTopics}) {
  const [filter,  setFilter]  = useState("All");
  const [sort,    setSort]    = useState("section");
  const [search,  setSearch]  = useState("");
  const [editing, setEditing] = useState(null);
  const upd=(i,k,v)=>setTopics(ts=>ts.map((t,j)=>j===i?{...t,[k]:v}:t));

  const filtered=useMemo(()=>{
    let ts=[...topics];
    if(filter!=="All") ts=ts.filter(t=>t.section===filter);
    if(search) ts=ts.filter(t=>t.topic.toLowerCase().includes(search.toLowerCase()));
    const sm={
      accuracy:(a,b)=>a.accuracy-b.accuracy,
      attempted:(a,b)=>b.attempted-a.attempted,
      mastery:(a,b)=>MASTERY_LEVELS.indexOf(a.mastery)-MASTERY_LEVELS.indexOf(b.mastery),
      section:(a,b)=>a.section.localeCompare(b.section)||a.topic.localeCompare(b.topic),
    };
    return ts.sort(sm[sort]||sm.section);
  },[topics,filter,sort,search]);

  return (
    <div>
      <div style={{...card,marginBottom:"1.25rem",background:"#FFFBEB",
        borderColor:"#FDE68A",color:"#92400E",fontSize:12}}>
        <strong>How to use:</strong> Click any row to edit mastery, accuracy, and time spent.
        Accuracy updates automatically when you save daily progress.
        Set mastery manually as you complete each topic's concept study.
      </div>

      {/* Section summaries */}
      <div style={{display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",
        gap:12,marginBottom:"1.5rem"}}>
        {SECTIONS.map(s=>{
          const st=topics.filter(t=>t.section===s);
          const sc=sectionColor(s);
          const mastered=st.filter(t=>["Mastered","Strong"].includes(t.mastery)).length;
          const withData=st.filter(t=>t.attempted>0);
          const avgAcc=withData.length
            ?Math.round(withData.reduce((a,t)=>a+t.accuracy,0)/withData.length):0;
          return (
            <div key={s} style={{...card,borderTop:`3px solid ${sc.solid}`}}>
              <div style={{fontWeight:700,fontSize:13,color:sc.text,marginBottom:8}}>{s}</div>
              <div style={{display:"flex",gap:12,marginBottom:8}}>
                <div>
                  <div style={{fontSize:17,fontWeight:700,color:sc.solid}}>
                    {pct(mastered,st.length)}%
                  </div>
                  <div style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase"}}>
                    Mastered
                  </div>
                </div>
                <div>
                  <div style={{fontSize:17,fontWeight:700,
                    color:avgAcc>0?(avgAcc>=70?"#10B981":avgAcc>=50?"#F59E0B":"#EF4444"):"#94A3B8"}}>
                    {avgAcc>0?`${avgAcc}%`:"—"}
                  </div>
                  <div style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase"}}>
                    Avg acc
                  </div>
                </div>
              </div>
              <PBar value={pct(mastered,st.length)} color={sc.solid} h={5}/>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{display:"flex",gap:8,marginBottom:"1.25rem",
        flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",
            transform:"translateY(-50%)",color:"#94A3B8",pointerEvents:"none"}}>🔍</span>
          <input style={{...inp,paddingLeft:32,width:200,height:34}}
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search topics..."/>
        </div>
        {["All",...SECTIONS].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{...btnBase,fontSize:12,
              borderColor:filter===f?"#7C3AED":"#E2E8F0",
              background:filter===f?"#EDE9FE":"#fff",
              color:filter===f?"#6D28D9":"#475569",
              fontWeight:filter===f?700:400}}>
            {f}
          </button>
        ))}
        <div style={{marginLeft:"auto"}}>
          <Sel value={sort} onChange={setSort} style={{width:170}}
            options={[
              {value:"section",  label:"Section A–Z"},
              {value:"accuracy", label:"Weakest first"},
              {value:"mastery",  label:"Mastery ↑"},
              {value:"attempted",label:"Most attempted"},
            ]}/>
        </div>
      </div>

      <div style={card}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",
            fontSize:12,minWidth:680}}>
            <thead>
              <tr style={{background:"#F8FAFC"}}>
                {["Topic","Section","Mastery","Accuracy",
                  "Attempted","Time Spent","Last Studied",""].map(h=>(
                  <th key={h}
                    style={{padding:"8px 10px",textAlign:"left",fontWeight:700,
                      color:"#475569",whiteSpace:"nowrap",
                      borderBottom:"1px solid #E2E8F0",fontSize:11}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t=>{
                const ri=topics.findIndex(x=>x.section===t.section&&x.topic===t.topic);
                const sc=sectionColor(t.section);
                const mc=masteryColor(t.mastery);
                return editing===ri ? (
                  <tr key={t.topic+t.section} style={{background:"#F0F4FF"}}>
                    <td colSpan={8} style={{padding:12}}>
                      <div style={{fontWeight:700,fontSize:13,
                        marginBottom:10,color:"#1E293B"}}>
                        Editing: {t.topic} ({t.section})
                      </div>
                      <div style={{display:"grid",
                        gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                        <div>
                          <Lbl t="Mastery level"/>
                          <Sel value={t.mastery} onChange={v=>upd(ri,"mastery",v)}
                            options={MASTERY_LEVELS}/>
                        </div>
                        <div>
                          <Lbl t="Accuracy %"/>
                          <input type="number" min="0" max="100" style={inp}
                            value={t.accuracy}
                            onChange={e=>upd(ri,"accuracy",+e.target.value)}/>
                        </div>
                        <div>
                          <Lbl t="Questions attempted"/>
                          <input type="number" min="0" style={inp}
                            value={t.attempted}
                            onChange={e=>upd(ri,"attempted",+e.target.value)}/>
                        </div>
                        <div>
                          <Lbl t="Questions correct"/>
                          <input type="number" min="0" style={inp}
                            value={t.correct}
                            onChange={e=>upd(ri,"correct",+e.target.value)}/>
                        </div>
                        <div>
                          <Lbl t="Time spent (hrs)"/>
                          <input type="number" min="0" step=".5" style={inp}
                            value={t.timeSpent}
                            onChange={e=>upd(ri,"timeSpent",+e.target.value)}/>
                        </div>
                        <div>
                          <Lbl t="Concept done?"/>
                          <Sel value={t.conceptDone?"Yes":"No"}
                            onChange={v=>upd(ri,"conceptDone",v==="Yes")}
                            options={["No","Yes"]}/>
                        </div>
                        <div>
                          <Lbl t="Last studied"/>
                          <input type="date" style={inp}
                            value={t.lastStudied||""}
                            onChange={e=>upd(ri,"lastStudied",e.target.value)}/>
                        </div>
                        <div style={{gridColumn:"1/-1"}}>
                          <Lbl t="Notes"/>
                          <input style={inp} value={t.notes||""}
                            onChange={e=>upd(ri,"notes",e.target.value)}
                            placeholder="Any notes about this topic..."/>
                        </div>
                      </div>
                      <Btn ch="✓ Done" v="primary"
                        onClick={()=>setEditing(null)} style={{marginTop:10}}/>
                    </td>
                  </tr>
                ) : (
                  <tr key={t.topic+t.section}
                    style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer",
                      transition:"background .1s"}}
                    onClick={()=>setEditing(ri)}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"9px 10px",fontWeight:600,color:"#1E293B"}}>
                      {t.topic}
                    </td>
                    <td style={{padding:"9px 10px"}}>
                      <Bdg text={t.section} color={sc} sm/>
                    </td>
                    <td style={{padding:"9px 10px"}}>
                      <Bdg text={t.mastery} color={mc} sm/>
                    </td>
                    <td style={{padding:"9px 10px"}}>
                      {t.attempted>0 ? (
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <PBar value={t.accuracy}
                            color={t.accuracy>=70?"#10B981":t.accuracy>=50?"#F59E0B":"#EF4444"}
                            h={4} style={{width:50}}/>
                          <span style={{fontWeight:700,
                            color:t.accuracy>=70?"#10B981":t.accuracy>=50?"#F59E0B":"#EF4444"}}>
                            {Math.round(t.accuracy)}%
                          </span>
                        </div>
                      ) : (
                        <span style={{color:"#94A3B8"}}>—</span>
                      )}
                    </td>
                    <td style={{padding:"9px 10px",color:"#64748B"}}>
                      {t.attempted||"—"}
                    </td>
                    <td style={{padding:"9px 10px",color:"#64748B"}}>
                      {t.timeSpent?`${t.timeSpent}h`:"—"}
                    </td>
                    <td style={{padding:"9px 10px",color:"#94A3B8",fontSize:11}}>
                      {t.lastStudied||"—"}
                    </td>
                    <td style={{padding:"9px 10px"}}>
                      <span style={{color:"#7C3AED",fontSize:11,fontWeight:600}}>
                        Edit ↗
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length===0&&(
            <Empty icon="🔍" title="No topics match"
              sub="Try a different search or filter."/>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK TESTS
// ═══════════════════════════════════════════════════════════════════════════════
function MocksPage({mocks,setMocks,settings}) {
  const ef=()=>({
    name:"",date:todayStr(),total:"",quant:"",verbal:"",di:"",
    percentile:"",timingNotes:"",guessed:"",sillyMistakes:"",
    conceptErrors:"",timingErrors:"",weakAreas:"",
    reviewed:false,actionItems:"",
  });
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState(ef());
  const [editId,setEditId]=useState(null);
  const u=(k,v)=>setForm(f=>({...f,[k]:v}));
  const target=parseInt(settings.targetScore)||0;

  const save=()=>{
    if(!form.total){alert("Total score is required.");return;}
    editId
      ?setMocks(ms=>ms.map(m=>m.id===editId?{...form,id:editId}:m))
      :setMocks(ms=>[...ms,{...form,id:uid()}]);
    setForm(ef());setShowForm(false);setEditId(null);
  };

  const sorted=[...mocks].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const best=mocks.length?Math.max(...mocks.map(m=>parseInt(m.total)||0)):0;
  const avg=mocks.length
    ?Math.round(mocks.reduce((a,m)=>a+(parseInt(m.total)||0),0)/mocks.length):0;
  const latest=sorted[0];

  return (
    <div style={{maxWidth:900}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        marginBottom:"1.25rem",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:"#1E293B"}}>Mock Test Tracker</div>
          <div style={{fontSize:12,color:"#64748B"}}>
            {mocks.length} test{mocks.length!==1?"s":""} logged
          </div>
        </div>
        <Btn ch="+ Log mock test" v="amber"
          onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm(ef());}}/>
      </div>

      {mocks.length===0&&(
        <Empty icon="🎯" title="No mock tests logged yet"
          sub="Take a mock and log your scores. Score trend appears once you have at least two entries."
          action={<Btn ch="+ Log first mock" v="amber" onClick={()=>setShowForm(true)}/>}/>
      )}

      {mocks.length>0&&(
        <div style={{display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
          gap:12,marginBottom:"1.5rem"}}>
          <MCard label="Mocks taken" value={mocks.length} color="#F59E0B" icon="📋"/>
          <MCard label="Best score"  value={best||"—"}    color="#10B981" icon="🏆"/>
          <MCard label="Latest"      value={latest?.total||"—"} color="#7C3AED" icon="📅"/>
          <MCard label="Average"     value={avg||"—"}     color="#2563EB" icon="📊"/>
          {target>0&&(
            <MCard label="Gap to target"
              value={best?Math.max(0,target-best):"—"}
              color={best>=target?"#10B981":"#EF4444"}
              sub="from best"/>
          )}
        </div>
      )}

      {showForm&&(
        <div style={{...card,marginBottom:"1.5rem",border:"2px solid #F59E0B"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>
            {editId?"Edit":"Log new"} mock test
          </div>
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
            {[
              ["name","Mock name","text"],
              ["date","Date","date"],
              ["total","Total score *","number"],
              ["quant","Quant","number"],
              ["verbal","Verbal","number"],
              ["di","Data Insights","number"],
              ["percentile","Percentile","text"],
              ["guessed","Questions guessed","number"],
              ["sillyMistakes","Silly mistakes","number"],
              ["conceptErrors","Concept errors","number"],
              ["timingErrors","Timing errors","number"],
            ].map(([k,l,type])=>(
              <div key={k}>
                <Lbl t={l}/>
                <input type={type}
                  style={{...inp,borderColor:k==="total"&&!form.total?"#FCA5A5":"#E2E8F0"}}
                  value={form[k]} onChange={e=>u(k,e.target.value)}/>
              </div>
            ))}
            <div>
              <Lbl t="Review completed?"/>
              <Sel value={form.reviewed?"Yes":"No"}
                onChange={v=>u("reviewed",v==="Yes")} options={["No","Yes"]}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
            <div>
              <Lbl t="Weak areas identified"/>
              <input style={inp} value={form.weakAreas}
                onChange={e=>u("weakAreas",e.target.value)}
                placeholder="e.g. Number Properties, CR Inference"/>
            </div>
            <div>
              <Lbl t="Timing notes"/>
              <input style={inp} value={form.timingNotes}
                onChange={e=>u("timingNotes",e.target.value)}/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Lbl t="Action items after review"/>
              <textarea style={{...inp,resize:"vertical",minHeight:50}}
                value={form.actionItems} onChange={e=>u("actionItems",e.target.value)}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <Btn ch="Save" v="amber" onClick={save}/>
            <Btn ch="Cancel" onClick={()=>{setShowForm(false);setEditId(null);}}/>
          </div>
        </div>
      )}

      {mocks.length>1&&(
        <div style={{...card,marginBottom:"1.25rem"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Score trend</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
            {[...mocks].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(m=>{
              const score=parseInt(m.total)||0;
              const all=mocks.map(mk=>parseInt(mk.total)||0);
              const maxS=Math.max(...all,target+50);
              const minS=Math.min(...all,400)-20;
              const h=Math.max(4,((score-minS)/(maxS-minS||1))*74);
              return (
                <div key={m.id}
                  style={{flex:1,display:"flex",flexDirection:"column",
                    alignItems:"center",gap:3}}>
                  <span style={{fontSize:10,fontWeight:700,
                    color:score>=(target||999)?"#10B981":"#7C3AED"}}>
                    {score}
                  </span>
                  <div style={{width:"100%",borderRadius:4,
                    background:score>=(target||999)?"#10B981":"#7C3AED",
                    height:`${h}px`}}/>
                  <span style={{fontSize:9,color:"#94A3B8"}}>
                    {new Date(m.date).toLocaleDateString("en-US",
                      {month:"short",day:"numeric"})}
                  </span>
                </div>
              );
            })}
          </div>
          {target>0&&(
            <div style={{fontSize:12,color:"#64748B",marginTop:6}}>
              Target: {target}
            </div>
          )}
        </div>
      )}

      {sorted.map(m=>(
        <div key={m.id} style={{...card,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",
            alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>
                {m.name||"Mock Test"}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <Bdg text={m.date} color={C.neutral}/>
                {m.percentile&&(
                  <Bdg text={`${m.percentile}th pct`} color={C.quant}/>
                )}
                {m.reviewed
                  ? <Bdg text="✓ Reviewed" color={C.green}/>
                  : <Bdg text="Review pending" color={C.amber}/>
                }
              </div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{fontSize:30,fontWeight:800,
                color:target&&parseInt(m.total)>=target?"#10B981":"#7C3AED"}}>
                {m.total}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <Btn ch="Edit" style={{fontSize:11,padding:"3px 9px"}}
                  onClick={()=>{setForm({...m});setEditId(m.id);setShowForm(true);}}/>
                <Btn ch="Delete"
                  style={{fontSize:11,padding:"3px 9px",background:C.red.bg,
                    borderColor:C.red.border,color:C.red.text}}
                  onClick={()=>setMocks(ms=>ms.filter(x=>x.id!==m.id))}/>
              </div>
            </div>
          </div>
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",
            gap:7,marginBottom:m.weakAreas||m.actionItems?8:0}}>
            {[
              ["Quant",m.quant,C.quant],
              ["Verbal",m.verbal,C.verbal],
              ["Data Insights",m.di,C.di],
              ["Guessed",m.guessed,C.amber],
              ["Silly err",m.sillyMistakes,C.red],
            ].map(([l,v,c])=>(
              <div key={l}
                style={{background:c.bg,borderRadius:8,padding:"5px 9px",
                  border:`1px solid ${c.border}`}}>
                <div style={{fontSize:9,color:c.text,fontWeight:700,
                  marginBottom:1,textTransform:"uppercase"}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:c.text}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          {(m.weakAreas||m.actionItems)&&(
            <div style={{borderTop:"1px solid #F1F5F9",paddingTop:8,
              display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {m.weakAreas&&(
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:C.red.text,marginBottom:2}}>
                    WEAK AREAS
                  </div>
                  <div style={{fontSize:12,color:"#64748B"}}>{m.weakAreas}</div>
                </div>
              )}
              {m.actionItems&&(
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#7C3AED",marginBottom:2}}>
                    ACTIONS
                  </div>
                  <div style={{fontSize:12,color:"#64748B"}}>{m.actionItems}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR LOG
// ═══════════════════════════════════════════════════════════════════════════════
function ErrorsPage({errors,setErrors}) {
  const ef=()=>({
    date:todayStr(),section:"Quant",topic:"Arithmetic",
    source:"",qid:"",errorType:"Concept Gap",difficulty:"Medium",
    correctAnswer:"",myAnswer:"",explanation:"",lesson:"",
    reattemptDate:"",resolved:false,
  });
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState(ef());
  const [editId,setEditId]=useState(null);
  const [filters,setFilters]=useState({section:"All",type:"All",resolved:"All"});
  const [search,setSearch]=useState("");
  const u=(k,v)=>setForm(f=>({...f,[k]:v}));
  const uf=(k,v)=>setFilters(f=>({...f,[k]:v}));

  const save=()=>{
    if(!form.topic||!form.errorType){
      alert("Topic and error type are required."); return;
    }
    editId
      ?setErrors(es=>es.map(e=>e.id===editId?{...form,id:editId}:e))
      :setErrors(es=>[...es,{...form,id:uid()}]);
    setForm(ef());setShowForm(false);setEditId(null);
  };

  const filtered=useMemo(()=>errors.filter(e=>{
    if(filters.section!=="All"&&e.section!==filters.section) return false;
    if(filters.type!=="All"&&e.errorType!==filters.type) return false;
    if(filters.resolved==="Resolved"&&!e.resolved) return false;
    if(filters.resolved==="Unresolved"&&e.resolved) return false;
    if(search&&!e.topic.toLowerCase().includes(search.toLowerCase())
      &&!(e.lesson||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[errors,filters,search]);

  const byType=ERROR_TYPES.map(t=>({t,n:errors.filter(e=>e.errorType===t).length}))
    .sort((a,b)=>b.n-a.n);
  const maxE=Math.max(...byType.map(x=>x.n),1);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        marginBottom:"1.25rem",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:"#1E293B"}}>Error Log</div>
          <div style={{fontSize:12,color:"#64748B"}}>
            {errors.filter(e=>!e.resolved).length} unresolved ·{" "}
            {errors.filter(e=>e.resolved).length} resolved
          </div>
        </div>
        <Btn ch="+ Log error" v="red"
          onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm(ef());}}/>
      </div>

      {errors.length===0&&(
        <Empty icon="🔴" title="No errors logged yet"
          sub="After every practice session or mock, log questions you got wrong. Identify patterns to improve."
          action={<Btn ch="+ Log first error" v="red" onClick={()=>setShowForm(true)}/>}/>
      )}

      {errors.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
          gap:"1rem",marginBottom:"1.5rem"}}>
          <div style={card}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>
              Error types breakdown
            </div>
            {byType.filter(x=>x.n>0).map(x=>(
              <div key={x.t} style={{marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:12}}>{x.t}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.red.solid}}>{x.n}</span>
                </div>
                <PBar value={pct(x.n,maxE)} color="#EF4444" h={4}/>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>By section</div>
            {SECTIONS.map(s=>{
              const n=errors.filter(e=>e.section===s).length;
              const sc=sectionColor(s);
              return (
                <div key={s} style={{marginBottom:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:12,color:sc.text,fontWeight:600}}>{s}</span>
                    <span style={{fontSize:12,fontWeight:700,color:sc.solid}}>{n}</span>
                  </div>
                  <PBar value={pct(n,errors.length||1)} color={sc.solid} h={4}/>
                </div>
              );
            })}
            <div style={{marginTop:8,fontSize:12,color:"#94A3B8"}}>
              Resolution rate:{" "}
              <strong style={{color:"#10B981"}}>
                {errors.length?pct(errors.filter(e=>e.resolved).length,errors.length):0}%
              </strong>
            </div>
          </div>
        </div>
      )}

      {showForm&&(
        <div style={{...card,marginBottom:"1.5rem",border:"2px solid #EF4444"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>
            {editId?"Edit":"Log new"} error
          </div>
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
            <div><Lbl t="Date"/><input type="date" style={inp}
              value={form.date} onChange={e=>u("date",e.target.value)}/></div>
            <div><Lbl t="Section"/>
              <Sel value={form.section}
                onChange={v=>{u("section",v);u("topic",TOPICS[v][0]);}}
                options={SECTIONS}/></div>
            <div><Lbl t="Topic"/>
              <Sel value={form.topic} onChange={v=>u("topic",v)}
                options={TOPICS[form.section]||[]}/></div>
            <div><Lbl t="Error type"/>
              <Sel value={form.errorType} onChange={v=>u("errorType",v)}
                options={ERROR_TYPES}/></div>
            <div><Lbl t="Difficulty"/>
              <Sel value={form.difficulty} onChange={v=>u("difficulty",v)}
                options={DIFFICULTY}/></div>
            <div><Lbl t="Source"/>
              <input style={inp} value={form.source}
                onChange={e=>u("source",e.target.value)}
                placeholder="OG, GMATPrep..."/></div>
            <div><Lbl t="Question ID"/>
              <input style={inp} value={form.qid}
                onChange={e=>u("qid",e.target.value)}
                placeholder="e.g. Q147"/></div>
            <div><Lbl t="My answer"/>
              <input style={inp} value={form.myAnswer}
                onChange={e=>u("myAnswer",e.target.value)}/></div>
            <div><Lbl t="Correct answer"/>
              <input style={inp} value={form.correctAnswer}
                onChange={e=>u("correctAnswer",e.target.value)}/></div>
            <div><Lbl t="Reattempt date"/>
              <input type="date" style={inp} value={form.reattemptDate}
                onChange={e=>u("reattemptDate",e.target.value)}/></div>
            <div style={{display:"flex",gap:6,alignItems:"center",paddingTop:18}}>
              <input type="checkbox" checked={form.resolved}
                onChange={e=>u("resolved",e.target.checked)}/>
              <label style={{fontSize:13}}>Mark as resolved</label>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
            <div><Lbl t="What went wrong"/>
              <textarea style={{...inp,resize:"vertical",minHeight:55}}
                value={form.explanation}
                onChange={e=>u("explanation",e.target.value)}/></div>
            <div><Lbl t="Lesson learned"/>
              <textarea style={{...inp,resize:"vertical",minHeight:55}}
                value={form.lesson}
                onChange={e=>u("lesson",e.target.value)}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <Btn ch="Save error" v="red" onClick={save}/>
            <Btn ch="Cancel" onClick={()=>{setShowForm(false);setEditId(null);}}/>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",
        marginBottom:"1rem",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",
            transform:"translateY(-50%)",color:"#94A3B8",pointerEvents:"none"}}>🔍</span>
          <input style={{...inp,paddingLeft:32,width:200,height:34}}
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search errors..."/>
        </div>
        <Sel value={filters.section} onChange={v=>uf("section",v)} style={{width:150}}
          options={[{value:"All",label:"All sections"},...SECTIONS.map(s=>({value:s,label:s}))]}/>
        <Sel value={filters.type} onChange={v=>uf("type",v)} style={{width:175}}
          options={[{value:"All",label:"All types"},...ERROR_TYPES.map(t=>({value:t,label:t}))]}/>
        <Sel value={filters.resolved} onChange={v=>uf("resolved",v)} style={{width:135}}
          options={["All","Resolved","Unresolved"]}/>
      </div>

      {filtered.length===0&&errors.length>0&&(
        <Empty icon="🔍" title="No errors match filters"
          sub="Adjust filters or log a new error."/>
      )}

      {filtered.map(e=>(
        <div key={e.id}
          style={{...card,marginBottom:8,
            borderLeft:`3px solid ${e.resolved?C.green.solid:C.red.solid}`,
            opacity:e.resolved?.75:1}}>
          <div style={{display:"flex",justifyContent:"space-between",
            alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:5}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              <Bdg text={e.section} color={sectionColor(e.section)} sm/>
              <Bdg text={e.topic} color={C.neutral} sm/>
              <Bdg text={e.errorType} color={C.red} sm/>
              <Bdg text={e.difficulty}
                color={e.difficulty==="Hard"?C.red:e.difficulty==="Medium"?C.amber:C.green} sm/>
              {e.resolved
                ? <Bdg text="✓ Resolved" color={C.green} sm/>
                : <Bdg text="Unresolved" color={C.red} sm/>
              }
            </div>
            <div style={{display:"flex",gap:6}}>
              <Btn ch={e.resolved?"Unresolve":"✓ Resolve"}
                style={{fontSize:11,padding:"3px 9px",background:"#F1F5F9",border:"none"}}
                onClick={()=>setErrors(es=>es.map(x=>
                  x.id===e.id?{...x,resolved:!x.resolved}:x))}/>
              <Btn ch="Edit"
                style={{fontSize:11,padding:"3px 9px",background:"#EDE9FE",
                  border:"none",color:"#6D28D9"}}
                onClick={()=>{setForm({...e});setEditId(e.id);setShowForm(true);}}/>
              <Btn ch="×"
                style={{fontSize:11,padding:"3px 9px",background:C.red.bg,
                  border:"none",color:C.red.text}}
                onClick={()=>setErrors(es=>es.filter(x=>x.id!==e.id))}/>
            </div>
          </div>
          <div style={{fontSize:11,color:"#94A3B8",marginBottom:3}}>
            {e.date}
            {e.source?` · ${e.source}`:""}
            {e.qid?` · Q${e.qid}`:""}
            {e.reattemptDate?` · Reattempt: ${e.reattemptDate}`:""}
          </div>
          {e.lesson&&(
            <div style={{fontSize:12,color:"#1E293B",fontStyle:"italic"}}>
              💡 {e.lesson}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
function AnalyticsPage({weeks,mocks,topics,errors,settings,
  readiness,overallAcc,totalHrs,allTasks,daysLeft}) {

  const done       = allTasks.filter(t=>t.status==="Completed").length;
  const planned    = weeks.reduce((a,w)=>a+(parseFloat(w.goals?.hours)||0),0);
  const avgDaily   = weeks.length>0
    ?Math.round(totalHrs/(weeks.length*7)*10)/10:0;
  const latestMock = [...mocks].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const target     = parseInt(settings.targetScore)||0;
  const deferred   = allTasks.filter(t=>t.status==="Deferred").length;
  const unresolvedE= errors.filter(e=>!e.resolved).length;
  const burnout    = Math.min(100,Math.round(
    (deferred/Math.max(allTasks.length,1)*40)
    +(avgDaily>5?40:avgDaily>4?20:0)
    +(unresolvedE>8?20:unresolvedE>4?10:0)
  ));
  const weakTopics  = [...topics].filter(t=>t.attempted>0)
    .sort((a,b)=>a.accuracy-b.accuracy).slice(0,6);
  const strongTopics= [...topics].filter(t=>t.attempted>0)
    .sort((a,b)=>b.accuracy-a.accuracy).slice(0,6);
  const mostCommonE = ERROR_TYPES
    .map(t=>({t,n:errors.filter(e=>e.errorType===t).length}))
    .sort((a,b)=>b.n-a.n)[0];

  // Smart insights — only where data exists
  const insights=[];
  if(allTasks.length>0&&done<allTasks.length*.5)
    insights.push({type:"warn",msg:`Only ${pct(done,allTasks.length)}% of planned tasks completed. Use Rebalancing to redistribute.`});
  if(latestMock&&target>0){
    const gap=target-parseInt(latestMock.total);
    insights.push({type:gap<=0?"good":"info",
      msg:gap<=0
        ?`Your latest mock (${latestMock.total}) has hit your target of ${target}! 🎉`
        :`Latest mock (${latestMock.total}) is ${gap} pts below target (${target}). Keep going.`});
  }
  if(weakTopics.length>0)
    insights.push({type:"info",
      msg:`Weakest area: ${weakTopics[0].topic} at ${Math.round(weakTopics[0].accuracy)}%. Prioritise this in your next session.`});
  if(unresolvedE>5)
    insights.push({type:"warn",msg:`${unresolvedE} unresolved error entries. Schedule a reattempt session.`});
  if(mostCommonE&&mostCommonE.n>2)
    insights.push({type:"info",msg:`Most frequent error: "${mostCommonE.t}" (${mostCommonE.n} entries). Fix this pattern.`});
  if(burnout>50)
    insights.push({type:"warn",msg:`High burnout risk (${burnout}%). ${deferred} tasks deferred. Consider reducing daily targets.`});
  if(planned>0&&totalHrs>0){
    const ratio=Math.round(totalHrs/planned*100);
    if(ratio<70)
      insights.push({type:"warn",msg:`You've logged ${ratio}% of planned study hours. Try to close the gap.`});
  }
  if(target>0&&daysLeft!==null&&daysLeft<30&&(!mocks.length||readiness<60))
    insights.push({type:"warn",msg:`${daysLeft} days to exam. Increase practice frequency and take more mocks.`});
  if(mocks.length>=2){
    const s=[...mocks].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const delta=parseInt(s[s.length-1].total)-parseInt(s[0].total);
    if(delta>0)
      insights.push({type:"good",msg:`Mock score up +${delta} pts since first attempt. Great trajectory!`});
  }
  if(!allTasks.length&&!mocks.length&&!totalHrs)
    insights.push({type:"info",msg:"No study data yet. Create a week, log tasks, and save daily progress. Insights will appear here."});

  const is={
    warn:{bg:"#FFFBEB",border:"#FDE68A",text:"#92400E",icon:"⚠"},
    good:{bg:"#F0FDF4",border:"#86EFAC",text:"#14532D",icon:"✓"},
    info:{bg:"#EFF6FF",border:"#BFDBFE",text:"#1E40AF",icon:"ℹ"},
  };

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
        gap:12,marginBottom:"1.5rem"}}>
        <MCard label="Readiness"
          value={readiness!==null?`${readiness}%`:"—"}
          color={readiness!==null?(readiness>=75?"#10B981":readiness>=50?"#7C3AED":"#EF4444"):"#94A3B8"}
          sub="estimated"/>
        <MCard label="Task completion"
          value={allTasks.length?`${pct(done,allTasks.length)}%`:"—"}
          color="#7C3AED"/>
        <MCard label="Avg accuracy"
          value={overallAcc>0?`${overallAcc}%`:"—"}
          color={overallAcc>=70?"#10B981":overallAcc>=50?"#F59E0B":"#EF4444"}/>
        <MCard label="Avg daily hrs"
          value={avgDaily>0?`${avgDaily}h`:"—"} color="#2563EB"/>
        <MCard label="Hours planned"
          value={planned>0?`${Math.round(planned)}h`:"—"}
          color="#64748B"
          sub={totalHrs>0?`Actual: ${fmtH(totalHrs)}`:undefined}/>
        <MCard label="Burnout risk"
          value={allTasks.length?`${burnout}%`:"—"}
          color={burnout>60?"#EF4444":burnout>30?"#F59E0B":"#10B981"}/>
      </div>

      {/* Smart insights */}
      <div style={{...card,marginBottom:"1.5rem"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
          Smart insights — based on your data
        </div>
        {insights.map((ins,i)=>{
          const st=is[ins.type];
          return (
            <div key={i}
              style={{background:st.bg,border:`1px solid ${st.border}`,
                borderLeft:`3px solid ${st.border}`,borderRadius:8,
                padding:"9px 14px",marginBottom:8,color:st.text,fontSize:13,
                display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,fontWeight:700}}>{st.icon}</span>
              <span>{ins.msg}</span>
            </div>
          );
        })}
      </div>

      {/* Planned vs actual */}
      {(planned>0||totalHrs>0)&&(
        <div style={{...card,marginBottom:"1.5rem"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
            Planned vs actual hours — per week
          </div>
          <div style={{display:"flex",gap:4,alignItems:"flex-end",
            height:90,marginBottom:8}}>
            {weeks.map((w,i)=>{
              const actual=w.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0);
              const pl=parseFloat(w.goals?.hours)||0;
              const maxH=Math.max(...weeks.map(wk=>
                Math.max(parseFloat(wk.goals?.hours)||0,
                  wk.days.reduce((a,d)=>a+(parseFloat(d.hoursLogged)||0),0))),1);
              return (
                <div key={w.id}
                  style={{flex:1,display:"flex",flexDirection:"column",
                    alignItems:"center",gap:2}}>
                  <div style={{display:"flex",gap:2,alignItems:"flex-end",
                    width:"100%",height:70}}>
                    {pl>0&&(
                      <div title={`Planned: ${pl}h`}
                        style={{flex:1,borderRadius:"3px 3px 0 0",
                          background:"#E2E8F0",
                          height:`${(pl/maxH)*65}px`,minHeight:2}}/>
                    )}
                    <div title={`Actual: ${actual}h`}
                      style={{flex:1,borderRadius:"3px 3px 0 0",background:"#7C3AED",
                        height:`${(actual/maxH)*65}px`,minHeight:2}}/>
                  </div>
                  <span style={{fontSize:8,color:"#94A3B8",overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap",
                    maxWidth:"100%",textAlign:"center"}}>
                    {w.label.split(" ").slice(0,2).join(" ")}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:16,fontSize:11}}>
            <span style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{width:10,height:10,borderRadius:2,background:"#E2E8F0",
                display:"inline-block"}}></span>Planned
            </span>
            <span style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{width:10,height:10,borderRadius:2,background:"#7C3AED",
                display:"inline-block"}}></span>Actual
            </span>
          </div>
        </div>
      )}

      {/* Weak vs Strong */}
      {(weakTopics.length>0||strongTopics.length>0)&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
          gap:"1.25rem",marginBottom:"1.5rem"}}>
          <div style={card}>
            <div style={{fontWeight:700,fontSize:13,color:C.red.text,marginBottom:10}}>
              Weakest topics
            </div>
            {weakTopics.length===0
              ? <div style={{fontSize:12,color:"#94A3B8"}}>
                  Log accuracy in Daily Progress to see weak areas.
                </div>
              : weakTopics.map(t=>(
                <div key={t.topic} style={{marginBottom:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:12,fontWeight:500}}>{t.topic}</span>
                    <span style={{fontSize:12,fontWeight:700,color:C.red.solid}}>
                      {Math.round(t.accuracy)}%
                    </span>
                  </div>
                  <PBar value={t.accuracy} color="#EF4444" h={4}/>
                </div>
              ))
            }
          </div>
          <div style={card}>
            <div style={{fontWeight:700,fontSize:13,color:C.green.text,marginBottom:10}}>
              Strongest topics
            </div>
            {strongTopics.length===0
              ? <div style={{fontSize:12,color:"#94A3B8"}}>
                  Attempt questions to see strong areas.
                </div>
              : strongTopics.map(t=>(
                <div key={t.topic} style={{marginBottom:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:12,fontWeight:500}}>{t.topic}</span>
                    <span style={{fontSize:12,fontWeight:700,color:C.green.solid}}>
                      {Math.round(t.accuracy)}%
                    </span>
                  </div>
                  <PBar value={t.accuracy} color="#22C55E" h={4}/>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {readiness!==null&&(
        <div style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>
            Readiness factor breakdown
          </div>
          {[
            ["Mock score proximity","30%",C.amber.solid],
            ["Overall accuracy","25%",C.green.solid],
            ["Syllabus completion","20%",C.verbal.solid],
            ["Study consistency","15%",C.quant.solid],
            ["Error resolution","10%",C.red.solid],
          ].map(([l,w,c])=>(
            <div key={l}
              style={{display:"flex",alignItems:"center",gap:12,
                marginBottom:8,fontSize:12}}>
              <div style={{width:180,color:"#475569"}}>{l}</div>
              <div style={{fontSize:10,color:"#94A3B8",width:30}}>{w}</div>
              <div style={{width:8,height:8,borderRadius:4,
                background:c,flexShrink:0}}/>
            </div>
          ))}
          <div style={{fontSize:11,color:"#94A3B8",marginTop:8}}>
            Readiness is an estimate based only on data you have entered.
            It improves as you log more sessions, mocks, and resolve errors.
          </div>
        </div>
      )}
    </div>
  );
}
