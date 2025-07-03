import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { User } from './models/usermodel.js';
import { Message } from './models/message.js';

interface CustomWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  isAlive?: boolean;
  pingInterval?: NodeJS.Timeout;
  timeout?: NodeJS.Timeout;
}

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({
    server,
    verifyClient: (info, done) => {
      try {
        // Extract token from query parameters or cookies
        const url = new URL(`ws://${info.req.headers.host}${info.req.url}`);
        const token = url.searchParams.get('token') || 
                     info.req.headers.cookie?.split(';')
                       .find(c => c.trim().startsWith('authToken='))
                       ?.split('=')[1];

        if (!token) {
          return done(false, 401, 'Authentication token required');
        }

        // Verify token
        jwt.verify(token, process.env.JWTPRIVATEKEY!, (err, decoded) => {
          if (err) {
            console.error('Token verification failed:', err);
            return done(false, 403, 'Invalid token');
          }
          done(true);
        });
      } catch (error) {
        console.error('Client verification error:', error);
        done(false, 400, 'Bad request');
      }
    }
  });

  // Heartbeat interval (checks connection every 30 seconds)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as CustomWebSocket;
      if (!ws.isAlive) {
        console.log('Terminating inactive connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (connection: WebSocket, req) => {
    const ws = connection as CustomWebSocket;
    ws.isAlive = true;

    // Extract and verify token again for user data
    const url = new URL(`ws://${req.headers.host}${req.url}`);
    const token = url.searchParams.get('token') || 
                 req.headers.cookie?.split(';')
                   .find(c => c.trim().startsWith('authToken='))
                   ?.split('=')[1];

    try {
      const decoded = jwt.verify(token!, process.env.JWTPRIVATEKEY!) as any;
      ws.userId = decoded._id;
      ws.username = `${decoded.firstName} ${decoded.lastName}`;
    } catch (error) {
      console.error('Connection authentication failed:', error);
      return ws.close(4001, 'Authentication failed');
    }

    // Setup heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Message handler
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle ping messages
        if (message.type === 'ping') {
          return ws.send(JSON.stringify({ type: 'pong' }));
        }

        // Handle regular messages
        if (message.recipient && message.text) {
          const msgDoc = await Message.create({
            sender: ws.userId,
            recipient: message.recipient,
            text: message.text
          });

          // Broadcast to recipient
          wss.clients.forEach((client) => {
            const c = client as CustomWebSocket;
            if (c.userId === message.recipient && c.readyState === WebSocket.OPEN) {
              c.send(JSON.stringify({
                _id: msgDoc._id,
                sender: ws.userId,
                text: message.text,
                recipient: message.recipient,
                createdAt: msgDoc.createdAt
              }));
            }
          });
        }
      } catch (error) {
        console.error('Message handling error:', error);
      }
    });

    // Notify all clients about online users
    const notifyOnlineUsers = async () => {
      const onlineUsers = await Promise.all(
        Array.from(wss.clients)
          .filter(client => (client as CustomWebSocket).userId)
          .map(async (client) => {
            const wsClient = client as CustomWebSocket;
            const user = await User.findById(wsClient.userId);
            return {
              userId: wsClient.userId,
              username: wsClient.username,
              avatarLink: user?.avatarLink
            };
          })
      );

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            online: onlineUsers.filter(user => user !== null)
          }));
        }
      });
    };

    // Initial notification
    notifyOnlineUsers();

    // Cleanup on close
    ws.on('close', () => {
      notifyOnlineUsers();
    });

    // Error handling
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Cleanup on server close
  server.on('close', () => {
    clearInterval(heartbeatInterval);
    wss.clients.forEach(client => client.close());
    wss.close();
  });

  return wss;
};