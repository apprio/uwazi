import Joi from 'joi';

import { validateRequest } from 'api/utils';
import needsAuthorization from '../auth/authMiddleware';
import users from './users';

const getDomain = req => `${req.protocol}://${req.get('host')}`;
export default (app) => {
  app.post(
    '/api/users',

    needsAuthorization(['admin', 'editor']),

    validateRequest(Joi.object().keys({
      _id: Joi.string().required(),
      __v: Joi.number(),
      username: Joi.string(),
      email: Joi.string(),
      password: Joi.string(),
      role: Joi.string().valid('admin', 'editor')
    }).required()),

    (req, res, next) => {
      users.save(req.body, req.user, getDomain(req))
      .then(response => res.json(response))
      .catch(next);
    });

  app.post('/api/users/new',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      username: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string(),
      role: Joi.string().valid('admin', 'editor').required()
    }).required()),
    (req, res, next) => {
      users.newUser(req.body, getDomain(req))
      .then(response => res.json(response))
      .catch(next);
    });

  app.post(
    '/api/recoverpassword',
    validateRequest(Joi.object().keys({
      email: Joi.string().required(),
    }).required()),
    (req, res, next) => {
      users.recoverPassword(req.body.email, getDomain(req))
      .then(() => res.json('OK'))
      .catch(next);
    }
  );

  app.post('/api/resetpassword',
    validateRequest(Joi.object().keys({
      key: Joi.string().required(),
      password: Joi.string().required(),
    }).required()),
    (req, res, next) => {
      users.resetPassword(req.body)
      .then(response => res.json(response))
      .catch(next);
    }
  );

  app.get('/api/users', needsAuthorization(), (req, res, next) => {
    users.get()
    .then(response => res.json(response))
    .catch(next);
  });

  app.delete('/api/users',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      _id: Joi.string().required()
    }).required(), 'query'),
    (req, res, next) => {
      users.delete(req.query._id, req.user)
      .then(response => res.json(response))
      .catch(next);
    }
  );
};
