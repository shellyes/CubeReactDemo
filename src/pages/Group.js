import React, { Component } from 'react'
import { Button, Select, Modal, Input, message, Progress } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';

import { AppGroupListener } from "../listener/AppGroupListener";
import { AppAccountListener } from "../listener/AppAccountListener";
const { Option } = Select;
class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appId: localStorage.getItem("appId") ? localStorage.getItem("appId") : '9c2ed36ae5d34131b3768ea432da6cea005',
      appKey: localStorage.getItem("appKey") ? localStorage.getItem("appKey") : '5df6d5495fb74b35ad157c94977527ff005',
      loginStatus: '请先登录',
      accountInfo: [],
      centerDialogVisible: false,
      cubeId: '',
      sendCubeId: '',
      errorInfo: '',
      isLogin: false,
      licenseServer: 'https://test-license.shixincube.cn/auth/license/get',
      isEngineLogin: '',
      isLoginOut: false,
      sendCubeId: "",

      dialogFormVisible: false,
      members: [],
      displayName: "",
      groupList: [],
      group: {}
    }
  }
  create() {
    var self = this;
    api.user
      .createCube(this.state.appKey, this.state.appId)
      .then(result => {
        if (result.state.code == 200) {
          self.setState({
            "centerDialogVisible": true,
            "errorInfo": "创建成功,cubeId:" + result.data.cube
          })
        }
      })
      .catch(e => {
        self.setState({
          "centerDialogVisible": true,
          "errorInfo": "注册操作出错，请检查用户名是否在证书的有效号段内。"
        })
      });
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
  // 创建cubeID
  createCube() {
    var self = this;
    console.log(api)
    api.user.createCube(this.state.appKey, this.state.appId).then(result => {
      if (result.state.code == 200) {
        self.setState({
          'centerDialogVisible': true,
          'errorInfo': "创建成功,cubeId:" + result.data.cube
        })
      }
    })
      .catch(e => {
        self.setState({
          'centerDialogVisible': true,
          'errorInfo': "注册操作出错，请检查用户名是否在证书的有效号段内。"
        });
      });
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
  //删除群组
  handleDelete(info) {
    //获取Cube群组服务
    var groupService = cube.getGroupService();
    var ret = groupService.deleteGroup(info.name);
    if (ret) {
      message.success("删除群组成功!");
    }
  }
  //
  handleCreate() {
    this.setState({ "dialogFormVisible": true })
  }
  //创建群组
  createGroup() {
    var self = this;
    if (self.state.displayName.trim().length == 0) {
      message.error("请输入群名称");
      return false;
    }
    if (self.state.members.length == 0) {
      message.error("请输入群成员");
      return false;
    }
    //获取Cube群组服务
    var groupService = cube.getGroupService();
    var ret = groupService.createGroup(self.state.displayName, self.state.members.split(","));
    if (ret) {
      self.state.dialogFormVisible = false;
      message.success("创建成功");
    }
  }
  //取消创建
  onCancelCreate() {
    this.setState({ "dialogFormVisible": false })

  }
  //设置群名
  onChangeName(event) {
    this.setState({ "displayName": event.target.value })
  }
  //设置群成员
  onChangeMembers(event) {
    this.setState({ "members": event.target.value })
  }
  //启动时调用的生命周期
  componentWillMount() {
    if (
      cube.startup(err => {
        if (err) {
          console.log("引擎启动失败");
        } else {
          cube.getAccountService().addListener(new AppAccountListener(this));
          //消息监听
          cube.getGroupService().addListener(new AppGroupListener(this));

        }
      })
    ) {
      console.log("引擎启动中....");
      let appId = localStorage.getItem("appId") ? localStorage.getItem("appId") : '9c2ed36ae5d34131b3768ea432da6cea005'
      cube.configure({
        appid: appId,
        licenseServer: this.state.licenseServer
      });
    } else {
      console.log("Cube Engine 启动失败！");
    }
    this.getAccount(this.state.appKey, this.state.appId)
  }

  render() {
    if (this.state.isEngineLogin == 'success') {
      this.state.loginStatus = '登录成功';
      this.state.isLogin = true;
    } else if (this.state.loginStatus == '') {
      this.state.loginStatus = '正在登录...';
      this.state.isLogin = false;
    } else {
      this.state.loginStatus = '请先登录';
      this.state.isLogin = false;
    }
    return (
      <div className='ly-wrapper'>
        <div className="ly-content-box">
          <div className="login-title">用户登录</div>
          <div className="tx-c login-status">{this.state.loginStatus}</div>
          <div className="mb10">
            <Select disabled={this.state.isLogin} placeholder='请输入账号' value={this.state.cubeId} style={{ width: 215, marginBottom: 20 }} onChange={(event) => this.onChange(event)}>
              {
                this.state.accountInfo.map((item, index) => {
                  return <Option key={index} value={item.cubeId}>{item.cubeId}</Option>
                })

              }
            </Select>
            <div>
              <Button className="mr10" type="primary" disabled={this.state.isLogin} onClick={(event) => this.login()}>登录</Button>
              <Button className="mr10" type="danger" disabled={!this.state.isLogin} onClick={(event) => this.loginOut()}>注销</Button>
              <Button className="mr10" type="primary" onClick={(event) => this.createCube()}>创建cubeId</Button>
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
        <div className="create-whiteboard ly-content-box">
          <div className="login-title">群组列表</div>
          <Button type="primary" onClick={(event) => { this.handleCreate() }}>创建群组</Button>
          <div className="whiteboard-list mt10">
            <div className="whiteboard-box">
              {
                this.state.groupList.map((item) => {
                  return <div className="groupItem flex felx-pac bb ptb10 mb10">
                    <div className="flex felx-f1">
                      群名称:{item.displayName}
                    </div>
                    <Button type="danger" onClick={(event) => this.handleDelete(item)}>删除</Button>
                  </div>
                })
              }
              <Modal
                title="创建群组"
                visible={this.state.dialogFormVisible}
                onOk={(event) => this.createGroup()}
                onCancel={(event) => this.onCancelCreate()}
              >
                <div className="flex flex-pac mb10">
                  <div className="mr10">群名称:</div>
                  <Input className="flex-f1" placeholder="请输入群名称" value={this.state.displayName} onChange={(event) => this.onChangeName(event)}></Input>
                </div>
                <div className="flex flex-pac">
                  <div className="mr10">群成员:</div>
                  <Input className="flex-f1" placeholder="输入成员Cube号码, 用','号分开" value={this.state.members} onChange={(event) => this.onChangeMembers(event)}></Input>
                </div>
              </Modal>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
function select(store) {
  return {
    userInfo: store.default.userStore.userInfo,
    status: store.default.userStore.status,
  }
}
export default connect(select)(Group)