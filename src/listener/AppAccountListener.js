
/*
 * 实现注册监听器。
 */
export class AppAccountListener{
	constructor (react) {
    this.react =react;
  }

    /**
     * 账号登录成功回调
     * @param session {Session}
     */
    onLogined (session) {
      console.log(this)
      // this.vue.$store.state.isEngineLogin = "success";
      this.react.setState({
        isEngineLogin:"success"
      })
      console.log("账号登录成功回调")
    }

    /**
     * 账号注销成功回调
     * @param session {Session}
     */
    onLogouted (session) {
      this.react.setState({
        isEngineLogin:"logout"
      })
      console.log("账号注销成功回调")
    }

    onFailed (error) {
      this.react.setState({
        isEngineLogin:"error"
      })
      console.log(error,"账号失败回调")
    }
};
