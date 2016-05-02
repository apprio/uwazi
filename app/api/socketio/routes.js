import cookie from 'cookie';

export default (server, app) => {
  let io = require('socket.io')(server);

  app.use((req, res, next) => {
    req.io = io;

    Object.keys(io.sockets.connected).forEach((socketId) => {
      let socket = io.sockets.connected[socketId];
      let sessionId = cookie.parse(socket.handshake.headers.cookie)['connect.sid']
      .split('.')[0].split(':')[1];
      if (sessionId === req.session.id) {
        req.iosocket = socket;
      }
    });

    next();
  });
};
