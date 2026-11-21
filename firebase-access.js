(function () {
  "use strict";

  var ADMIN_UID = "LUUDVDjFWAdNv7fptJ58ITVFmui2";
  var db, auth, ready = false;

  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

  function el(html) {
    document.getElementById("app").innerHTML = html;
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function gate(message) {
    el('<div style="max-width:560px;margin:45px auto;padding:25px;font-family:Arial;color:var(--ink,#222)">' +
      '<h1>CSS/PMS Daily Briefing</h1>' +
      '<p>' + esc(message || "Sign in or register to continue.") + '</p>' +
      '<div class="pane" style="padding:20px">' +
      '<h2>Student login</h2>' +
      '<form id="loginForm">' +
      '<input id="loginEmail" type="email" required placeholder="Email address" style="width:100%;padding:12px;margin:6px 0">' +
      '<input id="loginPassword" type="password" required placeholder="Password" style="width:100%;padding:12px;margin:6px 0">' +
      '<button class="rb" style="padding:10px 18px">Sign in</button></form>' +
      '<hr><h2>New student registration</h2>' +
      '<form id="registerForm">' +
      '<input id="regName" required maxlength="80" placeholder="Full name" style="width:100%;padding:12px;margin:6px 0">' +
      '<input id="regEmail" type="email" required placeholder="Email address" style="width:100%;padding:12px;margin:6px 0">' +
      '<input id="regPassword" type="password" required minlength="6" placeholder="Password (at least 6 characters)" style="width:100%;padding:12px;margin:6px 0">' +
      '<button class="rb" style="padding:10px 18px">Register</button></form>' +
      '<p id="authMessage" role="status"></p></div></div>');

    document.getElementById("loginForm").onsubmit = function (e) {
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

      auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
        return db.collection("users").doc(cred.user.uid).set({
          displayName: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).catch(showError);
    };
  }

  function showError(error) {
    var m = document.getElementById("authMessage");
    if (m) m.textContent = error.message || "An error occurred.";
    else alert(error.message || "An error occurred.");
  }

  function paymentView(user, profile) {
    el('<div style="max-width:650px;margin:45px auto;padding:25px;font-family:Arial">' +
      '<h1>CSS/PMS Daily Briefing</h1>' +
      '<p>Signed in as <b>' + esc(user.email) + '</b></p>' +
      '<div class="pane" style="padding:20px">' +
      '<h2>Subscription required</h2>' +
      '<p>Your account does not currently have an active subscription.</p>' +
      '<p><b>Subscription:</b> PKR 500 for 30 days</p>' +
      '<p><b>Payment method:</b> Easypaisa or JazzCash</p>' +
      '<p>Make your payment using the payment details provided by the platform administrator. Then submit your transaction reference below.</p>' +
      '<form id="paymentForm">' +
      '<input id="paymentRef" required minlength="4" maxlength="100" placeholder="Transaction reference / ID" style="width:100%;padding:12px;margin:8px 0">' +
      '<button class="rb" style="padding:10px 18px">Submit payment reference</button></form>' +
      '<p id="paymentMessage"></p>' +
      '<p>Free two-day trials are available only when granted by the administrator.</p>' +
      '<button id="logoutButton">Sign out</button></div></div>');

    document.getElementById("paymentForm").onsubmit = function (e) {
      e.preventDefault();
      var ref = document.getElementById("paymentRef").value.trim();
      db.collection("paymentRequests").add({
        userId: user.uid,
        amount: 500,
        method: "easypaisa_jazzcash",
        transactionReference: ref,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        document.getElementById("paymentMessage").textContent =
          "Your payment reference has been submitted for admin verification.";
      }).catch(function (err) {
        document.getElementById("paymentMessage").textContent = err.message;
      });
    };

    document.getElementById("logoutButton").onclick = function () {
      auth.signOut();
    };
  }

  function adminView(user) {
    el('<div style="max-width:900px;margin:35px auto;padding:20px;font-family:Arial">' +
      '<h1>CSS/PMS Administration</h1><p>Administrator: ' + esc(user.email) + '</p>' +
      '<button id="adminLogout">Sign out</button>' +
      '<h2>Pending payment requests</h2><div id="adminPayments">Loading...</div>' +
      '<h2>Student accounts</h2><div id="adminUsers">Loading...</div></div>');

    document.getElementById("adminLogout").onclick = function () {
      auth.signOut();
    };

    Promise.all([
      db.collection("paymentRequests").where("status", "==", "pending").get(),
      db.collection("users").get()
    ]).then(function (results) {
      var requests = results[0].docs;
      var users = results[1].docs;

      document.getElementById("adminPayments").innerHTML = requests.length
        ? requests.map(function (doc) {
            var p = doc.data();
            return '<div class="pane" style="padding:12px;margin:8px 0">' +
              '<b>' + esc(p.userId) + '</b><br>Amount: PKR ' + esc(p.amount) +
              '<br>Method: ' + esc(p.method) +
              '<br>Reference: ' + esc(p.transactionReference) +
              '<br><button data-approve="' + esc(doc.id) + '" data-user="' + esc(p.userId) + '">Approve: 30 days</button>' +
              '<button data-reject="' + esc(doc.id) + '">Reject</button></div>';
          }).join("")
        : "<p>No pending payment requests.</p>";

      document.getElementById("adminUsers").innerHTML = users.map(function (doc) {
        var u = doc.data();
        var expiry = u.subscriptionExpiry && u.subscriptionExpiry.toDate
          ? u.subscriptionExpiry.toDate().toLocaleString()
          : "No expiry";
        return '<div class="pane" style="padding:12px;margin:8px 0">' +
          '<b>' + esc(u.displayName || "Student") + '</b> â€” ' + esc(u.email) +
          '<br>Status: ' + esc(u.subscriptionStatus || "inactive") +
          '<br>Expiry: ' + esc(expiry) +
          '<br><button data-trial="' + esc(doc.id) + '">Grant 2-day free trial</button>' +
          '<button data-extend="' + esc(doc.id) + '">Renew for 30 days</button>' +
          '<button data-suspend="' + esc(doc.id) + '">Suspend access</button></div>';
      }).join("") || "<p>No registered students.</p>";
    }).catch(function (err) {
      alert("Admin data could not be loaded: " + err.message);
    });

    document.getElementById("app").addEventListener("click", function (e) {
      var b = e.target;
      if (b.dataset.approve) {
        if (!confirm("Approve this payment and grant 30 days?")) return;
        grant(b.dataset.user, 30).then(function () {
          return db.collection("paymentRequests").doc(b.dataset.approve)
            .update({status:"approved"});
        }).then(function () { location.reload(); }).catch(showError);
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
        }).then(function () { location.reload(); }).catch(showError);
      }
      if (b.dataset.reject) {
        db.collection("paymentRequests").doc(b.dataset.reject)
          .update({status:"rejected"}).then(function () {
            location.reload();
          }).catch(showError);
      }
    });
  }

  function grant(uid, days) {
    var expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return db.collection("users").doc(uid).update({
      subscriptionStatus: "active",
      subscriptionExpiry: firebase.firestore.Timestamp.fromDate(expiry)
    });
  }

  window.loadArticlesFromFirestore = function () {
    return new Promise(function (resolve, reject) {
      auth.onAuthStateChanged(function (user) {
        if (!user) {
          gate();
          return;
        }

        var isAdmin = user.uid === ADMIN_UID;
        db.collection("users").doc(user.uid).get().then(function (profileDoc) {
          if (isAdmin) {
            adminView(user);
            // Admin remains on the separate administration screen.
            return null;
          }

          if (!profileDoc.exists) {
            return db.collection("users").doc(user.uid).set({
              displayName: user.displayName || (user.email ? user.email.split("@")[0] : "CSS/PMS Student"),
              email: user.email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function () {
              return db.collection("users").doc(user.uid).get();
            });
          }

          return profileDoc;
        }).then(function (profileDoc) {
          if (!profileDoc) return null;

          var profile = profileDoc.data() || {};
          var expiry = profile.subscriptionExpiry &&
            profile.subscriptionExpiry.toDate
              ? profile.subscriptionExpiry.toDate()
              : null;

          var active = profile.subscriptionStatus === "active" &&
            expiry && expiry.getTime() > Date.now();

          if (!active) {
            paymentView(user, profile);
            return null;
          }

          return db.collection("articles").get();
        }).then(function (snapshot) {
          if (!snapshot) return;
          var articles = snapshot.docs.map(function (doc) {
            var data = doc.data();
            data.id = doc.id;
            return data;
          });
          ready = true;
          resolve({articles:articles});
        }).catch(function (err) {
          reject(err);
        });
      });
    });
  };
})();


