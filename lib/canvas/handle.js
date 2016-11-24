import React from 'react';

import bem from '../util/bem';

const st2Class = bem('viewer')
    ;

const icons = {
  'success': 'icon-check2',
  'error': 'icon-delete',
  'complete': 'icon-instance'
};

export default class Handle extends React.Component {
  static propTypes = {
    type: React.PropTypes.string,
    onDrag: React.PropTypes.func
  }

  handleDragStart(e) {
    e.stopPropagation();

    if (this.props.onDrag) {
      this.props.onDrag(e);
    }
  }

  render() {
    const props = {
      className: st2Class('node-button') + ' ' + st2Class('node-button', this.props.type) + ' ' + icons[this.props.type],
      draggable: !!this.props.onDrag,
      onDragStart: (e) => this.handleDragStart(e)
    };

    return <span {...props} />;
  }
}