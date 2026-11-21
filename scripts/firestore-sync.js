const admin = require("../functions/node_modules/firebase-admin");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "articles.json");
const COLLECTION = "articles";
const PROJECT_ID = "css-pms-student-platform";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID
});

const db = admin.firestore();

function loadLocalData() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  if (!data || !Array.isArray(data.articles)) {
    throw new Error("Invalid local articles.json structure.");
  }

  return data;
}

function validateArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error("Article collection is empty. Sync cancelled.");
  }

  const ids = new Set();

  for (const article of articles) {
    if (!article.id) {
      throw new Error("An article is missing its ID.");
    }

    if (ids.has(article.id)) {
      throw new Error("Duplicate article ID: " + article.id);
    }

    ids.add(article.id);
  }
}

async function pull() {
  const snapshot = await db.collection(COLLECTION).get();

  if (snapshot.empty) {
    throw new Error("Firestore is empty. Local data was not changed.");
  }

  const articles = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));

  validateArticles(articles);

  articles.sort((a, b) =>
    String(a.analysed_at || "").localeCompare(
      String(b.analysed_at || "")
    )
  );

  const dates = articles
    .map(a => a.analysed_at)
    .filter(Boolean)
    .sort();

  const data = {
    articles,
    last_updated: dates.length
      ? dates[dates.length - 1]
      : new Date().toISOString()
  };

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );

  console.log("Firestore pull completed.");
  console.log("Articles downloaded:", articles.length);
}

async function push() {
  const data = loadLocalData();
  const articles = data.articles;

  validateArticles(articles);

  const existing = await db.collection(COLLECTION).get();

  if (existing.empty) {
    throw new Error(
      "Firestore has no existing articles. Push cancelled for safety."
    );
  }

  let uploaded = 0;

  for (let i = 0; i < articles.length; i += 400) {
    const batch = db.batch();
    const chunk = articles.slice(i, i + 400);

    for (const article of chunk) {
      const ref = db.collection(COLLECTION).doc(article.id);
      batch.set(ref, article);
    }

    await batch.commit();
    uploaded += chunk.length;
  }

  const verified = await db.collection(COLLECTION).get();

  console.log("Firestore push completed.");
  console.log("Local articles:", articles.length);
  console.log("Firestore documents:", verified.size);
  console.log("Uploaded records:", uploaded);

  if (verified.size < articles.length) {
    throw new Error("Firestore verification failed.");
  }
}

async function main() {
  const operation = process.argv[2];

  if (operation === "pull") {
    await pull();
  } else if (operation === "push") {
    await push();
  } else {
    throw new Error("Usage: node firestore-sync.js pull|push");
  }
}

main()
  .catch(error => {
    console.error("Firestore sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await admin.app().delete();
  });
