import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import relationships from 'api/relationships/relationships';

import instrumentRoutes from '../../utils/instrumentRoutes';
import relationshipsRroutes from '../routes.js';
import entities from 'api/entities';

describe('relationships routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(relationshipsRroutes);
    spyOn(relationships, 'save').and.returnValue(Promise.resolve());
    spyOn(relationships, 'delete').and.returnValue(Promise.resolve());
    db.clearAllAndLoad({}).then(done);
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/references')).toMatchSnapshot();
    });

    it('should save a reference', (done) => {
      const req = { body: { name: 'created_reference' }, language: 'es' };

      routes.post('/api/references', req)
      .then(() => {
        expect(relationships.save).toHaveBeenCalledWith(req.body, req.language);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST bulk', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/relationships/bulk')).toMatchSnapshot();
    });

    it('should save and delete the relationships', (done) => {
      const req = {
        body: {
          save: [{ _id: 1 }, { _id: 2 }],
          delete: [{ _id: 3 }]
        },
        language: 'es',
      };

      spyOn(entities, 'updateMetdataFromRelationships').and.returnValue(Promise.resolve());

      routes.post('/api/relationships/bulk', req)
      .then(() => {
        expect(relationships.save).toHaveBeenCalledWith({ _id: 1 }, req.language);
        expect(relationships.save).toHaveBeenCalledWith({ _id: 2 }, req.language);
        expect(relationships.delete).toHaveBeenCalledWith({ _id: 3 }, req.language);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/references')).toMatchSnapshot();
    });
    it('should delete the reference', (done) => {
      const req = { query: { _id: 'to_delete_id' }, language: 'en' };

      routes.delete('/api/references', req)
      .then(() => {
        expect(relationships.delete).toHaveBeenCalledWith({ _id: req.query._id }, 'en');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET by_document', () => {
    it('should return relationships.getByDocument', (done) => {
      const req = { params: { id: 'documentId' }, language: 'es' };

      spyOn(relationships, 'getByDocument').and.returnValue(Promise.resolve('byDocument'));

      routes.get('/api/references/by_document/:id', req)
      .then((response) => {
        expect(relationships.getByDocument).toHaveBeenCalledWith('documentId', 'es');
        expect(response).toBe('byDocument');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET group_by_connection', () => {
    it('should return grouped refernces by connection', (done) => {
      const req = { params: { id: 'documentId' }, language: 'es', user: 'user' };

      spyOn(relationships, 'getGroupsByConnection').and.returnValue(Promise.resolve('groupedByConnection'));

      routes.get('/api/references/group_by_connection/:id', req)
      .then((response) => {
        expect(relationships.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', { excludeRefs: true, user: 'user' });
        expect(response).toBe('groupedByConnection');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET search', () => {
    beforeEach(() => {
      spyOn(relationships, 'search').and.returnValue(Promise.resolve('search results'));
    });

    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/references/search/:id')).toMatchSnapshot();
    });

    it('should return entities from relationships search() passing the user', (done) => {
      const req = { params: { id: 'documentId' }, language: 'es', user: 'user', query: { searchTerm: 'Something' } };

      routes.get('/api/references/search/:id', req)
      .then((response) => {
        expect(relationships.search).toHaveBeenCalledWith('documentId', { searchTerm: 'Something', filter: {} }, 'es', 'user');
        expect(response).toBe('search results');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/references/count_by_relationtype', () => {
    it('should return the number of relationships using a relationtype', (done) => {
      spyOn(relationships, 'countByRelationType').and.returnValue(Promise.resolve(2));
      const req = { query: { relationtypeId: 'abc1' } };
      routes.get('/api/references/count_by_relationtype', req)
      .then((result) => {
        expect(result).toBe(2);
        expect(relationships.countByRelationType).toHaveBeenCalledWith('abc1');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
