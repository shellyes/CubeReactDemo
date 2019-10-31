import React, { Component } from 'react'
import { Button, Select, Modal, Input, message, Slider, Checkbox, Row, Col, Icon } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';
import GetScreen from "cube/GetScreen"
import * as CubeSignaling from "cube/CubeSignaling";
import { AppAccountListener } from "../listener/AppAccountListener";
import { AppCallListener } from "../listener/AppCallListener";
import { MediaProbe } from "../listener/MediaProbe";
const MyIcon = Icon.createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_1386319_6vfypzbgm6s.js', // 在 iconfont.cn 上生成
});
const { Option } = Select;
class Call extends Component {
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

            operationStatus: "登录后输入用户名即可进行通话、消息和白板",
            videosize: "SQCIF (128×96)",
            framerate: 15,
            codec: "VP8",
            volume: 100,
            isVideo: false,
            videoCall: false,
            checked: false,
            isAudio: false,
            videoInfo: {},
            localvoiceText: "关闭话筒",
            localvideoText: "关闭视频",
            refreshTimer: 0,
            recordLocalState: "准备就绪",
            recordLocalTime: "00:00",
            recordRemoteTime: "00:00",
            isRecordLocal: true,

        }
    }
    onChange(value) {
        this.setState({ 'cubeId': value })
    }
    onChangeSendCubeId(event) {
        this.setState({ 'sendCubeId': event.target.value })
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
        this.setState({ 'loginStatus': '登陆中...', 'isEngineLogin': '' })
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

    //call 
    setVideos() {
        var self = this;
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            message.error("不支持 enumerateDevices() .");
            return;
        }
        navigator.mediaDevices.enumerateDevices().then((devices) => {

            devices.map((item) => {
                if (item.kind == 'videoinput') {
                    // let videoHtml = `<li data-deviceId="${item.deviceId}"><a  id="" href="javascript:;"><span class="glyphicon glyphicon-time"></span> ${item.label}</a></li>`;
                    // $(".choose_video .dropdown-menu").append(videoHtml);
                    console.log("devices", devices)
                }
            });

            // $(".choose_video .dropdown-menu li").click(function () {
            //     let deviceId = $(this).attr("data-deviceId");
            //     if (null != deviceId) {
            //         window.cube.getCallService().renegotiate({deviceId: deviceId});
            //     }
            // });
        });
    }
    //自动接听
    changeAuto(event) {
        console.log(event)
        var autoAnswer = event.target.checked;
        this.setState({
            "checked": event.target.checke
        })
        var callService = window.cube.getCallService();
        if (callService != null) {
            callService.setAutoAnswer(autoAnswer);
        }
    }
    //呼叫
    call(video) {
        var self = this;
        var callee = self.state.sendCubeId;
        if (null == callee) {
            self.setState({
                "operationStatus": "呼叫失败，输入的对端数据错误"
            })
            return;
        }

        cube.configure({
            videoSize: self.state.videoSize,
            frameRate: { min: 5, max: parseInt(self.state.frameRate) },
            videoCodec: self.state.codec
        });
        // 发起呼叫
        if (cube.getCallService().makeCall(callee, video)) {
            self.setState({
                "operationStatus": "呼叫 " + callee
            })
        } else {
            self.setState({
                "operationStatus": "呼叫 " + callee + " 失败"
            })
        }
        if (!video) {
            self.setState({
                "isAudio": true
            })
        }
    }
    // 发起应答
    answer() {
        window.cube.getCallService().answerCall(true);
    }
    //挂断
    terminate() {
        this.setState({
            "isAudio": false
        })
        cube.getCallService().terminateCall();
    }
    //关闭/恢复本地视频
    localvideo() {
        var self = this;
        if (!window.cube.getSession().isCalling()) {
            return;
        }

        if (window.cube.getMediaService().isVideoEnabled()) {
            window.cube.getMediaService().closeVideo();
            self.setState({
                "localvideoText": "开启视频"
            })
        } else {
            window.cube.getMediaService().openVideo();
            self.setState({
                "localvideoText": "关闭视频"
            })
        }
    }
    // 关闭/恢复麦克风
    localvoice() {
        if (window.cube.getMediaService().isVoiceEnabled()) {
            window.cube.getMediaService().closeVoice();
            this.setState({
                "localvoiceText": "开启话筒"
            })
        } else {
            window.cube.getMediaService().openVoice();
            this.setState({
                "localvoiceText": "关闭话筒"
            })
        }
    }
    // 开始录像
    startRecordLocal() {
        var self = this;
        if (self.state.refreshTimer > 0) {
            clearTimeout(self.state.refreshTimer);
            self.state.refreshTimer = 0;
        }
        if (cube.getSession().isCalling()) {
            // 录制通话视频
            if (
                !cube.getMediaService().startLocalRecording({
                    bufferSize: 16384,
                    sampleRate: 45000,
                    type: "video"
                })
            ) {
                alert("启动视频录制失败！");
                return;
            }
            self.setState({
                "recordLocalState": "正在录制"
            })
            self.state.isRecordLocal = false;
            var refreshTimeTask = function () {
                var duration = cube
                    .getMediaService()
                    .getLocalRecorder()
                    .getDuration();
                if (duration > 0) {
                    self.state.recordLocalTime = window.cube.utils.formatDuration(duration);
                }

                self.state.refreshTimer = setTimeout(refreshTimeTask, 1000);
            };

            self.state.refreshTimer = setTimeout(refreshTimeTask, 2000);
        }
    }
    // 停止录像
    stopRecordLocal() {
        var self = this;
        this.setState({
            "recordLocalState": "准备就绪",
            "isRecordLocal": true,
            "recordLocalTime": '00:00',
        })
        var taskCallback = function (recorder) {
            clearTimeout(self.state.refreshTimer);
            self.state.refreshTimer = 0;
            self.setState({
                "refreshTimer": 0,
            })
            // 记录结束
            // fireRecordEnd(recorder);
        };
        taskCallback();
        if (cube.getMediaService().hasLocalRecorded()) {
            cube.getMediaService().stopLocalRecording(taskCallback);
        } else {
            cube.getMediaService().stopRecording("offline", taskCallback);
        }
    }
    //调整音量
    changeVolume(event) {
        this.setState({
            "volume": event
        })
        // 判断是否正在通话
        if (!cube.getSession().isCalling()) {
            return;
        }
        cube.getMediaService().setVolume(event);
    }
    changeFramerate(event) {
        this.setState({
            "framerate": event.target.value
        })
    }
    onChangeCodec(event) {
        this.setState({
            "codec": event
        })
    }
    onChangevideosize(event) {
        this.setState({
            "videosize": event
        })
    }
    //屏幕共享
    shareScreen() {
        //  getScreenId((err, sourceId) => {
        //           if (null != sourceId) {
        //               window.cube.getCallService().renegotiate({
        //                   mandatory: {
        //                       chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId, maxWidth: 1280,
        //                       maxHeight: 720,
        //                       maxFrameRate: 18
        //                   }
        //               }, false);
        //           }
        //       });
        //   });
        //   CallUIManager.setVideos();
        var self = this;
        var param = (err, sourceId) => {
            if (null != sourceId) {
                window.cube.getCallService().renegotiate({
                    mandatory: {
                        chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId, maxWidth: 1280,
                        maxHeight: 720,
                        maxFrameRate: 18
                    }
                }, false);
            }
        };
        GetScreen.getScreenId(param)
        this.setVideos()
    }

    //启动时调用的生命周期
    componentWillMount() {
        console.log('123')
        this.getAccount(this.state.appKey, this.state.appId)
    }
    //调用Dom
    componentDidUpdate() {
        if (this.state.isEngineLogin == "") {
            if (
                cube.startup(err => {
                    if (err) {
                        console.log("引擎启动失败");
                    } else {
                        //加载音视频模块
                        cube.loadSignaling(
                            CubeSignaling.CallServiceWorker,
                            "local_video",
                            "remote_video",
                            "call_audio"
                        );
                        cube.getAccountService().addListener(new AppAccountListener(this));
                        // 设置通话监听器
                        cube.getCallService().addListener(new AppCallListener(this));

                        // 添加媒体探针
                        cube.getMediaService().addMediaProbe(new MediaProbe(this));

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

        var data = this.state.videoInfo;
        if (data.direction == "incoming") {
            this.state.operationStatus = "来电，请接听！";
        }

        if (data.type == "ringing") {
            this.state.operationStatus = "对方正在振铃";
        } else if (data.type == "failed") {
            if (data.errorCode == 1400) {
                this.state.operationStatus = "对方正在通话中";
            } else {
                this.state.operationStatus = "错误码: " + data.errorCode;
            }

        } else if (data.type == "connected") {
            this.state.operationStatus = "已连接";
            if (!data.video) {
                this.state.isAudio = true;
            }
        }
        var button = null, audio = null;
        if (this.state.videoCall) {
            button = <div>
                <Button
                    className="mb10 mr10"
                    type="primary"
                    onClick={(event) => this.answer(event)}
                >接听</Button>
                <Button
                    className="mb10 mr10"
                    type="primary"
                    onClick={(event) => this.terminate(event)}
                >挂断</Button>
                <Button
                    className="mb10 mr10"
                    type="primary"
                    onClick={(event) => this.localvideo(event)}
                >{this.state.localvideoText}</Button>
                <Button
                    className="mb10 mr10"
                    type="primary"
                    onClick={(event) => this.localvoice(event)}
                >{this.state.localvoiceText}</Button>
            </div>
        } else {
            this.state.isAudio = false;
            this.state.operationStatus = "登录后输入用户名即可进行通话、消息和白板";
        }
        if (this.state.isAudio) {
            audio = <div className="audioTip">仅使用语音通话</div>
        }
        return (
            <div className='ly-wrapper'>
                <Row gutter={10}>
                    <Col span={10}>
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
                                    <Button className="mr10" type="primary" onClick={(event)=>this.createCube()}>创建cubeId</Button>
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
                    </Col>
                    <Col span={14}><div className="ly-content-box">
                        <div className="login-title">操作</div>
                        <div className="tx-c login-status fz14">{this.state.operationStatus}</div>
                        <div className="operation-item dib">
                            <span className="operation-title">视频分辨率:</span>
                            <Select value={this.state.videosize} onChange={(event) => this.onChangevideosize(event)} placeholder="请选择账号">
                                <Option value="SQCIF">SQCIF (128×96)</Option>
                                <Option value="QQVGA">QQVGA (160×120)</Option>
                                <Option value="QVGA" selected="selected">QVGA (320×240)</Option>
                                <Option value="CIF">CIF (352×288)</Option>
                                <Option value="VGA">VGA (640×480)</Option>
                                <Option value="SVGA">SVGA (800×600)</Option>
                                <Option value="HD">HD (960×720)</Option>
                                <Option value="XGA">XGA (1024×768)</Option>
                                <Option value="SXGA">SXGA (1280×1024)</Option>
                                <Option value="UXGA">UXGA (1600×1200)</Option>
                                <Option value="WQVGA">WQVGA (400×240)</Option>
                                <Option value="WCIF">WCIF (512×288)</Option>
                                <Option value="WVGA">WVGA (800×480)</Option>
                                <Option value="WSVGA">WSVGA (1024×600)</Option>
                                <Option value="WHD">WHD (1280×720)</Option>
                                <Option value="WXGA">WXGA (1280×768)</Option>
                                <Option value="WUXGA">WUXGA (1920×1200)</Option>
                                <Option value="W432P">W432P (768×432)</Option>
                                <Option value="W480P">W480P (768×480)</Option>
                            </Select>
                        </div>
                        <div className="operation-item dib">
                            <span className="operation-title">@</span>
                            <Input
                                value={this.state.framerate}
                                className="operation-num"
                                onChange={(event) => this.changeFramerate(event)}
                            ></Input>
                        </div>
                        <div className="operation-item dib">
                            <span className="operation-title">codec:</span>
                            <Select className="operation-num" value={this.state.codec} onChange={(event) => this.onChangeCodec(event)} >
                                <Option value="VP8">VP8</Option>
                                <Option value="VP9">VP9</Option>
                                <Option value="H264">H264</Option>
                            </Select>
                        </div>
                        <br />
                        <div className="operation-item dib">
                            <span className="operation-title">音量:</span>
                            <Slider className="operation-num dib mb0" value={this.state.volume} onChange={(event) => this.changeVolume(event)} />
                        </div>
                        <div className="operation-item dib ml30">
                            <span className="operation-title">对方账号:</span>
                            <Input
                                value={this.state.sendCubeId}
                                className="operation-num"
                                onChange={(event) => this.onChangeSendCubeId(event)}
                            ></Input>
                        </div>
                        <br />
                        <div className="operation-item dib">
                            <Button disabled={this.state.videoCall} className="mb10 mr10" type="primary" onClick={(event) => this.call(true)}>视频呼叫</Button>
                            <Button disabled={this.state.videoCall} className="mb10 mr10" type="primary" onClick={(event) => this.call(false)}>语音呼叫</Button>
                            {button}
                            <Checkbox v-model="checked" onChange={(event) => this.changeAuto(event)}>自动接听</Checkbox>
                        </div>
                    </div>
                    </Col>
                </Row>
                <Row gutter={10}>
                    <Col span={12}><div className="ly-content-box">
                        <div className="login-title">本地视频</div>
                        <div className="panel-body text-center">
                            <video id="local_video" width="100%" autoPlay></video>
                            {audio}
                        </div>
                        <div className="panel-footer">
                            <form className="form-inline">
                                <label className="form-control-static mr10">
                                    <span className="text-info">
                                        <span className="glyphicon"></span> {this.state.recordLocalState}
                                    </span>
                                </label>
                                <Button className='mr10' disabled={!this.state.isRecordLocal} type="primary" icon="iconfont iconvideo" onClick={(event) => this.startRecordLocal()}><MyIcon type="iconvideo"></MyIcon>录制视频</Button>
                                <Button className='mr10' disabled={this.state.isRecordLocal} type="primary" icon="iconfont iconzanting" onClick={(event) => this.stopRecordLocal()}><MyIcon type="iconzanting"></MyIcon></Button>
                                <Button className='mr10' type="primary" icon="iconfont iconbofanganniu" ><MyIcon type="iconbofanganniu"></MyIcon></Button>
                                <Button className='mr10' type="primary" icon="iconfont icondiannao" onClick={(event) => this.shareScreen()}><MyIcon type="icondiannao"></MyIcon></Button>
                                <Button className='mr10' type="primary" icon="iconfont iconziyuan" ><MyIcon type="iconziyuan"></MyIcon>上传</Button>
                                <span className="record-time">{this.state.recordLocalTime}</span>
                            </form>
                        </div>
                    </div>
                    </Col>
                    <Col span={12}> <div className="ly-content-box">
                        <div className="login-title">远程视频</div>
                        <div className="panel-body text-center">
                            <video id="remote_video" width="100%" autoPlay></video>
                            {audio}
                        </div>
                        <div className="panel-footer">
                            <form className="form-inline">
                                <label className="form-control-static mr10">
                                    <span className="text-info">
                                        <span className="glyphicon"></span> 准备就绪
                                </span>
                                </label>
                                <Button className='mr10' type="primary" icon="iconfont iconvideo" ><MyIcon type="iconvideo"></MyIcon>录制视频</Button>
                                <Button className='mr10' type="primary" icon="iconfont iconzanting" ><MyIcon type="iconzanting"></MyIcon></Button>
                                <Button className='mr10' type="primary" icon="iconfont iconbofanganniu" ><MyIcon type="iconbofanganniu"></MyIcon></Button>
                                <span className="record-time">{this.state.recordRemoteTime}</span>
                            </form>
                        </div>
                    </div>
                    </Col>
                </Row>
                <audio id="call_audio"></audio>
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
export default connect(select)(Call)