<!--运维人员-->
<template>
  <Content :style="{padding: '12px', background: '#fff'}">
    <Row type="flex" justify="space-between" style="padding-bottom: 12px">
      <Button type="primary" shape="circle" icon="ios-plus-empty" @click="fmModal=true;fmData={}">添加人员</Button>
    </Row>
    <Table ref="table" :columns="tbColumns" :data="tbData" size="small"></Table>
    <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
          @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
          :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
    <Modal v-model="fmModal" title="新增/修改" @on-ok="saveData(fmData.id)">
      <Form :model="fmData" :label-width="80">
        <FormItem label="人员姓名">
          <Select v-model="fmData.id" placeholder="请选择人员" filterable @on-change="selectUser">
            <Option v-for="u in user" :key="u.id" :value="u.id">{{u.userCode+' '+u.userName}}</Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </Content>


</template>

<script>
  export default {
    name: "engineer",
    data() {
      return {
        api: this.$config.api.schema + "/sys_user/",
        loading: false,
        tbColumns: [
          {
            type: 'index',
            width: 60,
            align: 'center'
          },
          {
            type: 'selection',
            width: 60,
            align: 'center'
          },
          {
            title: '人员编码',
            key: 'userCode'
          },
          {
            title: '人员名称',
            key: 'userName'
          },
          {
            title: '职位',
            width: 100,
            key: 'job'
          },
          {
            title: '所属部门',
            key: 'idBranch',
            render: (h, params) => {
              if (params.row.idBranch) {
                return h('span', params.row.idBranch.branchName)
              }
            }
          },
          {
            title: '所属团队',
            key: 'idTeam',
            render: (h, params) => {
              if (params.row.idTeam) {
                return h('span', params.row.idTeam.teamName)
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
                      if (name === 'remove') {
                        this.$Modal.confirm({
                          title: '提示',
                          content: '<p>数据将被删除，请谨慎操作！确认删除吗？</p>',
                          onOk: () => {
                            this.remove(params.row)
                          },
                          onCancel: () => {

                          }
                        });
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
                          name: 'remove'
                        }
                      }, '删除'),
                    ])
                ]);
            }
          }],
        tbData: [],
        tbQuery: {
          order: 'id',
          limit: 10,
          page: 1,
          filter: {isEngineer: 1},
          populate: 'idTeam,idBranch'
        },
        event: [],
        user: [],
        fmData: {},
        fmModal: false,
      }
    },
    mounted() {
      this.loadData();
    },
    watch: {
      tbQuery: {
        handler(value) {
          if (value.like === '') {
            delete this.tbQuery.like;
          }
          this.loadData();
        },
        deep: true
      }
    },
    methods: {
      async loadData() {
        this.user = (await this.$http.get(this.api)).data.rows;
        this.tbData = (await this.$http.get(this.api, {params: this.tbQuery})).data.rows;
      },
      async saveData(id) {
        if (id) {
          await this.$http.patch(this.api + id, {'isEngineer': 1});
        }
        else {

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
        await this.$http.patch(this.api + ids, {'isEngineer': 0});
        this.loadData();
      },
      selectUser(value) {
        for (let user of this.user) {
          if (value === user.id) {
            this.fmData.userName = user.userName;
            this.fmData.idBranch = user.idBranch;
            this.fmData.idTeam = user.idTeam;
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
    }
  }
</script>

<style scoped>

</style>

