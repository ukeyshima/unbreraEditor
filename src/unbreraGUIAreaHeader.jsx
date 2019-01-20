import React from 'react';
import { inject, observer } from 'mobx-react';

@inject(({ state }) => ({
  unbreraGUIAreaPosition: state.unbreraGUIAreaPosition,
  updateUnbreraGUIAreaPosition: state.updateUnbreraGUIAreaPosition
}))
@observer
export default class RunAreaHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      x: 0,
      y: 0
    };
  }
  handleMouseAndTouchDown = e => {
    document.body.addEventListener('mousemove', this.handleMouseAndTouchMove);
    document.body.addEventListener('touchmove', this.handleMouseAndTouchMove);
    document.body.addEventListener('mouseup', this.handleMouseAndTouchUp);
    document.body.addEventListener('touchend', this.handleMouseAndTouchUp);
    this.setState({
      x: 'changedTouches' in e ? e.changedTouches[0].pageX : e.pageX,
      y: 'changedTouches' in e ? e.changedTouches[0].pageY : e.pageY
    });
  };
  handleMouseAndTouchMove = e => {
    const position = this.props.unbreraGUIAreaPosition;
    const x = 'changedTouches' in e ? e.changedTouches[0].pageX : e.pageX;
    const y = 'changedTouches' in e ? e.changedTouches[0].pageY : e.pageY;
    this.props.updateUnbreraGUIAreaPosition(
      position.x + x - this.state.x,
      position.y + y - this.state.y
    );
    this.setState({
      x: x,
      y: y
    });
  };
  handleMouseAndTouchUp = () => {
    document.body.removeEventListener(
      'mousemove',
      this.handleMouseAndTouchMove
    );
    document.body.removeEventListener(
      'touchmove',
      this.handleMouseAndTouchMove
    );
    document.body.removeEventListener('mouseup', this.handleMouseAndTouchUp);
    document.body.removeEventListener('touchend', this.handleMouseAndTouchUp);
  };
  render() {
    return (
      <div
        touch-action='none'
        onMouseDown={this.handleMouseAndTouchDown}
        onTouchStart={this.handleMouseAndTouchDown}
        style={this.props.style}
      />
    );
  }
}
