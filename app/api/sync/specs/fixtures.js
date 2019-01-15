/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const oldDoc1 = db.id();
const oldDoc2 = db.id();
const newDoc1 = db.id();
const newDoc2 = db.id();
const newDoc3 = db.id();
const newDoc4 = db.id();
const newDoc5 = db.id();
const newDoc6 = db.id();

const template1 = db.id();

const template1Property1 = db.id();
const template1Property2 = db.id();
const template1Property3 = db.id();
const template1PropertyThesauri1Select = db.id();
const template1PropertyThesauri2Select = db.id();
const template1PropertyThesauri3MultiSelect = db.id();

const template2 = db.id();
const template2PropertyThesauri5Select = db.id();

const template3 = db.id();

const thesauri1 = db.id();
const thesauri1Value1 = db.id();
const thesauri1Value2 = db.id();

const thesauri2 = db.id();

const thesauri3 = db.id();
const thesauri3Value1 = db.id();
const thesauri3Value2 = db.id();

const thesauri4 = db.id();
const thesauri5 = db.id();

const settingsId = db.id();
const sessionsId = db.id();

export default {
  syncs: [
    {
      lastSync: 10000,
    },
  ],

  updatelogs: [
    {
      timestamp: 20000,
      namespace: 'entities',
      mongoId: newDoc4,
      deleted: true,
    },
    {
      timestamp: 22000,
      namespace: 'connections',
      mongoId: newDoc5,
      deleted: false,
    },
    {
      timestamp: 20000,
      namespace: 'connections',
      mongoId: newDoc3,
      deleted: false,
    },
    {
      timestamp: 6000,
      namespace: 'entities',
      mongoId: oldDoc1,
      deleted: false,
    },
    {
      timestamp: 7000,
      namespace: 'entities',
      mongoId: oldDoc2,
      deleted: false,
    },
    {
      timestamp: 12000,
      namespace: 'entities',
      mongoId: newDoc2,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'entities',
      mongoId: newDoc1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'entities',
      mongoId: newDoc6,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template2,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template3,
      deleted: false,
    },
    {
      timestamp: 9006,
      namespace: 'dictionaries',
      mongoId: thesauri1,
      deleted: false,
    },
    {
      timestamp: 9009,
      namespace: 'dictionaries',
      mongoId: thesauri2,
      deleted: false,
    },
    {
      timestamp: 9007,
      namespace: 'dictionaries',
      mongoId: thesauri3,
      deleted: false,
    },
    {
      timestamp: 9008,
      namespace: 'dictionaries',
      mongoId: thesauri4,
      deleted: true,
    },
    {
      timestamp: 9001,
      namespace: 'dictionaries',
      mongoId: thesauri5,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'migrations',
      mongoId: newDoc1,
      deleted: false,
    },
    {
      timestamp: 9001,
      namespace: 'settings',
      mongoId: settingsId,
      deleted: false,
    },
    {
      timestamp: 9002,
      namespace: 'sessions',
      mongoId: sessionsId,
      deleted: false,
    },
  ],

  entities: [
    {
      _id: newDoc1,
      title: 'a new entity',
      template: template1,
      metadata: {
        t1Property1: 'sync property 1',
        t1Property2: 'sync property 2',
        t1Property3: 'sync property 3',
        t1Thesauri1Select: thesauri1Value2,
        t1Thesauri2Select: db.id(),
        t1Thesauri3MultiSelect: [thesauri3Value2, thesauri3Value1],
      }
    },
    {
      _id: newDoc2,
      title: 'another new entity',
      template: template1,
      metadata: {
        t1Property1: 'another doc property 1',
        t1Property2: 'another doc property 2',
        t1Thesauri3MultiSelect: [thesauri3Value2],
      }
    },
    {
      _id: newDoc6,
      title: 'not to sync',
      template: template3,
    },
  ],

  connections: [
    {
      _id: newDoc3,
      entity: newDoc1,
    },
    {
      _id: newDoc5,
      entity: newDoc1,
    },
  ],

  templates: [
    {
      _id: template1,
      properties: [
        {
          _id: template1Property1,
          name: 't1Property1',
        },
        {
          _id: template1Property2,
          name: 't1Property2',
        },
        {
          _id: template1Property3,
          name: 't1Property3',
        },
        {
          _id: template1PropertyThesauri1Select,
          name: 't1Thesauri1Select',
          type: 'select',
          content: thesauri1
        },
        {
          _id: template1PropertyThesauri2Select,
          name: 't1Thesauri2Select',
          type: 'select',
          content: thesauri2
        },
        {
          _id: template1PropertyThesauri3MultiSelect,
          name: 't1Thesauri3MultiSelect',
          type: 'multiselect',
          content: thesauri3
        }
      ],
    },
    {
      _id: template2,
      properties: [
        {
          _id: template2PropertyThesauri5Select,
          name: 't2Thesauri3MultiSelect',
          type: 'select',
          content: thesauri5
        }
      ]
    },
    {
      _id: template3
    }
  ],

  dictionaries: [
    {
      _id: thesauri1,
      values: [
        {
          _id: thesauri1Value1,
          label: 'th1value1',
        },
        {
          _id: thesauri1Value2,
          label: 'th1value2',
        },
      ],
    },
    {
      _id: thesauri2
    },
    {
      _id: thesauri3,
      values: [
        {
          _id: thesauri3Value1,
          label: 'th3value1',
        },
        {
          _id: thesauri3Value2,
          label: 'th3value2',
        },
      ],
    },
    {
      _id: thesauri4
    },
    {
      _id: thesauri5
    }
  ],

  settings: [
    {
      _id: settingsId,
      languages: [{ key: 'es', default: true }],
      sync: {
        url: 'url',
        active: true,
        config: {}
      }
    },
  ],

  sessions: [
    { _id: sessionsId }
  ]
};

export {
  newDoc1,
  newDoc2,
  newDoc3,
  newDoc4,
  template1,
  template1Property1,
  template1Property2,
  template1Property3,
  template1PropertyThesauri1Select,
  template1PropertyThesauri2Select,
  template1PropertyThesauri3MultiSelect,
  template2,
  template2PropertyThesauri5Select,
  template3,
  thesauri1,
  thesauri1Value1,
  thesauri1Value2,
  thesauri2,
  thesauri3,
  thesauri3Value1,
  thesauri3Value2,
  thesauri4,
  thesauri5,
};