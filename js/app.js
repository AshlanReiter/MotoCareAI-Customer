const app = document.getElementById("app");

const defaultAccount = {
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  phone: "+63 917 123 4567"
};

const state = {
  page: "home",
  modal: null,
  mobile: false,
  authenticated: localStorage.getItem("motocare_customer_session") === "1",
  authView: "login",
  showProfileMenu: false,
  notificationsOpen: false,
  account: JSON.parse(localStorage.getItem("motocare_customer_account") || "null") || defaultAccount,
  notifications: JSON.parse(localStorage.getItem("motocare_customer_notifications") || "null") || [
    {id:1,title:"Maintenance reminder",text:"Your CVT Inspection is approaching.",time:"Today",read:false},
    {id:2,title:"Appointment confirmed",text:"Your Sep 30 appointment is confirmed.",time:"Yesterday",read:false},
    {id:3,title:"Service history updated",text:"Your Chain Adjustment record is available.",time:"Sep 05",read:true}
  ],
  chat: [
    {role:"ai", text:"Hi! I'm MotoCare AI. I can help you understand your motorcycle's maintenance needs, explain services, and help you schedule an appointment."}
  ]
};

const bikes = JSON.parse(localStorage.getItem("motocare_customer_bikes") || "null") || [
  {
    id:"BIKE-001",
    brand:"Honda",
    model:"Click 125i",
    year:2023,
    plate:"ABC 1234",
    mileage:"18,450 km",
    lastService:"September 5, 2026",
    nextService:"CVT Inspection",
    nextDue:"20,000 km",
    engine:"125cc",
    color:"Matte Black",
    chassis:"MC-23-01482",
    status:"Healthy"
  }
];

let currentBikeId =
  localStorage.getItem("motocare_current_bike") || bikes[0].id;

const history = [
  {
    date:"Sep 05, 2026",
    service:"Chain Adjustment",
    mechanic:"Ramon Cruz",
    cost:"₱450",
    status:"Completed"
  },
  {
    date:"Jul 11, 2026",
    service:"Preventive Maintenance Service",
    mechanic:"Ramon Cruz",
    cost:"₱1,850",
    status:"Completed"
  },
  {
    date:"Apr 08, 2026",
    service:"General Checkup",
    mechanic:"Liza Santos",
    cost:"₱400",
    status:"Completed"
  }
];

const appointments = [
  {
    id:"APT-1048",
    date:"Sep 30, 2026",
    time:"10:00 AM",
    service:"CVT Inspection",
    status:"Confirmed",
    mechanic:"To be assigned"
  },
  {
    id:"APT-1021",
    date:"Sep 05, 2026",
    time:"9:30 AM",
    service:"Chain Adjustment",
    status:"Completed",
    mechanic:"Ramon Cruz"
  }
];

const recommendations = [
  {
    name:"CVT Inspection",
    reason:"Your mileage is approaching the recommended inspection point.",
    price:"From ₱500",
    urgency:"Recommended"
  },
  {
    name:"Preventive Maintenance Service",
    reason:"Regular PMS helps keep routine maintenance up to date.",
    price:"From ₱299",
    urgency:"Recommended"
  },
  {
    name:"Brake Inspection",
    reason:"A routine brake check can help identify wear early.",
    price:"Inspection",
    urgency:"Suggested"
  }
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
  return String(v ?? "").replace(
    /[&<>"']/g,
    m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[m])
  );
}

function initials(name){
  return String(name || "Customer")
    .split(" ")
    .filter(Boolean)
    .map(x => x[0])
    .join("")
    .slice(0,2)
    .toUpperCase();
}

function badge(text){
  const t = String(text).toLowerCase();
  let c = "gray";

  if(
    t.includes("confirm") ||
    t.includes("complete") ||
    t.includes("healthy")
  ) c = "success";
  else if(
    t.includes("recommend") ||
    t.includes("pending") ||
    t.includes("due")
  ) c = "warning";
  else if(t.includes("cancel")) c = "danger";
  else if(
    t.includes("progress") ||
    t.includes("assign")
  ) c = "info";

  return `<span class="badge ${c}">${esc(text)}</span>`;
}

function currentBike(){
  return bikes.find(b => b.id === currentBikeId) || bikes[0];
}

function bike(){
  return currentBike();
}

function saveBikes(){
  localStorage.setItem(
    "motocare_customer_bikes",
    JSON.stringify(bikes)
  );
}

function saveAccount(){
  localStorage.setItem(
    "motocare_customer_account",
    JSON.stringify(state.account)
  );
}

function saveNotifications(){
  localStorage.setItem(
    "motocare_customer_notifications",
    JSON.stringify(state.notifications)
  );
}

function pageTitle(){
  const x = nav.find(n => n[0] === state.page);
  return x
    ? x[2]
    : state.page === "account"
      ? "Account"
      : "Home";
}

function render(){

  if(!state.authenticated){
    app.innerHTML = authMarkup();
    bind();
    return;
  }

  app.innerHTML = `
  <div class="app">

    <aside class="sidebar ${state.mobile ? 'open' : ''}">

      <div class="brand">
        <div class="brand-mark">M</div>
        <div>
          <strong>MotoCare AI</strong>
          <small>Customer Portal</small>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-label">My MotoCare</div>

        ${nav.map(n => `
          <button
            class="${state.page === n[0] ? 'active' : ''}"
            data-action="go"
            data-page="${n[0]}"
          >
            <span class="nav-icon">${n[1]}</span>
            ${n[2]}
          </button>
        `).join("")}
      </nav>

      <div class="sidebar-foot">
        Personal motorcycle care<br>
        Prototype Interface
      </div>

    </aside>

    <main class="main">

      <header class="topbar">

        <div class="top-actions">

          <button
            class="icon-btn mobile-menu"
            data-action="menu"
          >
            ☰
          </button>

          <div class="breadcrumb">
            MotoCare AI / <strong>${pageTitle()}</strong>
          </div>

        </div>

        <div class="top-actions">

          <div class="mc-notification-wrap">

            <button
              class="icon-btn"
              data-action="notifications"
              title="Notifications"
            >
              ♢
              ${unreadCount()
                ? `<span class="mc-notification-dot"></span>`
                : ""}
            </button>

            ${state.notificationsOpen
              ? notificationPanel()
              : ""}

          </div>

          <div class="mc-profile-wrap">

            <button
              class="profile"
              data-action="profile-menu"
              type="button"
            >

              <div class="avatar">
                ${initials(state.account.name)}
              </div>

              <div class="hide-mobile">
                <strong style="font-size:12px">
                  ${esc(state.account.name)}
                </strong>

                <div class="small-text muted">
                  Customer
                </div>
              </div>

            </button>

            ${state.showProfileMenu
              ? profileMenu()
              : ""}

          </div>

        </div>

      </header>

      <section class="content">
        ${content()}
      </section>

    </main>

  </div>

  <div
    class="modal-backdrop ${state.modal ? 'open' : ''}"
    id="modalBackdrop"
  >
    ${state.modal ? modalMarkup() : ""}
  </div>

  <div
    class="toast"
    id="toast"
    aria-live="polite"
  ></div>
  `;

  bind();
}

function authMarkup(){

  let body = "";

  if(state.authView === "login")
    body = loginForm();

  if(state.authView === "signup")
    body = signupForm();

  if(state.authView === "forgot")
    body = forgotForm();

  if(state.authView === "reset")
    body = resetForm();

  return `
    <div class="mc-auth-shell">

      <div class="mc-auth-brand">
        <div class="brand-mark">M</div>

        <div>
          <strong>MotoCare AI</strong>
          <small>Customer Portal</small>
        </div>
      </div>

      <div class="mc-auth-card">
        ${body}
      </div>

      <div class="mc-auth-footer">
        MotoCare AI · Customer Portal · Prototype Interface
      </div>

    </div>
  `;
}

function loginForm(){

  return `
    <div class="mc-auth-head">
      <h1>Welcome back</h1>
      <p>Sign in to manage your motorcycle care.</p>
    </div>

    <form data-form="login">

      <div class="mc-auth-field">
        <label>Email</label>

        <input
          class="input"
          id="loginEmail"
          type="email"
          value="${esc(state.account.email)}"
          placeholder="you@example.com"
          required
        >
      </div>

      <div class="mc-auth-field">
        <label>Password</label>

        <input
          class="input"
          id="loginPassword"
          type="password"
          placeholder="Enter your password"
          required
        >
      </div>

      <div class="mc-auth-row">

        <label class="mc-auth-check">
          <input
            type="checkbox"
            id="rememberMe"
          >
          Remember me
        </label>

        <button
          class="mc-auth-link"
          type="button"
          data-action="auth-view"
          data-view="forgot"
        >
          Forgot password?
        </button>

      </div>

      <button
        class="mc-auth-submit"
        type="submit"
      >
        Sign In
      </button>

    </form>

    <div class="mc-auth-switch">
      Don't have an account?

      <button
        class="mc-auth-link"
        data-action="auth-view"
        data-view="signup"
      >
        Create an account
      </button>
    </div>

    <div class="mc-auth-demo">
      <strong>Demo account</strong><br>
      juan@example.com<br>
      Password: customer123
    </div>
  `;
}

function signupForm(){

  return `
    <div class="mc-auth-head">
      <h1>Create your account</h1>
      <p>Set up your MotoCare customer profile.</p>
    </div>

    <form data-form="signup">

      <div class="mc-auth-grid">

        <div class="mc-auth-field">
          <label>Full Name</label>
          <input
            class="input"
            id="signupName"
            value="${esc(state.account.name)}"
            required
          >
        </div>

        <div class="mc-auth-field">
          <label>Phone</label>
          <input
            class="input"
            id="signupPhone"
            value="${esc(state.account.phone)}"
            placeholder="09XX XXX XXXX"
          >
        </div>

      </div>

      <div class="mc-auth-field">
        <label>Email</label>
        <input
          class="input"
          id="signupEmail"
          type="email"
          value="${esc(state.account.email)}"
          required
        >
      </div>

      <div class="mc-auth-grid">

        <div class="mc-auth-field">
          <label>Password</label>
          <input
            class="input"
            id="signupPassword"
            type="password"
            minlength="6"
            required
          >
        </div>

        <div class="mc-auth-field">
          <label>Confirm Password</label>
          <input
            class="input"
            id="signupConfirm"
            type="password"
            minlength="6"
            required
          >
        </div>

      </div>

      <button
        class="mc-auth-submit"
        type="submit"
      >
        Create Account
      </button>

    </form>

    <div class="mc-auth-switch">
      Already have an account?

      <button
        class="mc-auth-link"
        data-action="auth-view"
        data-view="login"
      >
        Sign in
      </button>
    </div>
  `;
}

function forgotForm(){

  return `
    <div class="mc-auth-head">
      <h1>Reset your password</h1>
      <p>
        Enter your email and we'll simulate sending a reset link.
      </p>
    </div>

    <form data-form="forgot">

      <div class="mc-auth-field">
        <label>Email</label>

        <input
          class="input"
          id="forgotEmail"
          type="email"
          value="${esc(state.account.email)}"
          required
        >
      </div>

      <button
        class="mc-auth-submit"
        type="submit"
      >
        Send Reset Link
      </button>

    </form>

    <div class="mc-auth-switch">

      <button
        class="mc-auth-link"
        data-action="auth-view"
        data-view="login"
      >
        ← Back to sign in
      </button>

    </div>
  `;
}

function resetForm(){

  return `
    <div class="mc-auth-head">
      <h1>Set a new password</h1>
      <p>
        Choose a new password for your customer account.
      </p>
    </div>

    <form data-form="reset">

      <div class="mc-auth-field">
        <label>New Password</label>

        <input
          class="input"
          id="resetPassword"
          type="password"
          minlength="6"
          required
        >
      </div>

      <div class="mc-auth-field">
        <label>Confirm Password</label>

        <input
          class="input"
          id="resetConfirm"
          type="password"
          minlength="6"
          required
        >
      </div>

      <button
        class="mc-auth-submit"
        type="submit"
      >
        Update Password
      </button>

    </form>

    <div class="mc-auth-switch">

      <button
        class="mc-auth-link"
        data-action="auth-view"
        data-view="login"
      >
        Back to sign in
      </button>

    </div>
  `;
}

function bindAuth(){

  document
    .querySelectorAll('form[data-form]')
    .forEach(form => {

      form.addEventListener("submit", e => {

        e.preventDefault();

        submitAuth(form.dataset.form);

      });

    });
}

function submitAuth(type){

  if(type === "login"){

    const email =
      document.getElementById("loginEmail").value.trim();

    const password =
      document.getElementById("loginPassword").value;

    if(!email || !password){

      toast("Please enter your email and password.");

      return;
    }

    if(
      email.toLowerCase() !== "juan@example.com" ||
      password !== "customer123"
    ){

      toast(
        "Demo login: juan@example.com / customer123"
      );

      return;
    }

    state.account.email = email;

    state.authenticated = true;

    localStorage.setItem(
      "motocare_customer_session",
      "1"
    );

    saveAccount();

    render();

    toast("Welcome back, Juan!");

  }

  else if(type === "signup"){

    const name =
      document.getElementById("signupName").value.trim();

    const email =
      document.getElementById("signupEmail").value.trim();

    const phone =
      document.getElementById("signupPhone").value.trim();

    const password =
      document.getElementById("signupPassword").value;

    const confirm =
      document.getElementById("signupConfirm").value;

    if(!name || !email){

      toast("Please enter your name and email.");

      return;
    }

    if(password !== confirm){

      toast("Passwords do not match.");

      return;
    }

    if(password.length < 6){

      toast(
        "Password must be at least 6 characters."
      );

      return;
    }

    state.account = {
      name:name || "Customer",
      email,
      phone
    };

    saveAccount();

    state.authenticated = true;

    localStorage.setItem(
      "motocare_customer_session",
      "1"
    );

    render();

    toast("Account created successfully.");

  }

  else if(type === "forgot"){

    const email =
      document.getElementById("forgotEmail").value.trim();

    if(!email){

      toast("Enter your email first.");

      return;
    }

    state.authView = "reset";

    render();

    toast(
      "Reset link simulated. Set a new password here."
    );

  }

  else if(type === "reset"){

    const p =
      document.getElementById("resetPassword").value;

    const c =
      document.getElementById("resetConfirm").value;

    if(p !== c){

      toast("Passwords do not match.");

      return;
    }

    if(p.length < 6){

      toast(
        "Password must be at least 6 characters."
      );

      return;
    }

    state.authView = "login";

    render();

    toast("Password updated successfully.");

  }
}

function content(){

  if(state.page === "home")
    return home();

  if(state.page === "motorcycle")
    return motorcycle();

  if(state.page === "appointments")
    return appointmentPage();

  if(state.page === "history")
    return historyPage();

  if(state.page === "recommendations")
    return recommendationPage();

  if(state.page === "chat")
    return chatPage();

  if(state.page === "account")
    return accountPage();

  return home();
}

function pageHead(title,desc,actions=""){

  return `
    <div class="page-head">

      <div>
        <h1>${title}</h1>
        <p>${desc}</p>
      </div>

      <div class="actions">
        ${actions}
      </div>

    </div>
  `;
}

function home(){

  const b = bike();

  return pageHead(
    `Good afternoon, ${esc(state.account.name.split(" ")[0])} 👋`,
    `Here's what your motorcycle needs today.`,
    `
      <button
        class="btn"
        data-action="go"
        data-page="history"
      >
        View Service History
      </button>

      <button
        class="btn primary"
        data-action="go"
        data-page="chat"
      >
        Ask MotoCare AI
      </button>
    `
  )

  + `

  <div class="hero-bike">

    <div>

      <h2>
        ${esc(b.brand)} ${esc(b.model)}
      </h2>

      <p>
        ${b.year} · ${esc(b.plate)} · ${esc(b.mileage)}
      </p>

      <div>
        ${badge("Healthy")}

        <span class="small-text muted">
          Last service: ${esc(b.lastService)}
        </span>
      </div>

      <div class="kpi-row">

        <div class="kpi">
          <label>Next maintenance</label>
          <strong>${esc(b.nextService)}</strong>
        </div>

        <div class="kpi">
          <label>Recommended at</label>
          <strong>${esc(b.nextDue)}</strong>
        </div>

        <div class="kpi">
          <label>Service visits</label>
          <strong>${history.length} this year</strong>
        </div>

      </div>

    </div>

    <div class="bike-visual">
      🏍️
    </div>

  </div>

  <div style="margin-top:18px">

    <div class="alert warning">

      <div>

        <strong>Maintenance reminder</strong>

        <p>
          Your ${esc(b.brand)} ${esc(b.model)}
          is approaching its next recommended service point.
        </p>

      </div>

      <button
        class="btn primary small"
        data-action="book"
        data-service="CVT Inspection"
      >
        Schedule Service
      </button>

    </div>

  </div>

  <div class="grid-2" style="margin-top:18px">

    <div class="card panel">

      <div class="panel-head">

        <h2>AI Recommendation</h2>

        <button
          class="link-btn"
          data-action="go"
          data-page="recommendations"
        >
          View all
        </button>

      </div>

      <div class="service-card">

        <span class="reason">
          Based on mileage & service history
        </span>

        <h3 style="margin-top:10px">
          CVT Inspection
        </h3>

        <p>
          Your motorcycle is at ${esc(b.mileage)}.
          MotoCare AI recommends checking the CVT
          before your next major service interval.
        </p>

        <div class="service-meta">

          <strong class="service-price">
            From ₱500
          </strong>

          <button
            class="btn primary small"
            data-action="book"
            data-service="CVT Inspection"
          >
            Book
          </button>

        </div>

      </div>

    </div>

    <div class="card panel">

      <div class="panel-head">

        <h2>Next Appointment</h2>

        <button
          class="link-btn"
          data-action="go"
          data-page="appointments"
        >
          View all
        </button>

      </div>

      ${
        appointments[0]
          ? `
            <div class="list-row">

              <div class="person">

                <div class="mini-avatar">
                  ◷
                </div>

                <div>

                  <strong>
                    ${esc(appointments[0].service)}
                  </strong>

                  <span>
                    ${esc(appointments[0].date)}
                    ·
                    ${esc(appointments[0].time)}
                  </span>

                </div>

              </div>

              ${badge(appointments[0].status)}

            </div>
          `
          : `
            <div class="empty">
              No upcoming appointments.
            </div>
          `
      }

      <button
        class="btn"
        style="margin-top:10px"
        data-action="book"
        data-service="General Checkup"
      >
        Book another service
      </button>

    </div>

  </div>

  <div
    class="card panel"
    style="margin-top:18px"
  >

    <div class="panel-head">

      <h2>Recent Service</h2>

      <button
        class="link-btn"
        data-action="go"
        data-page="history"
      >
        View history
      </button>

    </div>

    ${
      history
        .slice(0,2)
        .map(h => `
          <div class="list-row">

            <div>

              <strong>
                ${esc(h.service)}
              </strong>

              <div class="small-text muted">
                ${esc(h.date)} · ${esc(h.mechanic)}
              </div>

            </div>

            <strong>
              ${esc(h.cost)}
            </strong>

          </div>
        `)
        .join("")
    }

  </div>

  `;
}

function motorcycle(){

  const b = bike();

  return pageHead(
    "My Motorcycle",
    "Your motorcycle profile, mileage, and maintenance information.",
    `
      <button
        class="btn"
        data-action="add-bike"
      >
        + Add Motorcycle
      </button>

      <button
        class="btn primary"
        data-action="book"
        data-service="General Checkup"
      >
        Book Service
      </button>
    `
  )

  + `

  <div class="detail-grid">

    <div class="card panel">

      <div class="panel-head">
        <h2>Motorcycle Profile</h2>
      </div>

      <div
        class="bike-visual"
        style="min-height:190px;margin-bottom:15px"
      >
        🏍️
      </div>

      <div class="info-list">

        ${info("Brand",b.brand)}
        ${info("Model",b.model)}
        ${info("Year",b.year)}
        ${info("Plate",b.plate)}
        ${info("Engine",b.engine)}
        ${info("Color",b.color)}
        ${info("Current Mileage",b.mileage)}
        ${info("Status",badge(b.status))}

      </div>

    </div>

    <div>

      <div class="card panel">

        <div class="panel-head">

          <h2>Maintenance Status</h2>

          ${badge("Due Soon")}

        </div>

        <div class="alert warning">

          <div>

            <strong>
              ${esc(b.nextService)}
            </strong>

            <p>
              Recommended around ${esc(b.nextDue)}.
              Your current mileage is ${esc(b.mileage)}.
            </p>

          </div>

          <button
            class="btn primary small"
            data-action="book"
            data-service="${esc(b.nextService)}"
          >
            Book
          </button>

        </div>

        <div style="margin-top:16px">

          <div class="small-text muted">
            Maintenance progress
          </div>

          <div class="progress">

            <div class="step done">
              <div class="step-dot"></div>
              Last Service
            </div>

            <div class="step current">
              <div class="step-dot"></div>
              Approaching
            </div>

            <div class="step">
              <div class="step-dot"></div>
              Next PMS
            </div>

          </div>

        </div>

      </div>

      <div
        class="card panel"
        style="margin-top:18px"
      >

        <div class="panel-head">

          <h2>AI Maintenance Insight</h2>

          <button
            class="link-btn"
            data-action="go"
            data-page="chat"
          >
            Ask AI
          </button>

        </div>

        <p
          class="small-text"
          style="line-height:1.6;margin:0"
        >
          Based on your current mileage and recent
          service history, MotoCare AI recommends
          checking the CVT and brakes before the next
          full maintenance interval.
        </p>

      </div>

      <div
        class="card panel"
        style="margin-top:18px"
      >

        <div class="panel-head">

          <h2>Your Motorcycles</h2>

          <span class="small-text muted">
            ${bikes.length} registered
          </span>

        </div>

        ${
          bikes.map(x => `
            <div class="list-row">

              <div>

                <strong>
                  ${esc(x.brand)} ${esc(x.model)}
                </strong>

                <div class="small-text muted">
                  ${esc(x.plate)} · ${esc(x.mileage)}
                </div>

              </div>

              ${
                x.id === currentBikeId
                  ? badge("Current")
                  : `
                    <button
                      class="link-btn"
                      data-action="select-bike"
                      data-id="${x.id}"
                    >
                      Use this
                    </button>
                  `
              }

            </div>
          `).join("")
        }

      </div>

    </div>

  </div>

  `;
}

function appointmentPage(){

  return pageHead(
    "Appointments",
    "Schedule and track your motorcycle service appointments.",
    `
      <button
        class="btn primary"
        data-action="book"
        data-service="General Checkup"
      >
        + Book Appointment
      </button>
    `
  )

  + `

  <div class="card panel">

    <div class="panel-head">

      <h2>Upcoming & Recent Appointments</h2>

      <span class="small-text muted">
        ${appointments.length} records
      </span>

    </div>

    <div class="table-wrap">

      <table class="table">

        <thead>
          <tr>
            <th>Appointment</th>
            <th>Date & Time</th>
            <th>Service</th>
            <th>Mechanic</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${
            appointments.length
              ? appointments.map(a => `
                <tr>

                  <td>
                    <strong>${esc(a.id)}</strong>
                  </td>

                  <td>
                    ${esc(a.date)}
                    <br>
                    <span class="small-text muted">
                      ${esc(a.time)}
                    </span>
                  </td>

                  <td>
                    ${esc(a.service)}
                  </td>

                  <td>
                    ${esc(a.mechanic)}
                  </td>

                  <td>
                    ${badge(a.status)}
                  </td>

                  <td>

                    <button
                      class="link-btn"
                      data-action="appointment-detail"
                      data-id="${a.id}"
                    >
                      View
                    </button>

                  </td>

                </tr>
              `).join("")
              : `
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      No appointments yet.
                    </div>
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

    </div>

  </div>

  `;
}

function historyPage(){

  return pageHead(
    "Service History",
    "Review your motorcycle's completed services and maintenance records."
  )

  + `

  <div class="card panel">

    <div class="panel-head">

      <h2>Service Records</h2>

      <span class="small-text muted">
        ${history.length} records
      </span>

    </div>

    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>
            <th>Date</th>
            <th>Service</th>
            <th>Mechanic</th>
            <th>Cost</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>

          ${
            history.length
              ? history.map(h => `
                <tr>

                  <td>${esc(h.date)}</td>

                  <td>
                    <strong>${esc(h.service)}</strong>
                  </td>

                  <td>${esc(h.mechanic)}</td>

                  <td>${esc(h.cost)}</td>

                  <td>${badge(h.status)}</td>

                </tr>
              `).join("")
              : `
                <tr>
                  <td colspan="5">
                    <div class="empty">
                      No service history available.
                    </div>
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

    </div>

  </div>

  `;
}

function recommendationPage(){

  const b = bike();

  return pageHead(
    "Maintenance & AI",
    "Personalized service recommendations based on your motorcycle.",
    `
      <button
        class="btn primary"
        data-action="go"
        data-page="chat"
      >
        Ask MotoCare AI
      </button>
    `
  )

  + `

  <div class="alert info">

    <div>

      <strong>
        Personalized for your ${esc(b.brand)} ${esc(b.model)}
      </strong>

      <p>
        Current mileage: ${esc(b.mileage)}.
        Recommendations are based on your motorcycle
        profile and service history.
      </p>

    </div>

  </div>

  <div class="grid-3" style="margin-top:18px">

    ${
      recommendations.map(r => `
        <div class="card panel">

          <div class="panel-head">

            <h2>${esc(r.name)}</h2>

            ${badge(r.urgency)}

          </div>

          <p>
            ${esc(r.reason)}
          </p>

          <div class="service-meta">

            <strong class="service-price">
              ${esc(r.price)}
            </strong>

            <button
              class="btn primary small"
              data-action="book"
              data-service="${esc(r.name)}"
            >
              Book
            </button>

          </div>

        </div>
      `).join("")
    }

  </div>

  <div
    class="card panel"
    style="margin-top:18px"
  >

    <div class="panel-head">

      <h2>Maintenance Reminders</h2>

      <span class="small-text muted">
        Automated
      </span>

    </div>

    <div class="list-row">

      <div>

        <strong>
          ${esc(b.nextService)}
        </strong>

        <div class="small-text muted">
          Recommended around ${esc(b.nextDue)}
        </div>

      </div>

      ${badge("Due Soon")}

    </div>

    <div class="list-row">

      <div>

        <strong>
          Brake Inspection
        </strong>

        <div class="small-text muted">
          Suggested during your next service visit
        </div>

      </div>

      ${badge("Suggested")}

    </div>

  </div>

  `;
}

function chatPage(){

  const b = bike();

  return pageHead(
    "MotoCare AI Assistant",
    "Ask questions about maintenance, services, symptoms, or booking an appointment.",
    `
      <button
        class="btn"
        data-action="clear-chat"
      >
        Clear Chat
      </button>
    `
  )

  + `

  <div class="grid-2">

    <div class="card panel">

      <div class="chat">

        <div
          class="chat-messages"
          id="chatMessages"
        >

          ${
            state.chat.map(m => `
              <div class="msg ${m.role}">

                <small>
                  ${m.role === "ai" ? "MotoCare AI" : "You"}
                </small>

                ${esc(m.text)}

              </div>
            `).join("")
          }

        </div>

        <div>

          <div class="chat-input">

            <input
              id="chatInput"
              class="input"
              placeholder="Ask something about your motorcycle..."
            >

            <button
              class="btn primary"
              data-action="send-chat"
            >
              Send
            </button>

          </div>

          <div class="prompt-row">

            <button
              class="prompt"
              data-action="prompt"
              data-text="What maintenance does my motorcycle need?"
            >
              What maintenance do I need?
            </button>

            <button
              class="prompt"
              data-action="prompt"
              data-text="What is a CVT inspection?"
            >
              What is a CVT inspection?
            </button>

            <button
              class="prompt"
              data-action="prompt"
              data-text="I hear a strange sound when accelerating."
            >
              Strange sound when accelerating
            </button>

            <button
              class="prompt"
              data-action="prompt"
              data-text="I want to book my recommended service."
            >
              Book my recommended service
            </button>

          </div>

        </div>

      </div>

    </div>

    <div>

      <div class="card panel">

        <div class="panel-head">
          <h2>Your Motorcycle</h2>
        </div>

        <div class="list-row">

          <div>

            <strong>
              ${esc(b.brand)} ${esc(b.model)}
            </strong>

            <div class="small-text muted">
              ${esc(b.mileage)} · ${esc(b.plate)}
            </div>

          </div>

          ${badge("Healthy")}

        </div>

        <div class="list-row">

          <span>Next recommendation</span>

          <strong>
            ${esc(b.nextService)}
          </strong>

        </div>

        <div class="list-row">

          <span>Last service</span>

          <span class="small-text muted">
            ${esc(b.lastService)}
          </span>

        </div>

      </div>

      <div
        class="card panel"
        style="margin-top:18px"
      >

        <div class="panel-head">

          <h2>AI can help you with</h2>

        </div>

        <div class="list">

          <div class="list-row">
            <span>Maintenance questions</span>
            <span>✓</span>
          </div>

          <div class="list-row">
            <span>Service explanations</span>
            <span>✓</span>
          </div>

          <div class="list-row">
            <span>Personalized recommendations</span>
            <span>✓</span>
          </div>

          <div class="list-row">
            <span>Appointment booking</span>
            <span>✓</span>
          </div>

        </div>

      </div>

    </div>

  </div>

  `;
}

function accountPage(){

  return pageHead(
    "My Account",
    "Manage your customer profile and account security.",
    `
      <button
        class="btn"
        data-action="logout"
      >
        Log Out
      </button>
    `
  )

  + `

  <div class="grid-2">

    <div class="card panel">

      <div class="panel-head">
        <h2>Profile</h2>
      </div>

      <div class="mc-account-profile">

        <div class="mc-account-avatar">
          ${initials(state.account.name)}
        </div>

        <div>

          <h3>
            ${esc(state.account.name)}
          </h3>

          <p class="small-text muted">
            Customer account
          </p>

        </div>

      </div>

      <div class="info-list">

        ${info("Email",esc(state.account.email))}

        ${info(
          "Phone",
          esc(state.account.phone || "Not provided")
        )}

      </div>

      <div class="form-actions">

        <button
          class="btn primary"
          data-action="edit-profile"
        >
          Edit Profile
        </button>

      </div>

    </div>

    <div class="card panel">

      <div class="panel-head">
        <h2>Account Security</h2>
      </div>

      <p
        class="small-text"
        style="line-height:1.6"
      >
        Keep your customer account details up to date.
        Password changes are simulated locally for this
        prototype.
      </p>

      <div class="form-actions">

        <button
          class="btn"
          data-action="change-password"
        >
          Change Password
        </button>

        <button
          class="btn"
          data-action="forgot-from-account"
        >
          Reset Password
        </button>

      </div>

    </div>

  </div>

  `;
}

function profileMenu(){

  return `
    <div class="mc-profile-menu">

      <div class="mc-profile-menu-head">

        <div class="mc-profile-menu-avatar">
          ${initials(state.account.name)}
        </div>

        <div>

          <strong>
            ${esc(state.account.name)}
          </strong>

          <div class="small-text muted">
            ${esc(state.account.email)}
          </div>

        </div>

      </div>

      <div class="mc-profile-divider"></div>

      <button data-action="account">
        My Account
      </button>

      <button data-action="notifications">
        Notifications
        ${
          unreadCount()
            ? `<span class="small-text muted">
                (${unreadCount()})
              </span>`
            : ""
        }
      </button>

      <button data-action="change-password">
        Change Password
      </button>

      <div class="mc-profile-divider"></div>

      <button data-action="logout">
        Log Out
      </button>

    </div>
  `;
}

function notificationPanel(){

  return `
    <div class="mc-notification-panel">

      <div class="mc-notification-head">

        <strong>Notifications</strong>

        <button
          class="link-btn"
          data-action="mark-notifications"
        >
          Mark all read
        </button>

      </div>

      ${
        state.notifications.length

          ? state.notifications.map(n => `
            <button
              class="mc-notification-item ${n.read ? '' : 'unread'}"
              data-action="read-notification"
              data-id="${n.id}"
            >

              <div>

                <strong>
                  ${esc(n.title)}
                </strong>

                <p>
                  ${esc(n.text)}
                </p>

                <span>
                  ${esc(n.time)}
                </span>

              </div>

            </button>
          `).join("")

          : `
            <div class="empty">
              No notifications.
            </div>
          `
      }

    </div>
  `;
}

function unreadCount(){
  return state.notifications.filter(n => !n.read).length;
}

function info(label,value){

  return `
    <div class="info-item">

      <label>${label}</label>

      <strong>${value}</strong>

    </div>
  `;
}

function modalMarkup(){

  if(state.modal.type === "booking"){

    return `
      <div class="modal">

        <div class="modal-head">

          <h3>
            Book a Service Appointment
          </h3>

          <button
            class="close"
            data-action="close-modal"
          >
            ×
          </button>

        </div>

        <div class="modal-body">

          <div
            class="alert info"
            style="margin-bottom:16px"
          >

            <div>

              <strong>
                ${esc(state.modal.service)}
              </strong>

              <p>
                For ${esc(bike().brand)}
                ${esc(bike().model)}
                · ${esc(bike().plate)}
              </p>

            </div>

          </div>

          <div class="form-grid">

            <div class="field">

              <label>Service</label>

              <select
                class="select"
                id="bookService"
              >

                ${
                  [
                    "General Checkup",
                    "Preventive Maintenance Service",
                    "CVT Inspection",
                    "Brake Inspection",
                    "Chain Adjustment",
                    "Engine Repair / Tune-up",
                    "Electrical Inspection",
                    "Suspension Inspection",
                    "Motorcycle Detailing"
                  ]
                  .map(x => `
                    <option
                      ${x === state.modal.service ? 'selected' : ''}
                    >
                      ${x}
                    </option>
                  `)
                  .join("")
                }

              </select>

            </div>

            <div class="field">

              <label>Preferred Date</label>

              <input
                class="input"
                id="bookDate"
                type="date"
                value="2026-10-02"
              >

            </div>

            <div class="field">

              <label>Preferred Time</label>

              <select
                class="select"
                id="bookTime"
              >

                <option>9:00 AM</option>
                <option>10:00 AM</option>
                <option>1:00 PM</option>
                <option>2:30 PM</option>
                <option>4:00 PM</option>

              </select>

            </div>

            <div class="field">

              <label>Preferred Branch</label>

              <select class="select">

                <option>MotoCare Main Branch</option>
                <option>MotoCare East Branch</option>

              </select>

            </div>

            <div class="field full">

              <label>Notes / Concern</label>

              <textarea
                class="textarea"
                id="bookNotes"
                rows="3"
                placeholder="Tell the service team anything they should know..."
              ></textarea>

            </div>

          </div>

          <div class="form-actions">

            <button
              class="btn"
              data-action="close-modal"
            >
              Cancel
            </button>

            <button
              class="btn primary"
              data-action="confirm-book"
            >
              Request Appointment
            </button>

          </div>

        </div>

      </div>
    `;
  }

  if(state.modal.type === "appointment"){

    const a = appointments.find(
      x => x.id === state.modal.id
    );

    if(!a) return "";

    return `
      <div class="modal">

        <div class="modal-head">

          <h3>Appointment Details</h3>

          <button
            class="close"
            data-action="close-modal"
          >
            ×
          </button>

        </div>

        <div class="modal-body">

          <div class="info-list">

            ${info("Appointment ID",esc(a.id))}
            ${info("Service",esc(a.service))}
            ${info("Date",esc(a.date))}
            ${info("Time",esc(a.time))}
            ${info("Mechanic",esc(a.mechanic))}
            ${info("Status",badge(a.status))}

          </div>

          <div class="form-actions">

            <button
              class="btn"
              data-action="close-modal"
            >
              Close
            </button>

            ${
              a.status !== "Completed" &&
              a.status !== "Cancelled"

                ? `
                  <button
                    class="btn"
                    data-action="cancel-appointment"
                    data-id="${a.id}"
                  >
                    Cancel Appointment
                  </button>
                `
                : ""
            }

          </div>

        </div>

      </div>
    `;
  }

  if(state.modal.type === "add-bike"){

    return `
      <div class="modal">

        <div class="modal-head">

          <h3>Add Motorcycle</h3>

          <button
            class="close"
            data-action="close-modal"
          >
            ×
          </button>

        </div>

        <div class="modal-body">

          <div class="form-grid">

            <div class="field">
              <label>Brand</label>
              <input
                class="input"
                id="bikeBrand"
                placeholder="Honda"
                required
              >
            </div>

            <div class="field">
              <label>Model</label>
              <input
                class="input"
                id="bikeModel"
                placeholder="Click 125i"
                required
              >
            </div>

            <div class="field">
              <label>Year</label>
              <input
                class="input"
                id="bikeYear"
                type="number"
                value="2024"
              >
            </div>

            <div class="field">
              <label>Plate</label>
              <input
                class="input"
                id="bikePlate"
                placeholder="ABC 1234"
              >
            </div>

            <div class="field">
              <label>Engine</label>
              <input
                class="input"
                id="bikeEngine"
                placeholder="125cc"
              >
            </div>

            <div class="field">
              <label>Color</label>
              <input
                class="input"
                id="bikeColor"
                placeholder="Black"
              >
            </div>

            <div class="field">
              <label>Current Mileage</label>
              <input
                class="input"
                id="bikeMileage"
                placeholder="0 km"
              >
            </div>

            <div class="field">
              <label>Chassis Number</label>
              <input
                class="input"
                id="bikeChassis"
                placeholder="Optional"
              >
            </div>

          </div>

          <div class="form-actions">

            <button
              class="btn"
              data-action="close-modal"
            >
              Cancel
            </button>

            <button
              class="btn primary"
              data-action="save-bike"
            >
              Add Motorcycle
            </button>

          </div>

        </div>

      </div>
    `;
  }

  if(state.modal.type === "edit-profile"){

    return `
      <div class="modal">

        <div class="modal-head">

          <h3>Edit Profile</h3>

          <button
            class="close"
            data-action="close-modal"
          >
            ×
          </button>

        </div>

        <div class="modal-body">

          <div class="field">

            <label>Full Name</label>

            <input
              class="input"
              id="profileName"
              value="${esc(state.account.name)}"
            >

          </div>

          <div class="field">

            <label>Email</label>

            <input
              class="input"
              id="profileEmail"
              type="email"
              value="${esc(state.account.email)}"
            >

          </div>

          <div class="field">

            <label>Phone</label>

            <input
              class="input"
              id="profilePhone"
              value="${esc(state.account.phone)}"
            >

          </div>

          <div class="form-actions">

            <button
              class="btn"
              data-action="close-modal"
            >
              Cancel
            </button>

            <button
              class="btn primary"
              data-action="save-profile"
            >
              Save Changes
            </button>

          </div>

        </div>

      </div>
    `;
  }

  if(state.modal.type === "change-password"){

    return `
      <div class="modal">

        <div class="modal-head">

          <h3>Change Password</h3>

          <button
            class="close"
            data-action="close-modal"
          >
            ×
          </button>

        </div>

        <div class="modal-body">

          <div class="field">

            <label>Current Password</label>

            <input
              class="input"
              id="currentPassword"
              type="password"
            >

          </div>

          <div class="field">

            <label>New Password</label>

            <input
              class="input"
              id="newPassword"
              type="password"
            >

          </div>

          <div class="field">

            <label>Confirm New Password</label>

            <input
              class="input"
              id="confirmNewPassword"
              type="password"
            >

          </div>

          <div class="form-actions">

            <button
              class="btn"
              data-action="close-modal"
            >
              Cancel
            </button>

            <button
              class="btn primary"
              data-action="save-password"
            >
              Update Password
            </button>

          </div>

        </div>

      </div>
    `;
  }

  return "";
}

function openBooking(service){

  state.modal = {
    type:"booking",
    service:service || "General Checkup"
  };

  state.showProfileMenu = false;
  state.notificationsOpen = false;

  render();
}

function toast(msg){

  const t = document.getElementById("toast");

  if(!t) return;

  t.textContent = msg;

  t.classList.add("show");

  setTimeout(
    () => t.classList.remove("show"),
    2200
  );
}

function aiReply(text){

  const q = text.toLowerCase();

  if(
    q.includes("book") ||
    q.includes("appointment")
  ){
    return "Sure. Your current AI recommendation is a CVT Inspection. I can open the appointment form so you can choose a date and time.";
  }

  if(q.includes("cvt")){

    return "A CVT inspection checks the continuously variable transmission system, including components such as the belt and related parts. A mechanic can confirm whether anything needs service or replacement.";

  }

  if(
    q.includes("sound") ||
    q.includes("noise")
  ){

    return "A strange sound can have several causes depending on when it happens. Avoid guessing from the sound alone. I recommend describing when it occurs and having a mechanic inspect the motorcycle. I can help you book an appointment.";

  }

  if(
    q.includes("maintenance") ||
    q.includes("service")
  ){

    return `For your ${bike().brand} ${bike().model} at ${bike().mileage}, MotoCare AI currently recommends ${bike().nextService}. Your recent service history also makes a routine brake inspection reasonable.`;

  }

  return "I can help with maintenance reminders, service explanations, common motorcycle concerns, recommendations, and appointment booking. What would you like to check?";
}

function sendChat(text){

  if(!text.trim()) return;

  state.chat.push({
    role:"user",
    text
  });

  state.chat.push({
    role:"ai",
    text:aiReply(text)
  });

  render();

  setTimeout(() => {

    const box =
      document.getElementById("chatMessages");

    if(box)
      box.scrollTop = box.scrollHeight;

  },0);
}

function bind(){

  bindAuth();

  document
    .querySelectorAll("[data-action]")
    .forEach(el => {

      el.addEventListener("click", () => {

        const a = el.dataset.action;

        if(a === "go"){

          state.page = el.dataset.page;
          state.mobile = false;
          state.showProfileMenu = false;
          state.notificationsOpen = false;

          render();

        }

        else if(a === "menu"){

          state.mobile = !state.mobile;

          render();

        }

        else if(a === "book"){

          openBooking(el.dataset.service);

        }

        else if(a === "close-modal"){

          state.modal = null;

          render();

        }

        else if(a === "confirm-book"){

          const service =
            document.getElementById("bookService").value;

          const date =
            document.getElementById("bookDate").value;

          const time =
            document.getElementById("bookTime").value;

          const notes =
            document.getElementById("bookNotes").value;

          const formatted = date
            ? new Date(date + "T00:00:00")
                .toLocaleDateString(
                  "en-US",
                  {
                    month:"short",
                    day:"2-digit",
                    year:"numeric"
                  }
                )
            : "Requested date";

          const id =
            "APT-" +
            Math.floor(
              1050 + Math.random() * 90
            );

          appointments.unshift({
            id,
            date:formatted,
            time,
            service,
            status:"Pending Confirmation",
            mechanic:"To be assigned",
            notes
          });

          state.notifications.unshift({
            id:Date.now(),
            title:"Appointment request submitted",
            text:`${service} request for ${formatted} at ${time}.`,
            time:"Just now",
            read:false
          });

          saveNotifications();

          state.modal = null;
          state.page = "appointments";

          render();

          toast(
            "Appointment request submitted."
          );
        }

        else if(a === "appointment-detail"){

          state.modal = {
            type:"appointment",
            id:el.dataset.id
          };

          render();

        }

        else if(a === "cancel-appointment"){

          if(
            !confirm(
              "Cancel this appointment?"
            )
          ) return;

          const ap =
            appointments.find(
              x => x.id === el.dataset.id
            );

          if(ap)
            ap.status = "Cancelled";

          state.modal = null;

          state.notifications.unshift({
            id:Date.now(),
            title:"Appointment cancelled",
            text:`${ap?.service || "Your appointment"} was cancelled.`,
            time:"Just now",
            read:false
          });

          saveNotifications();

          render();

          toast(
            "Appointment cancelled."
          );
        }

        else if(a === "notifications"){

          state.showProfileMenu = false;
          state.notificationsOpen =
            !state.notificationsOpen;

          render();

        }

        else if(a === "profile-menu"){

          state.notificationsOpen = false;
          state.showProfileMenu =
            !state.showProfileMenu;

          render();

        }

        else if(a === "account"){

          state.page = "account";
          state.showProfileMenu = false;
          state.notificationsOpen = false;

          render();

        }

        else if(a === "logout"){

          logout();

        }

        else if(a === "change-password"){

          state.showProfileMenu = false;
          state.notificationsOpen = false;

          state.modal = {
            type:"change-password"
          };

          render();

        }

        else if(a === "edit-profile"){

          state.modal = {
            type:"edit-profile"
          };

          render();

        }

        else if(a === "save-profile"){

          saveProfile();

        }

        else if(a === "save-password"){

          savePassword();

        }

        else if(a === "forgot-from-account"){

          state.authenticated = false;
          state.authView = "forgot";
          state.modal = null;

          localStorage.removeItem(
            "motocare_customer_session"
          );

          render();

        }

        else if(a === "auth-view"){

          state.authView = el.dataset.view;

          render();

        }

        else if(a === "mark-notifications"){

          state.notifications.forEach(
            n => n.read = true
          );

          saveNotifications();

          render();

          toast(
            "Notifications marked as read."
          );

        }

        else if(a === "read-notification"){

          const n =
            state.notifications.find(
              x =>
                String(x.id) ===
                String(el.dataset.id)
            );

          if(n)
            n.read = true;

          saveNotifications();

          state.notificationsOpen = true;

          render();

        }

        else if(a === "add-bike"){

          state.modal = {
            type:"add-bike"
          };

          render();

        }

        else if(a === "save-bike"){

          saveBike();

        }

        else if(a === "select-bike"){

          currentBikeId = el.dataset.id;

          localStorage.setItem(
            "motocare_current_bike",
            currentBikeId
          );

          render();

          toast(
            "Motorcycle selected."
          );

        }

        else if(a === "prompt"){

          sendChat(el.dataset.text);

        }

        else if(a === "send-chat"){

          const input =
            document.getElementById("chatInput");

          if(input)
            sendChat(input.value);

        }

        else if(a === "clear-chat"){

          state.chat = [
            {
              role:"ai",
              text:"Hi! I'm MotoCare AI. How can I help with your motorcycle today?"
            }
          ];

          render();

        }

      });

    });

  const input =
    document.getElementById("chatInput");

  if(input){

    input.addEventListener(
      "keydown",
      e => {

        if(e.key === "Enter")
          sendChat(input.value);

      }
    );

  }
}

function logout(){

  if(
    !confirm(
      "Log out of your MotoCare customer account?"
    )
  ) return;

  state.authenticated = false;
  state.authView = "login";
  state.showProfileMenu = false;
  state.notificationsOpen = false;
  state.page = "home";
  state.modal = null;

  localStorage.removeItem(
    "motocare_customer_session"
  );

  render();

  toast(
    "You have been logged out."
  );
}

function saveProfile(){

  const name =
    document.getElementById("profileName")
      .value.trim();

  const email =
    document.getElementById("profileEmail")
      .value.trim();

  const phone =
    document.getElementById("profilePhone")
      .value.trim();

  if(!name || !email){

    toast(
      "Name and email are required."
    );

    return;
  }

  state.account = {
    ...state.account,
    name,
    email,
    phone
  };

  saveAccount();

  state.modal = null;

  render();

  toast(
    "Profile updated successfully."
  );
}

function savePassword(){

  const current =
    document.getElementById("currentPassword")
      .value;

  const next =
    document.getElementById("newPassword")
      .value;

  const confirmNext =
    document.getElementById("confirmNewPassword")
      .value;

  if(current !== "customer123"){

    toast(
      "Current password is incorrect for this prototype."
    );

    return;
  }

  if(next.length < 6){

    toast(
      "New password must be at least 6 characters."
    );

    return;
  }

  if(next !== confirmNext){

    toast(
      "New passwords do not match."
    );

    return;
  }

  state.modal = null;

  render();

  toast(
    "Password changed successfully."
  );
}

function saveBike(){

  const brand =
    document.getElementById("bikeBrand")
      .value.trim();

  const model =
    document.getElementById("bikeModel")
      .value.trim();

  if(!brand || !model){

    toast(
      "Brand and model are required."
    );

    return;
  }

  const newBike = {

    id:"BIKE-" + Date.now(),

    brand,

    model,

    year:
      Number(
        document.getElementById("bikeYear").value
      ) || 2024,

    plate:
      document.getElementById("bikePlate")
        .value.trim() || "Not provided",

    mileage:
      document.getElementById("bikeMileage")
        .value.trim() || "0 km",

    lastService:"No service recorded",

    nextService:"General Checkup",

    nextDue:"Based on mileage",

    engine:
      document.getElementById("bikeEngine")
        .value.trim() || "Not provided",

    color:
      document.getElementById("bikeColor")
        .value.trim() || "Not provided",

    chassis:
      document.getElementById("bikeChassis")
        .value.trim() || "Not provided",

    status:"Healthy"

  };

  bikes.push(newBike);

  saveBikes();

  currentBikeId = newBike.id;

  localStorage.setItem(
    "motocare_current_bike",
    currentBikeId
  );

  state.modal = null;

  render();

  toast(
    "Motorcycle added successfully."
  );
}

render();
