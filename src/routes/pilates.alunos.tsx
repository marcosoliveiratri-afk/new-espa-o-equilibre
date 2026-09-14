import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Filter, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataSync } from "@/hooks/useDataSync";

type Student={id:string;full_name:string;phone:string|null;active:boolean;plan:string;teacher:string;due:string|null;planStatus:string;contract:string;assessment:string;financial:string;destination:string};
const fmt=(d:string|null)=>d?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T00:00:00")):"—";
const formatPhone=(value:string)=>{const digits=value.replace(/[^0-9]/g,"").slice(0,11);if(digits.length===0)return "";if(digits.length<=2)return `(${digits}`;if(digits.length<=3)return `(${digits.slice(0,2)}) ${digits.slice(2)}`;if(digits.length<=7)return `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3)}`;return `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3,7)}-${digits.slice(7)}`};
const formatMoneyInput=(value:string)=>{const digits=String(value??"").replace(/[^0-9]/g,"");if(!digits)return "";const cents=Number(digits);if(!Number.isFinite(cents))return "";return (cents/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});};
const moneyToNumber=(value:string)=>{const digits=String(value??"").replace(/[^0-9]/g,"");if(!digits)return 0;const cents=Number(digits);return Number.isFinite(cents)?cents/100:0;};
const statusClass=(v:string)=>["Vencida","Vencendo","Pendente","Vencido"].includes(v)?"bg-red-50 text-red-700 ring-1 ring-red-100":"text-emerald-700";
const statusBadge=(v:string)=>{const cls=statusClass(v);return v.includes("Próxima")?"bg-amber-50 text-amber-700 ring-1 ring-amber-100":"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";};

export const Route=createFileRoute("/pilates/alunos")({component:Alunos});

const whiteCard: React.CSSProperties={
  background:"#FFFFFF",
  borderRadius:16,
  border:"none",
  boxShadow:"0 8px 24px rgba(16,24,40,0.05)",
};

function Alunos(){
 const pathname=useRouterState({select:s=>s.location.pathname}); const [rows,setRows]=useState<Student[]>([]); const [plans,setPlans]=useState<any[]>([]); const [teachers,setTeachers]=useState<any[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""); const [search,setSearch]=useState(""),[activity,setActivity]=useState("Todos"),[teacher,setTeacher]=useState("Todos"),[plan,setPlan]=useState("Todos"),[destination,setDestination]=useState("Todos"),[showForm,setShowForm]=useState(false),[deleting,setDeleting]=useState<Student|null>(null);
 const [form,setForm]=useState({full_name:"",phone:"",plan_id:"",teacher_id:"",monthly_value:"",start_date:new Date().toISOString().slice(0,10),due_date:"",payment_method:"",destination:"Clínica"});
 async function load(){
  setLoading(true);setError("");
  const db=supabase as any;
  const [s,p,t]=await Promise.all([db.from("students").select("*,student_plans(plan_id,teacher_id,due_date,status,plans(name),teachers(name)),student_contracts(status,end_date),physical_assessments(status,next_assessment_date),student_payments(status,due_date,destination)").order("full_name"),db.from("plans").select("*").order("duration_months"),db.from("teachers").select("*").eq("active",true).order("name")]);
  if(s.error){setError(s.error.message);setLoading(false);return;} if(p.error||t.error){setError(p.error?.message||t.error?.message||"Erro ao carregar dados");}
  setPlans(p.data||[]);setTeachers(t.data||[]);
  setRows((s.data||[]).map((x:any)=>{const sp=(x.student_plans||[])[0]||{};const c=(x.student_contracts||[])[0]||{};const a=(x.physical_assessments||[])[0]||{};const pay=(x.student_payments||[])[0]||{};return {id:x.id,full_name:x.full_name,phone:x.phone,active:x.active,plan:sp.plans?.name||"—",teacher:sp.teachers?.name||"—",due:sp.due_date||null,planStatus:sp.status||"—",contract:c.status||"—",assessment:a.status||"—",financial:pay.status==="Pago"?"Regular":pay.status||"—",destination:pay.destination||"—"};}));setLoading(false);
 }
 useDataSync(load,[pathname]);
 useEffect(()=>{
  const db=supabase as any;
  const channel=db.channel("alunos-sync")
   .on("postgres_changes",{event:"*",schema:"public",table:"students"},()=>load())
   .on("postgres_changes",{event:"*",schema:"public",table:"student_plans"},()=>load())
   .on("postgres_changes",{event:"*",schema:"public",table:"student_contracts"},()=>load())
   .on("postgres_changes",{event:"*",schema:"public",table:"physical_assessments"},()=>load())
   .on("postgres_changes",{event:"*",schema:"public",table:"student_payments"},()=>load())
   .subscribe();
  const onFocus=()=>load();
  window.addEventListener("focus",onFocus);
  return ()=>{db.removeChannel(channel);window.removeEventListener("focus",onFocus);};
 },[]);
 const filtered=useMemo(()=>rows.filter(x=>(!search||x.full_name.toLowerCase().includes(search.toLowerCase())||(x.phone||"").includes(search))&&(activity==="Todos"||(activity==="Ativos"?x.active:!x.active))&&(teacher==="Todos"||x.teacher===teacher)&&(plan==="Todos"||x.plan===plan)&&(destination==="Todos"||x.destination===destination)),[rows,search,activity,teacher,plan,destination]);
 
 async function save(){if(!form.full_name||!form.plan_id||!form.start_date||!form.due_date){setError("Preencha nome, plano, início e a data de vencimento (dia da cobrança).");return;}const db=supabase as any;const {data:st,error:e}=await db.from("students").insert({full_name:form.full_name,phone:form.phone||null}).select().single();if(e){setError(e.message);return;}const {error:pe}=await db.from("student_plans").insert({student_id:st.id,plan_id:form.plan_id,teacher_id:form.teacher_id||null,monthly_value:moneyToNumber(form.monthly_value),start_date:form.start_date,due_date:form.due_date});if(pe){setError(pe.message);return;}await db.from("student_payments").insert({student_id:st.id,plan_id:form.plan_id,amount:moneyToNumber(form.monthly_value)||0,due_date:form.due_date,status:"Pendente",payment_method:form.payment_method||null,destination:form.destination||"Clínica"});await db.from("student_audit_log").insert({student_id:st.id,action:"Cadastro criado",details:{source:"interface"}});setShowForm(false);setForm({full_name:"",phone:"",plan_id:"",teacher_id:"",monthly_value:"",start_date:new Date().toISOString().slice(0,10),due_date:"",payment_method:"",destination:"Clínica"});load();}
 async function remove(){if(!deleting)return;const {error}=await (supabase as any).from("students").delete().eq("id",deleting.id);if(error){setError(error.message);return;}setDeleting(null);load();}

 if(pathname!=="/pilates/alunos")return <Outlet/>;
 return (
  <div style={{background:"#F5F6FA",minHeight:"100vh",padding:"24px 24px 40px"}}>
   {/* Header */}
   <div style={{background:"linear-gradient(to right,#1f2937,#334155,#0f766e)",borderRadius:20,padding:"28px 32px",marginBottom:24,boxShadow:"0 18px 40px -24px rgba(15,23,42,.7)"}}>
    <p style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:"rgba(255,255,255,0.6)",textTransform:"uppercase"}}>Pilates</p>
    <h1 style={{fontSize:30,fontWeight:700,color:"white",marginTop:8,letterSpacing:"-0.02em"}}>Cadastro de Alunos</h1>
    <p style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginTop:8,maxWidth:500}}>Dados sincronizados com o Supabase em tempo real.</p>
   </div>

   {/* Botão novo */}
   <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
    <button onClick={()=>setShowForm(true)} style={{display:"inline-flex",alignItems:"center",gap:8,background:"#111827",color:"white",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:500,border:"none",cursor:"pointer",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
     <Plus size={18}/>Novo aluno
    </button>
   </div>

   {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:14,color:"#B91C1C"}}>{error}</div>}

   {/* Filtros */}
   <div style={{...whiteCard,padding:"20px 24px",marginBottom:16}}>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
     <div style={{position:"relative",flex:1}}>
      <Search style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(0,0,0,0.4)"}} size={18}/>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar aluno por nome ou telefone..." style={{width:"100%",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",background:"#FAFAFA",padding:"12px 12px 12px 40px",fontSize:14}}/>
     </div>
     <Filter style={{color:"rgba(0,0,0,0.4)",flexShrink:0}} size={18}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,alignItems:"center"}}>
     <select value={activity} onChange={e=>setActivity(e.target.value)} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"10px 12px",fontSize:14,background:"#FAFAFA",color:"#374151"}}><option>Todos</option><option>Ativos</option><option>Inativos</option></select>
     <select value={teacher} onChange={e=>setTeacher(e.target.value)} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"10px 12px",fontSize:14,background:"#FAFAFA",color:"#374151"}}><option>Todos</option>{teachers.map(t=><option key={t.id}>{t.name}</option>)}</select>
     <select value={plan} onChange={e=>setPlan(e.target.value)} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"10px 12px",fontSize:14,background:"#FAFAFA",color:"#374151"}}><option>Todos</option>{plans.map(p=><option key={p.id}>{p.name}</option>)}</select>
     <select value={destination} onChange={e=>setDestination(e.target.value)} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"10px 12px",fontSize:14,background:"#FAFAFA",color:"#374151"}}><option>Todos</option><option>Professor</option><option>Clínica</option></select>
     <div style={{fontSize:14,color:"#64748B",padding:"10px 4px",whiteSpace:"nowrap"}}>{filtered.length} aluno(s)</div>
    </div>
   </div>

   {/* Tabela */}
   <div style={{...whiteCard,overflow:"hidden"}}>
    <div style={{overflowX:"auto"}}>
     <table style={{width:"100%",minWidth:1400,fontSize:14,textAlign:"left"}}>
      <thead style={{background:"rgba(0,0,0,0.025)",fontSize:11,textTransform:"uppercase",color:"#64748B",letterSpacing:"0.05em",fontWeight:600}}>
       <tr>{["Nome","Telefone","Plano atual","Professor","Vencimento","Status plano","Contrato","Avaliação física","Financeiro","Destino pag.","Ações"].map((h,i)=><th key={h} style={{padding:"14px 16px",fontWeight:600}}>{h}</th>)}</tr>
      </thead>
      <tbody style={{borderTop:"1px solid rgba(0,0,0,0.05)"}}>
       {filtered.map(x=>(
        <tr key={x.id} style={{borderBottom:"1px solid rgba(0,0,0,0.05)",transition:"background 0.15s"}} onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(0,0,0,0.02)";}} onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background="transparent";}}>
         <td style={{padding:"16px",fontWeight:500}}><Link to="/pilates/alunos/$alunoId" params={{alunoId:x.id}} style={{color:"#111827",textDecoration:"none",fontWeight:500}}>{x.full_name}</Link></td>
         <td style={{padding:"16px",color:"#64748B"}}>{x.phone||"—"}</td>
         <td style={{padding:"16px",color:"#374151"}}>{x.plan}</td>
         <td style={{padding:"16px",color:"#374151"}}>{x.teacher}</td>
         <td style={{padding:"16px",color:"#374151"}}>{fmt(x.due)}</td>
         <td style={{padding:"16px"}}><span style={{borderRadius:"9999px",padding:"4px 10px",fontSize:12,fontWeight:500,background:x.active?"#ECFDF5":"#F9FAFB",color:x.active?"#059669":"#9CA3AF"}}>{x.active?"Ativo":"Inativo"}</span></td>
         <td style={{padding:"16px"}}><span style={{borderRadius:"9999px",padding:"4px 10px",fontSize:12,fontWeight:500,...(x.contract&&["Vencida","Vencendo","Pendente","Vencido"].includes(x.contract)?{background:"#FEF2F2",color:"#DC2626"}:x.contract.includes("Próxima")?{background:"#FFFBEB",color:"#D97706"}:{background:"#ECFDF5",color:"#059669"})}}>{x.contract}</span></td>
         <td style={{padding:"16px",color:"#374151"}}>{x.assessment||"—"}</td>
         <td style={{padding:"16px",color:"#374151"}}>{x.financial}</td>
         <td style={{padding:"16px",color:"#374151"}}>{x.destination}</td>
         <td style={{padding:"16px"}}><button onClick={()=>setDeleting(x)} style={{background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,color:"#DC2626",fontSize:13}}><Trash2 size={15}/>Excluir</button></td>
        </tr>
       ))}
       {!loading&&!filtered.length&&<tr><td colSpan={11} style={{padding:"48px 16px",textAlign:"center",color:"#9CA3AF"}}>Nenhum aluno cadastrado.</td></tr>}
      </tbody>
     </table>
    </div>
    {loading&&<div style={{padding:"32px 16px",textAlign:"center",color:"#9CA3AF",fontSize:14}}>Carregando alunos...</div>}
   </div>

   {/* Modal novo aluno */}
   {showForm&&<div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
    <div style={{width:"100%",maxWidth:560,background:"white",borderRadius:16,padding:"28px 32px",boxShadow:"0 25px 50px -12px rgba(0,0,0,0.25)"}}>
     <h2 style={{fontSize:20,fontWeight:700,color:"#111827",marginBottom:20}}>Novo aluno</h2>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Nome completo" style={{gridColumn:"1/-1",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}/>
      <input value={form.phone} onChange={e=>setForm({...form,phone:formatPhone(e.target.value)})} placeholder="(00) 0 0000-0000" inputMode="numeric" maxLength={16} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}/>
      <input value={form.monthly_value} onChange={e=>setForm({...form,monthly_value:formatMoneyInput(e.target.value)})} placeholder="Ex.: 150,00" inputMode="decimal" style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}/>
      <select value={form.plan_id} onChange={e=>setForm({...form,plan_id:e.target.value})} style={{gridColumn:"1/-1",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}><option value="">Selecione o plano</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select value={form.teacher_id} onChange={e=>setForm({...form,teacher_id:e.target.value})} style={{gridColumn:"1/-1",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}><option value="">Sem professor</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <div>
       <label style={{display:"block",fontSize:13,color:"#64748B",marginBottom:6}}>Início do plano</label>
       <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} style={{width:"100%",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}/>
      </div>
      <div>
       <label style={{display:"block",fontSize:13,color:"#64748B",marginBottom:6}}>Dia de vencimento</label>
       <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} style={{width:"100%",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}/>
      </div>
      <select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})} style={{gridColumn:"1/-1",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}><option value="">Forma de pagamento</option><option>PIX - CNPJ</option><option>PIX - Professor</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Transferência</option><option>Boleto</option></select>
      <select value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} style={{gridColumn:"1/-1",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",padding:"12px 14px",fontSize:14}}><option>Clínica</option><option>Professor</option></select>
     </div>
     <div style={{display:"flex",justifyContent:"flex-end",gap:12,marginTop:24}}>
      <button onClick={()=>setShowForm(false)} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.15)",padding:"10px 20px",fontSize:14,background:"white",cursor:"pointer"}}>Cancelar</button>
      <button onClick={save} style={{borderRadius:12,background:"#111827",color:"white",border:"none",padding:"10px 20px",fontSize:14,fontWeight:500,cursor:"pointer",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>Salvar aluno</button>
     </div>
    </div>
   </div>}

   {/* Modal exclusão */}
   {deleting&&<div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)",padding:16}}>
    <div style={{width:"100%",maxWidth:420,background:"white",borderRadius:16,padding:"28px 32px",boxShadow:"0 25px 50px -12px rgba(0,0,0,0.25)"}}>
     <h2 style={{fontSize:20,fontWeight:700,color:"#111827"}}>Excluir aluno?</h2>
     <p style={{fontSize:14,color:"#64748B",marginTop:8}}>A exclusão é permanente e remove todos os dados vinculados ao aluno.</p>
     <div style={{display:"flex",justifyContent:"flex-end",gap:12,marginTop:24}}>
      <button onClick={()=>setDeleting(null)} style={{borderRadius:12,border:"1px solid rgba(0,0,0,0.15)",padding:"10px 20px",fontSize:14,background:"white",cursor:"pointer"}}>Cancelar</button>
      <button onClick={remove} style={{borderRadius:12,background:"#DC2626",color:"white",border:"none",padding:"10px 20px",fontSize:14,fontWeight:500,cursor:"pointer"}}>Excluir</button>
     </div>
    </div>
   </div>}
  </div>
 );
}
