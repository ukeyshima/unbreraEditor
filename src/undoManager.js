import _ from 'lodash';

export default class UndoManager {
  constructor(editor) {
    this.aceUndoManager = editor.session.$undoManager;
    this.aceUndoManager.reset = this.reset;
    this.aceUndoManager.undoStackObj = this.undoStackObj;
    this.aceUndoManager.isEqualUndoStackObj = this.isEqualUndoStackObj;
    this.aceUndoManager.execute = this.execute;
    this.aceUndoManager.undo = this.undo;
    this.aceUndoManager.redo = this.redo;
    this.aceUndoManager.unbra = this.unbra;
    this.aceUndoManager.rebra = this.rebra;
    this.aceUndoManager.recomposeUndoStack = this.recomposeUndoStack;
    this.aceUndoManager.hasUndoStack = this.hasUndoStack;
    this.aceUndoManager.hasRedoStack = this.hasRedoStack;
    this.aceUndoManager.lastUndoStack = this.lastUndoStack;
    this.aceUndoManager.isBranchPoint = this.isBranchPoint;
    this.aceUndoManager.updateStackWidth = this.updateStackWidth;
    this.aceUndoManager.getNextBranchPoint = this.getNextBranchPoint;

    this.aceUndoManager.reset();
  }

  reset = function() {
    this.branchId = 0;
    this.$undoStack = [this.undoStackObj([], this.branchId, null, [], 1)];
    this.$redoStack = [];
  };

  undoStackObj = function(delta, branchId, frontStack, nextStack, stackWidth) {
    return {
      delta: delta,
      branchId: branchId,
      frontStack: frontStack,
      nextStack: nextStack,
      stackWidth: stackWidth
    };
  };
  isEqualUndoStackObj = function(stack1, stack2) {
    return (
      _.isEqual(stack1.delta, stack2.delta) &&
      stack1.branchId == stack2.branchId &&
      stack1.stackWidth == stack2.stackWidth
    );
  };
  execute = function(options) {
    this.$redoStack = [];
    let lastUndoStack = this.lastUndoStack();
    if (lastUndoStack.nextStack.length > 0) {
      const repaintBranchId = stack => {
        stack.branchId = 0;
        if (!(stack.nextStack.length > 1 || stack.nextStack.length == 0)) {
          repaintBranchId(stack.nextStack[0]);
        } else {
          return;
        }
      };
      repaintBranchId(lastUndoStack.nextStack[0]);
      this.branchId = lastUndoStack.nextStack.length;
    } else {
      this.branchId = lastUndoStack.branchId;
    }
    let deltaSets = options.args[0];
    this.$doc = options.args[1];
    const action = deltaSets[0].deltas[0].action;
    const prevAction =
      lastUndoStack.delta[0] && lastUndoStack.delta[0].deltas[0].action;      
    if (options.merge && this.hasUndoStack() && action === prevAction) {
      this.dirtyCounter--;
      const popStack = this.$undoStack.pop();
      deltaSets = popStack.delta.concat(deltaSets);
      lastUndoStack = this.lastUndoStack();
      lastUndoStack.nextStack.pop();
      const newUndoStack = this.undoStackObj(
        deltaSets,
        this.branchId,
        lastUndoStack,
        [],
        1
      );
      this.$undoStack.push(newUndoStack);
      lastUndoStack.nextStack.push(newUndoStack);
    } else {
      const newUndoStack = this.undoStackObj(
        deltaSets,
        this.branchId,
        lastUndoStack,
        [],
        1
      );
      this.$undoStack.push(newUndoStack);
      lastUndoStack.nextStack.push(newUndoStack);
      if (lastUndoStack.nextStack.length > 1)
        this.updateStackWidth(lastUndoStack);
    }
    if (this.dirtyCounter < 0) {
      this.dirtyCounter = NaN;
    }
    this.dirtyCounter++;    
  };
  undo = function(dontSelect) {
    if (this.hasUndoStack()) {
      const stack = this.$undoStack.pop();
      const deltaSets = stack.delta;
      let undoSelectionRange = null;
      if (deltaSets) {
        undoSelectionRange = this.$doc.undoChanges(deltaSets, dontSelect);
        this.$redoStack.push(
          this.undoStackObj(
            deltaSets,
            stack.branchId,
            stack.frontStack,
            stack.nextStack,
            stack.stackWidth
          )
        );
        this.dirtyCounter--;
      }
      return undoSelectionRange;
    } else {
      console.log("can't undo!");
    }
  };
  redo = function(dontSelect) {
    if (this.hasRedoStack()) {
      const stack = this.$redoStack.pop();
      const deltaSets = stack.delta;
      let redoSelectionRange = null;
      if (deltaSets) {
        redoSelectionRange = this.$doc.redoChanges(
          this.$deserializeDeltas(deltaSets),
          dontSelect
        );
        this.$undoStack.push(
          this.undoStackObj(
            deltaSets,
            stack.branchId,
            stack.frontStack,
            stack.nextStack,
            stack.stackWidth
          )
        );
        this.dirtyCounter++;
      }
      return redoSelectionRange;
    } else {
      console.log("can't redo!");
    }
  };
  unbra = function() {
    const lastUndoStack = _.cloneDeep(this.lastUndoStack());
    const undoStack = this.$undoStack;
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
      const branchPointNum = _.lastIndexOf(undoStack, branchPoint);
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
          this.dirtyCounter++;
        }
        if (stack.nextStack.length === 0) return;
        stackUndoStack(stack.nextStack[stack.nextStack.length - 1]);
      };
      stackUndoStack(branchPoint.nextStack[nextBranchId]);
      this.$redoStack = [];
    } else {
      console.log("can't unbra!");
    }
  };
  rebra = function() {
    const lastUndoStack = _.cloneDeep(this.lastUndoStack());
    const undoStack = this.$undoStack;
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
      const branchPointNum = _.lastIndexOf(undoStack, branchPoint);
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
          this.dirtyCounter++;
        }
        if (stack.nextStack.length === 0) return;
        stackUndoStack(stack.nextStack[0]);
      };
      stackUndoStack(branchPoint.nextStack[nextBranchId]);
      this.$redoStack = [];
    } else {
      console.log("can't rebra!");
    }
  };
  recomposeUndoStack = function(target) {
    const nextStack = [];
    const undoStack = this.$undoStack;
    const searchBranchPoint = target => {
      nextStack.unshift(target);
      if (!target.frontStack) return target;
      if (undoStack.some(e => this.isEqualUndoStackObj(e, target.frontStack))) {
        return target.frontStack;
      } else {
        return searchBranchPoint(target.frontStack);
      }
    };
    const branchPoint = searchBranchPoint(target);
    let branchPointNum;
    undoStack
      .concat()
      .reverse()
      .forEach((e, i) => {
        if (this.isEqualUndoStackObj(e, branchPoint)) {
          branchPointNum = undoStack.length - i - 1;
        }
      });

    const j = undoStack.length - branchPointNum - 1;
    for (let i = 0; i < j; i++) {
      this.undo();
    }
    const stackUndoStack = stack => {
      if (!stack) return;
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
        this.dirtyCounter++;
      }
      if (this.isEqualUndoStackObj(stack, target)) {
        return;
      } else {
        stackUndoStack(stack.nextStack[0]);
      }
    };
    stackUndoStack(nextStack[0], 0);
    this.$redoStack = [];
    const stackRedoStack = stack => {
      if (stack.nextStack.length === 0) return;
      this.$redoStack.unshift(stack.nextStack[0]);
      stackRedoStack(stack.nextStack[0]);
    };
    stackRedoStack(this.lastUndoStack());
  };
  hasUndoStack = function() {
    return this.$undoStack.length > 1;
  };
  hasRedoStack = function() {
    return this.$redoStack.length > 0;
  };
  lastUndoStack = function() {
    return this.$undoStack[this.$undoStack.length - 1];
  };
  isBranchPoint = function(stack) {
    return stack.nextStack.length > 1;
  };
  updateStackWidth = function(stack) {
    const parent = stack.frontStack;
    let currentStackIndex;
    this.$undoStack.forEach((e, i) => {
      if (this.isEqualUndoStackObj(e, stack)) {
        currentStackIndex = i;
      }
    });
    let parentNextStackIndex;
    if (parent) {
      parent.nextStack.forEach((e, i) => {
        if (this.isEqualUndoStackObj(e, stack)) {
          parentNextStackIndex = i;
        }
      });
    }
    stack.stackWidth++;
    if (parent) {
      this.$undoStack[currentStackIndex] = stack;
      parent.nextStack[parentNextStackIndex] = stack;
      this.updateStackWidth(parent);
    }
  };
  getNextBranchPoint = function(stack) {
    if (!(stack.nextStack.length > 1 || stack.nextStack.length === 0)) {
      return this.getNextBranchPoint(stack.nextStack[0]);
    } else {
      return stack;
    }
  };
}
