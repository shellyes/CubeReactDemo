
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
      var self = this;
      // this.vue.$store.state.isEngineLogin = "success";
      this.react.setState({
        isEngineLogin:"success"
      })
      this.react.messageSuccess("登录成功")
      cube.getGroupService().queryGroups(
        function (groupEntity) {
          var paramList = [];
          for (var i = 0; i < groupEntity.list.length; i++) {
            var param = {
              founder: groupEntity.list[i].founder,
              displayName: groupEntity.list[i].displayName,
              name: groupEntity.list[i].name,
              members: groupEntity.list[i].members
            };
            if(groupEntity.list[i].members.length > 0 && groupEntity.list[i].members.indexOf(cube.accName)>-1){
              paramList.push(param);
            }else{
              paramList = self.react.state.groupList
            }
           
          }
          console.log('paramList',paramList)
          self.react.setState({
            groupList: paramList
          })
        },
        function () {
          message.error("查询群组失败!");
        }
      )
      console.log("账号登录成功回调")
    }

    /**
     * 账号注销成功回调
     * @param session {Session}
     */
    onLogouted (session) {
      this.react.setState({
        isEngineLogin:"logout",
        groupList:[]
      })
      console.log("账号注销成功回调")
    }

    onFailed (error) {
      this.react.setState({
        isEngineLogin:"error"
      })
      this.react.messageErro(error)
      console.log(error,"账号失败回调")
    }
};
