import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveDocument, finishEdit} from 'app/Uploads/actions/uploadsActions';
import SidePanel from 'app/Layout/SidePanel';
import DocumentForm from 'app/DocumentForm/components/DocumentForm';

export class UploadsFormPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>{this.props.title}</h1>
        <i className='fa fa-close close-modal' onClick={this.props.finishEdit}></i>
        <DocumentForm templates={this.props.templates} thesauris={this.props.thesauris} onSubmit={this.submit.bind(this)}/>
      </SidePanel>
    );
  }
}

UploadsFormPanel.propTypes = {
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  finishEdit: PropTypes.func,
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  title: PropTypes.string
};

const mapStateToProps = (state) => {
  let uiState = state.uploads.uiState;
  return {
    open: typeof uiState.get('documentBeingEdited') === 'string',
    templates: state.uploads.templates,
    thesauris: state.uploads.thesauris,
    title: state.document.title
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveDocument, finishEdit}, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(UploadsFormPanel);