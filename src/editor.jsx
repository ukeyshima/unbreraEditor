import React from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/html';
import 'brace/mode/javascript';
import 'brace/mode/glsl';
import 'brace/mode/css';
import 'brace/theme/dawn';
import { inject, observer } from 'mobx-react';
import 'brace/ext/language_tools';
import 'brace/snippets/html.js';
import 'brace/snippets/javascript.js';
import 'brace/snippets/glsl.js';
import 'brace/snippets/css.js';
import UndoManager from './undoManager';

@inject(({ state }) => ({
  updateEditor: state.updateEditor,
  hotReload: state.hotReload,
  updateActiveText: state.updateActiveText,
  executeHTML: state.executeHTML,
  textFile: state.textFile,
  editorValue: state.activeTextFile.text,
  activeTextFileType: state.activeTextFile.type,
  activeTextFileId: state.activeTextFileId,
  updateActiveUndoStack: state.updateActiveUndoStack,
  updateActiveRedoStack: state.updateActiveRedoStack,
  saveEvent: state.saveEvent
}))
@observer
export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight - 110
    };
  }
  handleResize = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight - 110
    });
    this.editor.resize();
  };
  componentDidMount = () => {
    const editor = this.refs.aceEditor.editor;
    this.editor = editor;
    editor.resize();
    this.props.updateEditor(editor);
    editor.session.$undoManager = new UndoManager(editor).aceUndoManager;
    this.keyboardHandler = editor.getKeyboardHandler();
    this.keyboardHandler.addCommand({
      name: 'save-event',
      bindKey: { win: 'Ctrl+s', mac: 'Command+s' },
      exec: () => {
        try {
          console.log('saveEvent');
          this.props.saveEvent();
        } catch (e) {
          console.log(e);
        }
      },
      readOnly: true
    });
    this.keyboardHandler.addCommand({
      name: 'undo-event',
      bindKey: { win: 'Ctrl+z', mac: 'Command+z' },
      exec: () => {
        try {
          console.log('undoEvent');
          editor.session.$undoManager.undo();
        } catch (e) {
          console.log(e);
        }
      },
      readOnly: true
    });
    this.keyboardHandler.addCommand({
      name: 'redo-event',
      bindKey: { win: 'Ctrl+Shift+z', mac: 'Command+Shift+z' },
      exec: () => {
        try {
          console.log('redoEvent');
          editor.session.$undoManager.redo();
        } catch (e) {
          console.log(e);
        }
      },
      readOnly: true
    });
    this.keyboardHandler.addCommand({
      name: 'unbra-event',
      bindKey: { win: 'Alt+z', mac: 'Option+z' },
      exec: () => {
        try {
          console.log('unbraEvent');
          editor.session.$undoManager.unbra();
        } catch (e) {
          console.log(e);
        }
      },
      readOnly: true
    });
    this.keyboardHandler.addCommand({
      name: 'rebra-event',
      bindKey: { win: 'Alt+Shift+z', mac: 'Option+Shift+z' },
      exec: () => {
        try {
          console.log('rebraEvent');
          editor.session.$undoManager.rebra();
        } catch (e) {
          console.log(e);
        }
      },
      readOnly: true
    });
    window.addEventListener('resize', this.handleResize);
  };
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  handleChange = e => {
    this.props.updateActiveText(e);
    if (this.props.hotReload) {
      this.props.updateActiveText(e);
      this.props.executeHTML(this.props.textFile);
    }
  };
  render() {
    return (
      <AceEditor
        style={{
          position: 'absolute',
          top: 110,
          width: this.state.width,
          height: this.state.height
        }}
        ref='aceEditor'
        mode={this.props.activeTextFileType}
        theme='dawn'
        onChange={this.handleChange}
        onScroll={this.handleScroll}
        value={this.props.editorValue}
        fontSize={27}
        editorProps={{
          $blockScrolling: Infinity
        }}
        wrapEnabled={false}
        tabSize={4}
        setOptions={{
          hScrollBarAlwaysVisible: true,
          vScrollBarAlwaysVisible: true,
          animatedScroll: true,
          scrollSpeed: 0.7,
          enableBasicAutocompletion: true,
          enableSnippets: true,
          enableLiveAutocompletion: true
        }}
      />
    );
  }
}
