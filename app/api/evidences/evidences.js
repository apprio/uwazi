import model from './evidencesModel.js';
import entities from '../entities';
import templates from '../templates';
import thesauris from '../thesauris/thesauris';
import MLAPI from './MLAPI';

export default {
  save(evidence, user, language) {
    return model.save(evidence)
    .then(() => {
      return entities.getById(evidence.entity);
    })
    .then((entity) => {
      return Promise.all([
        entity,
        templates.getById(entity.template)
      ]);
    })
    .then(([entity, template]) => {
      const propertyName = template.properties.find((p) => p._id.toString() === evidence.property.toString()).name;
      if (!entity.metadata[propertyName]) {
        entity.metadata[propertyName] = [];
      }
      entity.metadata[propertyName].push(evidence.value);
      return entities.save(entity, {user, language});
    });
  },

  get(query, select, pagination) {
    return model.get(query, select, pagination);
  },

  getSuggestions(docId) {
    return entities.get({_id: docId}, '+fullText')
    .then(([entity]) => {
      return Promise.all([
        entity,
        templates.getById(entity.template)
      ]);
    })
    .then(([entity, template]) => {
      const multiselects = template.properties.filter(p => p.type === 'multiselect');

      return Promise.all([
        entity,
        template,
        Promise.all(multiselects.map((multiselect) => thesauris.get(multiselect.content, 'en').then((t) => t[0])))
      ]);
    })
    .then(([entity, template, dictionaries]) => {
      const multiselects = template.properties.filter(p => p.type === 'multiselect');
      let properties = [];
      multiselects.forEach((property) => {
        dictionaries.find((d) => d._id.toString() === property.content.toString()).values.forEach((value) => {
          properties.push({entity: docId, property: property._id, value: value.id});
        });
      });
      return MLAPI.getSuggestions({
        doc: {
          title: entity.title,
          text: entity.fullText.replace(/\[\[[0-9]*\]\]/g, '')
        },
        properties
      });
    })
    .then((evidences) => {
      return evidences.map((evidence) => {
        evidence.evidence = {text: evidence.evidence};
        return evidence;
      });
    });
  },

  getById(_id) {
    return model.get({_id}).then(([evidence]) => evidence);
  },

  delete(_id) {
    return model.delete({_id});
  }
};
