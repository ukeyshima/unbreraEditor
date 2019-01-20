import React from 'react';
import UnbreraGUIAreaHeader from './unbreraGUIAreaHeader';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { FaStackOverflow } from 'react-icons/fa';

@inject(({ state }) => ({
  undoManager: state.undoManager,
  updateVisualizeTreeUndoFunction: state.updateVisualizeTreeUndoFunction,
  imgSize: state.imgSize,
  unbreraGUIAreaWidth: state.unbreraGUIAreaWidth,
  unbreraGUIAreaHeight: state.unbreraGUIAreaHeight,
  currentStackBackgroundSize: state.currentStackBackgroundSize,
  unbreraGUIAreaPositionX: state.unbreraGUIAreaPosition.x,
  unbreraGUIAreaPositionY: state.unbreraGUIAreaPosition.y,
  headerHeight: state.headerHeight
}))
@observer
export default class UnbreraGUIArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visualizeUndoStack: [],
      lastVisualizeUndoStackCoord: [
        (this.props.imgSize * 3) / 2 - this.props.imgSize / 2,
        (this.props.imgSize * 5) / 4 - this.props.imgSize / 2
      ],
      visualizeBranch: [],
      scrollLeft: 0,
      scrollTop: 0
    };
  }
  componentDidMount() {
    this.props.updateVisualizeTreeUndoFunction(this.visualizeTreeUndo);
    setTimeout(() => {
      this.visualizeTreeUndo(
        this.props.undoManager.$undoStack[0],
        this.props.undoManager.$redoStack,
        this.props.imgSize,
        (this.props.undoManager.$undoStack[0].stackWidth / 2) *
          ((this.props.imgSize / 2) * 3)
      );
    }, 10);
    this.wrapperDivArea.addEventListener('scroll', this.handleScroll(this));
  }
  componentWillUnmount() {
    this.wrapperDivArea.removeEventListener('scroll', this.handleScroll(this));
  }
  createTreeObj = (stack, redoStack, x, y) => {
    this.visualizeUndoStack.push({
      stack: stack,
      x: x,
      y: y,
      width: this.props.imgSize,
      height: this.props.imgSize
    });
    if (this.props.undoManager.isEqualUndoStackObj(stack, this.lastUndoStack)) {
      this.lastVisualizeUndoStackCoord = [
        x - (this.props.currentStackBackgroundSize - this.props.imgSize) / 2,
        y - (this.props.currentStackBackgroundSize - this.props.imgSize) / 2
      ];
    }
    if (stack.nextStack.length > 0) {
      let totalSpread =
        -(stack.stackWidth - 1) / 2 +
        (this.props.undoManager.getNextBranchPoint(stack.nextStack[0])
          .stackWidth -
          1) /
          2;
      let num = 0;
      stack.nextStack.forEach((e, i) => {
        if (i !== 0) {
          totalSpread +=
            (this.props.undoManager.getNextBranchPoint(stack.nextStack[i - 1])
              .stackWidth -
              1) /
              2 +
            (this.props.undoManager.getNextBranchPoint(stack.nextStack[i])
              .stackWidth -
              1) /
              2;
        }
        num = totalSpread + i;
        this.visualizeBranch.push({
          x1: x + this.props.imgSize,
          y1: y + this.props.imgSize / 2,
          x2: x + (this.props.imgSize / 2) * 3,
          y2: y + (this.props.imgSize / 2) * 3 * num + this.props.imgSize / 2,
          x3: x + this.props.imgSize + (this.props.imgSize / 10) * 3,
          y3: y + this.props.imgSize / 2,
          x4: x + (this.props.imgSize / 2) * 3 - (this.props.imgSize / 10) * 3,
          y4: y + (this.props.imgSize / 2) * 3 * num + this.props.imgSize / 2,
          stroke: this.props.undoManager.$undoStack.some(e => {
            return this.props.undoManager.isEqualUndoStackObj(
              e,
              stack.nextStack[i]
            );
          })
            ? '#f26'
            : redoStack.some(e =>
                this.props.undoManager.isEqualUndoStackObj(
                  e,
                  stack.nextStack[i]
                )
              )
            ? '#4f2'
            : '#24f'
        });
        this.createTreeObj(
          e,
          redoStack,
          x + (this.props.imgSize / 2) * 3,
          y + (this.props.imgSize / 2) * 3 * num
        );
      });
    }
  };
  regenerateUndoStack = () => {
    const stackLoop = (frontStack, currentStack) => {
      const nextStack = currentStack.nextStack;
      if (nextStack.length === 0)
        this.props.undoManager.undoStackObj(
          currentStack.delta,
          currentStack.branchId,
          frontStack,
          [],
          currentStack.stackWidth
        );
      currentStack.nextStack = _.map(nextStack, e => {
        return this.props.undoManager.undoStackObj(
          e.delta,
          e.branchId,
          currentStack,
          _.map(e.nextStack, f => {
            return stackLoop(currentStack, f);
          }),
          e.stackWidth
        );
      });
      return currentStack;
    };
    const undoManager = this.props.undoManager;
    const startUndoStack = stackLoop(null, undoManager.$undoStack[0]);
    const branchIds = undoManager.$undoStack.map(e => {
      return e.branchId;
    });
    const stackStack = (stack, loopCount, Ids) => {
      undoManager.$undoStack[loopCount] = stack;
      loopCount++;
      if (loopCount >= undoManager.$undoStack.length) return;
      stackStack(
        stack.nextStack[stack.nextStack.length > 1 ? Ids[loopCount] : 0],
        loopCount,
        Ids
      );
    };
    stackStack(startUndoStack, 0, branchIds);
  };

  visualizeTreeUndo = () => {
    this.regenerateUndoStack();
    const startUndoStack = this.props.undoManager.$undoStack[0];
    const redoStack = this.props.undoManager.$redoStack;
    const x = 50;
    const y = (startUndoStack.stackWidth / 2) * ((50 / 2) * 3);
    this.visualizeUndoStack = [];
    this.visualizeBranch = [];
    this.lastUndoStack = this.props.undoManager.lastUndoStack();
    this.lastVisualizeUndoStackCoord = [
      (this.props.imgSize * 3) / 2 - this.props.currentStackBackgroundSize / 2,
      (this.props.imgSize * 5) / 4 - this.props.currentStackBackgroundSize / 2
    ];
    this.createTreeObj(startUndoStack, redoStack, x, y);
    this.setState({
      lastVisualizeUndoStackCoord: this.lastVisualizeUndoStackCoord,
      visualizeUndoStack: this.visualizeUndoStack,
      visualizeBranch: this.visualizeBranch
    });
  };
  imgHandleClick = stack => {
    return () => {
      this.props.undoManager.recomposeUndoStack(stack);
      this.visualizeTreeUndo(
        this.props.undoManager.$undoStack[0],
        this.props.undoManager.$redoStack,
        this.props.imgSize,
        (this.props.undoManager.$undoStack[0].stackWidth / 2) *
          ((this.props.imgSize / 2) * 3)
      );
    };
  };
  handleScroll = self => {
    return function(e) {
      self.setState({
        scrollLeft: this.scrollLeft,
        scrollTop: this.scrollTop
      });
    };
  };
  render() {
    return (
      <div
        ref={e => (this.wrapperDivArea = e)}
        onMouseUp={this.handleMouseUp}
        style={this.props.style}
      >
        <UnbreraGUIAreaHeader
          style={{
            width: this.props.style.width,
            height: 20,
            backgroundColor: '#ddd',
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            position: 'absolute',
            left: this.state.scrollLeft,
            top: this.state.scrollTop
          }}
        />
        <svg
          touch-action='auto'
          style={{
            width: this.props.style.width,
            height: this.props.style.height - 20,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
            borderWidth: 0,
            backgroundColor: '#111',
            position: 'absolute',
            left: this.state.scrollLeft,
            top: this.state.scrollTop + this.props.headerHeight,
            userSelect: 'none'
          }}
          xmlns='http://www.w3.org/2000/svg'
          xmlnsXlink='http://www.w3.org/1999/xlink'
        >
          {this.state.visualizeBranch.map((e, i) => {
            const xm = Math.min(e.x1, e.x2, e.x3, e.x4);
            const xM = Math.max(e.x1, e.x2, e.x3, e.x4);
            const ym = Math.min(e.y1, e.y2, e.y3, e.y4);
            const yM = Math.max(e.y1, e.y2, e.y3, e.y4);
            if (
              xm - this.state.scrollLeft < this.props.unbreraGUIAreaWidth &&
              xM - this.state.scrollLeft > 0 &&
              ym - this.state.scrollTop < this.props.unbreraGUIAreaHeight &&
              yM - this.state.scrollTop > 0
            )
              return (
                <path
                  key={i}
                  stroke={e.stroke}
                  strokeWidth='3'
                  d={`M ${e.x1 - this.state.scrollLeft},${e.y1 -
                    this.state.scrollTop}
                                C ${e.x3 - this.state.scrollLeft},${e.y3 -
                    this.state.scrollTop} ${e.x4 -
                    this.state.scrollLeft},${e.y4 -
                    this.state.scrollTop} ${e.x2 -
                    this.state.scrollLeft},${e.y2 - this.state.scrollTop}`}
                />
              );
          })}
          <rect
            x={
              this.state.lastVisualizeUndoStackCoord[0] - this.state.scrollLeft
            }
            y={this.state.lastVisualizeUndoStackCoord[1] - this.state.scrollTop}
            width={this.props.currentStackBackgroundSize}
            height={this.props.currentStackBackgroundSize}
            fill='#e38'
          />
          {this.state.visualizeUndoStack.map((e, i) => {
            if (
              e.x - this.state.scrollLeft < this.props.unbreraGUIAreaWidth &&
              e.x - this.state.scrollLeft + this.props.imgSize > 0 &&
              e.y - this.state.scrollTop < this.props.unbreraGUIAreaHeight &&
              e.y - this.state.scrollTop + this.props.imgSize > 0
            ) {
              const text = e.stack.delta.reduce((prev, curr) => {
                return (
                  prev +
                  curr.deltas.reduce((pre, cur) => {
                    return pre + cur.lines;
                  }, '')
                );
              }, '');
              return (
                <React.Fragment key={i}>
                  <rect
                    x={e.x - this.state.scrollLeft}
                    y={e.y - this.state.scrollTop}
                    fill={
                      e.stack.delta.length > 0 &&
                      e.stack.delta[0].deltas[0].action === 'insert'
                        ? '#3E4C65'
                        : '#2884C3'
                    }
                    width={this.props.imgSize}
                    height={this.props.imgSize}
                  />
                  <text
                    x={e.x - this.state.scrollLeft}
                    y={e.y - this.state.scrollTop + 30}
                    fontSize={
                      (this.props.imgSize * 2) / text.length > 30
                        ? 30
                        : (this.props.imgSize * 2) / text.length
                    }
                    fill='#fff'
                  >
                    {text}
                  </text>
                </React.Fragment>
              );
            }
          })}
        </svg>
        {(() => {
          const maxX = Math.max(...this.state.visualizeUndoStack.map(e => e.x));
          const maxY = Math.max(...this.state.visualizeUndoStack.map(e => e.y));
          return this.state.visualizeUndoStack.map((e, i) => {
            if (
              (e.x - this.state.scrollLeft < this.props.unbreraGUIAreaWidth &&
                e.x - this.state.scrollLeft + this.props.imgSize > 0 &&
                e.y - this.state.scrollTop < this.props.unbreraGUIAreaHeight &&
                e.y - this.state.scrollTop + this.props.imgSize > 0) ||
              e.x === maxX ||
              e.y === maxY
            )
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: e.x,
                    top: e.y + this.props.headerHeight,
                    width: this.props.imgSize,
                    height: this.props.imgSize
                  }}
                  onClick={this.imgHandleClick(e.stack)}
                  onTouchStart={this.imgHandleClick(e.stack)}
                />
              );
          });
        })()}
      </div>
    );
  }
}
