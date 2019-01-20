import React from 'react';
import Editor from './editor';
import RunArea from './runArea';
import UnbreraGUIArea from './unbreraGUIArea';
import { inject, observer } from 'mobx-react';

@inject(({ state }) => ({
  textFile: state.textFile,
  runAreaRenderingFlag: state.runAreaRenderingFlag,
  runAreaPosition: state.runAreaPosition,
  unbreraGUIAreaRenderingFlag: state.unbreraGUIAreaRenderingFlag,
  unbreraGUIAreaPosition: state.unbreraGUIAreaPosition
}))
@observer
export default class RenderingObject extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Editor />
        {this.props.runAreaRenderingFlag && (
          <RunArea
            style={{
              position: 'absolute',
              left: this.props.runAreaPosition.x,
              top: this.props.runAreaPosition.y,
              width: 400,
              height: 400,
              borderRadius: 5,
              boxShadow: '2px 2px 10px grey',
              zIndex: 26
            }}
          />
        )}
        {this.props.unbreraGUIAreaRenderingFlag && (
          <UnbreraGUIArea
            style={{
              overflow: 'auto',
              position: 'absolute',
              left: this.props.unbreraGUIAreaPosition.x,
              top: this.props.unbreraGUIAreaPosition.y,
              width: 500,
              height: 250,
              borderRadius: 5,
              boxShadow: '2px 2px 10px grey',
              zIndex: 26
            }}
          />
        )}
      </React.Fragment>
    );
  }
}
