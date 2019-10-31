import React, { Component } from 'react'
import {
    Route,
    Link,
    withRouter
} from 'react-router-dom'
import './App.css';
import { Menu, Icon } from 'antd';
import DemoItem from "./pages/DemoItem";
import Login from './pages/Login';
import Message from './pages/Message';
import Group from './pages/Group';
import Call from './pages/Call';
import Whiteboard from './pages/Whiteboard';
import File from './pages/File';

class AppRoot extends Component {
    constructor(props) {
        super(props);
        this.state = {
            current: this.props.location.pathname === '/' ? 'login' : this.props.location.pathname
        };
    }

    handleClick = (e) => {
        this.setState({
            current: e.key,
        });
    };

    render() {
        return (
            <div className="App">
                <div className="tx-r c91">v1.0.1</div>
                <Route exact path="/" component={Login} />
                <Route exact path="/login" component={Login} />
                
                <Route path="/demoItem" component={DemoItem} />
                <Route path="/message" component={Message} />
                <Route path="/group" component={Group} />
                <Route path="/call" component={Call} />
                <Route path="/whiteboard" component={Whiteboard} />
                <Route path="/file" component={File} />
                
            </div>
        );
    }
}

export default withRouter(AppRoot);