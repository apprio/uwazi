import moment from 'moment';
import React from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { store } from 'app/store';
import nestedProperties from 'app/Templates/components/ViolatedArticlesNestedProperties';
import t from 'app/I18N/t';
import Map from 'app/Map/Map';

const getOption = (thesauri, id) => {
  let option;
  thesauri.get('values').forEach((value) => {
    if (value.get('id') === id) {
      option = value;
    }

    if (value.get('values')) {
      value.get('values').forEach((subValue) => {
        if (subValue.get('id') === id) {
          option = subValue;
        }
      });
    }
  });

  if (option) {
    option = option.set('type', thesauri.get('isEntity') ? 'entity' : 'document');
  }

  return option;
};

const addSortedProperty = (templates, sortedProperty) => templates.reduce((_property, template) => {
  if (!template.get('properties')) {
    return _property;
  }

  let matchProp = template.get('properties').find(prop => `metadata.${prop.get('name')}` === sortedProperty);

  if (matchProp) {
    matchProp = matchProp.set('type', null).set('translateContext', template.get('_id'));
  }

  return _property || matchProp;
}, false);

const formatMetadataSortedProperty = (metadata, sortedProperty) => metadata.map((prop) => {
  const newProp = Object.assign({}, prop);
  newProp.sortedBy = false;
  if (sortedProperty === `metadata.${prop.name}`) {
    newProp.sortedBy = true;
    if (!prop.value) {
      newProp.value = 'No value';
      newProp.translateContext = 'System';
    }
  }
  return newProp;
});

const addCreationDate = (result, doc) => result.push({
  value: moment.utc(doc.creationDate).format('ll'),
  label: 'Date added',
  translateContext: 'System',
  sortedBy: true
});

const conformSortedProperty = (metadata, templates, doc, sortedProperty) => {
  const sortPropertyInMetadata = metadata.find(p => sortedProperty === `metadata.${p.name}`);
  if (!sortPropertyInMetadata && sortedProperty !== 'creationDate') {
    return metadata.push(addSortedProperty(templates, sortedProperty)).filter(p => p);
  }

  let result = formatMetadataSortedProperty(metadata, sortedProperty);

  if (sortedProperty === 'creationDate') {
    result = addCreationDate(result, doc);
  }

  return result;
};

export default {

  formatDateRange(daterange) {
    let from = '';
    let to = '';
    if (daterange.from) {
      from = moment.utc(daterange.from, 'X').format('ll');
    }
    if (daterange.to) {
      to = moment.utc(daterange.to, 'X').format('ll');
    }
    return `${from} ~ ${to}`;
  },

  getSelectOptions(option, thesauri) {
    let value = '';
    let icon;
    if (option) {
      value = t(thesauri.get('_id'), option.get('label'), null, false);
      icon = option.get('icon');
    }

    let url;
    if (option && thesauri.get('type') === 'template') {
      url = `/${option.get('type') ? option.get('type') : 'entity'}/${option.get('id')}`;
    }

    return { value, url, icon };
  },

  multimedia(property, value, type) {
    return {
      type,
      label: property.get('label'),
      name: property.get('name'),
      style: property.get('style') || 'contain',
      noLabel: Boolean(property.get('noLabel')),
      value,
    };
  },

  date(property, timestamp) {
    const value = moment.utc(timestamp, 'X').format('ll');
    return { label: property.get('label'), name: property.get('name'), value, timestamp };
  },

  daterange(property, daterange) {
    return { label: property.get('label'), name: property.get('name'), value: this.formatDateRange(daterange) };
  },

  multidate(property, timestamps = []) {
    const value = timestamps.map(timestamp => ({ timestamp, value: moment.utc(timestamp, 'X').format('ll') }));
    return { label: property.get('label'), name: property.get('name'), value };
  },

  multidaterange(property, dateranges = []) {
    const value = dateranges.map(range => ({ value: this.formatDateRange(range) }));
    return { label: property.get('label'), name: property.get('name'), value };
  },

  image(property, value) {
    return this.multimedia(property, value, 'image');
  },

  preview(property, value, thesauris, { doc }) {
    const reloadHack = doc.file && doc.file.filename ? doc.file.filename : '';
    return this.multimedia(property, `/api/attachment/${doc._id}.jpg${reloadHack ? `?r=${reloadHack}` : ''}`, 'image');
  },

  media(property, value) {
    return this.multimedia(property, value, 'media');
  },

  geolocation(property, value, thesauris, { onlyForCards }) {
    const markers = [];
    let _value;
    if (value.lat && value.lon) {
      _value = `Lat / Lon: ${value.lat} / ${value.lon}`;
      markers.push({ latitude: value.lat, longitude: value.lon });
    }
    if (!onlyForCards) {
      _value = <Map latitude={value.lat} height={370} longitude={value.lon} markers={markers}/>;
    }

    return { label: property.get('label'), name: property.get('name'), value: _value };
  },

  select(property, thesauriValue, thesauris) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));
    const { value, url, icon } = this.getSelectOptions(getOption(thesauri, thesauriValue), thesauri);
    return { label: property.get('label'), name: property.get('name'), value, icon, url };
  },

  multiselect(property, thesauriValues, thesauris) {
    const thesauri = thesauris.find(thes => thes.get('_id') === property.get('content'));
    const sortedValues = this.getThesauriValues(thesauriValues, thesauri);
    return { label: property.get('label'), name: property.get('name'), value: sortedValues };
  },

  relationship(property, thesauriValues, thesauris) {
    const allEntitiesThesauriValues = thesauris
    .filter(_thesauri => _thesauri.get('type') === 'template')
    .reduce((result, _thesauri) => {
      if (result) {
        return result.concat(this.getThesauriValues(thesauriValues, _thesauri));
      }

      return this.getThesauriValues(thesauriValues, _thesauri);
    }, null);

    const sortedValues = advancedSort(allEntitiesThesauriValues, { property: 'value' });

    return { label: property.get('label'), name: property.get('name'), value: sortedValues };
  },

  markdown(property, value, thesauris, { type }) {
    return { label: property.get('label'), name: property.get('name'), value, type: type || 'markdown' };
  },

  nested(property, rows, thesauris) {
    if (!rows[0]) {
      return { label: property.get('label'), name: property.get('name'), value: '' };
    }

    const { locale } = store.getState();
    const keys = Object.keys(rows[0]).sort();
    const translatedKeys = keys.map(key => nestedProperties[key.toLowerCase()] ? nestedProperties[key.toLowerCase()][`key_${locale}`] : key);
    let result = `| ${translatedKeys.join(' | ')}|\n`;
    result += `| ${keys.map(() => '-').join(' | ')}|\n`;
    result += `${rows.map(row => `| ${keys.map(key => (row[key] || []).join(', ')).join(' | ')}`).join('|\n')}|`;

    return this.markdown(property, result, thesauris, { type: 'markdown' });
  },

  getThesauriValues(thesauriValues, thesauri) {
    return advancedSort(
      thesauriValues.map(thesauriValue => this.getSelectOptions(getOption(thesauri, thesauriValue), thesauri)).filter(v => v.value),
      { property: 'value' }
    );
  },

  prepareMetadataForCard(doc, templates, thesauris, sortedProperty) {
    return this.prepareMetadata(doc, templates, thesauris, { onlyForCards: true, sortedProperty });
  },

  prepareMetadata(_doc, templates, thesauris, options = {}) {
    const doc = _doc;
    const template = templates.find(temp => temp.get('_id') === doc.template);

    if (!template || !thesauris.size) {
      return Object.assign({}, doc, { metadata: [], documentType: '' });
    }

    if (!doc.metadata) {
      doc.metadata = {};
    }

    let metadata = this.filterProperties(template, options.onlyForCards, options.sortedProperty)
    .map(property => this.applyTransformation(property, { doc, thesauris, options, template }));

    metadata = conformSortedProperty(metadata, templates, doc, options.sortedProperty);

    return Object.assign({}, doc, { metadata: metadata.toJS(), documentType: template.name });
  },

  applyTransformation(property, { doc, thesauris, options, template }) {
    const value = doc.metadata[property.get('name')];
    const showInCard = property.get('showInCard');

    const type = property.get('type');

    if (this[type] && (value || type === 'preview')) {
      return Object.assign(
        {},
        { translateContext: template.get('_id'), ...property.toJS() },
        this[type](property, value, thesauris, { ...options, doc })
      );
    }

    return { label: property.get('label'), name: property.get('name'), value, showInCard, translateContext: template.get('_id') };
  },

  filterProperties(template, onlyForCards, sortedProperty) {
    return template.get('properties')
    .filter((p) => {
      if (!onlyForCards) {
        return true;
      }

      if (p.get('showInCard') || sortedProperty === `metadata.${p.get('name')}`) {
        return true;
      }
      return false;
    });
  }
};
