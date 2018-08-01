<!--工单管理-->
<template>
    <Content :style="{padding: '12px', background: '#fff'}">
      <Row type="flex" justify="space-between" style="padding-bottom: 12px">
        <Button type="primary" shape="circle" @click="newOrder">新建工单</Button>
        <Select v-model="tbQuery.filter.workOrderState" style="width:200px" clearable>
          <Option v-for="ec in classify" :key="ec.id" :value="ec.id">{{ec.stateName}}</Option>
        </Select>
      </Row>
      <Table :columns="tbColumns" :data="tbData.rows" size="small"></Table>
      <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
            @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
            :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
      <Modal v-model="fmModal" title="新增/修改" @on-ok="saveData(fmData)">
      <Form :model="fmData" :label-width="80">
        <FormItem label="人员姓名">
          <Select v-model="fmData.id" placeholder="请选择人员" filterable>
            <Option v-for="u in user" :key="u.id" :value="u.id">{{u.userCode+' '+u.userName}}</Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
    </Content>


</template>

<script>
  export default {
    name: "workorder",
    data() {
      return {
        api: this.$config.api.schema + "/sys_work_order/",
        ltApi:this.$config.ltPmp, // lentrue工单接口地址
        tbColumns: [
          {
            type: 'index',
            width: 60,
            align: 'center'
          },
          {
            title: '工单编号',
            key: 'workOrderNo',
            align: 'center'
          },
          {
            title: '工单标题',
            key: 'workOrderTitle',
            align: 'center'
          },
          {
            title: '工单类别',
            align: 'center',
            key: 'workOrderClass',
          },
          {
            title: '提交人',
            align: 'center',
            key: 'submitterName',
          },
          {
            title: '提交时间',
            key: 'submitTime',
            width: 200,
            align: 'center',
            render: (h, params) => {
              return h('span', this.$moment(params.createdAt).format("LLL"))
            }
          },
          {
            title: '完成时间',
            key: 'workOrderEndTime',
            width: 200,
            align: 'center',
            render: (h, params) => {
              if(params.row.workOrderEndTime){
                return h('span', this.$moment(params.row.workOrderEndTime).format("LLL"))
              }
              else{
                return h('span', '进行中')
              }
            }
          },
          {
            title: '状态',
            align: 'center',
            key: 'workOrderState',
            render: (h, params) => {
              if (params.row.workOrderState === 0) {
                return h('span', '已提交')
              }
              else if (params.row.workOrderState === 1) {
                return h('span', '已分派')
              }
              else if (params.row.workOrderState === 2) {
                return h('span', '正在处理')
              }
              else if (params.row.workOrderState === 3) {
                return h('span', '处理完成，待评价')
              }
              else if (params.row.workOrderState === 4) {
                return h('span', '工单已关闭')
              }
              else if (params.row.workOrderState === 11) {
                return h('span', '已提交联启')
              } else {
                return h('span', '火星了')
              }
            }
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 60,
            render: (h, params) => {
                return h('Dropdown', {
                    props: {
                      placement: 'top',
                      transfer: true
                    },
                    on: {
                      'on-click': (name) => {
                        if (name === 'refer') {
                          this.refer(params.row)
                        }
                        if (name === 'detail') {
                          this.detail(params.row)
                        }
                        if (name === 'assign') {
                          this.assign(params.row)
                        }
                      }
                    }
                  },
                  [
                    h('Button', {
                      props: {
                        type: "text",
                        icon: "more",
                        size: "large"
                      },
                    }),
                    h('DropdownMenu', {
                        slot: 'list',
                      },
                      [
                        h('DropdownItem', {
                          props: {
                            name: 'detail'
                          }
                        }, '详情'),
                        h('DropdownItem', {
                          props: {
                            name: 'assign'
                          }
                        }, '分派'),
                        h('DropdownItem', {
                          props: {
                            name: 'refer'
                          }
                        }, '提交联启'),

                      ])
                  ]);
            }
          }
        ],
        tbData: [],
        tbQuery: {
          limit: 10,
          page: 1,
          populate:'idWorkOrderCl',
          filter: {__r: 0}
        },
        ltQuery: {
          limit: 10,
          page: 1,
          filter: {__r: 0,originCode:'ZAJT01'}
        },
        fmData: {},
        fmModal: false,
        classify: [
          {id: 0, stateName: '已提交'},
          {id: 1, stateName: '已分派'},
          {id: 2, stateName: '处理中'},
          {id: 3, stateName: '待评价'},
          {id: 4, stateName: '已关闭'},
          {id: 11, stateName: '提交至联启'},],
        user: []
      }
    },
    watch: {
      '$route': "loadData",
      tbQuery: {
        handler(value) {
          if (value.filter.workOrderState !== '' || value.filter.workOrderState === 0) {
            if (value.filter.workOrderState === 11) {
              this.loadLenTrueData();
            } else {
              this.loadData();
            }
          } else {
            delete this.tbQuery.filter.workOrderState;
            this.loadData();
          }

        },
        deep: true
      }
    },
    mounted() {
      this.loadData();
    },
    methods: {
      async loadLenTrueData() {
        //加载联启数据库中的数据
        this.tbData = (await this.$http.get(this.ltApi + '/sys_work_order/', {
          params: this.ltQuery
        })).data;
      },
      async loadData() {
        this.tbData = (await this.$http.get(this.api, {
          params: this.tbQuery
        })).data;
        this.tbData.submitTime = this.$moment(this.tbData.createdAt).format("LLL");
        this.user = (await this.$http.get(this.$config.api.schema + '/sys_user/', {
          params: {
            filter: {isEngineer: 1}
          }
        })).data.rows;
      },
      // 生成工单的接单人
      async saveData(data) {
        await this.$http.patch(this.api + this.fmData.idworkOrder,
          {'idEngineer': data.id, 'workOrderState': 1});
        this.loadData();
        this.fmModal = false;
      },
      // 提交到lentrue
      async refer(rows) {
        let id = rows.id
        // 改变本地服务器数据
        await this.$http.patch(this.api + id,
          {'__r': 1,'workOrderState': 11})
        // 上传到lentrue pmp服务器
        rows.originCode = 'ZAJT01'
        delete rows._id;
        delete rows.id;
        await this.$http.post(this.ltApi + '/sys_work_order/',rows)
        this.loadData();
      },
      //工单详情
      async detail(rows) {
        this.$router.push({path:'/workOrderDetail/',query:{id:rows.id,state:this.tbQuery.filter.workOrderState}})
      },
      //分派工单
      async assign(row) {
        let id = row.id
        this.fmData.idworkOrder = id
        const workOrder = (await this.$http.get(this.$config.api.schema + "/sys_work_order/" + id, {params: {populate: 'idEngineer'}})).data.rows[0]
        switch (workOrder.workOrderState) {
          case 0: {
            if(this.user.length !== 0){
              this.fmModal = true
              this.loadData();
            }else{
              this.$Message.error('请添加维修工程师')
            }
            break;
          }
          case 1: {
            if(this.user.length !== 0){
              this.$Modal.confirm({
                render: (h) => {
                  return h('h3', '该工单已分派给:' + '  ' + workOrder.idEngineer.userName + '  ' + '是否重新分派?')
                },
                onOk: async () => {
                  this.fmModal = true
                  this.loadData();
                },
                onCancel: () => {
                }
              });
            }else{
              this.$Message.error('请添加维修工程师')
            }
            break;
          }
          case 2: {
            if(this.user.length !== 0){
              this.$Modal.confirm({
                render: (h) => {
                  return h('h3', '该工单已分派给:' + '  ' + workOrder.idEngineer.userName + '  ' + '是否重新分派?')
                },
                onOk: async () => {
                  this.fmModal = true
                  this.loadData();
                },
                onCancel: () => {
                }
              });
            }else{
              this.$Message.error('请添加维修工程师')
            }

            break;
          }
          case 3: {
            if(this.user.length !== 0){
              this.$Modal.confirm({
                render: (h) => {
                  return h('h3', workOrder.idEngineer.userName + '  正在处理' + '该工单' + '确认重新分派?')
                },
                onOk: async () => {
                  this.fmModal = true
                  this.loadData();
                },
                onCancel: () => {
                }
              });
            }else{
              this.$Message.error('请添加维修工程师')
            }
            break;
          }
          default: {
            this.$Message.error('该工单已不可重新分派')
          }
        }

      },
      changPage(value) {
        this.tbQuery.page = value;
        this.loadData();
      },
      changPageSize(value) {
        this.tbQuery.limit = value;
        this.loadData();
      },
      newOrder() {
        this.$router.push({
          name: 'workOrderSub'
        });
      }
    }
  }
</script>

<style scoped>

</style>

