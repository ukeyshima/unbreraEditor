import React from 'react';
import HotReloadButton from './hotReloadButton';
import DefaultButton from './defaultButton';
import { inject, observer } from 'mobx-react';

@inject('state')
@observer
export default class ModeSelect extends React.Component {
  render() {
    return (
      <div
        touch-action="auto"
        className="dropDown"
        id="modeSelect"
        style={{
          position: 'absolute',
          left: this.props.style.x,
          top: this.props.style.y
        }}
      >
        <HotReloadButton />
        <DefaultButton />
      </div>
    );
  }
}
