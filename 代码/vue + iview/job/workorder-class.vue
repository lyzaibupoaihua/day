<template>
  <Content :style="{padding: '12px', background: '#fff'}">
    <Row type="flex" justify="space-between" style="padding-bottom: 12px">
      <Button type="primary" @click="fmModal=true;fmData={}">添加分类</Button>
    </Row>
    <Table :columns="tbColumns" :data="tbData.rows" size="small"></Table>
    <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
          @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
          :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
    <Modal v-model="fmModal" title="新增/修改" @on-ok="saveData(fmData)">
      <Form :model="fmData" :label-width="100">
        <FormItem label="工单类别编码">
          <Input v-model="fmData.workOrderClassCode" placeholder="自定义档案编码"></Input>
        </FormItem>
        <FormItem label="工单类别名称">
          <Input v-model="fmData.workOrderClassName" placeholder="自定义档案名称"></Input>
        </FormItem>
        <FormItem label="备注">
          <Input v-model="fmData.memo" placeholder="备注"></Input>
        </FormItem>
      </Form>
    </Modal>
  </Content>
</template>

<script>
  export default {
    name: "base-doc",
    data() {
      return {
        api: this.$config.api.schema + '/sys_work_order_class/',
        tbColumns: [
          {
            type: 'index',
            width: 60,
            align: 'center'
          },
          {
            title: '工单类别编码',
            key: 'workOrderClassCode',
            align: 'center'
          },
          {
            title: '工单类别名称',
            align: 'center',
            key: 'workOrderClassName'
          },
          {
            title: '备注',
            align: 'center',
            key: 'memo'
          },
          {
            title: '状态',
            align: 'center',
            key: '__s',
            render: (h, params) => {
              if (params.row.__s === 0) {
                return h('span', {
                  style: {
                    color: '#ff0000'
                  }
                }, '已停用')
              }
              else if (params.row.__s === 1) {
                return h('span', {
                  style: {
                    color: '#00ff00'
                  }
                }, '已启用')
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
                      if (name === 'modify') {
                        this.fmModal = true;
                        this.fmData = params.row;
                      }
                      if (name === 'remove') {
                        this.remove(params.row)
                      }
                      if (name === 'switch') {
                        this.switch(params.row)
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
                          name: 'modify'
                        }
                      }, '修改'),
                      h('DropdownItem', {
                        props: {
                          name: 'remove'
                        }
                      }, '删除'),
                      h('DropdownItem', {
                        props: {
                          name: 'switch'
                        }
                      }, '启/停用')
                    ])
                ]);
            }
          }
        ],
        tbData: [],
        tbQuery: {
          order: 'id',
          limit: 10,
          page: 1
        },
        fmData: {},
        fmModal: false
      }
    },
    mounted() {
      this.loadData();
    },
    methods: {
      async loadData() {
        const result = await this.$http.get(this.api, {params: this.tbQuery});
        this.tbData = result.data;
      },
      async saveData(data) {
        if (data.id) {
          await this.$http.put(this.api + data.id, data);
        }
        else {
          await this.$http.post(this.api, data);
        }
        this.loadData();
        this.fmModal = false;
      },
      async remove(rows) {
        let ids = [];
        if (rows[0]) {
          rows.forEach((row) => {
            ids.push(row.id);
          });
        }
        else {
          ids = rows.id;
        }
        await this.$http.delete(this.api + ids);
        this.$Message.success('删除成功')
        this.loadData();
      },
      //状态开关
      async switch(rows) {
        let ids = rows.id
        if (rows.__s === 0) {
          await this.$http.patch(this.api + ids, {"__s": 1});
        } else {
          await this.$http.patch(this.api + ids, {"__s": 0});
        }
        this.loadData();
      },
      changPage(value) {
        this.tbQuery.page = value;
        this.loadData();
      },
      changPageSize(value) {
        this.tbQuery.limit = value;
        this.loadData();
      }
    }
  }
</script>

<style scoped>

</style>

