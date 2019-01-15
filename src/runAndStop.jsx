import React from 'react';
import RunButton from './runButton';
import StopButton from './stopButton';

export default class RunAndStop extends React.Component {
  render() {
    return (
      <div id="runAndStop">
        <RunButton />
        <StopButton />
      </div>
    );
  }
}
