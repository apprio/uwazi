import 'api/entities';
import 'api/thesauris/dictionariesModel';
import errorLog from 'api/log/errorLog';
import 'api/relationships';
import backend from 'fetch-mock';

import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import settings from 'api/settings';
import settingsModel from 'api/settings/settingsModel';

import fixtures, {
  newDoc1,
  newDoc2,
  newDoc3,
  newDoc4,
  template1,
  template1Property1,
  template1Property2,
  template1Property3,
  template1PropertyThesauri1Select,
  template1PropertyThesauri3MultiSelect,
  template2,
  template2PropertyThesauri5Select,
  template3,
  thesauri1,
  thesauri2,
  thesauri1Value1,
  thesauri1Value2,
  thesauri3,
  thesauri4,
  thesauri5,
} from './fixtures';

import syncWorker from '../syncWorker';
import syncsModel from '../syncsModel';

describe('syncWorker', () => {
  beforeEach((done) => {
    spyOn(errorLog, 'error');
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
    syncWorker.stopped = false;
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  const syncWorkerWithConfig = async config => syncWorker.syncronize({
    url: 'url',
    config
  });

  const syncAllTemplates = async () => syncWorker.syncronize({
    url: 'url',
    config: {
      templates: {
        [template1.toString()]: [],
        [template2.toString()]: [],
        [template3.toString()]: [],
      }
    }
  });

  const expectCallToEqual = (call, namespace, data) => {
    expect(call).toEqual(['url/api/sync', { namespace, data }]);
  };

  const expectCallWith = (spy, namespace, data) => {
    expect(spy).toHaveBeenCalledWith('url/api/sync', { namespace, data });
  };

  describe('syncronize', () => {
    beforeEach(() => {
      spyOn(request, 'post').and.returnValue(Promise.resolve());
      spyOn(request, 'delete').and.returnValue(Promise.resolve());
    });

    it('should only sync whitelisted collections (forbidding certain collections even if present)', async () => {
      await syncWorkerWithConfig({ migrations: {}, settings: {}, sessions: {} });

      expect(request.post.calls.count()).toBe(0);
      expect(request.delete.calls.count()).toBe(0);
    });

    describe('templates', () => {
      it('should only sync whitelisted templates and properties', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [template1Property1.toString(), template1Property3.toString()],
            [template2.toString()]: [],
          }
        });

        const templateCallsOnly = request.post.calls.allArgs().filter(args => args[1].namespace === 'templates');
        const template1Call = templateCallsOnly.find(call => call[1].data._id.toString() === template1.toString());
        const template2Call = templateCallsOnly.find(call => call[1].data._id.toString() === template2.toString());

        expect(templateCallsOnly.length).toBe(2);

        expectCallToEqual(template1Call, 'templates', {
          _id: template1,
          properties: [
            expect.objectContaining({ _id: template1Property1 }),
            expect.objectContaining({ _id: template1Property3 })
          ]
        });

        expectCallToEqual(template2Call, 'templates', expect.objectContaining({ _id: template2 }));
      });
    });

    describe('thesauris (dictionaries collection)', () => {
      it('should only sync whitelisted thesauris through template configs (deleting even non whitelisted ones)', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [
              template1Property2.toString(),
              template1PropertyThesauri1Select.toString(),
              template1PropertyThesauri3MultiSelect.toString(),
            ],
            [template2.toString()]: [template2PropertyThesauri5Select.toString()],
          }
        });

        const thesauriCallsOnly = request.post.calls.allArgs().filter(args => args[1].namespace === 'dictionaries');
        const thesauri1Call = thesauriCallsOnly.find(call => call[1].data._id.toString() === thesauri1.toString());
        const thesauri2Call = thesauriCallsOnly.find(call => call[1].data._id.toString() === thesauri2.toString());
        const thesauri3Call = thesauriCallsOnly.find(call => call[1].data._id.toString() === thesauri3.toString());
        const thesauri5Call = thesauriCallsOnly.find(call => call[1].data._id.toString() === thesauri5.toString());

        expect(thesauriCallsOnly.length).toBe(3);

        expectCallToEqual(thesauri1Call, 'dictionaries', {
          _id: thesauri1,
          values: [expect.objectContaining({ _id: thesauri1Value1 }), expect.objectContaining({ _id: thesauri1Value2 })]
        });

        expect(thesauri2Call).not.toBeDefined();
        expect(thesauri3Call).toBeDefined();
        expect(thesauri5Call).toBeDefined();
        expectCallWith(request.delete, 'dictionaries', expect.objectContaining({ _id: thesauri4 }));
      });
    });

    describe('entities', () => {
      it('should only sync entities belonging to a whitelisted template and properties', async () => {
        await syncWorkerWithConfig({
          templates: {
            [template1.toString()]: [template1Property2.toString(), template1Property3.toString(), template1PropertyThesauri1Select.toString()],
            [template2.toString()]: [],
          }
        });

        const entitiesCallsOnly = request.post.calls.allArgs().filter(args => args[1].namespace === 'entities');
        const entity1Call = entitiesCallsOnly.find(call => call[1].data._id.toString() === newDoc1.toString());
        const entity2Call = entitiesCallsOnly.find(call => call[1].data._id.toString() === newDoc2.toString());

        expectCallToEqual(entity1Call, 'entities', expect.objectContaining({
          _id: newDoc1,
          metadata: { t1Property2: 'sync property 2', t1Property3: 'sync property 3', t1Thesauri1Select: thesauri1Value2 }
        }));

        expectCallToEqual(entity2Call, 'entities', expect.objectContaining({
          _id: newDoc2,
          metadata: { t1Property2: 'another doc property 2' },
        }));

        expect(request.post).not.toHaveBeenCalledWith('url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({ title: 'not to sync' })
        });
      });
    });

    it('should process the log records newer than the current sync time (minus 1 sec)', async () => {
      await syncAllTemplates();

      expect(request.post.calls.count()).toBe(8);
      expect(request.delete.calls.count()).toBe(2);
    });

    it('should update lastSync timestamp with the last change', async () => {
      await syncAllTemplates();
      const [{ lastSync }] = await syncsModel.find();
      expect(lastSync).toBe(22000);
    });

    it('should update lastSync on each operation', async () => {
      request.post.and.callFake((url, body) =>
        body.data._id.equals(newDoc3) ? Promise.reject(new Error('post failed')) : Promise.resolve()
      );
      request.delete.and.callFake((url, body) =>
        body.data._id.equals(newDoc4) ? Promise.reject(new Error('delete failed')) : Promise.resolve()
      );

      try {
        await syncAllTemplates();
      } catch (e) {
        const [{ lastSync }] = await syncsModel.find();
        expect(lastSync).toBe(12000);
      }
    });
  });

  describe('intervalSync', () => {
    it('should syncronize every x seconds', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.resolve();
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should retry when syncronize returns a request error', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 500, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should login when a sync response its "Unauthorized"', async () => {
      spyOn(syncWorker, 'login').and.returnValue(Promise.resolve());
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 1) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 401, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.login).toHaveBeenCalledWith('url', 'admin', 'admin');
    });
  });

  describe('login', () => {
    it('should login to the target api and set the cookie', async () => {
      backend.restore();
      backend.post('http://localhost/api/login', { body: '{}', headers: { 'set-cookie': 'cookie' } });
      spyOn(request, 'cookie');
      await syncWorker.login('http://localhost', 'username', 'password');
      expect(request.cookie).toHaveBeenCalledWith('cookie');
    });

    it('should catch errors and log them', async () => {
      spyOn(request, 'post').and.callFake(() => Promise.reject(new Error('post failed')));
      await syncWorker.login('http://localhost', 'username', 'password');
      expect(errorLog.error.calls.argsFor(0)[0]).toMatch('post failed');
    });
  });

  describe('start', () => {
    it('should not fail on sync not in settings', async () => {
      await settingsModel.db.update({}, { $unset: { sync: '' } });
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      let thrown;
      try {
        await syncWorker.start(interval);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).not.toBeDefined();
    });

    it('should lazy create lastSync entry if not exists', async () => {
      await syncsModel.remove({});

      await syncWorker.start();
      const [{ lastSync }] = await syncsModel.find();
      expect(lastSync).toBe(0);
    });

    it('should get sync config and start the sync', async () => {
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      await syncWorker.start(interval);
      expect(syncWorker.intervalSync).toHaveBeenCalledWith({ url: 'url', active: true, config: {} }, interval);
    });

    describe('when there is no sync config', () => {
      it('should not start the intervalSync', async () => {
        spyOn(syncWorker, 'intervalSync');
        await settings.save({ sync: {} });
        await syncWorker.start();
        expect(syncWorker.intervalSync).not.toHaveBeenCalled();
      });
    });
  });
});