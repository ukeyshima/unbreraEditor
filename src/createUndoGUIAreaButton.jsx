import React from "react";
import { inject, observer } from "mobx-react";

@inject("state")
@observer
export default class CreateUndoGUIArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fontColor: "#000"
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
  }
  handleClick() {
    if (
      !this.props.state.renderingObject.some(e => {
        return e.type === "undoGUIArea";
      })
    ) {
      const renderingObjectLength = this.props.state.renderingObject.length;
      const frontElementObjWidth = this.props.state.renderingObject[
        renderingObjectLength - 1
      ].width;
      this.props.state.sizeChange(
        renderingObjectLength - 1,
        frontElementObjWidth * 0.7
      );
      this.props.state.pushRenderingObject({
        type: "undoGUIArea",
        width: frontElementObjWidth * 0.3 - 3,
        scrolling: false
      });
    } else {
      this.props.state.removeRenderingObject("undoGUIArea");
    }
  }
  handleMouseLeave() {
    this.setState({
      fontColor: "#000"
    });
  }
  handleMouseEnter() {
    this.setState({
      fontColor: "#e38"
    });
  }
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
        UndoGUIArea
      </button>
    );
  }
}
