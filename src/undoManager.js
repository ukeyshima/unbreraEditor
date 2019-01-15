export default class UndoManager {
  constructor(editor) {
    this.aceUndoManager = editor.session.$undoManager;
    this.aceUndoManager.reset = this.reset;
    this.aceUndoManager.undoStackObj = this.undoStackObj;
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
    this.$undoStack[0].id = 0;
    this.id = 0;
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
  execute = function(options) {
    this.$redoStack = [];
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
      this.branchId = lastUndoStack.nextStack.length;
    } else {
      this.branchId = lastUndoStack.branchId;
    }
    let deltaSets = options.args[0];
    this.$doc = options.args[1];
    const action = deltaSets[0].deltas[0].action;
    const prevAction =
      this.$undoStack[this.$undoStack.length - 1].delta[0] &&
      this.$undoStack[this.$undoStack.length - 1].delta[0].deltas[0].action;
    if (options.merge && this.hasUndo() && action == prevAction) {
      this.dirtyCounter--;
      deltaSets = this.$undoStack.pop().delta.concat(deltaSets);
      lastUndoStack = this.$undoStack[this.$undoStack.length - 1];
      lastUndoStack.nextStack.pop();
    }
    if (this.dirtyCounter < 0) {
      this.dirtyCounter = NaN;
    }
    this.$undoStack.push(
      this.undoStackObj(deltaSets, this.branchId, lastUndoStack, [], 1)
    );
    this.dirtyCounter++;
    lastUndoStack.nextStack.push(this.lastUndoStack());
    if (lastUndoStack.nextStack.length > 1)
      this.updateStackWidth(lastUndoStack);
    this.id++;
    this.lastUndoStack().id = this.i$d;
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
    const lastUndoStack = Object.assign({}, this.lastUndoStack());
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
    const lastUndoStack = Object.assign({}, this.lastUndoStack());
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
    const self = this;
    const undoStack = this.$undoStack;
    const branchPoint = (function searchBranchPoint(target) {
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
      undoStack.push(stack);
      if (stack === target) {
        return;
      } else {
        stackUndoStack(nextStack[i + 1], i + 1);
      }
    })(nextStack[0], 0);
    this.$redoStack = [];
    (function stackRedoStack(stack) {
      if (stack.nextStack.length === 0) return;
      self.$redoStack.unshift(stack.nextStack[0]);
      stackRedoStack(stack.nextStack[0]);
    })(this.lastUndoStack());
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
    stack.stackWidth++;
    const parent = stack.frontStack;
    if (parent) this.updateStackWidth(parent);
  };
  getNextBranchPoint = function(stack) {
    if (!(stack.nextStack.length > 1 || stack.nextStack.length == 0)) {
      return this.getNextBranchPoint(stack.nextStack[0]);
    } else {
      return stack;
    }
  };
}
