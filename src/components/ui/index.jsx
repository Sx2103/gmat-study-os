import { clamp } from '../../utils/helpers.js'

export const baseInput = {
  display:'block',width:'100%',boxSizing:'border-box',padding:'7px 11px',
  border:'1px solid #E2E8F0',borderRadius:8,fontSize:13,background:'#fff',
  color:'#1E293B',outline:'none',fontFamily:'inherit',
}
export const baseBtn = {
  display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,
  padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',
  border:'1px solid #E2E8F0',background:'#fff',color:'#475569',
  transition:'all .15s',whiteSpace:'nowrap',fontFamily:'inherit',
}
export const cardStyle = {
  background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,
  padding:'1rem 1.25rem',boxShadow:'0 1px 4px rgba(0,0,0,.05)',
}

const vs = {
  default:{},
  primary:{background:'#7C3AED',color:'#fff',border:'1px solid #7C3AED'},
  green:  {background:'#10B981',color:'#fff',border:'1px solid #10B981'},
  amber:  {background:'#F59E0B',color:'#fff',border:'1px solid #F59E0B'},
  red:    {background:'#EF4444',color:'#fff',border:'1px solid #EF4444'},
  ghost:  {background:'transparent',color:'#7C3AED',border:'1px solid #DDD6FE'},
}

export function Button({children,onClick,disabled,variant='default',style={},className=''}) {
  return (
    <button onClick={onClick} disabled={disabled} className={className}
      style={{...baseBtn,...(vs[variant]||{}),...style,opacity:disabled?.5:1}}>
      {children}
    </button>
  )
}

export function Label({text}) {
  return <div style={{fontSize:12,color:'#64748B',fontWeight:500,marginBottom:4}}>{text}</div>
}

export function Badge({text,color={bg:'#F8FAFC',border:'#E2E8F0',text:'#475569'},sm=false}) {
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',
      padding:sm?'2px 7px':'3px 9px',borderRadius:20,fontSize:sm?10:11,fontWeight:500,
      background:color.bg,color:color.text,border:`1px solid ${color.border}`,
    }}>{text}</span>
  )
}

export function ProgressBar({value,color='#7C3AED',height=6,style={}}) {
  return (
    <div style={{height,borderRadius:height,background:'#F1F5F9',overflow:'hidden',...style}}>
      <div style={{height:'100%',borderRadius:height,background:color,width:`${clamp(value,0,100)}%`,transition:'width .5s ease'}}/>
    </div>
  )
}

export function MetricCard({label,value,sub,color='#7C3AED',icon,style={}}) {
  return (
    <div style={{...cardStyle,padding:'1rem',...style}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
        <div style={{fontSize:11,color:'#94A3B8',fontWeight:600,textTransform:'uppercase',letterSpacing:.4}}>{label}</div>
        {icon&&<span style={{fontSize:16}}>{icon}</span>}
      </div>
      <div style={{fontSize:22,fontWeight:700,color,lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'#94A3B8',marginTop:3}}>{sub}</div>}
    </div>
  )
}

export function EmptyState({icon='📭',title,sub,action}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem 1.5rem',textAlign:'center',color:'#94A3B8'}}>
      <div style={{fontSize:36,marginBottom:10,opacity:.6}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:600,color:'#475569',marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,maxWidth:280,lineHeight:1.6,marginBottom:action?14:0}}>{sub}</div>
      {action}
    </div>
  )
}

export function Modal({title,onClose,children,width=540}) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:50,background:'rgba(15,23,42,.5)'}}>
      <div style={{background:'#fff',borderRadius:16,width,maxWidth:'94vw',maxHeight:'85vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.18)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.25rem',borderBottom:'1px solid #F1F5F9',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:'#1E293B'}}>{title}</div>
          <button onClick={onClose} style={{...baseBtn,border:'none',background:'transparent',fontSize:20,color:'#94A3B8',padding:'2px 8px'}}>×</button>
        </div>
        <div style={{padding:'1.25rem'}}>{children}</div>
      </div>
    </div>
  )
}

export function Select({value,onChange,options,style={}}) {
  return (
    <select style={{...baseInput,height:34,...style}} value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  )
}

export function SearchBar({value,onChange,placeholder='Search...'}) {
  return (
    <div style={{position:'relative'}}>
      <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',pointerEvents:'none',fontSize:13}}>🔍</span>
      <input style={{...baseInput,paddingLeft:32,width:220,height:34}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  )
}
