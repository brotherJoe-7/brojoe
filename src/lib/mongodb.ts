// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cached = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export const isDBConfigured = () => {
  return (
    !!MONGODB_URI &&
    !MONGODB_URI.includes('<username>') &&
    !MONGODB_URI.includes('<password>') &&
    !MONGODB_URI.includes('cluster.mongodb.net')
  );
};

export async function connectDB() {
  if (!isDBConfigured()) {
    throw new Error('MongoDB not configured');
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
