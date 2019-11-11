import React, {
    Component
} from 'react'
import { Button, Input} from 'antd';
import {connect} from 'react-redux';
import api from '../api/index';
import  '../assets/css/mian.css';

import imgUrl from '../assets/img/logo120.png';
let appInfo = require(`${__dirname}/../appInfo`);

class UserList extends Component {
    constructor(props) {
        super(props);
        this.state ={
            appId: appInfo.appId,
            appKey: appInfo.appKey
        };
    }

    loginCube(){
        console.log(api,this)
        api.user.loginWithAppKey(this.state.appId,this.state.appKey).then(()=>{
            localStorage.setItem('appKey',this.state.appKey)
            localStorage.setItem('appId',this.state.appId,)
            this.props.history.push("/demoItem");
        })
     }
 
     chengeAppId(event){
         console.log(event.target.value, this)
         this.setState({'appId':event.target.value})
 
     }
     chengeAppKey(event){
         console.log(event.target.value)
         this.setState({'appKey':event.target.value});
     }
    render() {
        return (
                <div className="ms-login">
                    <img className="cube-logo" src={imgUrl} />
                <Input className="input-style" placeholder='请输入appId' value={this.state.appId} onChange={(event)=>this.chengeAppId(event)}></Input>
               
                <Input className="input-style" placeholder='请输入appKey' value={this.state.appKey} onChange={(event)=>this.chengeAppKey(event)}></Input>
               
                <Button onClick={(event)=>this.loginCube(event)} className="login-btn" type="primary"> 登录</Button>
                
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

export default connect(select)(UserList);