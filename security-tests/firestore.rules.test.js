const fs = require("fs");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");

const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} = require("firebase/firestore");

const ADMIN_UID = "LUUDVDjFWAdNv7fptJ58ITVFmui2";
const PROJECT_ID = "demo-css-pms-security-test";

async function main() {
  const rules = fs.readFileSync("../firestore.rules", "utf8");

  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: "127.0.0.1",
      port: 8080
    }
  });

  let failures = 0;

  async function test(name, operation) {
    try {
      await operation();
      console.log("PASS:", name);
    } catch (error) {
      failures++;
      console.error("FAIL:", name);
      console.error(error.message);
    }
  }

  try {
    const future = Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    const past = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, "users/student-active"), {
        displayName: "Active Student",
        email: "active@example.com",
        subscriptionStatus: "active",
        subscriptionExpiry: future
      });

      await setDoc(doc(db, "users/student-pending"), {
        displayName: "Pending Student",
        email: "pending@example.com",
        subscriptionStatus: "pending"
      });

      await setDoc(doc(db, "users/student-expired"), {
        displayName: "Expired Student",
        email: "expired@example.com",
        subscriptionStatus: "active",
        subscriptionExpiry: past
      });

      await setDoc(doc(db, "articles/article-1"), {
        title: "Test CSS PMS Article"
      });
    });

    const anonymous = env.unauthenticatedContext().firestore();
    const active = env.authenticatedContext("student-active").firestore();
    const pending = env.authenticatedContext("student-pending").firestore();
    const expired = env.authenticatedContext("student-expired").firestore();
    const admin = env.authenticatedContext(ADMIN_UID).firestore();

    await test("Anonymous visitor cannot read articles", () =>
      assertFails(getDoc(doc(anonymous, "articles/article-1")))
    );

    await test("Pending student cannot read articles", () =>
      assertFails(getDoc(doc(pending, "articles/article-1")))
    );

    await test("Expired student cannot read articles", () =>
      assertFails(getDoc(doc(expired, "articles/article-1")))
    );

    await test("Active student can read articles", () =>
      assertSucceeds(getDoc(doc(active, "articles/article-1")))
    );

    await test("Administrator can read articles", () =>
      assertSucceeds(getDoc(doc(admin, "articles/article-1")))
    );

    await test("Student cannot publish or modify shared articles", () =>
      assertFails(
        setDoc(doc(active, "articles/unauthorized"), {
          title: "Unauthorized article"
        })
      )
    );

    await test("Administrator can publish articles", () =>
      assertSucceeds(
        setDoc(doc(admin, "articles/admin-test"), {
          title: "Administrator article"
        })
      )
    );

    await test("Active student can save personal progress", () =>
      assertSucceeds(
        setDoc(doc(active, "users/student-active/progress/article-1"), {
          status: "Reading",
          note: "My private note"
        })
      )
    );

    await test("Active student cannot access another student's progress", () =>
      assertFails(
        getDoc(doc(active, "users/student-pending/progress/article-1"))
      )
    );

    await test("Pending student cannot save study progress", () =>
      assertFails(
        setDoc(doc(pending, "users/student-pending/progress/article-1"), {
          status: "Reading"
        })
      )
    );

    await test("Student cannot approve their own subscription", () =>
      assertFails(
        updateDoc(doc(active, "users/student-active"), {
          subscriptionStatus: "pending",
          subscriptionExpiry: Timestamp.fromDate(
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          )
        })
      )
    );

    await test("Student can submit a pending payment reference", () =>
      assertSucceeds(
        setDoc(doc(active, "paymentRequests/test-payment"), {
          userId: "student-active",
          amount: 500,
          method: "easypaisa_jazzcash",
          transactionReference: "TEST123456",
          status: "pending",
          createdAt: serverTimestamp()
        })
      )
    );

    await test("Student cannot submit an already approved payment", () =>
      assertFails(
        setDoc(doc(active, "paymentRequests/fake-approved"), {
          userId: "student-active",
          amount: 500,
          method: "easypaisa_jazzcash",
          transactionReference: "TEST654321",
          status: "approved",
          createdAt: serverTimestamp()
        })
      )
    );


    await test("Student can register their own profile", () =>
      assertSucceeds(
        setDoc(
          doc(env.authenticatedContext("new-student", {
            email: "new@example.com"
          }).firestore(), "users/new-student"),
          {
            displayName: "New Student",
            email: "new@example.com",
            createdAt: serverTimestamp()
          }
        )
      )
    );

    await test("Student cannot register another user's profile", () =>
      assertFails(
        setDoc(doc(active, "users/another-student"), {
          displayName: "Another Student",
          email: "another@example.com",
          createdAt: serverTimestamp()
        })
      )
    );

    await test("Student cannot change their registered email", () =>
      assertFails(
        updateDoc(doc(active, "users/student-active"), {
          email: "changed@example.com"
        })
      )
    );

    await test("Student cannot activate their own subscription", () =>
      assertFails(
        updateDoc(doc(pending, "users/student-pending"), {
          subscriptionStatus: "active",
          subscriptionExpiry: future
        })
      )
    );

    await test("Active student can save their own custom article", () =>
      assertSucceeds(
        setDoc(doc(active, "users/student-active/customArticles/my-article"), {
          title: "My CSS PMS Article",
          content: "Personal study material"
        })
      )
    );

    await test("Student cannot access another student's custom articles", () =>
      assertFails(
        getDoc(doc(active, "users/student-pending/customArticles/my-article"))
      )
    );

    await test("Student cannot read another student's payment request", () =>
      assertFails(
        getDoc(doc(pending, "paymentRequests/test-payment"))
      )
    );

  } finally {
    await env.cleanup();
  }

  console.log("");
  console.log("Security test failures:", failures);

  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log("All security tests passed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
