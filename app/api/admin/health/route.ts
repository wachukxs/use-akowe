import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Try to connect to MongoDB
    await connectDB();
    
    const connectionTime = Date.now() - startTime;
    
    // Get connection status
    const connectionState = mongoose.connection.readyState;
    const stateNames = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    // Test a simple query
    const db = mongoose.connection.db;
    const adminDb = db?.admin();
    let serverStatus = null;
    
    try {
      if (adminDb) {
        serverStatus = await adminDb.ping();
      }
    } catch (pingError) {
      // Ping failed, but connection might still work
    }
    
    // Get database stats
    const dbName = mongoose.connection.name;
    const collections = await db?.listCollections().toArray() || [];
    
    return NextResponse.json({
      status: 'healthy',
      mongodb: {
        connected: connectionState === 1,
        state: stateNames[connectionState as keyof typeof stateNames] || 'unknown',
        connectionTime: `${connectionTime}ms`,
        database: dbName,
        collections: collections.length,
        ping: serverStatus ? 'ok' : 'failed',
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('ECONNREFUSED') || 
                              errorMessage.includes('MongoNetworkError') ||
                              errorMessage.includes('connect');
    
    return NextResponse.json({
      status: 'unhealthy',
      mongodb: {
        connected: false,
        state: 'disconnected',
        error: errorMessage,
        isConnectionError,
      },
      timestamp: new Date().toISOString(),
    }, { status: isConnectionError ? 503 : 500 });
  }
}

