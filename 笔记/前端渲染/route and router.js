 // 关于vue中路由的一些笔记

 this.$router  

 this.$route

 // 前者为 vue中的一个实例 且包含后者的全部信息

 this.$router.history.current  === this.$route // true

 this.$router 控制着vue中关于路由跳转的部分（方法以及参数）

而 this.$route 则是储存者 this.$rounter 跳转完成携带的参数
（this.router 为当前路由的信息，前者则是整个实例的信息）

this.$router 携带的方法
push('name') 	//跳转 string object 
=== replace() 	// 替代 
go(n) 后退n步