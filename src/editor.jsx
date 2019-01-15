import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/html';
import 'brace/mode/javascript';
import 'brace/mode/glsl';
import 'brace/mode/css';
import 'brace/theme/dawn';

import { inject, observer } from 'mobx-react';

@inject('state')
@observer
export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.width = window.innerWidth;
  }
  handleResize(e) {
    let diff = -3;
    this.props.state.renderingObject.forEach(e => {
      diff += 3;
      if (e.type == 'run') {
        diff += 4;
      }
    });
    const per = (window.innerWidth - diff) / (this.width - diff);
    const width = this.props.state.renderingObject[this.props.num].width;
    this.props.state.sizeChange(this.props.num, width * per);
    this.width = window.innerWidth;
  }
  componentWillUpdate() {
    const text = this.props.state.editor.getValue();
    this.props.state.updateActiveText(text);
  }
  componentDidUpdate(nextProps) {
    this.editor.setValue(nextProps.state.activeTextFile.text);
  }
  componentDidMount() {
    this.editor = this.refs.aceEditor.editor;
    this.props.state.updateEditor(this.editor);
    const self = this;
    const AceUndoManager = this.editor.session.$undoManager;
    AceUndoManager.undoStackObj = function(
      delta,
      branchId,
      frontStack,
      nextStack,
      stackWidth
    ) {
      return {
        delta: delta,
        branchId: branchId,
        frontStack: frontStack,
        nextStack: nextStack,
        stackWidth: stackWidth
      };
    };

    AceUndoManager.execute = function(options) {
      if (self.props.state.dontExecute === false) {
        const activeId = self.props.state.activeTextFile.id;
        this.$redoStack[activeId] = [];
        let lastUndoStack = this.lastUndoStack();
        if (lastUndoStack.nextStack.length > 0) {
          (function repaintBranchId(stack) {
            stack.branchId = 0;
            if (!(stack.nextStack.length > 1 || stack.nextStack.length == 0)) {
              repaintBranchId(stack.nextStack[0]);
            } else {
              return;
            }
          })(lastUndoStack.nextStack[0]);
          this.branchId[activeId] = lastUndoStack.nextStack.length;
        } else {
          this.branchId[activeId] = lastUndoStack.branchId;
        }
        let deltaSets = options.args[0];
        this.$doc = options.args[1];
        const action = deltaSets[0].deltas[0].action;
        const prevAction =
          this.$undoStack[activeId][this.$undoStack[activeId].length - 1]
            .delta[0] &&
          this.$undoStack[activeId][this.$undoStack[activeId].length - 1]
            .delta[0].deltas[0].action;
        if (options.merge && this.hasUndo() && action == prevAction) {
          this.dirtyCounter[activeId]--;
          deltaSets = this.$undoStack[activeId].pop().delta.concat(deltaSets);
          lastUndoStack = this.$undoStack[activeId][
            this.$undoStack[activeId].length - 1
          ];
          lastUndoStack.nextStack.pop();
        }
        if (this.dirtyCounter[activeId] < 0) {
          this.dirtyCounter[activeId] = NaN;
        }
        this.$undoStack[activeId].push(
          this.undoStackObj(
            deltaSets,
            this.branchId[activeId],
            lastUndoStack,
            [],
            1
          )
        );
        this.dirtyCounter[activeId]++;
        lastUndoStack.nextStack.push(this.lastUndoStack());
        if (lastUndoStack.nextStack.length > 1)
          this.updateStackWidth(lastUndoStack);
        this.id[activeId]++;
        this.lastUndoStack().id = this.id[activeId];
        if (self.props.state.hotReload) {
          self.props.state.updateActiveText(self.props.state.editor.getValue());
          self.props.state.executeHTML();
        }
      } else {
        self.props.state.updateDontExecute(false);
      }
    };
    AceUndoManager.undo = function(dontSelect) {
      const activeId = self.props.state.activeTextFile.id;
      if (this.hasUndo()) {
        const stack = this.$undoStack[activeId].pop();
        const deltaSets = stack.delta;
        let undoSelectionRange = null;
        if (deltaSets) {
          undoSelectionRange = this.$doc.undoChanges(deltaSets, dontSelect);
          this.$redoStack[activeId].push(
            this.undoStackObj(
              deltaSets,
              stack.branchId,
              stack.frontStack,
              stack.nextStack,
              stack.stackWidth
            )
          );
          this.dirtyCounter[activeId]--;
        }
        return undoSelectionRange;
      } else {
        console.log("can't undo!");
      }
    };
    AceUndoManager.redo = function(dontSelect) {
      const activeId = self.props.state.activeTextFile.id;
      if (this.hasRedo()) {
        const stack = this.$redoStack[activeId].pop();
        const deltaSets = stack.delta;
        let redoSelectionRange = null;
        if (deltaSets) {
          redoSelectionRange = this.$doc.redoChanges(
            this.$deserializeDeltas(deltaSets),
            dontSelect
          );
          this.$undoStack[activeId].push(
            this.undoStackObj(
              deltaSets,
              stack.branchId,
              stack.frontStack,
              stack.nextStack,
              stack.stackWidth
            )
          );
          this.dirtyCounter[activeId]++;
        }
        return redoSelectionRange;
      } else {
        console.log("can't redo!");
      }
    };
    AceUndoManager.unbra = function() {
      const activeId = self.props.state.activeTextFile.id;
      const lastUndoStack = Object.assign({}, this.lastUndoStack());
      const undoStack = this.$undoStack[activeId];
      const branchPointStack = undoStack
        .concat()
        .filter(e => e.nextStack.length > 1);
      const currentId = branchPointStack.map(e => e.branchId);
      currentId.push(lastUndoStack.branchId);
      const currentBranchId = currentId
        .concat()
        .reverse()
        .find(e => e > 0);
      const branchPointIndex = currentId.lastIndexOf(currentBranchId) - 1;
      const branchPoint = branchPointStack[branchPointIndex];
      if (branchPoint) {
        console.log('unbra!');
        const nextBranchId = currentBranchId - 1;
        const branchPointNum = undoStack.lastIndexOf(branchPoint);
        const j = undoStack.length - branchPointNum - 1;
        for (let i = 0; i < j; i++) {
          this.undo();
        }
        const stackUndoStack = stack => {
          const deltaSets = stack.delta;
          if (deltaSets) {
            this.$doc.redoChanges(this.$deserializeDeltas(deltaSets), null);
            undoStack.push(
              this.undoStackObj(
                deltaSets,
                stack.branchId,
                stack.frontStack,
                stack.nextStack,
                stack.stackWidth
              )
            );
            this.dirtyCounter[activeId]++;
          }
          if (stack.nextStack.length === 0) return;
          stackUndoStack(stack.nextStack[stack.nextStack.length - 1]);
        };
        stackUndoStack(branchPoint.nextStack[nextBranchId]);
        this.$redoStack[activeId] = [];
      } else {
        console.log("can't unbra!");
      }
    };
    AceUndoManager.rebra = function() {
      const activeId = self.props.state.activeTextFile.id;
      const lastUndoStack = Object.assign({}, this.lastUndoStack());
      const undoStack = this.$undoStack[activeId];
      const branchPointStack = undoStack
        .concat()
        .filter(e => e.nextStack.length > 1);
      const currentId = branchPointStack.map(e => e.branchId);
      currentId.push(lastUndoStack.branchId);
      let nextBranchId = 0;
      const branchPoint = branchPointStack
        .concat()
        .reverse()
        .find((e, i) => {
          nextBranchId = currentId.concat().reverse()[i] + 1;
          return e.nextStack.length > currentId.concat().reverse()[i] + 1;
        });
      if (branchPoint) {
        console.log('rebra!');
        const branchPointNum = undoStack.lastIndexOf(branchPoint);
        const j = undoStack.length - branchPointNum - 1;
        for (let i = 0; i < j; i++) {
          this.undo();
        }
        const stackUndoStack = stack => {
          const deltaSets = stack.delta;
          if (deltaSets) {
            this.$doc.redoChanges(this.$deserializeDeltas(deltaSets), null);
            undoStack.push(
              this.undoStackObj(
                deltaSets,
                stack.branchId,
                stack.frontStack,
                stack.nextStack,
                stack.stackWidth
              )
            );
            this.dirtyCounter[activeId]++;
          }
          if (stack.nextStack.length === 0) return;
          stackUndoStack(stack.nextStack[0]);
        };
        stackUndoStack(branchPoint.nextStack[nextBranchId]);
        this.$redoStack[activeId] = [];
      } else {
        console.log("can't rebra!");
      }
    };
    AceUndoManager.recomposeUndoStack = function() {
      const activeId = self.props.state.activeTextFile.id;
      const nextStack = [];
      const self = this;
      const undoStack = this.$undoStack[activeId];
      const branchPoint = (function searchBranchPoint(target) {
        console.log(target);
        nextStack.unshift(target);
        if (!target.frontStack) return target;
        if (undoStack.some(e => e === target.frontStack)) {
          return target.frontStack;
        } else {
          return searchBranchPoint(target.frontStack);
        }
      })(target);
      const branchPointNum = undoStack.lastIndexOf(branchPoint);
      const j = undoStack.length - branchPointNum - 1;
      for (let i = 0; i < j; i++) {
        this.undo();
      }
      (function stackUndoStack(stack, i) {
        self.undoStack.push(stack);
        if (stack === target) {
          return;
        } else {
          stackUndoStack(nextStack[i + 1], i + 1);
        }
      })(nextStack[0], 0);
      this.$redoStack[activeId] = [];
      (function stackRedoStack(stack) {
        if (stack.nextStack.length === 0) return;
        self.redoStack.unshift(stack.nextStack[0]);
        stackRedoStack(stack.nextStack[0]);
      })(this.lastUndoStack());
    };
    AceUndoManager.reset = function() {
      this.$undoStack = [];
      this.$redoStack = [];
      this.dirtyCounter = [];
      this.branchId = [];
      this.id = [];
    };
    AceUndoManager.init = function() {
      const activeId = self.props.state.activeTextFile.id;
      this.branchId[activeId] = 0;
      this.$undoStack[activeId] = [
        this.undoStackObj([], this.branchId[activeId], null, [], 1)
      ];
      this.$redoStack[activeId] = [];
      this.$undoStack[activeId][0].id = 0;
      this.id[activeId] = 0;
      this.dirtyCounter[activeId] = 0;
    };
    AceUndoManager.hasUndo = function() {
      const activeId = self.props.state.activeTextFile.id;
      return this.$undoStack[activeId].length > 1;
    };
    AceUndoManager.hasRedo = function() {
      const activeId = self.props.state.activeTextFile.id;
      return this.$redoStack[activeId].length > 0;
    };
    AceUndoManager.markClean = function() {
      const activeId = self.props.state.activeTextFile.id;
      this.dirtyCounter[activeId] = 0;
    };
    AceUndoManager.isClean = function() {
      const activeId = self.props.state.activeTextFile.id;
      return this.dirtyCounter[activeId] === 0;
    };
    AceUndoManager.lastUndoStack = function() {
      const activeId = self.props.state.activeTextFile.id;
      return this.$undoStack[activeId][this.$undoStack[activeId].length - 1];
    };
    AceUndoManager.isBranchPoint = function(stack) {
      return stack.nextStack.length > 1;
    };
    AceUndoManager.updateStackWidth = function(stack) {
      stack.stackWidth++;
      const parent = stack.frontStack;
      if (parent) this.updateStackWidth(parent);
    };
    AceUndoManager.getNextBranchPoint = function(stack) {
      if (!(stack.nextStack.length > 1 || stack.nextStack.length == 0)) {
        return this.getNextBranchPoint(stack.nextStack[0]);
      } else {
        return stack;
      }
    };

    this.undoManager = AceUndoManager;
    this.keyboardHandler = this.editor.getKeyboardHandler();
    this.undoManager.reset();
    this.undoManager.init();
    this.keyboardHandler.addCommand({
      name: 'undo-event',
      bindKey: { win: 'Ctrl+z', mac: 'Command+z' },
      exec: () => {
        try {
          this.undoManager.undo();
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
          this.undoManager.redo();
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
          this.undoManager.unbra();
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
          this.undoManager.rebra();
        } catch (e) {
          console.log(e);
        }
      },
      readOnly: true
    });
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  handleMouseMove(e) {
    if (this.props.state.renderingObject.length > this.props.num + 1) {
      if (this.props.state.renderingObject[this.props.num + 1].scrolling) {
        const width = this.props.state.renderingObject[this.props.num].width;
        const diff = width - e.nativeEvent.clientX;
        const nextElementWidth = this.props.state.renderingObject[
          this.props.num + 1
        ].width;
        this.props.state.sizeChange(this.props.num, width - diff);
        this.props.state.sizeChange(
          this.props.num + 1,
          nextElementWidth + diff
        );
      }
    }
  }
  handleMouseUp() {
    if (this.props.state.renderingObject.length > this.props.num + 1) {
      this.props.state.scrolling(this.props.num + 1, false);
    }
  }
  render() {
    return (
      <div onMouseMove={this.handleMouseMove} onMouseUp={this.handleMouseUp}>
        <AceEditor
          ref="aceEditor"
          style={this.props.style}
          mode={this.props.state.activeTextFile.type}
          theme="dawn"
          fontSize={23}
          editorProps={{
            $blockScrolling: Infinity
          }}
        />
      </div>
    );
  }
}
