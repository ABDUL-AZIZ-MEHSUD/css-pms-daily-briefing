
(function () {
  "use strict";

  var ADMIN_UID = "LUUDVDjFWAdNv7fptJ58ITVFmui2";
  var db, auth;

  /* =========================
     VISUAL REDESIGN
  ========================= */

  function addDesign() {
    if (document.getElementById("css-pms-redesign")) return;

    var style = document.createElement("style");
    style.id = "css-pms-redesign";
    style.textContent = `
      :root {
        --brand: #173b63;
        --brand-dark: #102c49;
        --gold: #d6a64b;
        --ink: #263548;
        --muted: #718096;
        --surface: #ffffff;
        --background: #f3f6fa;
        --line: #e4eaf1;
        --success: #18845b;
        --danger: #c34b4b;
      }

      body {
        background: var(--background) !important;
        color: var(--ink);
        font-family: Inter, "Segoe UI", Arial, sans-serif !important;
      }

      #app {
        min-height: 100vh;
        padding: 24px;
        box-sizing: border-box;
      }

      #app h1 {
        color: var(--brand);
        font-size: 29px;
        font-weight: 800;
        letter-spacing: -.5px;
      }

      #app h2 {
        color: var(--brand);
        font-size: 20px;
        font-weight: 750;
      }

      #app p {
        line-height: 1.65;
      }

      #app .pane {
        background: var(--surface) !important;
        border: 1px solid var(--line) !important;
        border-radius: 15px !important;
        box-shadow: 0 5px 20px rgba(25, 50, 80, .055);
      }

      #app input,
      #app select,
      #app textarea {
        box-sizing: border-box;
        border: 1px solid #dce4ed !important;
        border-radius: 9px !important;
        background: #fff !important;
        color: var(--ink) !important;
        font: inherit;
        outline: none;
      }

      #app input:focus,
      #app select:focus,
      #app textarea:focus {
        border-color: var(--gold) !important;
        box-shadow: 0 0 0 3px rgba(214,166,75,.14);
      }

      #app button,
      #app .rb,
      #app .nb {
        border: 0;
        border-radius: 9px !important;
        padding: 10px 17px;
        background: var(--brand);
        color: white;
        font-weight: 700;
        cursor: pointer;
        transition: .18s ease;
      }

      #app button:hover,
      #app .rb:hover,
      #app .nb:hover {
        background: var(--brand-dark);
        transform: translateY(-1px);
      }

      #app button:disabled {
        opacity: .55;
        cursor: not-allowed;
        transform: none;
      }

      #app button[data-reject],
      #app button[data-suspend] {
        background: #fff0f0;
        color: var(--danger);
        border: 1px solid #f2d1d1;
      }

      #app button[data-trial],
      #app button[data-extend] {
        background: #eaf5ef;
        color: var(--success);
        border: 1px solid #d0e9da;
      }

      #app button[data-approve] {
        background: var(--success);
      }

      #app hr {
        border: 0;
        border-top: 1px solid var(--line);
        margin: 25px 0;
      }

                  /* Modern Institutional Login */

      body:has(.auth-shell) {
        margin: 0 !important;
        overflow: hidden !important;
        background: #eae8e0 !important;
      }

      #app:has(.auth-shell) {
        width: 100%;
        height: 100vh;
        height: 100dvh;
        min-height: 0;
        padding: 22px !important;
        display: grid;
        place-items: center;
        overflow: hidden;
        background:
          radial-gradient(ellipse at 12% 15%, rgba(184,149,82,.15), transparent 35%),
          linear-gradient(135deg, #f3f0e7, #e6e8e3);
      }

      .auth-shell {
        width: min(1120px, 100%);
        height: min(690px, calc(100dvh - 44px));
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 440px;
        overflow: hidden;
        border: 1px solid #ded6c5;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 24px 65px rgba(20,35,54,.15);
      }

      .auth-banner {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 48px;
        overflow: hidden;
        color: white;
        background:
          radial-gradient(ellipse at 75% 22%, rgba(184,149,82,.22), transparent 40%),
          linear-gradient(145deg, #1c3854, #10243c 75%);
        border-right: 4px solid #b89552;
      }

      .auth-banner::before {
        content: "";
        position: absolute;
        width: 390px;
        height: 390px;
        right: -100px;
        top: 95px;
        border: 1px solid rgba(215,190,137,.25);
        border-radius: 50%;
        box-shadow:
          0 0 0 25px rgba(215,190,137,.045),
          0 0 0 55px rgba(215,190,137,.035);
      }

      .auth-banner::after {
        content: "✦";
        position: absolute;
        right: 48px;
        top: 42px;
        color: #d8bd82;
        font-size: 28px;
      }

      .auth-brand {
        position: relative;
        z-index: 1;
      }

      .auth-tag {
        display: inline-block;
        padding: 8px 13px;
        color: #e8d5aa;
        border: 1px solid rgba(216,189,130,.5);
        border-radius: 3px;
        font-size: 12px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }

      .auth-banner h1 {
        max-width: 490px;
        margin: 30px 0 18px;
        color: #fff !important;
        font-family: Georgia, serif;
        font-size: clamp(34px, 4vw, 48px) !important;
        line-height: 1.12;
        font-weight: 500;
      }

      .auth-banner p {
        max-width: 420px;
        color: #d8e0e7 !important;
        line-height: 1.8;
        font-size: 15px;
      }

      .auth-motto {
        position: relative;
        z-index: 1;
        padding-top: 22px;
        border-top: 1px solid rgba(255,255,255,.18);
        color: #d8bd82;
        font-family: Georgia, serif;
        font-size: 14px;
        letter-spacing: .4px;
      }

      .auth-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        padding: 42px;
        overflow-y: auto;
        background: #fffefa;
        color: #243247;
      }

      .auth-content h2 {
        margin: 0 0 8px;
        color: #172f4b !important;
        font-family: Georgia, serif;
        font-size: 27px;
        font-weight: 500;
      }

      .auth-content p {
        color: #78808a;
        line-height: 1.6;
        font-size: 14px;
      }

      .auth-switch {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin: 24px 0 25px;
        padding: 5px;
        background: #f0eee7;
        border-radius: 8px;
      }

      .auth-switch button {
        min-height: 43px;
        margin: 0 !important;
        padding: 10px !important;
        background: transparent !important;
        color: #657080 !important;
        border: 1px solid transparent !important;
        border-radius: 6px !important;
        font-size: 14px;
        font-weight: 600;
      }

      .auth-switch button.active {
        background: #fff !important;
        color: #173451 !important;
        border-color: #e1d8c7 !important;
        box-shadow: 0 2px 7px rgba(20,35,54,.07);
      }

      .auth-form[hidden] {
        display: none !important;
      }

      .auth-content input {
        box-sizing: border-box;
        width: 100%;
        min-height: 49px;
        margin: 7px 0;
        padding: 13px 14px !important;
        background: #fff !important;
        color: #243247 !important;
        border: 1px solid #dcd9d0 !important;
        border-radius: 7px;
        font: inherit;
      }

      .auth-content input:focus {
        outline: 2px solid rgba(184,149,82,.25);
        border-color: #b89552 !important;
      }

      .auth-content .auth-submit {
        width: 100%;
        min-height: 49px;
        margin-top: 15px;
        padding: 13px !important;
        background: #173451 !important;
        color: #fff !important;
        border: 1px solid #173451 !important;
        border-radius: 7px;
        font-weight: 600;
        letter-spacing: .2px;
      }

      .auth-content .auth-submit:hover {
        background: #244968 !important;
      }

      .auth-content hr {
        display: none;
      }

      #authMessage {
        min-height: 20px;
        overflow-wrap: anywhere;
      }

      @media (max-width: 800px) {
        body:has(.auth-shell) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }

        #app:has(.auth-shell) {
          height: auto;
          min-height: 100vh;
          min-height: 100dvh;
          padding: 16px !important;
          display: block;
          overflow: visible;
        }

        .auth-shell {
          width: 100%;
          max-width: 500px;
          height: auto;
          min-height: 0;
          margin: 0 auto;
          grid-template-columns: 1fr;
          border-radius: 14px;
        }

        .auth-banner {
          min-height: 205px;
          padding: 25px 25px 22px;
          border-right: 0;
          border-bottom: 4px solid #b89552;
        }

        .auth-banner::before {
          width: 190px;
          height: 190px;
          right: -40px;
          top: 55px;
        }

        .auth-banner::after {
          right: 25px;
          top: 22px;
        }

        .auth-banner h1 {
          margin: 19px 0 9px;
          font-size: 30px !important;
        }

        .auth-banner p {
          margin: 5px 0;
          font-size: 13px;
        }

        .auth-motto {
          display: none;
        }

        .auth-content {
          padding: 25px 23px 28px;
          overflow: visible;
        }

        .auth-content h2 {
          font-size: 25px;
        }
      }

      @media (max-width: 380px) {
        #app:has(.auth-shell) {
          padding: 9px !important;
        }

        .auth-banner {
          padding: 22px 19px;
        }

        .auth-content {
          padding: 22px 17px;
        }
      }

      /* Payment page */

      .payment-shell {
        max-width: 720px;
        margin: 35px auto;
      }

      .payment-header {
        background: linear-gradient(135deg, #173b63, #285b83);
        color: white;
        border-radius: 17px;
        padding: 25px;
        margin-bottom: 20px;
      }

      .payment-header h1 {
        color: white !important;
        margin-top: 0;
      }

      .payment-card {
        padding: 27px;
      }

      .price-display {
        background: #f8f5ec;
        border: 1px solid #eee2c5;
        border-radius: 12px;
        padding: 17px;
        margin: 18px 0;
      }

      .price-display strong {
        color: var(--brand);
        font-size: 25px;
      }

      .payment-card input {
        width: 100%;
        padding: 13px !important;
        margin: 10px 0;
      }

      /* Administration dashboard */

      .admin-shell {
        max-width: 1200px;
        margin: 10px auto;
      }

      .admin-header {
        background: linear-gradient(120deg, #102c49, #285b83);
        color: white;
        padding: 26px 30px;
        border-radius: 17px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
      }

      .admin-header h1 {
        color: white !important;
        margin: 0 0 7px;
      }

      .admin-header p {
        color: #dce8f3;
        margin: 0;
      }

      .admin-header button {
        background: rgba(255,255,255,.15) !important;
        border: 1px solid rgba(255,255,255,.3) !important;
      }

      .admin-section {
        margin: 25px 0;
      }

      .admin-section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .admin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 15px;
      }

      .admin-card {
        padding: 20px !important;
        margin: 0 !important;
      }

      .admin-card strong {
        color: var(--brand);
      }

      .admin-card .admin-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 15px;
      }

      .admin-card .admin-actions button {
        font-size: 12px;
        padding: 9px 11px !important;
      }

      .admin-meta {
        color: var(--muted);
        font-size: 13px;
        overflow-wrap: anywhere;
      }

      .admin-status {
        display: inline-block;
        background: #eef3f8;
        color: var(--brand);
        border-radius: 30px;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 700;
        margin: 8px 0;
      }

      .admin-empty {
        padding: 22px;
        background: white;
        border: 1px dashed #cbd6e2;
        border-radius: 12px;
        color: var(--muted);
      }

      /* Existing student dashboard - Premium Academic */

      #app {
        --bg: #f7f5ef;
        --card: #ffffff;
        --ink: #243247;
        --mut: #687487;
        --g: #142b49;
        --acc: #b89552;
        --line: #e5e0d5;
        --chip: #f0eadc;
        --sh: 0 5px 20px rgba(20,43,73,.055);
        color: var(--ink);
      }

      #app .top {
        background: linear-gradient(125deg,#10233d,#1b3b60) !important;
        color: #fff !important;
        border-bottom: 3px solid #b89552 !important;
        border-radius: 0 0 16px 16px !important;
        box-shadow: 0 8px 24px rgba(16,35,61,.13) !important;
      }

      #app .top h1,
      #app .top h2,
      #app .top p {
        color: #fff !important;
      }

      #app .main {
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
        padding-top: 25px;
      }

      #app .st,
      #app .ac,
      #app .pane {
        border: 1px solid var(--line) !important;
        border-radius: 13px !important;
        box-shadow: var(--sh) !important;
      }

      #app .st,
      #app .ac,
      #app .pane {
        background: var(--card) !important;
      }

      #app .st b,
      #app .ac h3,
      #app .pane h2,
      #app .art h1 {
        color: #142b49 !important;
      }

      #app .ac {
        padding: 19px;
        transition: transform .18s ease, box-shadow .18s ease;
      }

      #app .ac:hover {
        transform: translateY(-2px);
        border-color: #c9b88f !important;
        box-shadow: 0 9px 25px rgba(20,43,73,.09) !important;
      }

      #app .nb.on,
      #app .fl button.on {
        background: #b89552 !important;
        color: #142b49 !important;
        border-color: #b89552 !important;
      }

      #app .rb,
      #app .quiz button {
        background: #142b49 !important;
        color: #fff !important;
        border-radius: 8px !important;
      }

      #app .rb:hover,
      #app .quiz button:hover {
        background: #203f64 !important;
      }

      #app .star {
        color: #b89552 !important;
      }

      #app .tb {
        background: #fff !important;
        border-bottom: 2px solid #b89552 !important;
      }

      #app .art h2 {
        color: #9b783c !important;
        border-color: #d8c69f !important;
      }

      #app .hl {
        background: #f1eadb !important;
        border-color: #b89552 !important;
      }

      #app .terms li {
        background: #f0eadc !important;
      }

      #app .reader,
      #app .reading,
      #app .article-reader {
        line-height: 1.8;
      }

      @media (max-width: 700px) {
        #app .main {
          padding: 15px 12px 60px;
        }

        #app .top {
          border-radius: 0 0 12px 12px !important;
        }

        #app .grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 700px) {
        #app {
          padding: 12px;
        }

        .auth-shell {
          grid-template-columns: 1fr;
          margin: 10px auto;
        }

        .auth-banner {
          padding: 25px;
        }

        .auth-content {
          padding: 22px;
        }

        .admin-header {
          align-items: flex-start;
          flex-direction: column;
          padding: 22px;
        }

        .admin-grid {
          grid-template-columns: 1fr;
        }

        .admin-card .admin-actions button {
          flex: 1 1 100%;
        }

        #app h1 {
          font-size: 24px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  addDesign();

  /* =========================
     FIREBASE INITIALISATION
  ========================= */

  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

  function el(html) {
    document.getElementById("app").innerHTML = html;
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }

  /* =========================
     LOGIN AND REGISTRATION
  ========================= */

  function gate(message) {
    el(
      '<div class="auth-shell">' +
        '<section class="auth-banner">' +
          '<div class="auth-brand">' +
            '<span class="auth-tag">CSS / PMS Preparation Platform</span>' +
            '<h1>CSS/PMS Daily Briefing</h1>' +
            '<p>Build knowledge. Strengthen analysis. Prepare with purpose.</p>' +
            '<p>Daily editorial insights and examination-focused resources for serious aspirants.</p>' +
          '</div>' +
          '<div class="auth-motto">A tradition of learning. A future of leadership.</div>' +
        '</section>' +
        '<section class="auth-content">' +
          '<h2 id="authHeading">Welcome Back</h2>' +
          '<p id="authIntro">Sign in to continue your preparation.</p>' +
          '<div class="auth-switch">' +
            '<button type="button" id="showLogin" class="active" aria-pressed="true">Sign In</button>' +
            '<button type="button" id="showRegister" aria-pressed="false">New Registration</button>' +
          '</div>' +
          '<form id="loginForm" class="auth-form">' +
            '<input id="loginEmail" type="email" required autocomplete="email" placeholder="Email address">' +
            '<input id="loginPassword" type="password" required autocomplete="current-password" placeholder="Password">' +
            '<button class="auth-submit" type="submit">Sign in to your account</button>' +
          '</form>' +
          '<form id="registerForm" class="auth-form" hidden>' +
            '<input id="regName" required maxlength="80" autocomplete="name" placeholder="Full name">' +
            '<input id="regEmail" type="email" required autocomplete="email" placeholder="Email address">' +
            '<input id="regPassword" type="password" required minlength="6" autocomplete="new-password" placeholder="Password (at least 6 characters)">' +
            '<button class="auth-submit" type="submit">Create student account</button>' +
          '</form>' +
          '<p id="authMessage" role="status" aria-live="polite"></p>' +
        '</section>' +
      '</div>'
    );    document.getElementById("loginForm").onsubmit = function (e) {
      e.preventDefault();

      auth.signInWithEmailAndPassword(
        document.getElementById("loginEmail").value.trim(),
        document.getElementById("loginPassword").value
      ).catch(showError);
    };

    document.getElementById("registerForm").onsubmit = function (e) {
      e.preventDefault();

      var name = document.getElementById("regName").value.trim();
      var email = document.getElementById("regEmail").value.trim();
      var password = document.getElementById("regPassword").value;

      auth.createUserWithEmailAndPassword(email, password)
        .then(function (cred) {
          return db.collection("users").doc(cred.user.uid).set({
            displayName: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .catch(showError);
    };

    var loginTab = document.getElementById("showLogin");
    var registerTab = document.getElementById("showRegister");
    var loginForm = document.getElementById("loginForm");
    var registerForm = document.getElementById("registerForm");
    var heading = document.getElementById("authHeading");
    var intro = document.getElementById("authIntro");

    function showAuthForm(mode) {
      var registering = mode === "register";

      loginForm.hidden = registering;
      registerForm.hidden = !registering;

      loginTab.classList.toggle("active", !registering);
      registerTab.classList.toggle("active", registering);

      loginTab.setAttribute("aria-pressed", String(!registering));
      registerTab.setAttribute("aria-pressed", String(registering));

      heading.textContent = registering ? "Create Your Account" : "Welcome Back";
      intro.textContent = registering
        ? "Register to begin your preparation."
        : "Sign in to continue your preparation.";
    }

    loginTab.onclick = function () {
      showAuthForm("login");
    };

    registerTab.onclick = function () {
      showAuthForm("register");
    };
  }

  function showError(error) {
    var m = document.getElementById("authMessage");

    if (m) {
      m.textContent = error.message || "An error occurred.";
    } else {
      alert(error.message || "An error occurred.");
    }
  }

  /* =========================
     PAYMENT AND SUBSCRIPTION
  ========================= */

  function paymentView(user, profile) {
    el(
      '<div class="payment-shell">' +
        '<div class="payment-header">' +
          '<h1>CSS/PMS Daily Briefing</h1>' +
          '<p>Student subscription portal</p>' +
          '<p>Signed in as <b>' + esc(user.email) + '</b></p>' +
        '</div>' +
        '<div class="pane payment-card">' +
          '<h2>Subscription Required</h2>' +
          '<p>Your account does not currently have an active subscription.</p>' +
          '<div class="price-display">' +
            '<p>Student subscription</p>' +
            '<strong>PKR 500</strong>' +
            '<p>30 days of access</p>' +
          '</div>' +
          '<p><b>Payment methods:</b> Easypaisa or JazzCash</p>' +
          '<p>Make your payment using the payment details provided by the platform administrator. Then submit your transaction reference below.</p>' +
          '<form id="paymentForm">' +
            '<input id="paymentRef" required minlength="4" maxlength="100" placeholder="Transaction reference / ID">' +
            '<button type="submit">Submit payment reference</button>' +
          '</form>' +
          '<p id="paymentMessage" role="status"></p>' +
          '<hr>' +
          '<p>Free two-day trials are available only when granted by the administrator.</p>' +
          '<button id="logoutButton">Sign out</button>' +
        '</div>' +
      '</div>'
    );

    document.getElementById("paymentForm").onsubmit = function (e) {
      e.preventDefault();

      var ref = document.getElementById("paymentRef").value.trim();
      var message = document.getElementById("paymentMessage");

      db.collection("paymentRequests").add({
        userId: user.uid,
        amount: 500,
        method: "easypaisa_jazzcash",
        transactionReference: ref,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        message.textContent =
          "Your payment reference has been submitted for admin verification.";
      }).catch(function (err) {
        message.textContent = err.message;
      });
    };

    document.getElementById("logoutButton").onclick = function () {
      auth.signOut();
    };
  }

  /* =========================
     ADMIN DASHBOARD
  ========================= */

  function adminView(user) {
    el(
      '<div class="admin-shell">' +
        '<div class="admin-header">' +
          '<div>' +
            '<h1>Administration Dashboard</h1>' +
            '<p>CSS/PMS Daily Briefing | Administrator: ' + esc(user.email) + '</p>' +
          '</div>' +
          '<button id="adminLogout">Sign out</button>' +
        '</div>' +

        '<section class="admin-section">' +
          '<div class="admin-section-title"><h2>Pending Payment Requests</h2></div>' +
          '<div id="adminPayments" class="admin-grid">' +
            '<p>Loading payment requests...</p>' +
          '</div>' +
        '</section>' +

        '<section class="admin-section">' +
          '<div class="admin-section-title"><h2>Student Accounts</h2></div>' +
          '<div id="adminUsers" class="admin-grid">' +
            '<p>Loading student accounts...</p>' +
          '</div>' +
        '</section>' +
      '</div>'
    );

    document.getElementById("adminLogout").onclick = function () {
      auth.signOut();
    };

    Promise.all([
      db.collection("paymentRequests")
        .where("status", "==", "pending").get(),
      db.collection("users").get()
    ]).then(function (results) {
      var requests = results[0].docs;
      var users = results[1].docs;

      document.getElementById("adminPayments").innerHTML =
        requests.length
          ? requests.map(function (doc) {
              var p = doc.data();

              return (
                '<div class="pane admin-card">' +
                  '<strong>Payment request</strong>' +
                  '<p class="admin-meta">Student ID: ' + esc(p.userId) + '</p>' +
                  '<p><b>Amount:</b> PKR ' + esc(p.amount) + '</p>' +
                  '<p><b>Method:</b> ' + esc(p.method) + '</p>' +
                  '<p><b>Reference:</b> ' + esc(p.transactionReference) + '</p>' +
                  '<span class="admin-status">Pending verification</span>' +
                  '<div class="admin-actions">' +
                    '<button data-approve="' + esc(doc.id) + '" data-user="' + esc(p.userId) + '">Approve: 30 days</button>' +
                    '<button data-reject="' + esc(doc.id) + '">Reject</button>' +
                  '</div>' +
                '</div>'
              );
            }).join("")
          : '<div class="admin-empty">There are no pending payment requests.</div>';

      document.getElementById("adminUsers").innerHTML =
        users.map(function (doc) {
          var u = doc.data();

          var expiry = u.subscriptionExpiry && u.subscriptionExpiry.toDate
            ? u.subscriptionExpiry.toDate().toLocaleString()
            : "No expiry";

          var status = u.subscriptionStatus || "inactive";

          return (
            '<div class="pane admin-card">' +
              '<strong>' + esc(u.displayName || "Student") + '</strong>' +
              '<p class="admin-meta">' + esc(u.email) + '</p>' +
              '<span class="admin-status">' + esc(status) + '</span>' +
              '<p><b>Expiry:</b><br>' + esc(expiry) + '</p>' +
              '<div class="admin-actions">' +
                '<button data-trial="' + esc(doc.id) + '">Grant 2-day trial</button>' +
                '<button data-extend="' + esc(doc.id) + '">Renew 30 days</button>' +
                '<button data-suspend="' + esc(doc.id) + '">Suspend access</button>' +
              '</div>' +
            '</div>'
          );
        }).join("") || '<div class="admin-empty">No registered student accounts.</div>';

    }).catch(function (err) {
      alert("Admin data could not be loaded: " + err.message);
    });

    document.getElementById("app").addEventListener("click", function (e) {
      var b = e.target;

      if (!b || !b.dataset) return;

      if (b.dataset.approve) {
        if (!confirm("Approve this payment and grant 30 days?")) return;

        grant(b.dataset.user, 30).then(function () {
          return db.collection("paymentRequests")
            .doc(b.dataset.approve)
            .update({status:"approved"});
        }).then(function () {
          location.reload();
        }).catch(showError);
      }

      if (b.dataset.trial) {
        if (!confirm("Grant this student a 48-hour free trial?")) return;

        grant(b.dataset.trial, 2).then(function () {
          alert("48-hour trial granted.");
          location.reload();
        }).catch(showError);
      }

      if (b.dataset.extend) {
        if (!confirm("Grant 30 days from now?")) return;

        grant(b.dataset.extend, 30).then(function () {
          alert("30-day access granted.");
          location.reload();
        }).catch(showError);
      }

      if (b.dataset.suspend) {
        if (!confirm("Suspend this student's access?")) return;

        db.collection("users").doc(b.dataset.suspend).update({
          subscriptionStatus:"suspended"
        }).then(function () {
          location.reload();
        }).catch(showError);
      }

      if (b.dataset.reject) {
        if (!confirm("Reject this payment request?")) return;

        db.collection("paymentRequests")
          .doc(b.dataset.reject)
          .update({status:"rejected"})
          .then(function () {
            location.reload();
          }).catch(showError);
      }
    });
  }

  /* =========================
     SUBSCRIPTION GRANT
  ========================= */

  function grant(uid, days) {
    var expiry = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    );

    return db.collection("users").doc(uid).update({
      subscriptionStatus: "active",
      subscriptionExpiry: firebase.firestore.Timestamp.fromDate(expiry),
      subscriptionStartedAt: firebase.firestore.Timestamp.fromDate(new Date())
    });
  }

  /* =========================
     STUDENT ACCESS CONTROL
  ========================= */

  window.dashboardSignOut = function () {
    return auth.signOut();
  };

  window.loadArticlesFromFirestore = function () {
    return new Promise(function (resolve, reject) {
      var studentSubscription = null;
      auth.onAuthStateChanged(function (user) {
        if (!user) {
          gate();
          return;
        }

        var isAdmin = user.uid === ADMIN_UID;

        db.collection("users").doc(user.uid).get()
          .then(function (profileDoc) {
            if (isAdmin) {
              adminView(user);
              return null;
            }

            if (!profileDoc.exists) {
              return db.collection("users").doc(user.uid).set({
                displayName: user.displayName ||
                  (user.email ? user.email.split("@")[0] : "CSS/PMS Student"),
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              }).then(function () {
                return db.collection("users").doc(user.uid).get();
              });
            }

            return profileDoc;
          })
          .then(function (profileDoc) {
            if (!profileDoc) return null;

            var profile = profileDoc.data() || {};


            var expiry = profile.subscriptionExpiry &&
              profile.subscriptionExpiry.toDate
                ? profile.subscriptionExpiry.toDate()
                : null;

            studentSubscription = {
              status: profile.subscriptionStatus || "inactive",
              expiry: expiry ? expiry.toISOString() : null,
              startedAt: profile.subscriptionStartedAt &&
                profile.subscriptionStartedAt.toDate
                  ? profile.subscriptionStartedAt.toDate().toISOString()
                  : null
            };

            var active = profile.subscriptionStatus === "active" &&
              expiry && expiry.getTime() > Date.now();

            if (!active) {
              paymentView(user, profile);
              return null;
            }

            return db.collection("articles").get();
          })
          .then(function (snapshot) {
            if (!snapshot) return;

            var articles = snapshot.docs.map(function (doc) {
              var data = doc.data();
              data.id = doc.id;
              return data;
            });

            resolve({articles:articles,subscription:studentSubscription});
          })
          .catch(function (err) {
            reject(err);
          });
      });
    });
  };

})();
