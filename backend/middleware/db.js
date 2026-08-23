/**
 * MongoDB Serverless Connection Handler
 * Compatible con Vercel, Netlify y otras plataformas serverless
 * 
 * Problema común: MongoDB connections no se cierran propertamente en serverless
 * Esto causa conexiones agotadas y errores ENOTFOUND
 */

let client = null;
let clientPromise = null;

if (process.env.MONGODB_URI) {
  // Usar URI directamente del entorno (Vercel, MongoDB Atlas, etc.)
  const mongoUrl = process.env.MONGODB_URI;
  
  if (process.env.NODE_ENV === "development") {
    // En desarrollo, globalThis mantiene el cliente across hot reloads
    if (!globalThis._mongoClientPromise) {
      client = new (require("mongodb").MongoClient)(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      globalThis._mongoClientPromise = client.connect();
    }
    clientPromise = globalThis._mongoClientPromise;
  } else {
    // En production, no usar globalThis pero sí cachear
    client = new (require("mongodb").MongoClient)(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    clientPromise = client.connect();
  }
} else {
  // Fallback: construir URI desde variables individuales
  const mongoHost = process.env.MONGO_HOST || "localhost";
  const mongoPort = process.env.MONGO_PORT || 27017;
  const mongoDBName = process.env.MONGO_DB_NAME || "lavanet_db";
  const mongoUser = process.env.MONGO_USER;
  const mongoPass = process.env.MONGO_PASS;
  
  let mongoUri;
  if (mongoUser && mongoPass) {
    mongoUri = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDBName}?authSource=admin`;
  } else {
    mongoUri = `mongodb://${mongoHost}:${mongoPort}/${mongoDBName}`;
  }
  
  if (process.env.NODE_ENV === "development") {
    if (!globalThis._mongoClientPromise) {
      client = new (require("mongodb").MongoClient)(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      globalThis._mongoClientPromise = client.connect();
    }
    clientPromise = globalThis._mongoClientPromise;
  } else {
    client = new (require("mongodb").MongoClient)(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    clientPromise = client.connect();
  }
}

module.exports = clientPromise;