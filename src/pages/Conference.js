import React, { Component } from 'react'
import { Button, Select, Modal, Input, message, Progress,Row, Col,Slider } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';

import * as CubeSignaling from "cube/CubeSignaling";
import * as CubeSipworker from "cube/CubeSipworker";

import { AppAccountListener } from "../listener/AppAccountListener";
import { AppConferenceListener } from "../listener/AppConferenceListener";
import { AppGroupListener } from "../listener/AppGroupListener";
// import UserLogin from "../common/UserLogin";
import * as CubeCore from "cube/CubeCore";
let appInfo = require(`${__dirname}/../../appInfo`);
window.CubeCore = CubeCore;
const { Option } = Select;
class Conference extends Component {
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
      localStreams: [],
      remoteStreams: [],
      conferenceList:[],
      inviteMembers:"",
      inviteConferenceId:'',
      confrenceType:'sfu-video-call',
      videoCodec:'H264',
      dialogInvite:false,
      dialogSFUSetting:false,
      dialogCreate:false,
      cameraList:[],
      groupList:[],
      videoInputStream:null,
      SFUStreamSettingForm:{
        type: 'video',
        camera: '',
        minVideoSize:0,
        maxVideoSize:0,
        frameRate:[8,12],
        videoBW:[300,300]
      },
      createform:{
        conferenceMembers:'',
        conferenceExpired:'1800',
        bindGroup:'',
      },
    }
  }
  updateStreams(stream){
    let existence = false;
    console.log(stream)
    if(stream.local){
      this.state.localStreams.forEach((item,index)=>{
        if(item.getID()==stream.getID()){
          existence = true;
          this.state.localStreams.splice(index,1)
          this.setState({localStreams:this.state.localStreams})
        }
      });
      if(!existence){
        this.setState({localStreams:[...this.state.localStreams,stream]})
        setTimeout(()=>{
          stream.show(stream.getID(), {bar: false,})
        },50)
      }
    }else{
      this.state.remoteStreams.forEach((item,index)=>{
        if(item.getID()==stream.getID()){
          existence = true;
          this.state.remoteStreams.splice(index,1)
          this.setState({remoteStreams:this.state.remoteStreams})
        }
      });
      if(!existence){
        this.setState({remoteStreams:[...this.state.remoteStreams,stream]})
         setTimeout(()=>{
          stream.show(stream.getID(), {bar: false,})
        },50)
      }
    }
  }
  dataRest(){
    this.setState({"inviteConferenceId":''});
    this.setState({"inviteMembers":''});
    this.setState({"dialogInvite":false});
    this.setState({"dialogSFUSetting":false});
    this.setState({"dialogCreate":false});
    this.setState({"localStreams":[]});
    this.setState({"remoteStreams":[]});
    this.setState({"videoCodec":'H264'});
    this.setState({"confrenceType":'sfu-video-call'});
    this.setState({"videoInputStream":null});
  }
  handleReject(conferenceId){
    cube.getConferenceService().reject(conferenceId.toString());
  }
  handleQuit(conferenceId){
    cube.getConferenceService().quit(conferenceId.toString());
    this.setState({localStreams:[]});
    this.setState({remoteStreams:[]});
  }
  handleInvite(){
    if(this.state.inviteMembers==""){
      this.messageErro("请输入成员cube号");
      return false
    }
    let members = this.state.inviteMembers.split(",")
    cube.getConferenceService().inviteConference(this.state.inviteConferenceId.toString(), members);
    this.setState({dialogInvite:false})
  }
  handleJoin(conferenceId , conferenceType, creater){
    let videoSizeWidths=[320,640,1280,1920];
    let videoSizeHeights=[240,480,720,1080];
    let min = this.state.SFUStreamSettingForm.minVideoSize;
    let max = this.state.SFUStreamSettingForm.maxVideoSize;
    let videoSize = [videoSizeWidths[min],videoSizeHeights[min],videoSizeWidths[max],videoSizeHeights[max]];
    let conferenceService= cube.getConferenceService();
    if(conferenceType == CubeConferenceType.ShareScreen){
      if(creater==cube.accName){
        getScreenId((err, sourceId) => {
          conferenceService.applyJoin(conferenceId, sourceId);
        }, ['screen']);
      }else{
        conferenceService.applyJoin(conferenceId)
      }
      return false;
    }
    if(this.state.SFUStreamSettingForm.type == 'screen'){
      getScreenId((err, sourceId) => {
          let con1 = new CubeStreamConfig('video',videoSize,null);
          let con2 = new CubeStreamConfig('screen',[320,640,1280,1920], sourceId);
          con1.setOptions({maxVideoBW:this.state.SFUStreamSettingForm.videoBW[0],minVideoBW:this.state.SFUStreamSettingForm.videoBW[1]});
          con1.setVideoFrameRate(this.state.SFUStreamSettingForm.frameRate);
          let configs =[con1,con2];
          console.log("configs===113",configs);
          if(this.state.SFUStreamSettingForm.camera!=''){
              con1.setMandatory(
                  {deviceId:{
                      exact:this.state.SFUStreamSettingForm.camera
                  }});
          }
          conferenceService.applyJoin(conferenceId, configs, sourceId);
      }, ['screen']);
    }else {
        let con1 = new CubeStreamConfig(this.state.SFUStreamSettingForm.type,videoSize,null);
            con1.setOptions({maxVideoBW:this.state.SFUStreamSettingForm.videoBW[0],minVideoBW:this.state.SFUStreamSettingForm.videoBW[1]});
            con1.setVideoFrameRate(this.state.SFUStreamSettingForm.frameRate);
            if(this.state.SFUStreamSettingForm.camera!=''){
                con1.setMandatory(
                    {deviceId:{
                        exact:this.state.SFUStreamSettingForm.camera
                    }});
            }
        conferenceService.applyJoin(conferenceId, [con1]);
    }
  }
  handldialogSFUSetting(){//sfu独有流配置
    this.setState({"dialogSFUSetting":!this.state.dialogSFUSetting},()=>{
      if(this.state.dialogSFUSetting){
        this.showMedia();
      }else{
        if(this.state.videoInputStream){
          this.state.videoInputStream.getTracks().forEach(track => {
              track.stop();
          });
          this.setState({videoInputStream:null});
        }
      }
    });
  }
  handldialogdialogCreate(){//创建会议按钮
    this.setState({"dialogCreate":!this.state.dialogCreate},()=>{
      if(!this.state.dialogCreate){
        this.createConference()
      }
    })
  }
  createConference(){//创建会议
    if(this.state.isEngineLogin == 'success'){
      //获取成员列表
      let conferenceMembers = this.state.createform.conferenceMembers.split(',');
      //获取会议时间
      let conference_expired = this.state.createform.conferenceExpired;
      //获取绑定群组
      let bindGroup = this.state.createform.bindGroup;
      //获取Cube会议服务
      let conferenceService = cube.getConferenceService();
      let coferenceConfig = new CubeConferenceConfig(conferenceMembers,this.state.confrenceType,bindGroup,5,false,conference_expired);
      coferenceConfig.isMux = true;
      conferenceService.applyConference(coferenceConfig);
      
    }else{
      this.messageErro("引擎cube未登陆")
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
  onChangeVideoCodec(value){
    this.setState({'videoCode':value})
  }
  onChangeConfrenceType(value){
    this.setState({"confrenceType":value})
  }
  
  onchangeSFUStreamSettingForm(value,option){//会议弹窗值set
    switch (option.props.datatype){
      case "type":{
        this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,"type":value}},()=>{
          console.log(this.state.SFUStreamSettingForm)
        });
        break
      }
      case "camera":{
        this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,"camera":value}},()=>{
          console.log(this.state.SFUStreamSettingForm);
          this.showMedia();
        });
        break
      }
      case "minVideoSize":{
        this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,"minVideoSize":value}},()=>{
          console.log(this.state.SFUStreamSettingForm);
        });
        break
      }
      case "maxVideoSize":{
        this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,"maxVideoSize":value}},()=>{
          console.log(this.state.SFUStreamSettingForm);
        });
        break
      }
        
    }
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
  showMedia(){//选择摄像头播出
    if(this.state.videoInputStream){
        this.state.videoInputStream.getTracks().forEach(track => {
            track.stop();
        });
        this.setState({videoInputStream:null});
    }
    const constraints = {
      audio: false,
      video: {
          deviceId: this.state.SFUStreamSettingForm.camera ? {exact: this.state.SFUStreamSettingForm.camera} : undefined,
          width: { ideal: 320 },
          height: { ideal: 240 }
      }
    };
    console.log(this.state.SFUStreamSettingForm.camera)
    navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
      this.refs.mediashow.srcObject = stream;
      this.setState({videoInputStream:stream});
      }).catch((err)=>{
        this.messageErro(err);
      })
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
    this.setState({ 'isLoginOut': true },()=>{
      this.setState({localStreams:[]});
      this.setState({remoteStreams:[]});
      this.setState({conferenceList:[]})
    })
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
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.map((item,index) => {
        if (item.kind == 'videoinput') {
          this.setState({
            cameraList: [...this.state.cameraList, {value:item.deviceId,label:item.deviceId}]
          },()=>{
            console.log(this.state.cameraList)
          })
          if(!this.state.SFUStreamSettingForm.camera){
            this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,"camera":item.deviceId}},()=>{
              console.log(this.state.SFUStreamSettingForm)
            });
          }
        }
      });
    });
  }
  //挂在完调用
  componentDidMount() {
    if (this.state.isEngineLogin == '') {
      if (
        cube.startup(err => {
          if (err) {
            console.log("引擎启动失败");
          } else {
            console.log(1111111111111111111111111)
           //加载音视频模块
           cube.loadSignaling(CubeSignaling.CallServiceWorker,"c_local_video","c_remote_video","call_audio");
            // 加载会议模块
            cube.loadConference(CubeConferenceServiceWorker,"c_local_video", "c_remote_video", "c_bell_audio", "c_local_canvas");
            cube.getConferenceService().addListener(new AppConferenceListener(this))
            cube.getAccountService().addListener(new AppAccountListener(this));
            cube.getGroupService().addListener(new AppGroupListener(this));
  
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
    }
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
    let confrenceTypeList=[
      {value:"voice-call",label:"多人音频"},
      {value:"video-call",label:"多人视频"},
      {value:"voice-conference",label:"多人语音会议"},
      {value:"video-conference",label:"多人视频会议"},
      {value:"share-screen",label:"FS屏幕分享会议"},
      {value:"sfu-video-call",label:"SFU多人视频"}
    ];
    let createform={
      conferenceMembers:'',
      conferenceExpired:'1800',
      bindGroup:'',
      confrenceType:'sfu-video-call'
    };
    let streamTypeList=["video","audio","screen"];
    let videoCodecList=['H264','VP9','VP8'];
    let videoSizeList=[
        {value:0,label:"320*240"},
        {value:1,label:"640*480"},
        {value:2,label:"1280*720"},
        {value:3,label:"1920*1080"},
      ];
    let conferenceExpiredList=[
        {value:'1800',label:"30分钟"},
        {value:'3600',label:"1小时"},
        {value:'7200',label:"2小时"},
        {value:'14400',label:"3小时"},
        {value:'0',label:"0"},
      ]
    // var div = document.getElementById("message-box");
    return (
      <div className='Conference'>
        <Row gutter={10}>
          <Col span={8} style={{width: "464px"}}>
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
              <p >全局视频传输格式</p>
              <Select  placeholder='全局视频传输格式' value={this.state.videoCodec} style={{ width: 215, marginBottom: 20 }} onChange={(event) => this.onChangeVideoCodec(event)}>
                  {
                   videoCodecList.map((item, index) => {
                      return <Option key={index} value={item}>{item}</Option>
                    })

                  }
              </Select>
              <p >会议类型选择</p>
              <Select  placeholder='会议类型选择' value={this.state.confrenceType} style={{ width: 215, marginBottom: 20 }} onChange={(event) => this.onChangeConfrenceType(event)}>
                  {
                   confrenceTypeList.map((item, index) => {
                      return <Option key={index} value={item.value}>{item.label}</Option>
                    })

                  }
              </Select>
              <Button className="mr10" type="primary"style={{display:this.state.confrenceType.includes('sfu')?"inline-block":"none"}} onClick={(event)=>{this.handldialogSFUSetting(event)}}>SFU会议设置</Button>
              <Modal title="SFU会议设置面板"  onCancel={(event)=>{this.handldialogSFUSetting(event)}} footer={[ <Button key="back" onClick={(event)=>{this.handldialogSFUSetting(event)}}>确定</Button>]} visible={this.state.dialogSFUSetting}   >
                <label className="conference_label">type</label>
                <Select  className="conference_item"  value={this.state.SFUStreamSettingForm.type}  onChange={this.onchangeSFUStreamSettingForm.bind(this)}>
                  {
                    streamTypeList.map((item, index)=>{
                      return <Option key={index} value={item} datatype="type" >{item}</Option>
                    })
                  }
                </Select>
                <label className="conference_label">camera</label>
                <Select className="conference_item"  value={this.state.SFUStreamSettingForm.camera}  onChange={this.onchangeSFUStreamSettingForm.bind(this)}>
                  {
                    this.state.cameraList.map((item, index)=>{
                      return <Option key={index} value={item.value} datatype="camera" >{item.label}</Option>
                    })
                  }
                </Select>
                <video ref="mediashow" autoPlay></video><br></br>
                <label className="conference_label">minVideoSize</label>
                <Select  className="conference_item"  placeholder='请选择最小分辨率' value={this.state.SFUStreamSettingForm.minVideoSize} onChange={this.onchangeSFUStreamSettingForm.bind(this)}>
                  {
                    videoSizeList.map((item,index)=>{
                      return <Option key={index} value={item.value} datatype="minVideoSize" >{item.label}</Option>
                    })
                  }
                </Select>
                <label className="conference_label">maxVideoSize</label>
                <Select  className="conference_item"  placeholder='请选择最大分辨率' value={this.state.SFUStreamSettingForm.maxVideoSize} onChange={this.onchangeSFUStreamSettingForm.bind(this)}>
                  {
                    videoSizeList.map((item,index)=>{
                      return <Option key={index} value={item.value} datatype="maxVideoSize" >{item.label}</Option>
                    })
                  }
                </Select>
                <label className="conference_label">frameRate</label>
                <Slider className=""    min={1} max={30} value={this.state.SFUStreamSettingForm.frameRate[0]} onChange={(value)=>{this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,frameRate:[value,this.state.SFUStreamSettingForm.frameRate[1]]}})}}></Slider>
                <label className="conference_label">videoBW</label>
                <Slider className=""   min={1} max={30} value={this.state.SFUStreamSettingForm.frameRate[1]} onChange={(value)=>{this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,frameRate:[this.state.SFUStreamSettingForm.frameRate[0],value]}})}}></Slider>
                <label className="conference_label">frameRate</label>
                <Slider className=""   step={50} min={100} max={4000} value={this.state.SFUStreamSettingForm.videoBW[0]} onChange={(value)=>{this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,videoBW:[value,this.state.SFUStreamSettingForm.videoBW[1]]}})}}></Slider>
                <label className="conference_label">videoBW</label>
                <Slider className=""   step={50} min={100} max={4000} value={this.state.SFUStreamSettingForm.videoBW[1]} onChange={(value)=>{this.setState({"SFUStreamSettingForm":{...this.state.SFUStreamSettingForm,videoBW:[this.state.SFUStreamSettingForm.videoBW[0],value]}})}}></Slider>
              </Modal>
              <div className="conferenceList">
                <Button className="mr10" type="primary" onClick={(event)=>{this.handldialogdialogCreate(event)}}>创建会议</Button>
                {
                  this.state.conferenceList.map((item,index)=>{
                    return <div key={index}>
                      <div className="flex-f1" style={{margin:"20px 0",background: "#ddd"}}>
                        <label>{"会议号:"+item.conferenceId+"  绑定群组:"+item.bindGroup}</label>
                        <Button className="mr10" type="primary" onClick={()=>{this.setState({"dialogInvite":true});this.setState({"inviteConferenceId":item.conferenceId})}}>邀请</Button> 
                        <Button className="mr10" type="success" onClick={()=>{this.handleJoin(item.conferenceId,this.state.confrenceType,cube.accName)}}>加入</Button> 
                        <Button className="mr10" type="danger"  onClick={()=>{this.handleQuit(item.conferenceId)}}>退出</Button> 
                        <Button className="mr10" type="danger"  onClick={()=>{this.handleReject(item.conferenceId)}}>拒绝</Button> 
                      </div>
                    </div>
                  })
                }
              </div>
              <Modal title="邀请成员入会"  onCancel={(event)=>{this.setState({"dialogInvite":false})}} footer={[ <Button key="back" onClick={(event)=>{this.handleInvite()}}>确定</Button>]} visible={this.state.dialogInvite} >
              <Input className="conference_item" placeholder="输入成员Cube号码, 用','号分开"  onChange={(event)=>{this.setState({"inviteMembers":event.target.value},()=>{console.log(this.state.inviteMembers)})}}></Input>
              </Modal>
              <Modal title="创建会议"  onCancel={(event)=>{this.setState({dialogCreate:false})}} footer={[ <Button key="back" onClick={(event)=>{this.handldialogdialogCreate(event)}}>确定</Button>]} visible={this.state.dialogCreate} >
                <label className="conference_label">群组</label>
                <Select  className="conference_item"  value={this.state.createform.bindGroup}  onChange={(value)=>{this.setState({"createform":{...this.state.createform,"bindGroup":value}},()=>{console.log(this.state.createform)})}}>
                  {
                    this.state.groupList.map((item, index)=>{
                      return <Option key={index} value={item.name} datatype="type" >{item.name}</Option>
                    })
                  }
                </Select>
                <label className="conference_label">成员</label>
                <Input className="conference_item" placeholder="输入成员Cube号码, 用','号分开"  onChange={(event)=>{this.setState({"createform":{...this.state.createform,"conferenceMembers":event.target.value}},()=>{console.log(this.state.createform)})}}></Input>
                <label className="conference_label">时长</label>
                <Select  className="conference_item"  value={this.state.createform.conferenceExpired}  onChange={(value)=>{this.setState({"createform":{...this.state.createform,"conferenceExpired":value}},()=>{console.log(this.state.createform)})}}>
                  {
                   conferenceExpiredList.map((item, index)=>{
                      return <Option key={index} value={item.value} datatype="type" >{item.label}</Option>
                    })
                  }
                </Select>
              </Modal>
            </div>
          </Col>
          <Col span={16}>
            <div className="conferenceStreamList">.
              <div className="local_fs" style={{display:this.state.confrenceType.includes('sfu')?"none":"block"}}>
                <video id="c_local_video" autoPlay style={{width: '100%'}}></video>
                <span style={{color:"white"}}>local_video</span>
              </div>
              <div className="remote_fs" style={{display:this.state.confrenceType.includes('sfu')?"none":"block"}}>
                <video id="c_remote_video" autoPlay style={{width: '100%'}}></video>
                <span style={{color:"white"}}>remote_video</span>
                <video id="call_audio" autoPlay></video>
              </div>  
              {this.state.localStreams.map((stream,index)=>{
                return <div className="member-group" key={index}>
                  <div id={stream.getID()}> </div>
                  <span>{'localStream:' + (stream.getAttributes() && stream.getAttributes().cubeId) || stream.getID() }</span>
                </div>
              })}
              {this.state.remoteStreams.map((stream,index)=>{
                return <div className="member-group" key={index}>
                  <div id={stream.getID()}> </div>
                  <span>{'remotelStream:' + (stream.getAttributes() && stream.getAttributes().cubeId) || stream.getID() }</span>
                </div>
              })}
            </div>
          </Col>
        </Row>
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

export default connect(select)(Conference);