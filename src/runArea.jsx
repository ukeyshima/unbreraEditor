import React from 'react';
import RunAreaHeader from './runAreaHeader';
import { inject, observer } from 'mobx-react';

@inject(({ state }) => ({
  iframeElement: state.iframeElement,
  updateIframeElement: state.updateIframeElement,
  updateExecuteHTML: state.updateExecuteHTML,
  textFile: state.textFile    
}))
@observer
export default class RunArea extends React.Component {
  async componentDidMount() {
    await this.props.updateIframeElement(this.refs.iframe);
    this.props.updateExecuteHTML(this.executeHTML);
    this.executeHTML(this.props.textFile);
  }
  componentWillUnmount() {
    this.props.updateIframeElement(null);
  }  
  executeHTML = textFile => {
    const domParser = new DOMParser();
    let document_obj = null;
    try {
      document_obj = domParser.parseFromString(textFile[0].text, 'text/html');
      if (document_obj.getElementsByTagName('parsererror').length) {
        document_obj = null;
      }
    } catch (e) {
      console.log(e);
    }
    if (document_obj) {
      const scripts = Array.prototype.slice.call(
        document_obj.getElementsByTagName('script')
      );
      const links = Array.prototype.slice.call(
        document_obj.getElementsByTagName('link')
      );
      scripts.forEach(e => {
        if (e.src) {
          const fileName = e.src.split('/')[e.src.split('/').length - 1];
          const targetOfJs = textFile.find(f => {
            return f.fileName === fileName;
          });
          if (targetOfJs) {
            const blob = new Blob([targetOfJs.text], {
              type: 'application/javascript'
            });
            e.src = URL.createObjectURL(blob);
          }
        } else {
          const targetOfNotJs = textFile.find(f => {
            return f.fileName === e.type;
          });
          e.text = targetOfNotJs.text;
        }
      });
      links.forEach(e => {
        const fileName = e.href.split('/')[e.href.split('/').length - 1];
        const targetOfCss = textFile.find(f => {
          return (
            f.type === 'css' &&
            e.rel === 'stylesheet' &&
            fileName === f.fileName
          );
        });
        if (targetOfCss) {
          const blob = new Blob([targetOfCss.text], { type: 'text/css' });
          e.href = URL.createObjectURL(blob);
        }
      });
      if (document_obj.documentElement) {
        const blob = new Blob([document_obj.documentElement.outerHTML], {
          type: 'text/html'
        });
        this.props.iframeElement.contentWindow.location.replace(
          URL.createObjectURL(blob)
        );
      }
    }
  };
  render() {
    return (
      <div onMouseUp={this.handleMouseUp} style={this.props.style}>
        <RunAreaHeader />
        <iframe
          touch-action='auto'
          ref='iframe'
          style={{
            width: this.props.style.width,
            height: this.props.style.height - 20,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
            borderWidth: 0
          }}
        />
      </div>
    );
  }
}
