import React, { Component } from 'react'
import { Button, Select, Modal, Input, message, Popconfirm, Row, Col } from 'antd';
import { connect } from 'react-redux';
import api from '../api/index';
import '../assets/css/mian.css';

import * as CubeWhiteboard from "cube/CubeWhiteboard";
import { AppAccountListener } from "../listener/AppAccountListener";
import { AppWhiteboardListener } from "../listener/AppWhiteboardListener";
let appInfo = require(`${__dirname}/../../appInfo`);
const { Option } = Select;

class Whiteboard extends Component {
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
            sendCubeId: "",

            whiteName: null,
            isHaveWhiteBoard: false,
            domId: "wb_canvas_",
            domIndex: 1,
            whiteBoarListHandle: [],
            whiteBoarList: [],
            whiteBoarStatusText: "登录后输入用户名即可进行通话、消息和白板",
            wbActive: -1,
            wbName: "",
            objWbList: {},
            member: "",
            isShare: false,
            wbExportData: null,
            wbRecordingData: null,
            wbPlayer: null,
            CreateWhiteboardList: [],//白板列表
            whiteboardId: '',//当前的白板ID,
            isStopRecord: false,
            isStartRecord: false,
            isStopPlay: false,
            isStartPlay: false,
            activeSn: ''
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
        this.setState({
            'loginStatus': '登陆中...',
            'isEngineLogin': ''
        })
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
                    self.state.errorInfo = "注册操作出错，请检查用户名是否在证书的有效号段内。";
                } else {
                }
            } else {
                self.state.centerDialogVisible = true;
            }
        })
            .catch(e => {
                self.state.centerDialogVisible = true;
                self.state.errorInfo = "注册操作出错，请检查用户名是否在证书的有效号段内。";
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
            // this.setState({ 'isLogin': false })
        }

    }


    //wb

    //分享
    share(sn) {
        this.state.whiteboardId = sn;
        var whiteboard = this.state.objWbList[sn];
        if (whiteboard.whiteboardId.length < 4) {
            message.error("请输入正确的用户名");
            return;
        }
        cube.getWhiteboardService().setOffline(false);

        var wb = cube.getWhiteboardService();
        // 将白板分享给指定的用户
        if (wb.isSharing(whiteboard.whiteboardId)) {
            // 停止分享
            wb.revokeSharing(whiteboard.whiteboardId);
        } else {
            wb.shareWith(whiteboard.whiteboardId);
        }
        this.setState({
            "isShare": !this.state.isShare
        })
    }
    //邀请
    invite(sn) {
        if (this.state.member == "" && isNaN(parseInt(this.state.member))) {
            message.error("邀请人为空或不存在");
        }
        var whiteboard = this.state.objWbList[sn];
        var cubeId = this.state.member.split(",");
        for (let i = 0; i < cubeId.length; i++) {
            if (cubeId[i].length < 4) {
                message.error("请输入长度大于4的有效cube号");
                return;
            }
        }
        var wb = cube.getWhiteboardService();
        wb.inviteWhiteboard(whiteboard.whiteboardId, cubeId);
    }
    //拒绝
    reject(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        wb.rejectWhiteboard(whiteboard.whiteboardId);
    }
    //复位
    resetView(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        wb.resetView(whiteboard);
    }
    //导出
    exportContent(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var data = wb.exportContent(whiteboard);
        this.state.wbExportData = JSON.stringify(data);
        console.log("白板导出", this.state.wbExportData);
    }
    // 白板导入
    importContent(sn) {
        var whiteboard = this.state.objWbList[sn];
        if (null == this.state.wbExportData) {
            message.error("无可导入数据");
            return;
        }
        var wb = cube.getWhiteboardService();
        wb.importContent(whiteboard, JSON.parse(this.state.wbExportData));
    }
    // 白板录制
    getRecorder(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var recorder = wb.getRecorder(whiteboard);
        this.state.activeSn = sn;
        if (recorder.isRecording()) {
            this.setState({
                "isStopRecord": true
            })
        } else {
            this.setState({
                "isStartRecord": true
            })
        }
    }
    // 白板回放
    getPlayer(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var player = wb.getPlayer(whiteboard);
        this.state.activeSn = sn;
        if (player.isPlaying()) {
            this.setState({
                "isStopPlay": true
            })
        } else {
            this.setState({
                "isStartPlay": true
            })
        }
        this.state.wbPlayer = player;
    }
    stopRecord(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var recorder = wb.getRecorder(whiteboard);
        recorder.stopRecording();
        this.state.wbRecordingData = recorder.exportData();
        this.state.wbRecordingData = JSON.stringify(this.state.wbRecordingData);
        this.cancelRecord();
    }
    startRecord(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var recorder = wb.getRecorder(whiteboard);
        this.state.wbRecordingData = null;

        // 设置监听器
        recorder.setListener({
            onStarted: function (player) {
                console.log("--- 录制开始 ---");
            },

            onStopped: function (player) {
                console.log("--- 录制结束 ---");
            },
            onPaused: function (player) {
                console.log("--- 录制暂停 ---");
            },
            onResumed: function (player) {
                console.log("--- 录制继续 ---");
            }
        });
        if (!recorder.startRecording()) {
            message.error("录制白板错误");
        }
        this.cancelRecord();

    }
    stopPlay(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var player = wb.getPlayer(whiteboard);
        player.stop();
        this.cancelRecord();

    }
    startPlay(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = cube.getWhiteboardService();
        var player = wb.getPlayer(whiteboard);
        if (null == this.state.wbRecordingData) {
            message.error("请先录制数据");
            return;
        }

        player.importData(JSON.parse(this.state.wbRecordingData));

        // 设置监听器
        player.setListener({
            onStarted: function (player) {
                console.log("*** 开始播放 ***");
            },

            onStopped: function (player) {
                console.log("*** 停止播放 ***");
            },

            onPaused: function (player) {
                console.log("*** 暂停播放 ***");
            },

            onResumed: function (player) {
                console.log("*** 恢复播放 ***");
            }
        });
        if (!player.play()) {
            message.error("回放白板失败");
        }
        this.cancelRecord();
    }
    cancelRecord() {
        this.setState({
            "isStopRecord": false,
            "isStartRecord": false,
            "isStopPlay": false,
            "isStartPlay": false,

        })
    }
    //暂停播放
    pause() {
        this.state.wbPlayer.pause();
    }
    //继续播放
    resume() {
        this.state.wbPlayer.resume();
    }
    // 白板铅笔工具
    pencil(sn) {
        var whiteboard = this.state.objWbList[sn];
        // var checked = !$(this).hasClass('active');
        // if (checked) {
        var pencil = new PencilEntity();
        cube.getWhiteboardService().selectEntity(whiteboard, pencil);
        // }
        // else {
        //     window.cube.getWhiteboardService().unselect(whiteboard);
        // }
    }
    //箭头
    arrow(sn) {
        var whiteboard = this.state.objWbList[sn];

        // var checked = !$(this).hasClass('active');
        // if (checked) {
        var arrow = new ArrowEntity();
        cube.getWhiteboardService().selectEntity(whiteboard, arrow);
        // switchTool($(this));
        // }
        // else {
        //     window.cube.getWhiteboardService().unselect(wb);
        // }
    }
    //文本工具
    text(sn) {
        var whiteboard = this.state.objWbList[sn];

        // var checked = !$(this).hasClass('active');
        // if (checked) {
        var text = new TextEntity();
        cube.getWhiteboardService().selectEntity(whiteboard, text);
        // switchTool($(this));
        // }
        // else {
        //     window.cube.getWhiteboardService().unselect(wb);
        // }
    }
    //方框
    rect(sn) {
        var whiteboard = this.state.objWbList[sn];

        // var checked = !$(this).hasClass('active');
        // if (checked) {
        var rect = new RectEntity();
        cube.getWhiteboardService().selectEntity(whiteboard, rect);
        // switchTool($(this));
        // }
        // else {
        //     window.cube.getWhiteboardService().unselect(wb);
        // }
    }
    //圆圈
    ellipse(sn) {
        var whiteboard = this.state.objWbList[sn];

        // var checked = !$(this).hasClass('active');
        // if (checked) {
        var ellipse = new EllipseEntity();
        cube.getWhiteboardService().selectEntity(whiteboard, ellipse);
        // switchTool($(this));
        // }
        // else {
        //     window.cube.getWhiteboardService().unselect(wb);
        // }
    }
    //白板撤销
    wbUndo(sn) {
        var whiteboard = this.state.objWbList[sn];
        window.cube.getWhiteboardService().undo(whiteboard);
    }
    //白板撤销
    wbRedo(sn) {
        var whiteboard = this.state.objWbList[sn];
        window.cube.getWhiteboardService().redo(whiteboard);
    }
    //白板擦除笔记
    wbErase(sn) {
        var whiteboard = this.state.objWbList[sn];
        window.cube.getWhiteboardService().erase(whiteboard);
    }
    //白板清空
    wbClean(sn) {
        var whiteboard = this.state.objWbList[sn];
        window.cube.getWhiteboardService().cleanup(whiteboard);
    }
    //白板原尺寸
    wbNozoom(sn) {
        var whiteboard = this.state.objWbList[sn];
        window.cube.getWhiteboardService().zoom(whiteboard, 0.6);
    }
    //白板放大
    wbZoomin(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = window.cube.getWhiteboardService();
        var cr = wb.getZoomRatio(whiteboard);
        if (cr >= 5.0) {
            return;
        }

        cr += 0.2;
        if (cr > 5.0) {
            cr = 5.0;
        }

        wb.zoom(whiteboard, cr);
    }
    //白板缩小
    wbZoomout(sn) {
        var whiteboard = this.state.objWbList[sn];
        var wb = window.cube.getWhiteboardService();
        var cr = wb.getZoomRatio(whiteboard);
        if (cr <= 0.2) {
            return;
        }

        cr -= 0.2;
        if (cr < 0.2) {
            cr = 0.2;
        }

        wb.zoom(whiteboard, cr);
    }
    changeActive(index) {
        console.log(index)
        this.setState({
            "wbActive": index,
            "whiteName": "新建白板" + (index + 1)
        })
    }
    getAccountList(accountInfo) {
        this.state.sendCubeId = accountInfo[1].cubeId;
    }
    //创建白板
    createWhiteBoard() {
        var self = this;
        var name = self.state.whiteName ? self.state.whiteName : 'name';
        let a = /^[\u4e00-\u9fa5a-zA-Z0-9]*$/;
        if (a.test(name)) {
            self.state.domIndex++;
            self.state.domIndex = self.state.domIndex;
            var domId = self.state.domId + self.state.domIndex;
            // self.state.isHaveWhiteBoard=true;
            // self.state.domId = domId;
            var whiteBoardItem = {
                domId: domId
            };
            self.state.whiteBoarListHandle.push(whiteBoardItem);
            self.state.CreateWhiteboardList.push(
                {
                    domId: domId,
                    name: name
                }
            )
            self.setState({
                "whiteBoarListHandle": self.state.whiteBoarListHandle,
                "CreateWhiteboardList": self.state.CreateWhiteboardList
            })
        } else {
            message.error("白板名称为空或含有特殊字符！");
        }
    }
    delWhiteBoard(val, id) {
        var self = this;
        self.ate.state.whiteBoarListHandle.forEach((item, index) => {
            if (val == index) {
                self.state.whiteBoarListHandle.splice(index, 1);
            }
        });
        cube.getWhiteboardService().removeWhiteboard(id);
    }
    openWb(id) { }
    onchangeMember(event) {
        this.setState({
            'member': event.target.value
        })
    }
    onChangeName(event) {
        this.setState({
            'whiteName': event.target.value
        })
    }

    //启动时调用的生命周期
    componentWillMount() {
        this.getAccount(this.state.appKey, this.state.appId)
    }
    //调用Dom
    componentDidMount() {
        if (this.state.isEngineLogin == '') {
            if (
                cube.startup(err => {
                    if (err) {
                        console.log("引擎启动失败");
                    } else {
                        cube.loadWhiteboard(CubeWhiteboard.ServiceWorker);
                        cube.getAccountService().addListener(new AppAccountListener(this));
                        cube.getWhiteboardService().addListener(new AppWhiteboardListener(this));
                        cube.getWhiteboardService().setOffline(false);
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
        if (this.state.CreateWhiteboardList && this.state.CreateWhiteboardList.length > 0) {
            this.state.CreateWhiteboardList.forEach((item, index) => {
                cube.getWhiteboardService().createWhiteboard(item.domId, item.name, item.whiteboardId);
                this.state.CreateWhiteboardList.splice(index, 1)
            })
            var self = this;
            self.state.whiteBoarListHandle = [];
            var wbAction = false;
            // this.whiteBoarListHandle = data;
            this.state.whiteBoarList.forEach(item => {
                if (item.sn) {
                    self.state.objWbList[item.sn] = item[item.sn];
                    self.state.objWbList[item.sn]["sn"] = item.sn;
                    self.state.objWbList[item.sn]["domId"] = item.domId;

                }
            });
            if (self.state.objWbList) {
                for (let key in self.state.objWbList) {
                    self.state.whiteBoarListHandle.push(self.state.objWbList[key]);
                }

            }
            console.log("objWbList1111111", self.state.objWbList);
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

        return (<div className='ly-wrapper'>
            <Row gutter={10}>
                <Col span={8}>
                    <div className="ly-content-box">
                        <div className="login-title">用户登录</div>
                        <div className="tx-c login-status">{this.state.loginStatus}</div>
                        <div className="mb10 mr10">

                            <Select disabled={this.state.isLogin} placeholder='请输入账号' value={this.state.cubeId} style={{ width: 215, marginBottom: 20 }} onChange={(event) => this.onChange(event)}>
                                {
                                    this.state.accountInfo.map((item, index) => {
                                        return <Option key={index} value={item.cubeId}>{item.cubeId}</Option>
                                    })

                                }
                            </Select>
                            <div>
                                <Button className="mr10 mb10" type="primary" disabled={this.state.isLogin} onClick={(event) => this.login()}>登录</Button>
                                <Button className="mr10 mb10" type="danger" disabled={!this.state.isLogin} onClick={(event) => this.loginOut()}>注销</Button>
                                <Button className="mr10 mb10" type="primary" onClick={(event) => this.createCube()}>创建cubeId</Button>
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
                        <div className="flex flex-ac">
                            <Input placeholder='请输入白板名称' value={this.state.whiteName} onChange={(event) => { this.onChangeName(event) }}></Input>
                            <Button type="primary" onClick={(event) => this.createWhiteBoard(event)}>创建白板</Button>
                        </div>
                        <div className="whiteboard-list">
                            {
                                this.state.whiteBoarListHandle.map((item, index) => {
                                    return <div key={index} className="whiteboardItem flex flex-pac">
                                        <div className="flex-f1" onClick={(event) => this.changeActive(index)}>新建白板{index + 1}</div>
                                        <span className="deleteIcon" onClick={(event) => this.delWhiteBoard(index, item.sn)}>x</span>
                                    </div>
                                })
                            }
                        </div>
                    </div>
                </Col>
                <Col span={16}>
                    <div className="whiteboard-box">
                        <div className="tx-c login-status fz14">{this.state.whiteBoarStatusText}</div>
                        <div className="tx-c mb10">{this.state.whiteName}</div>
                        {
                            this.state.whiteBoarListHandle.map((item, index) => {
                                return <div key={index} className={`wb-from ${this.state.wbActive == index ? 'active' : null}`}>
                                    <div className="mtb10 flex">
                                        <Input className="mr10 mb10" value={this.state.member} onChange={(event) => { this.onchangeMember(event) }} placeholder="请输入对方cubeId"></Input>
                                        <Button disabled={!this.state.isShare} className="mb10 mr10" type="primary" onClick={(event) => this.invite(item.sn)}>邀请</Button>
                                        <Button disabled={!this.state.isShare} className="mb10 mr10" type="danger" onClick={(event) => this.reject(item.sn)}>拒绝</Button>
                                    </div>
                                    <Button disabled={this.state.isShare} className="mb10 mr10" type="primary" onClick={(event) => this.share(item.sn)} >分享</Button>
                                    <Button disabled={!this.state.isShare} className="mb10 mr10" type="primary" onClick={(event) => this.share(item.sn)} >停止</Button>

                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.resetView(item.sn)}>复位</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.exportContent(item.sn)}>导出</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.importContent(item.sn)}>导入</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.getRecorder(item.sn)}>录制</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.getPlayer(item.sn)}>回放</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.pause()}>暂停</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.resume()}>恢复</Button>
                                    {/* <Button className="mb10 mr10" type="primary" >文件</div>
              <Button className="mb10 mr10" type="primary" >回档</Button> */}
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.rect(item.sn)}>方框</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.ellipse(item.sn)}>圆圈</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.arrow(item.sn)}>箭头</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.pencil(item.sn)}>铅笔</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.text(item.sn)}>文本</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbUndo(item.sn)}>撤销</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbRedo(item.sn)}>重做</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbErase(item.sn)}>擦除</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbClean(item.sn)}>清空</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbNozoom(item.sn)}>原尺寸</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbZoomin(item.sn)}>放大</Button>
                                    <Button className="mb10 mr10" type="primary" onClick={(event) => this.wbZoomout(item.sn)}>缩小</Button>
                                    <div id={item.domId} className="svg-window"></div>
                                </div>
                            })
                        }
                    </div>
                </Col>
            </Row >
            <Modal
                title="提示"
                visible={this.state.isStopRecord}
                onOk={(event) => this.stopRecord(this.state.activeSn)}
                onCancel={(event) => this.cancelRecord(false)}
            >
                <p>"是否结束白板录制?"</p>
            </Modal>
            <Modal
                title="提示"
                visible={this.state.isStartRecord}
                onOk={(event) => this.startRecord(this.state.activeSn)}
                onCancel={(event) => this.cancelRecord(false)}
            >
                <p>"是否开始白板录制?"</p>
            </Modal>
            <Modal
                title="提示"
                visible={this.state.isStopPlay}
                onOk={(event) => this.stopPlay(this.state.activeSn)}
                onCancel={(event) => this.cancelRecord(false)}
            >
                <p>"是否结束回放?"</p>
            </Modal>
            <Modal
                title="提示"
                visible={this.state.isStartPlay}
                onOk={(event) => this.startPlay(this.state.activeSn)}
                onCancel={(event) => this.cancelRecord(false)}
            >
                <p>"是否开始回放?"</p>
            </Modal>
        </div >)
    }

}

function select(store) {
    return {
        userInfo: store.default.userStore.userInfo,
        status: store.default.userStore.status,
    }
}
export default connect(select)(Whiteboard)