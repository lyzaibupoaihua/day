 

//向父组件传递数据，以事件形式传递，父组件以@string接收事件。
 this.$emit('string',data.id)
// 当 string === input 时，我们可以在子组件中 prop 一个 value,
// 此时我们就可以在父组件中 使用 v-model 的方式来绑定 该value值,
// 而后只需将子组件的视图部分的数据与value关联就形成了双向绑定。
// 视如：
<MyInput v-model='fmData'> === <MyInput @input='(value)=>{fmData = value}' :value='fmData'>
