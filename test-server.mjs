console.log('Starting test server...');

const app = (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is working!');
};

const port = process.env.PORT || 3000;
import { createServer } from 'http';

const server = createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`Test server listening on port ${port}`);
});
