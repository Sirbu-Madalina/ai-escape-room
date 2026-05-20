import { MongoClient } from "mongodb";

let clientPromise = null;
let dbInstance = null;
let indexesEnsured = false;

const getDatabaseName = () => process.env.MONGODB_DB_NAME || "ai_escape_room";

export const isMongoConfigured = () => Boolean(process.env.MONGODB_URI);

export const connectToMongo = async () => {
  if (!isMongoConfigured()) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  dbInstance = client.db(getDatabaseName());
  return dbInstance;
};

export const getSessionsCollection = async () => {
  const db = await connectToMongo();

  if (!db) {
    return null;
  }

  return db.collection("sessions");
};

export const ensureMongoIndexes = async () => {
  if (!isMongoConfigured() || indexesEnsured) {
    return;
  }

  const sessionsCollection = await getSessionsCollection();

  if (!sessionsCollection) {
    return;
  }

  await sessionsCollection.createIndex(
    { joinCode: 1 },
    {
      name: "joinCode_unique",
      unique: true,
    },
  );

  await sessionsCollection.createIndex(
    { expiresAt: 1 },
    {
      name: "expiresAt_ttl",
      expireAfterSeconds: 0,
    },
  );

  indexesEnsured = true;
};
