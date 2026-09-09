const KEY="misBeneficiosV1";
let data=JSON.parse(localStorage.getItem(KEY)||"[]");
let selectedIcon="💰", imageData=null;
const icons=["💰","📦","🚗","🏠","🍴","💻","✈️","🛒","📱","🎯","🎁","🏋️","⛽","🧾"];

const $=id=>document.getElementById(id);
function euro(n){return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n)}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function dateISO(d=new Date()){return new Date(d).toISOString().slice(0,10)}
function startWeek(){let d=new Date();let day=d.getDay()||7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day+1);return d}
function startMonth(){let d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)}
function calc(items){return items.reduce((s,m)=>s+(m.type==="expense"?-m.amount:m.amount),0)}
function totals(items=data){
 return {income:items.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0),
 expense:items.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0),
 profit:items.filter(x=>x.type==="profit").reduce((s,x)=>s+x.amount,0)}
}
function render(){
 const t=totals(); $("incomeTotal").textContent=euro(t.income);$("expenseTotal").textContent=euro(t.expense);$("profitTotal").textContent=euro(t.profit);
 $("netTotal").textContent=euro(t.income-t.expense+t.profit);
 const w=data.filter(x=>new Date(x.date)>=startWeek()), m=data.filter(x=>new Date(x.date)>=startMonth());
 $("weekResult").textContent=euro(calc(w));$("monthResult").textContent=euro(calc(m));
 $("weekBar").style.width=Math.min(100,Math.abs(calc(w))/Math.max(1,Math.abs(calc(data)))*100)+"%";
 $("monthBar").style.width=Math.min(100,Math.abs(calc(m))/Math.max(1,Math.abs(calc(data)))*100)+"%";
 const box=$("movements");box.innerHTML="";
 if(!data.length){box.innerHTML='<div class="empty">No hay movimientos todavía.<br>Pulsa ＋ para añadir el primero.</div>';return}
 data.slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach((m,i)=>{
  const sign=m.type==="expense"?"-":"+";
  const cls=m.type==="profit"?"green":"red";
  box.insertAdjacentHTML("beforeend",`<div class="row"><div class="ico">${m.icon}</div><div class="rowmain"><b>${escapeHtml(m.concept)}</b><small>${escapeHtml(m.category)} · ${m.date}</small></div><div class="value ${cls}">${sign}${euro(m.amount)}</div></div>`)
 })
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function openModal(){ $("modal").classList.remove("hidden"); $("date").value=dateISO(); }
function closeModal(){ $("modal").classList.add("hidden"); $("movementForm").reset();imageData=null;$("preview").classList.add("hidden");}
$("addBtn").onclick=openModal;$("newBottom").onclick=openModal;$("closeModal").onclick=closeModal;
$("type").onchange=()=>highlightType($("type").value);
function highlightType(v){document.querySelectorAll(".switches button").forEach(b=>b.classList.toggle("selected",b.dataset.type===v))}
document.querySelectorAll(".switches button").forEach(b=>b.onclick=()=>{$("type").value=b.dataset.type;highlightType(b.dataset.type)});
icons.forEach(ic=>{$("icons").insertAdjacentHTML("beforeend",`<button type="button" data-icon="${ic}">${ic}</button>`)});
document.querySelectorAll("#icons button").forEach(b=>b.onclick=()=>{selectedIcon=b.dataset.icon;document.querySelectorAll("#icons button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
$("image").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{imageData=r.result;$("preview").src=imageData;$("preview").classList.remove("hidden")};r.readAsDataURL(f)};
$("movementForm").onsubmit=e=>{e.preventDefault();let amount=parseFloat($("amount").value.replace(".","").replace(",","."));if(!Number.isFinite(amount)||amount<=0)return;
 data.push({id:crypto.randomUUID(),concept:$("concept").value.trim(),amount,type:$("type").value,category:$("category").value,icon:selectedIcon,date:$("date").value,notes:$("notes").value.trim(),image:imageData});save();closeModal()}
$("clearBtn").onclick=()=>{if(confirm("¿Borrar todos los movimientos?")){data=[];save()}}
$("exportBtn").onclick=()=>{let csv="Fecha;Concepto;Tipo;Categoría;Importe;Icono;Notas\n"+data.map(x=>[x.date,x.concept,x.type,x.category,x.amount.toFixed(2).replace(".",","),x.icon,x.notes].map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");let blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="MisBeneficios.csv";a.click();URL.revokeObjectURL(a.href)}
$("statsBtn").onclick=()=>{$("statsModal").classList.remove("hidden");let cats={};data.forEach(x=>cats[x.category]=(cats[x.category]||0)+(x.type==="expense"?-x.amount:x.amount));$("statsContent").innerHTML=Object.entries(cats).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).map(([k,v])=>`<div class="statCard"><div class="statLine"><span>${escapeHtml(k)}</span><b>${euro(v)}</b></div></div>`).join("")||'<div class="empty">Todavía no hay datos.</div>'}
$("closeStats").onclick=()=>$("statsModal").classList.add("hidden");
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
