import React, { Component, PropTypes } from 'react'
import superagent from 'superagent';
import api from '../../utils/api'
import {APIURL} from '../../config.js'
import './scss/upload.scss';
import { Link } from 'react-router'
import {events} from '../../utils/index'

class Upload extends Component {

  constructor (props) {
    super(props);
    this.state = {
      progress: 0
    }
  }

  upload = () => {
    this.setState({progress:0});

    if(this.input.files.length == 0) {
      return;
    }

    let file = this.input.files[0];
    this.createDocument(file)
    .then((response) => {
      this.uploadFile(file, response.json);
    });
  };

  createDocument = (file) => {
    return api.post('documents', {title: this.extractTitle(file)});
  };

  uploadFile = (file, doc) => {
    events.emit('newDocument', doc);

    let uploadRequest = superagent.post(APIURL + 'upload')
    .set('Accept', 'application/json')
    .field('document', doc.id)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      events.emit('uploadProgress', doc.id, Math.floor(data.percent));
      this.setState({progress:data.percent})
    })
    .on('response', (res) => {
      this.setState({progress: 0});
      this.input.value = ''; //can't test
      events.emit('uploadEnd', doc.id, res.body);
    })
    .end()
    return uploadRequest;
  };

  extractTitle(file) {
    let title = file.name
      .replace(/\.[^/.]+$/, "") //remove file extension
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/  /g, ' ');

    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  triggerUpload = (e) => {
    e.preventDefault();
    this.input.click();
  };

  render = () => {

    return (
      <div className="upload-component">
      <div className="upload-component_button" onClick={this.triggerUpload}><i className="fa fa-cloud-upload"></i> Upload</div>
      <input className="upload-component_input" onChange={this.upload} type="file" ref={(ref) => this.input = ref} accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"/>
      </div>
    )
  };

}

export default Upload;
