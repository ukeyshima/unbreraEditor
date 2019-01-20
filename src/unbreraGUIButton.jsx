import React from 'react';
import { inject, observer } from 'mobx-react';

@inject(({ state }) => ({
  updateUnbreraGUIAreaRenderingFlag: state.updateUnbreraGUIAreaRenderingFlag
}))
@observer
export default class NormalButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fontColor: '#000'
    };
  }
  handleClick = () => {
    this.props.updateUnbreraGUIAreaRenderingFlag(true);
  };
  handleMouseLeave = () => {
    this.setState({
      fontColor: '#000'
    });
  };
  handleMouseEnter = () => {
    this.setState({
      fontColor: ' #e38'
    });
  };
  render() {
    return (
      <button
        style={{
          color: this.state.fontColor
        }}
        onClick={this.handleClick}
        onMouseLeave={this.handleMouseLeave}
        onMouseEnter={this.handleMouseEnter}
      >
        unbreraGUI
      </button>
    );
  }
}
