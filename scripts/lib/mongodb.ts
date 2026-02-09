/**
 * MongoDB utility for scripts
 * Writes collected data to MongoDB Atlas alongside JSON files
 */
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

function buildUri(): string {
  const user = process.env.MONGO_USER || process.env.PUSER || process.env.puser || '';
  const pass = process.env.MONGO_PASS || process.env.PPASS || process.env.ppass || '';
  const uri = process.env.MONGO_URI || '';

  if (uri) return uri;
  if (user && pass) {
    return `mongodb+srv://${user}:${pass}@pricelist.qzaqcnd.mongodb.net/?appName=pricelist`;
  }
  return '';
}

export async function connectMongo(): Promise<Db | null> {
  if (db) return db;

  const uri = buildUri();
  if (!uri) {
    console.log('[MongoDB] No credentials found, skipping MongoDB writes');
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.MONGO_DATABASE || 'pricelist');
    console.log('[MongoDB] Connected to Atlas');
    return db;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    return null;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Disconnected');
  }
}

/**
 * Save vehicle data for a brand+date to MongoDB
 */
export async function saveVehicleToMongo(brandId: string, date: string, data: Record<string, unknown>): Promise<void> {
  const database = await connectMongo();
  if (!database) return;

  try {
    const collection = database.collection('vehicles');
    await collection.replaceOne(
      { brandId, date },
      { ...data, brandId, date },
      { upsert: true }
    );
    console.log(`  [MongoDB] Saved vehicles: ${brandId}/${date}`);
  } catch (err) {
    console.error(`  [MongoDB] Error saving vehicles ${brandId}/${date}:`, err);
  }
}

/**
 * Save a document to a named collection (upsert by date or generatedAt)
 */
export async function saveToMongo(collectionName: string, data: Record<string, unknown>): Promise<void> {
  const database = await connectMongo();
  if (!database) return;

  try {
    const collection = database.collection(collectionName);
    const date = data.date as string | undefined;
    const generatedAt = data.generatedAt as string | undefined;

    let filter: Record<string, string>;
    if (date) {
      filter = { date };
    } else if (generatedAt) {
      filter = { generatedAt };
    } else {
      await collection.insertOne(data);
      console.log(`  [MongoDB] Inserted to ${collectionName}`);
      return;
    }

    await collection.replaceOne(filter, data, { upsert: true });
    console.log(`  [MongoDB] Saved to ${collectionName}`);
  } catch (err) {
    console.error(`  [MongoDB] Error saving to ${collectionName}:`, err);
  }
}
