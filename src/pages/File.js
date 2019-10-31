import React, { Component } from 'react'
import { Button, Select, Modal, Progress } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';


import { AppAccountListener } from "../listener/AppAccountListener";
import { AppFileManagerListener } from "../listener/AppFileManagerListener";
import * as CubeFile from "cube/CubeFile";
import { CubeFileStatusListener } from "../listener/CubeFileStatusListener";


var CubeFileInfo = CubeFile.Info;
window.CubeCore = CubeCore;
const { Option } = Select;
class File extends Component {
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
      messageList: [],
      messageContent: ''
    }
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

  uploadFile() {
    var self = this;
    var fileInfo = new CubeFileInfo();
    fileInfo.chooseFile(function (file, el) {
      fileInfo.setListener(new CubeFileStatusListener(self));
      //获取Cube文件服务
      var fileService = window.cube.getFileManagerService();

      fileService.upload(fileInfo.identifier, fileInfo);
    })
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
          cube.loadFileManager(CubeFile.Manager.ServiceWorker);
          cube.getAccountService().addListener(new AppAccountListener(this));
          // 文件监听
          cube.getFileManagerService().addListener(new AppFileManagerListener(this));

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
        <div className="ly-content-box">
          <div className="login-title">文件列表</div>
          <Button className="mr10" type="primary" onClick={(event) => this.uploadFile()}>创建文件</Button>
          <div className="message-box mb10" id="message-box">
            {this.state.messageList.map((item, index) => {

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
            }
            )}
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

export default connect(select)(File);