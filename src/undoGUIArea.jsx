import React from "react";
import { inject, observer } from "mobx-react";

@inject("state")
@observer
export default class UndoGUIArea extends React.Component {
  constructor(props) {
    super(props);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.width = window.innerWidth;
  }
  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }
  handleResize(e) {
    let diff = -3;
    this.props.state.renderingObject.forEach(e => {
      diff += 3;
      if (e.type == "run") {
        diff += 4;
      }
    });
    const per = (window.innerWidth - diff) / (this.width - diff);
    const width = this.props.state.renderingObject[this.props.num].width;
    this.props.state.sizeChange(this.props.num, width * per);
    this.width = window.innerWidth;
  }
  handleMouseMove(e) {
    if (this.props.state.renderingObject[this.props.num].scrolling) {
      const width = this.props.state.renderingObject[this.props.num].width;
      const diff = e.nativeEvent.movementX;
      const frontElementWidth = this.props.state.renderingObject[
        this.props.num - 1
      ].width;
      this.props.state.sizeChange(this.props.num - 1, frontElementWidth + diff);
      this.props.state.sizeChange(this.props.num, width - diff);
    }
    if (this.props.state.renderingObject.length > this.props.num + 1) {
      if (this.props.state.renderingObject[this.props.num + 1].scrolling) {
        const width = this.props.state.renderingObject[this.props.num].width;
        const diff = -e.nativeEvent.movementX;
        const nextElementWidth = this.props.state.renderingObject[
          this.props.num + 1
        ].width;
        this.props.state.sizeChange(
          this.props.num + 1,
          nextElementWidth + diff
        );
        this.props.state.sizeChange(this.props.num, width - diff);
      }
    }
  }
  render() {
    return <div onMouseMove={this.handleMouseMove} style={this.props.style} />;
  }
}
