<!--我的工单-->
<template>
  <Content :style="{padding: '12px', background: '#fff'}">
    <Row type="flex" justify="space-between" style="padding-bottom: 12px">
      <Select v-model="tbQuery.filter.workOrderState" style="width:200px" clearable>
        <Option v-for="ec in classify" :key="ec.id" :value="ec.id">{{ec.stateName}}</Option>
      </Select>
    </Row>
    <Table :columns="tbColumns" :data="tbData.rows" size="small"></Table>
    <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
          @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
          :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
  </Content>

</template>

<script>
  export default {
    name: "workorder-mine",
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
                    'on-click': async (name) => {
                      if (name === 'refer') {
                        this.$Modal.confirm({
                          title: '提示',
                          content: '<p>确认将此工单提交到联启？</p>',
                          onOk: async () => {
                            this.refer(params.row)
                          },
                          onCancel: () => {

                          }
                        });
                      }
                      if (name === 'detail') {
                        if (this.tbQuery.filter.workOrderState == 11) {
                          this.$router.push({
                            path: '/workOrderDetail/',
                            query: {id: params.row.id, state: this.tbQuery.filter.workOrderState}
                          })
                        } else {
                          this.$router.push({
                            path: '/workOrderDetail/',
                            query: {id: params.row.id, state: params.row.workOrderState}
                          })
                        }
                      }
                      if (name === 'confirm') {
                        let id = params.row.id
                        await this.$http.patch(this.$config.api.schema + "/sys_work_order/" + id,
                          {'workOrderState': 2})
                        this.loadData();
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
                          name: 'confirm'
                        }
                      }, '确认受理'),
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
          populate: 'idWorkOrderCl',
          filter: {
            __r: 0,
            idEngineer: JSON.parse(this.$cookie.get('LOGIN_USER')).id
          }
        },
        ltQuery: {
          limit: 10,
          page: 1,
          filter: {__r: 0,originCode:'ZAJT01'}
        },
        fmData: {},
        fmModal: false,
        classify: [
          {id: 1, stateName: '已分派'},
          {id: 2, stateName: '处理中'},
          {id: 3, stateName: '待评价'},
          {id: 4, stateName: '已关闭'},
          {id: 11, stateName: '提交至联启'},]
      }
    },
    watch: {
      '$route': "loadData",
      tbQuery: {
        handler(value) {
          if (value.filter.workOrderState != '') {
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
        this.tbData = (await this.$http.get(this.ltApi +'/sys_work_order/', {
          params: this.ltQuery
        })).data;
      },
      async loadData() {
        console.log('this.$config.ltPmp',this.$config.ltPmp)
        this.tbData = (await this.$http.get(this.api, {
          params: this.tbQuery
        })).data;
        this.tbData.submitTime = this.$moment(this.tbData.createdAt).format("LLL");
      },
      async saveData(data) {
        await this.$http.post(this.$config.api.schema + "/sys_work_order_class/", data);
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
      changPage(value) {
        this.tbQuery.page = value;
        this.loadData();
      },
      changPageSize(value) {
        this.tbQuery.limit = value;
        this.loadData();
      },
    }
  }
</script>

<style scoped>

</style>
