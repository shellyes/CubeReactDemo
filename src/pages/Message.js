import React, { Component } from 'react'
import { Button, Select, Modal, Input, message, Progress } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';


import { AppAccountListener } from "../listener/AppAccountListener";
import { AppMessageListener } from "../listener/AppMessageListener";
import { AppFileManagerListener } from "../listener/AppFileManagerListener";

// import UserLogin from "../common/UserLogin";
import * as CubeCore from "cube/CubeCore";
import * as CubeFile from "cube/CubeFile";
import * as CubeMessage from "cube/CubeMessage";

import { CubeFileStatusListener } from "../listener/CubeFileStatusListener";
let appInfo = require(`${__dirname}/../../appInfo`);

var CubeFileInfo = CubeFile.Info;
var CubeImageMessage = CubeMessage.Entity.Image;
window.CubeCore = CubeCore;
const { Option } = Select;
class Message extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appId: appInfo.appId,
      appKey: appInfo.appKey,
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
      messageList: [],
      messageContent: ''
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
  //文本内容
  onChangeContent(event) {
    this.setState({ "messageContent": event.target.value })
  }
  //发送消息
  sendMessage(type) {
    var self = this;
    if (!self.state.sendCubeId) {
      message.error('请选择用户ID');
      return false;
    }
    if (type == "text") {
      if (self.state.messageContent.trim().length == 0) {
        message.error("不能发送空消息");
        return false;
      }
      //获取消息服务
      var msgService = cube.getMessageService();
      var ret = msgService.sendMessage(
        self.state.sendCubeId.toString(),
        self.state.messageContent
      );
      if (!ret) {
        message.error("发送信息失败");
        return;
      }
      return false;
    }
    if (type == "file") {
      var fileInfo = new CubeFileInfo();
      fileInfo.chooseFile(function (file, el) {
        fileInfo.setListener(new CubeFileStatusListener(self));
        //获取Cube文件服务
        var fileService = window.cube.getFileManagerService();

        fileService.upload(fileInfo.identifier, fileInfo);


      });

    }
    if (type == 'image') {
      var receiver = self.state.sendCubeId.toString();
      var entity = new CubeImageMessage(receiver);
      entity.chooseFile(function (file) {
        cube.getMessageService().sendMessage(receiver, entity);
      })

    }
  }
  pauseUpload(file) {
    console.log(file)
    cube.getFileManagerService().pauseUpload(file.sn);
  }
  resumeUpload(file) {
    var fileInfo = new CubeFileInfo();
    fileInfo.setListener(new CubeFileStatusListener(this));
    fileInfo.identifier = file.sn;
    cube.getFileManagerService().resumeUpload(file.sn, fileInfo);
  }
  cancelUpload(file) {
    console.log(file)
    cube.getFileManagerService().cancelMessage(file.sn);
  }

  //启动时调用的生命周期
  componentWillMount() {
    if (
      cube.startup(err => {
        if (err) {
          console.log("引擎启动失败");
        } else {
          // 加载即时消息模块
          cube.loadMessager(CubeMessage.ServiceWorker);
          cube.loadFileManager(CubeFile.Manager.ServiceWorker);
          cube.getAccountService().addListener(new AppAccountListener(this));
          //消息监听
          cube.getMessageService().addListener(new AppMessageListener(this));
          // 文件监听
          cube.getFileManagerService().addListener(new AppFileManagerListener(this));

        }
      })
    ) {
      console.log("引擎启动中....");
      let appId = appInfo.appId
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
    // var div = document.getElementById("message-box");
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
              <Button className="mr10" type="primary" onClick={(event) => this.createCube(event)}>创建cubeId</Button>
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
        <div className="ly-content-box">
          <div className="login-title">文本消息</div>
          <Select placeholder='请输入账号' value={this.state.sendCubeId} style={{ width: 215, marginBottom: 20 }} onChange={(event) => this.onChangeSendCubeId(event)}>
            {
              this.state.accountInfo.map((item, index) => {
                return <Option key={index} value={item.cubeId}>{item.cubeId}</Option>
              })

            }
          </Select>
          <div className="message-box mb10" id="message-box">
            {this.state.messageList.map((item, index) => {
              if (item.type == 'text') {
                if (item.isSelf) {
                  return <div key={index}
                    className={item.isSelf ? 'tx-r' : 'tx-l'}
                  >
                    <div>{item.content} :{item.cubeId}</div>
                  </div>

                } else {
                  return <div key={index}
                    className="message-item mb10"
                    className={item.isSelf ? 'tx-r' : 'tx-l'}
                  >
                    <div>{item.cubeId}: {item.content}</div>
                  </div>
                }
              }
              if (item.type == 'file') {
                let progress = null;
                if (item.status != "complate" && item.status != "cancel") {
                  progress = <div className="progress flex flex-pac mb10">
                    <Progress className="mr10" percent={item.progress} />
                    <Button className="mr10" size="small" type="primary" onClick={(evnet) => this.pauseUpload(item)}>暂停</Button>
                    <Button className="mr10" size="small" type="success" onClick={(event) => this.resumeUpload(item)}>恢复上传</Button>
                    <Button className="mr10" size="small" type="danger" onClick={(event) => this.cancelUpload(item)}>取消</Button>
                  </div>
                }

                return <div className={item.isSelf ? 'tx-r' : 'tx-l'} key={index}>
                  <div className="fileInfo mb10">
                    文件名: {item.file.name}
                  </div>
                  {progress}
                </div>
              }
              if (item.type == 'image') {
                if (item.isSelf) {
                  return <div key={index} className="tx-r">
                    <div> {item.file.name}:{item.cubeId}</div>
                    <div><img src={item.file.thumb}></img></div>
                  </div>

                } else {
                  return <div key={index} className="tx-l">
                    <div>{item.cubeId}: {item.file.name}</div>
                    <div><img src={item.file.thumb}></img></div>
                  </div>
                }
              }
            }
            )}
          </div>
          <div className="mtb10">
            <Button className="mr10" type="primary" onClick={(event) => this.sendMessage('file')}>文件消息</Button>
            <Button className="mr10" type="primary" onClick={(event) => this.sendMessage('image')}>图片消息</Button>
          </div>
          <div className="flex flex-pac">
            <Input className="flex-f1" placeholder="请输入内容" value={this.state.messageContent} onChange={(event) => this.onChangeContent(event)}></Input>
            <Button type="primary" onClick={(event) => this.sendMessage('text')}>发送</Button>
          </div>
        </div>
      </div>
    );
  }
}

function select(store) {
  return {
    userInfo: store.default.userStore.userInfo,
    status: store.default.userStore.status,
  }
}

export default connect(select)(Message);