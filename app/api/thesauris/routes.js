import Joi from 'joi';
import { validateRequest } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import thesauris from './thesauris';

export default (app) => {
  app.post('/api/thesauris',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      _id: Joi.string(),
      __v: Joi.number(),
      name: Joi.string().required(),
      values: Joi.array().items(
        Joi.object().keys({
          id: Joi.string(),
          label: Joi.string().required(),
          _id: Joi.string(),
          values: Joi.array()
        })).required()
    }).required()),
    (req, res, next) => {
      thesauris.save(req.body)
      .then((response) => {
        res.json(response);
        req.io.sockets.emit('thesauriChange', response);
      })
      .catch(next);
    }
  );

  app.get('/api/thesauris',
    validateRequest(Joi.object().keys({
      _id: Joi.string()
    }), 'query'),
    (req, res, next) => {
      let id;
      if (req.query) {
        id = req.query._id;
      }
      thesauris.get(id, req.language, req.user)
      .then(response => res.json({ rows: response }))
      .catch(next);
    }
  );

  app.get('/api/dictionaries',
    validateRequest(Joi.object().keys({
      _id: Joi.string()
    }), 'query'),
    (req, res, next) => {
      let id;
      if (req.query && req.query._id) {
        id = { _id: req.query._id };
      }
      thesauris.dictionaries(id)
      .then(response => res.json({ rows: response }))
      .catch(next);
    }
  );

  app.delete('/api/thesauris',
    needsAuthorization(),
    validateRequest(Joi.object().keys({
      _id: Joi.string().required(),
      _rev: Joi.any()
    }).required(), 'query'),
    (req, res, next) => {
      thesauris.delete(req.query._id, req.query._rev)
      .then((response) => {
        res.json(response);
        req.io.sockets.emit('thesauriDelete', response);
      })
      .catch(next);
    }
  );
};
