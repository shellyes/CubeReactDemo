import React, { Component } from "react";
import { Button, Input } from "antd";
import { connect } from "react-redux";
import "../assets/css/mian.css";

import imgUrl from "../assets/img/logo120.png";
class DemoItem extends Component {
  constructor(props) {
    super(props);
  }

  goToDemo(event, type) {
    this.props.history.push("/" + type);
  }
  render() {
    var classes = this.props;
    return (
      <div className="ms-login">
        <img className="cube-logo" src={imgUrl} />
        <Button
          onClick={event => this.goToDemo(event, "message")}
          className="login-btn"
          type="primary"
        >
          消息Demo
        </Button>
        <Button
          onClick={event => this.goToDemo(event, "call")}
          className="login-btn"
          type="primary"
        >
          音视频Demo
        </Button>
        <Button
          onClick={event => this.goToDemo(event, "whiteboard")}
          className="login-btn"
          type="primary"
        >
          白板Demo
        </Button>
        <Button
          onClick={event => this.goToDemo(event, "group")}
          className="login-btn"
          type="primary"
        >
          群组Demo
        </Button>
        <Button
          onClick={event => this.goToDemo(event, "file")}
          className="login-btn"
          type="primary"
        >
          文件管理Demo
        </Button>
        <Button onClick={(event)=>this.goToDemo(event,'conference')} className="login-btn" type="primary">
                    会议Demo
                </Button>
      </div>
    );
  }
}

function select(store) {
  return {
    userInfo: store.default.userStore.userInfo,
    status: store.default.userStore.status
  };
}

export default connect(select)(DemoItem);
