import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from './models/usermodel.js';
import { Message } from './models/message.js';

// Complete CustomWebSocket interface with all required properties and methods
interface CustomWebSocket extends WebSocket {
  // Custom properties
  userId?: string;
  username?: string;
  isAlive?: boolean;
  pingInterval?: NodeJS.Timeout;
  timeout?: NodeJS.Timeout;

  // WebSocket methods we explicitly use
  send(data: string): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(data?: any): void;
  
  // Event handlers
  on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'message', listener: (data: Buffer) => void): this;
  on(event: 'pong', listener: () => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
}

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({
    server,
    verifyClient: (info: { req: IncomingMessage }, done: (result: boolean, code?: number, message?: string) => void) => {
      try {
        if (!info.req.url || !info.req.headers.host) {
          return done(false, 400, 'Bad request');
        }

        const url = new URL(`ws://${info.req.headers.host}${info.req.url}`);
        const token = url.searchParams.get('token') || 
                     info.req.headers.cookie?.split(';')
                       .find((c: string) => c.trim().startsWith('authToken='))
                       ?.split('=')[1];

        if (!token) {
          return done(false, 401, 'Authentication token required');
        }

        jwt.verify(token, process.env.JWTPRIVATEKEY!, (err: Error | null, decoded: unknown) => {
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

  // Heartbeat interval (30 seconds)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client: WebSocket) => {
      const ws = client as CustomWebSocket;
      if (!ws.isAlive) {
        console.log('Terminating inactive connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (connection: WebSocket, req: IncomingMessage) => {
    const ws = connection as CustomWebSocket;
    ws.isAlive = true;

    if (!req.url || !req.headers.host) {
      return ws.close(4000, 'Invalid request');
    }

    // Extract token from URL or cookies
    const url = new URL(`ws://${req.headers.host}${req.url}`);
    const token = url.searchParams.get('token') || 
                 req.headers.cookie?.split(';')
                   .find((c: string) => c.trim().startsWith('authToken='))
                   ?.split('=')[1];

    try {
      const decoded = jwt.verify(token!, process.env.JWTPRIVATEKEY!) as JwtPayload & { 
        _id: string; 
        firstName: string; 
        lastName: string 
      };
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
    ws.on('message', async (data: Buffer) => {
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
          wss.clients.forEach((client: WebSocket) => {
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
      const clients = Array.from(wss.clients) as CustomWebSocket[];
      const onlineUsers = await Promise.all(
        clients
          .filter((client) => client.userId)
          .map(async (client) => {
            const user = await User.findById(client.userId);
            return {
              userId: client.userId,
              username: client.username,
              avatarLink: user?.avatarLink
            };
          })
      );

      clients.forEach((client) => {
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
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Cleanup on server close
  server.on('close', () => {
    clearInterval(heartbeatInterval);
    wss.clients.forEach((client: WebSocket) => client.close());
    wss.close();
  });

  return wss;
};