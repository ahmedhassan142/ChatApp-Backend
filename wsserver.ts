import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from './models/usermodel.js';
import { Message } from './models/message.js';

interface CustomWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  isAlive?: boolean;
  pingInterval?: NodeJS.Timeout;
  timeout?: NodeJS.Timeout;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, listener: (...args: any[]) => void): this;
  ping(data?: any): void;
  terminate(): void;
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
                       .find(c => c.trim().startsWith('authToken='))
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

  wss.on('connection', (connection: WebSocket, req: IncomingMessage) => {
    const ws = connection as CustomWebSocket;
    ws.isAlive = true;

    if (!req.url || !req.headers.host) {
      return ws.close(4000, 'Invalid request');
    }

    const url = new URL(`ws://${req.headers.host}${req.url}`);
    const token = url.searchParams.get('token') || 
                 req.headers.cookie?.split(';')
                   .find(c => c.trim().startsWith('authToken='))
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

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: string | Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'ping') {
          return ws.send(JSON.stringify({ type: 'pong' }));
        }

        if (message.recipient && message.text) {
          const msgDoc = await Message.create({
            sender: ws.userId,
            recipient: message.recipient,
            text: message.text
          });

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

    const notifyOnlineUsers = async () => {
      const clients = Array.from(wss.clients) as CustomWebSocket[];
      const onlineUsers = await Promise.all(
        clients
          .filter(client => client.userId)
          .map(async (client) => {
            const user = await User.findById(client.userId);
            return {
              userId: client.userId,
              username: client.username,
              avatarLink: user?.avatarLink
            };
          })
      );

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            online: onlineUsers.filter(user => user !== null)
          }));
        }
      });
    };

    notifyOnlineUsers();

    ws.on('close', () => {
      notifyOnlineUsers();
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.on('close', () => {
    clearInterval(heartbeatInterval);
    wss.clients.forEach(client => client.close());
    wss.close();
  });

  return wss;
};