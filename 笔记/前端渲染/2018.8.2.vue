<!--关于组件的使用-->

<template>
    <div>
        <Input v-model="organName"  @click.native="modal = true" readonly></Input>
        <Modal v-model="modal" title="选择组织" draggable>
            <Tree style="height: 100%" :data="organJson" :render="renderContent"></Tree>
        </Modal>
    </div>
</template>

<script>
    export default {
        name: "2018.8.2.vue",
        props:{
            value: {
                type: String, // 在vue 中 向父组件传递 prop  ‘vulae’ 可由v-model 双向绑定
                // 其他一般情况为 :data-value 是由父组件向该组件传递参数
            },
        },
        data() {
            return {
                modal: false,
                organList: [],
                organJson: [],
                organName:'',
            }
        },
        watch: {
            value (val) {
                for(let bl of this.organList){
                    if(bl.id===val){
                        this.organName=bl.organName
                    }
                }
            },
            modal(val){
                if(val){
                    this.loadData();
                }
            }
        },
        mounted() {
            this.loadData();
        },
        methods: {
            async loadData() {
                this.organList = (await this.$http.get(this.$config.api.schema + "/sys_organ/", {params: {order: 'order'}})).data.rows;
                this.organJson = this.$utils.convertJsonTree(this.organList, 0);
            },
            renderContent(h, {root, node, data}) {
                return h('CellGroup', {
                    style: {
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        padding: 0,
                        margin: 0,
                        width: '100%'
                    },
                }, [
                    h('Cell', {
                        props: {
                            selected: data.id === this.value, // 选中标志的判断
                        },
                        nativeOn: {
                            click: () => {
                                this.$emit('input', data.id) // input// 组件传递参数的方法
                            },
                            dblclick: () => {
                                this.$emit('input', data.id)
                                this.modal = false;
                            }
                        }
                    }, data.organCode + ' ' + data.organName)
                ]);
            },
        }
    }
</script>

<style scoped>

</style>

