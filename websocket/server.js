const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Redis client for pub/sub
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

const redisSubscriber = redisClient.duplicate();

// Connect to Redis
(async () => {
  await redisClient.connect();
  await redisSubscriber.connect();
  console.log('Connected to Redis');

  // Subscribe to Redis channels
  await redisSubscriber.subscribe('workflow-complete', (message) => {
    console.log('Workflow complete:', message);
    io.emit('workflow-status', {
      type: 'workflow-complete',
      data: JSON.parse(message),
      timestamp: new Date().toISOString()
    });
  });

  await redisSubscriber.subscribe('meeting-updated', (message) => {
    console.log('Meeting updated:', message);
    io.emit('meeting-updated', JSON.parse(message));
  });

  await redisSubscriber.subscribe('proposal-generated', (message) => {
    console.log('Proposal generated:', message);
    io.emit('proposal-generated', JSON.parse(message));
  });
})();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial connection confirmation
  socket.emit('connected', {
    message: 'Connected to WebSocket server',
    timestamp: new Date().toISOString()
  });

  // Handle custom messages from clients
  socket.on('message', async (data) => {
    console.log('Received message:', data);

    // Broadcast to all clients except sender
    socket.broadcast.emit('message', {
      ...data,
      senderId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Store important messages in Redis
    if (data.persist) {
      await redisClient.set(
        `message:${socket.id}:${Date.now()}`,
        JSON.stringify(data),
        { EX: 3600 } // Expire after 1 hour
      );
    }
  });

  // Handle workflow trigger requests
  socket.on('trigger-workflow', async (data) => {
    console.log('Workflow trigger requested:', data);

    // Publish to Redis for N8N to pick up
    await redisClient.publish('workflow-trigger', JSON.stringify({
      workflow: data.workflow,
      params: data.params,
      requestedBy: socket.id,
      timestamp: new Date().toISOString()
    }));

    socket.emit('workflow-triggered', {
      message: 'Workflow trigger request sent',
      workflow: data.workflow
    });
  });

  // Handle meeting status updates
  socket.on('update-meeting', async (data) => {
    console.log('Meeting update requested:', data);

    // Broadcast to all clients
    io.emit('meeting-updated', {
      meetingId: data.meetingId,
      updates: data.updates,
      updatedBy: socket.id,
      timestamp: new Date().toISOString()
    });

    // Publish to Redis
    await redisClient.publish('meeting-updated', JSON.stringify(data));
  });

  // Handle room joining for specific meeting updates
  socket.on('join-meeting-room', (meetingId) => {
    socket.join(`meeting:${meetingId}`);
    console.log(`Socket ${socket.id} joined room: meeting:${meetingId}`);
  });

  socket.on('leave-meeting-room', (meetingId) => {
    socket.leave(`meeting:${meetingId}`);
    console.log(`Socket ${socket.id} left room: meeting:${meetingId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: io.engine.clientsCount,
    redis: redisClient.isReady,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const metrics = {
    connections: io.engine.clientsCount,
    rooms: io.sockets.adapter.rooms.size,
    redisInfo: await redisClient.info(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  res.json(metrics);
});

// Start the server
const PORT = process.env.WEBSOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');

  io.close(() => {
    console.log('WebSocket server closed');
  });

  await redisClient.quit();
  await redisSubscriber.quit();

  process.exit(0);
});