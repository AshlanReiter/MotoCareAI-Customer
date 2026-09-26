
const app = document.getElementById("app");

const state = {
  page: "home",
  modal: null,
  mobile: false,
  chat: [
    {role:"ai", text:"Hi! I'm MotoCare AI. I can help you understand your motorcycle's maintenance needs, explain services, and help you schedule an appointment."}
  ]
};

const bike = {
  brand:"Honda", model:"Click 125i", year:2023, plate:"ABC 1234",
  mileage:"18,450 km", lastService:"September 5, 2026",
  nextService:"CVT Inspection", nextDue:"20,000 km",
  engine:"125cc", color:"Matte Black", chassis:"MC-23-01482",
  status:"Healthy"
};

const history = [
  {date:"Sep 05, 2026", service:"Chain Adjustment", mechanic:"Ramon Cruz", cost:"₱450", status:"Completed"},
  {date:"Jul 11, 2026", service:"Preventive Maintenance Service", mechanic:"Ramon Cruz", cost:"₱1,850", status:"Completed"},
  {date:"Apr 08, 2026", service:"General Checkup", mechanic:"Liza Santos", cost:"₱400", status:"Completed"}
];

const appointments = [
  {id:"APT-1048", date:"Sep 30, 2026", time:"10:00 AM", service:"CVT Inspection", status:"Confirmed", mechanic:"To be assigned"},
  {id:"APT-1021", date:"Sep 05, 2026", time:"9:30 AM", service:"Chain Adjustment", status:"Completed", mechanic:"Ramon Cruz"}
];

const recommendations = [
  {name:"CVT Inspection", reason:"Your mileage is approaching the recommended inspection point.", price:"From ₱500", urgency:"Recommended"},
  {name:"Preventive Maintenance Service", reason:"Regular PMS helps keep routine maintenance up to date.", price:"From ₱299", urgency:"Recommended"},
  {name:"Brake Inspection", reason:"A routine brake check can help identify wear early.", price:"Inspection", urgency:"Suggested"}
];

const nav = [
  ["home","⌂","Home"],
  ["motorcycle","🏍","My Motorcycle"],
  ["appointments","◷","Appointments"],
  ["history","▤","Service History"],
  ["recommendations","✦","Maintenance & AI"],
  ["chat","◉","MotoCare AI"]
];

function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function initials(name){ return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(); }
function badge(text){
  const t = String(text).toLowerCase();
  let c = "gray";
  if(t.includes("confirm") || t.includes("complete") || t.includes("healthy")) c="success";
  else if(t.includes("recommend") || t.includes("pending") || t.includes("due")) c="warning";
  else if(t.includes("cancel")) c="danger";
  else if(t.includes("progress") || t.includes("assign")) c="info";
  return `<span class="badge ${c}">${esc(text)}</span>`;
}
function pageTitle(){
  const x = nav.find(n=>n[0]===state.page);
  return x ? x[2] : "Home";
}

function render(){
  app.innerHTML = `
  <div class="app">
    <aside class="sidebar ${state.mobile?'open':''}">
      <div class="brand">
        <div class="brand-mark">M</div>
        <div><strong>MotoCare AI</strong><small>Customer Portal</small></div>
      </div>
      <nav class="nav">
        <div class="nav-label">My MotoCare</div>
        ${nav.map(n=>`<button class="${state.page===n[0]?'active':''}" data-action="go" data-page="${n[0]}"><span class="nav-icon">${n[1]}</span>${n[2]}</button>`).join("")}
      </nav>
      <div class="sidebar-foot">Personal motorcycle care<br>Prototype Interface</div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="top-actions">
          <button class="icon-btn mobile-menu" data-action="menu">☰</button>
          <div class="breadcrumb">MotoCare AI / <strong>${pageTitle()}</strong></div>
        </div>
        <div class="top-actions">
          <button class="icon-btn" data-action="notifications" title="Notifications">♢</button>
          <div class="profile">
            <div class="avatar">JV</div>
            <div class="hide-mobile"><strong style="font-size:12px">Juan Dela Cruz</strong><div class="small-text muted">Customer</div></div>
          </div>
        </div>
      </header>
      <section class="content">${content()}</section>
    </main>
  </div>

  <div class="modal-backdrop ${state.modal?'open':''}" id="modalBackdrop">
    ${state.modal ? modalMarkup() : ""}
  </div>
  <div class="toast" id="toast" aria-live="polite"></div>
  `;
  bind();
}

function content(){
  if(state.page==="home") return home();
  if(state.page==="motorcycle") return motorcycle();
  if(state.page==="appointments") return appointmentPage();
  if(state.page==="history") return historyPage();
  if(state.page==="recommendations") return recommendationPage();
  if(state.page==="chat") return chatPage();
  return home();
}

function pageHead(title,desc,actions=""){
  return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${actions}</div></div>`;
}

function home(){
  return pageHead("Good afternoon, Juan 👋","Here's what your motorcycle needs today.",
    `<button class="btn" data-action="go" data-page="history">View Service History</button><button class="btn primary" data-action="go" data-page="chat">Ask MotoCare AI</button>`) +
  `<div class="hero-bike">
    <div>
      <h2>${bike.brand} ${bike.model}</h2>
      <p>${bike.year} · ${bike.plate} · ${bike.mileage}</p>
      <div>${badge("Healthy")} <span class="small-text muted">Last service: ${bike.lastService}</span></div>
      <div class="kpi-row">
        <div class="kpi"><label>Next maintenance</label><strong>${bike.nextService}</strong></div>
        <div class="kpi"><label>Recommended at</label><strong>${bike.nextDue}</strong></div>
        <div class="kpi"><label>Service visits</label><strong>${history.length} this year</strong></div>
      </div>
    </div>
    <div class="bike-visual">🏍️</div>
  </div>

  <div style="margin-top:18px">
    <div class="alert warning">
      <div><strong>Maintenance reminder</strong><p>Your ${bike.brand} ${bike.model} is approaching its next recommended service point.</p></div>
      <button class="btn primary small" data-action="book" data-service="CVT Inspection">Schedule Service</button>
    </div>
  </div>

  <div class="grid-2" style="margin-top:18px">
    <div class="card panel">
      <div class="panel-head"><h2>AI Recommendation</h2><button class="link-btn" data-action="go" data-page="recommendations">View all</button></div>
      <div class="service-card">
        <span class="reason">Based on mileage & service history</span>
        <h3 style="margin-top:10px">CVT Inspection</h3>
        <p>Your motorcycle is at 18,450 km. MotoCare AI recommends checking the CVT before your next major service interval.</p>
        <div class="service-meta"><strong class="service-price">From ₱500</strong><button class="btn primary small" data-action="book" data-service="CVT Inspection">Book</button></div>
      </div>
    </div>

    <div class="card panel">
      <div class="panel-head"><h2>Next Appointment</h2><button class="link-btn" data-action="go" data-page="appointments">View all</button></div>
      ${appointments[0] ? `<div class="list-row">
        <div class="person"><div class="mini-avatar">◷</div><div><strong>${appointments[0].service}</strong><span>${appointments[0].date} · ${appointments[0].time}</span></div></div>${badge(appointments[0].status)}
      </div>` : `<div class="empty">No upcoming appointments.</div>`}
      <button class="btn" style="margin-top:10px" data-action="book" data-service="General Checkup">Book another service</button>
    </div>
  </div>

  <div class="card panel" style="margin-top:18px">
    <div class="panel-head"><h2>Recent Service</h2><button class="link-btn" data-action="go" data-page="history">View history</button></div>
    ${history.slice(0,2).map(h=>`<div class="list-row"><div><strong>${esc(h.service)}</strong><div class="small-text muted">${h.date} · ${h.mechanic}</div></div><strong>${h.cost}</strong></div>`).join("")}
  </div>`;
}

function motorcycle(){
  return pageHead("My Motorcycle","Your motorcycle profile, mileage, and maintenance information.",
    `<button class="btn primary" data-action="book" data-service="General Checkup">Book Service</button>`) +
  `<div class="detail-grid">
    <div class="card panel">
      <div class="panel-head"><h2>Motorcycle Profile</h2></div>
      <div class="bike-visual" style="min-height:190px;margin-bottom:15px">🏍️</div>
      <div class="info-list">
        ${info("Brand",bike.brand)}${info("Model",bike.model)}${info("Year",bike.year)}${info("Plate",bike.plate)}
        ${info("Engine",bike.engine)}${info("Color",bike.color)}${info("Current Mileage",bike.mileage)}${info("Status",badge(bike.status))}
      </div>
    </div>
    <div>
      <div class="card panel">
        <div class="panel-head"><h2>Maintenance Status</h2>${badge("Due Soon")}</div>
        <div class="alert warning"><div><strong>${bike.nextService}</strong><p>Recommended around ${bike.nextDue}. Your current mileage is ${bike.mileage}.</p></div><button class="btn primary small" data-action="book" data-service="${bike.nextService}">Book</button></div>
        <div style="margin-top:16px">
          <div class="small-text muted">Maintenance progress</div>
          <div class="progress">
            <div class="step done"><div class="step-dot"></div>Last Service</div>
            <div class="step current"><div class="step-dot"></div>Approaching</div>
            <div class="step"><div class="step-dot"></div>Next PMS</div>
          </div>
        </div>
      </div>
      <div class="card panel" style="margin-top:18px">
        <div class="panel-head"><h2>AI Maintenance Insight</h2><button class="link-btn" data-action="go" data-page="chat">Ask AI</button></div>
        <p class="small-text" style="line-height:1.6;margin:0">Based on your current mileage and recent service history, MotoCare AI recommends checking the CVT and brakes before the next full maintenance interval.</p>
      </div>
    </div>
  </div>`;
}

function appointmentPage(){
  return pageHead("Appointments","Schedule and track your motorcycle service appointments.",
    `<button class="btn primary" data-action="book" data-service="General Checkup">+ Book Appointment</button>`) +
  `<div class="card panel">
    <div class="panel-head"><h2>Upcoming & Recent Appointments</h2><span class="small-text muted">${appointments.length} records</span></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Appointment</th><th>Date & Time</th><th>Service</th><th>Mechanic</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${appointments.map(a=>`<tr><td><strong>${a.id}</strong></td><td>${a.date}<br><span class="small-text muted">${a.time}</span></td><td>${a.service}</td><td>${a.mechanic}</td><td>${badge(a.status)}</td><td><button class="link-btn" data-action="appointment-detail" data-id="${a.id}">View</button></td></tr>`).join("")}
    </tbody></table></div>
  </div>`;
}

function historyPage(){
  return pageHead("Service History","A record of the maintenance and repair services performed on your motorcycle.",
    `<button class="btn primary" data-action="book" data-service="General Checkup">Book Service</button>`) +
  `<div class="grid-2">
    <div class="card panel">
      <div class="panel-head"><h2>Service Timeline</h2><span class="small-text muted">${history.length} completed services</span></div>
      <div class="timeline">${history.map(h=>`<div class="timeline-item"><strong>${h.date} · ${esc(h.service)}</strong><p>${esc(h.mechanic)} · ${h.cost} · ${badge(h.status)}</p></div>`).join("")}</div>
    </div>
    <div>
      <div class="card panel">
        <div class="panel-head"><h2>Maintenance Summary</h2></div>
        <div class="kpi-row">
          <div class="kpi"><label>Last service</label><strong>${bike.lastService}</strong></div>
          <div class="kpi"><label>Visits this year</label><strong>${history.length}</strong></div>
          <div class="kpi"><label>Next service</label><strong>${bike.nextService}</strong></div>
        </div>
      </div>
      <div class="card panel" style="margin-top:18px">
        <div class="panel-head"><h2>What was included?</h2></div>
        <div class="list">
          <div class="list-row"><span>Preventive Maintenance</span><span class="small-text muted">Oil · Tune-up · Chain · Brakes</span></div>
          <div class="list-row"><span>Chain Adjustment</span><span class="small-text muted">Adjustment & inspection</span></div>
          <div class="list-row"><span>General Checkup</span><span class="small-text muted">Basic inspection</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

function recommendationPage(){
  return pageHead("Maintenance & AI","Personalized service suggestions based on your motorcycle information and service history.",
    `<button class="btn" data-action="go" data-page="chat">Ask MotoCare AI</button>`) +
  `<div class="alert info" style="margin-bottom:18px"><div><strong>How recommendations work</strong><p>MotoCare AI uses your motorcycle details, mileage, and recorded service history to suggest maintenance. Recommendations are not a diagnosis.</p></div></div>
  <div class="rec-grid">
    ${recommendations.map(r=>`<div class="service-card">
      ${badge(r.urgency)}
      <h3 style="margin-top:10px">${esc(r.name)}</h3>
      <p>${esc(r.reason)}</p>
      <span class="small-text muted">${esc(r.price)}</span>
      <div class="service-meta"><span class="reason">AI suggestion</span><button class="btn primary small" data-action="book" data-service="${esc(r.name)}">Book</button></div>
    </div>`).join("")}
  </div>
  <div class="card panel" style="margin-top:18px">
    <div class="panel-head"><h2>Maintenance Reminder</h2>${badge("Due Soon")}</div>
    <div class="list-row"><div><strong>${bike.nextService}</strong><div class="small-text muted">Your ${bike.brand} ${bike.model} is at ${bike.mileage}. Recommended around ${bike.nextDue}.</div></div><button class="btn primary small" data-action="book" data-service="${bike.nextService}">Schedule</button></div>
  </div>`;
}

function chatPage(){
  return pageHead("MotoCare AI Assistant","Ask questions about maintenance, services, symptoms, or booking an appointment.",
    `<button class="btn" data-action="clear-chat">Clear Chat</button>`) +
  `<div class="grid-2">
    <div class="card panel">
      <div class="chat">
        <div class="chat-messages" id="chatMessages">
          ${state.chat.map(m=>`<div class="msg ${m.role}"><small>${m.role==="ai"?"MotoCare AI":"You"}</small>${esc(m.text)}</div>`).join("")}
        </div>
        <div>
          <div class="chat-input"><input id="chatInput" class="input" placeholder="Ask something about your motorcycle..."><button class="btn primary" data-action="send-chat">Send</button></div>
          <div class="prompt-row">
            <button class="prompt" data-action="prompt" data-text="What maintenance does my motorcycle need?">What maintenance do I need?</button>
            <button class="prompt" data-action="prompt" data-text="What is a CVT inspection?">What is a CVT inspection?</button>
            <button class="prompt" data-action="prompt" data-text="I hear a strange sound when accelerating.">Strange sound when accelerating</button>
            <button class="prompt" data-action="prompt" data-text="I want to book my recommended service.">Book my recommended service</button>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="card panel">
        <div class="panel-head"><h2>Your Motorcycle</h2></div>
        <div class="list-row"><div><strong>${bike.brand} ${bike.model}</strong><div class="small-text muted">${bike.mileage} · ${bike.plate}</div></div>${badge("Healthy")}</div>
        <div class="list-row"><span>Next recommendation</span><strong>${bike.nextService}</strong></div>
        <div class="list-row"><span>Last service</span><span class="small-text muted">${bike.lastService}</span></div>
      </div>
      <div class="card panel" style="margin-top:18px">
        <div class="panel-head"><h2>AI can help you with</h2></div>
        <div class="list">
          <div class="list-row"><span>Maintenance questions</span><span>✓</span></div>
          <div class="list-row"><span>Service explanations</span><span>✓</span></div>
          <div class="list-row"><span>Personalized recommendations</span><span>✓</span></div>
          <div class="list-row"><span>Appointment booking</span><span>✓</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

function info(label,value){
  return `<div class="info-item"><label>${label}</label><strong>${value}</strong></div>`;
}

function modalMarkup(){
  if(state.modal.type==="booking"){
    return `<div class="modal">
      <div class="modal-head"><h3>Book a Service Appointment</h3><button class="close" data-action="close-modal">×</button></div>
      <div class="modal-body">
        <div class="alert info" style="margin-bottom:16px"><div><strong>${esc(state.modal.service)}</strong><p>For ${bike.brand} ${bike.model} · ${bike.plate}</p></div></div>
        <div class="form-grid">
          <div class="field"><label>Service</label><select class="select" id="bookService">
            ${["General Checkup","Preventive Maintenance Service","CVT Inspection","Brake Inspection","Chain Adjustment","Engine Repair / Tune-up","Electrical Inspection","Suspension Inspection","Motorcycle Detailing"].map(x=>`<option ${x===state.modal.service?'selected':''}>${x}</option>`).join("")}
          </select></div>
          <div class="field"><label>Preferred Date</label><input class="input" id="bookDate" type="date" value="2026-10-02"></div>
          <div class="field"><label>Preferred Time</label><select class="select" id="bookTime"><option>9:00 AM</option><option>10:00 AM</option><option>1:00 PM</option><option>2:30 PM</option><option>4:00 PM</option></select></div>
          <div class="field"><label>Preferred Branch</label><select class="select"><option>MotoCare Main Branch</option><option>MotoCare East Branch</option></select></div>
          <div class="field full"><label>Notes / Concern</label><textarea class="textarea" id="bookNotes" rows="3" placeholder="Tell the service team anything they should know..."></textarea></div>
        </div>
        <div class="form-actions"><button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="confirm-book">Request Appointment</button></div>
      </div>
    </div>`;
  }
  if(state.modal.type==="appointment"){
    const a=appointments.find(x=>x.id===state.modal.id);
    return `<div class="modal"><div class="modal-head"><h3>Appointment Details</h3><button class="close" data-action="close-modal">×</button></div><div class="modal-body">
      <div class="info-list">${info("Appointment ID",a.id)}${info("Service",a.service)}${info("Date",a.date)}${info("Time",a.time)}${info("Mechanic",a.mechanic)}${info("Status",badge(a.status))}</div>
      <div class="form-actions"><button class="btn" data-action="close-modal">Close</button>${a.status!=="Completed"?`<button class="btn" data-action="cancel-appointment" data-id="${a.id}">Cancel Appointment</button>`:""}</div>
    </div></div>`;
  }
}

function openBooking(service){
  state.modal={type:"booking",service:service||"General Checkup"};
  render();
}
function toast(msg){
  const t=document.getElementById("toast");
  if(!t)return;
  t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function aiReply(text){
  const q=text.toLowerCase();
  if(q.includes("book") || q.includes("appointment")){
    return "Sure. Your current AI recommendation is a CVT Inspection. I can open the appointment form so you can choose a date and time.";
  }
  if(q.includes("cvt")){
    return "A CVT inspection checks the continuously variable transmission system, including components such as the belt and related parts. A mechanic can confirm whether anything needs service or replacement.";
  }
  if(q.includes("sound") || q.includes("noise")){
    return "A strange sound can have several causes depending on when it happens. Avoid guessing from the sound alone. I recommend describing when it occurs and having a mechanic inspect the motorcycle. I can help you book an appointment.";
  }
  if(q.includes("maintenance") || q.includes("service")){
    return `For your ${bike.brand} ${bike.model} at ${bike.mileage}, MotoCare AI currently recommends ${bike.nextService}. Your recent service history also makes a routine brake inspection reasonable.`;
  }
  return "I can help with maintenance reminders, service explanations, common motorcycle concerns, recommendations, and appointment booking. What would you like to check?";
}

function sendChat(text){
  if(!text.trim())return;
  state.chat.push({role:"user",text});
  state.chat.push({role:"ai",text:aiReply(text)});
  render();
  setTimeout(()=>{const box=document.getElementById("chatMessages");if(box)box.scrollTop=box.scrollHeight;},0);
}

function bind(){
  document.querySelectorAll("[data-action]").forEach(el=>{
    el.addEventListener("click",()=>{
      const a=el.dataset.action;
      if(a==="go"){state.page=el.dataset.page;state.mobile=false;render();}
      else if(a==="menu"){state.mobile=!state.mobile;render();}
      else if(a==="book"){openBooking(el.dataset.service);}
      else if(a==="close-modal"){state.modal=null;render();}
      else if(a==="confirm-book"){
        const service=document.getElementById("bookService").value;
        const date=document.getElementById("bookDate").value;
        const time=document.getElementById("bookTime").value;
        const notes=document.getElementById("bookNotes").value;
        const formatted=date ? new Date(date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}) : "Requested date";
        appointments.unshift({id:"APT-"+Math.floor(1050+Math.random()*90),date:formatted,time,service,status:"Pending Confirmation",mechanic:"To be assigned",notes});
        state.modal=null;state.page="appointments";render();toast("Appointment request submitted.");
      }
      else if(a==="appointment-detail"){state.modal={type:"appointment",id:el.dataset.id};render();}
      else if(a==="cancel-appointment"){
        const ap=appointments.find(x=>x.id===el.dataset.id); if(ap)ap.status="Cancelled";
        state.modal=null;render();toast("Appointment cancelled.");
      }
      else if(a==="notifications"){toast("You have 1 maintenance reminder.");}
      else if(a==="prompt"){sendChat(el.dataset.text);}
      else if(a==="send-chat"){const input=document.getElementById("chatInput");if(input)sendChat(input.value);}
      else if(a==="clear-chat"){state.chat=[{role:"ai",text:"Hi! I'm MotoCare AI. How can I help with your motorcycle today?"}];render();}
    });
  });
  const input=document.getElementById("chatInput");
  if(input)input.addEventListener("keydown",e=>{if(e.key==="Enter")sendChat(input.value);});
}

render();
