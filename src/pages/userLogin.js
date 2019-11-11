import React, { Component } from 'react'
import { Button, Select, Modal, Input, message, Progress } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';


import { AppAccountListener } from "../listener/AppAccountListener";
import { AppMessageListener } from "../listener/AppMessageListener";
// import { AppFileManagerListener } from "../listener/AppFileManagerListener";

// import UserLogin from "../common/UserLogin";
import * as CubeCore from "../assets/lib/CubeCore";
// import * as CubeFile from "../assets/lib/CubeFile";
import * as CubeMessage from "../assets/lib/CubeMessage";

import { CubeFileStatusListener } from "../listener/CubeFileStatusListener";
// var CubeFileInfo = Info,
var CubeImageMessage = CubeMessage.Entity.Image;
window.CubeCore = CubeCore;
const { Option } = Select;
class UserLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appId: localStorage.getItem("appId") ? localStorage.getItem("appId") : '9c2ed36ae5d34131b3768ea432da6cea005',
      appKey: localStorage.getItem("appKey") ? localStorage.getItem("appKey") : '5df6d5495fb74b35ad157c94977527ff005',
      loginStatus: '请先登录',
      accountInfo: [],
      cubeId: '',
      sendCubeId: '',
      errorInfo: '',
    }
  }
  messageSuccess(des){
    message.success(des)
  }
  messageErro(des){
    message.error(des)
  }
  onChange(value) {
    this.setState({ 'cubeId': value })
  }
  onChangeSendCubeId(value) {
    this.setState({ 'sendCubeId': value })
  }
  getAccount(appKey, appId, callback) {
    var self = this;
    api.user.findByAppId(appKey, appId).then(result => {
      if (result.state.code == 200) {
        this.setState({
          'accountInfo': result.data.list,
          'cubeId': result.data.list[0].cubeId,
          'sendCubeId': result.data.list[1].cubeId
        })
        if (callback && typeof callback == "function") {
          callback && callback();
        }
      } else {
        this.setState({ 'centerDialogVisible': true })
      }
    })
      .catch(e => {
        this.setState({
          'centerDialogVisible': true,
          'errorInfo': "注册操作出错，请检查用户名是否在证书的有效号段内。"
        })

      });
  }
  handleOk() {
    this.setState({ 'centerDialogVisible': false })
  }

  login() {
    var self = this;
    this.setState({ 'loginStatus': '登陆中...' })
    api.user.getToken(this.state.appKey, this.state.appId, this.state.cubeId).then(result => {
      if (result.state.code == 200) {
        self.state.cubeToken = result.data.cubeToken;
        var loginData = {
          appKey: self.state.appKey,
          appId: self.state.appId,
          cube: self.state.cubeId
        };
        var displayName = "name";

        var ret = cube.getAccountService().login(
          loginData.cube.toString(),
          "123456",
          self.state.cubeToken,
          displayName
        );
        if (!ret) {
          self.showAlert(
            "注册操作出错，请检查用户名是否在证书的有效号段内。"
          );
        } else {
        }
      } else {
        self.centerDialogVisible = true;
      }
    })
      .catch(e => {
        self.centerDialogVisible = true;
        self.errorInfo = "注册操作出错，请检查用户名是否在证书的有效号段内。";
      });
  }
  loginOut() {
    this.setState({ 'isLoginOut': true })
  }
  handleLoginOut(type) {
    this.setState({ 'isLoginOut': false })
    if (type) {
      cube.getAccountService().logout();
    } else {

      this.setState({ 'isLogin': false })
    }

  }
  
  //启动时调用的生命周期
  componentWillMount() {
    this.getAccount(this.state.appKey, this.state.appId)
  }
  render() {
    if (this.state.isEngineLogin == 'success') {
      this.state.loginStatus = '登录成功';
      this.state.isLogin = true;
    } else {
      this.state.loginStatus = '请先登录';
      this.state.isLogin = false;
    }
   
    return (
        <div className="ly-content-box">
          <div className="login-title">用户登录</div>
          <div className="tx-c login-status">{this.state.loginStatus}</div>
          <div className="mb10">

            <Select placeholder='请输入账号' value={this.state.cubeId} style={{ width: 215,marginBottom:20 }} onChange={(event) => this.onChange(event)}>
              {
                this.state.accountInfo.map((item, index) => {
                  return <Option key={index} value={item.cubeId}>{item.cubeId}</Option>
                })

              }
            </Select>
            <div>
              <Button className="mr10" type="primary" disabled={this.state.isLogin} onClick={(event) => this.login()}>登录</Button>
              <Button className="mr10" type="danger" disabled={!this.state.isLogin} onClick={(event) => this.loginOut()}>注销</Button>
              <Button className="mr10" type="primary">创建cubeId</Button>
            </div>
          </div>
          <Modal
            title="提示"
            visible={this.state.centerDialogVisible}
            onOk={(event) => this.handleOk()}
            onCancel={(event) => this.handleOk()}
          >
            <p>{this.state.errorInfo}</p>
          </Modal>
          <Modal
            title="提示"
            visible={this.state.isLoginOut}
            onOk={(event) => this.handleLoginOut(true)}
            onCancel={(event) => this.handleLoginOut(false)}
          >
            <p>"是否确定退出登录?"</p>
          </Modal>
        </div>
       
    );
  }
}

function select(store) {
  return {
    accountInfo: store.default.userStore.accountInfo,
    status: store.default.userStore.status,
  }
}

export default connect(select)(userLogin);