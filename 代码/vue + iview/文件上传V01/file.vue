<template>
  <Layout>
    <Content :style="{padding: '12px', background: '#fff'}">
      <Form>
        <FormItem label="所属组织" style="margin-bottom:0px;">
          <Row type="flex" justify="space-between" style="padding-bottom: 12px">
            <Select v-model="idOrgan" style="width:200px" clearable>
              <Option v-for="o in organList" :key="o._id" :value="o._id">{{o.organName}}</Option>
            </Select>
          </Row>
        </FormItem>
      </Form>
      <div v-show="!fmView">
        <Row type="flex" justify="space-between" style="padding-bottom: 12px">
          <ButtonGroup>
            <Button type="primary" icon="ios-plus-empty" @click="fmView=true;isHis=false">上传文档</Button>
          </ButtonGroup>
          <div><Input v-model="tbQuery.like" placeholder="请输入关键字..." icon="search"></Input></div>
        </Row>
        <Table ref="table" :columns="tbColumns" :data="tbData.rows" size="small"></Table>
        <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
              @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
              :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
      </div>
      <file-detail @fmView ='changeFm' v-show="fmView" :is-his="isHis" :uid-files="uidFiles" :id-organ="idOrgan"></file-detail>
    </Content>
  </Layout>
</template>
<script>
  import uuidv1 from 'uuid/v1';
  import FileDetail from "./file-detail";
  export default {
    components: {
      FileDetail
    },
    name: "file",
    data() {
      return {
        api: this.$config.api.schema + '/bd_file/',
        tbQuery: {
          order: '-version',
          limit: 10,
          page: 1,
          populate: 'idFileClass',
          likeBy: 'fileCode,fileName',
          filter: {__r: 0}
        },
        isHis: false,
        files: {},
        fileList:[],
        uidFiles:'',
        tbColumns: [
          {
            type: 'index',
            width: 60,
            align: 'center'
          },
          {
            title: '文档编码',
            key: 'fileCode'
          },
          {
            title: '文档名称',
            key: 'fileName'
          },
          {
            title: '文档类别',
            key: 'idFileClass',
            render: (h, params) => {
              if (params.row.idFileClass) {
                return h('span', params.row.idFileClass.fileClassName)
              }
            }
          },
          {
            title: '版本',
            align: 'center',
            key: 'version',
            render: (h, params) => {
              return h('span', {
                style: {
                  color: '#ff0000'
                }
              }, 'V'+params.row.version)
            }
          },
          // {
          //   title: '状态',
          //   align: 'center',
          //   key: '__s',
          //   render: (h, params) => {
          //     if (params.row.__s === 0) {
          //       return h('span', {
          //         style: {
          //           color: '#ff0000'
          //         }
          //       }, '已停用')
          //     }
          //     else if (params.row.__s === 1) {
          //       return h('span', {
          //         style: {
          //           color: '#00ff00'
          //         }
          //       }, '已启用')
          //     }
          //   }
          // },
          {
            title: '备注',
            key: 'memo'
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
                        this.fmView = true;
                        this.isHis = true;
                        this.uidFiles = params.row.uidFiles;
                      }
                      if (name === 'remove') {
                        this.$Modal.confirm({
                          title: '提示',
                          content: '<p>数据将被删除，删除后不可恢复，请谨慎操作！确认删除吗？</p>',
                          onOk: () => {
                            this.remove(params.row)
                          },
                          onCancel: () => {

                          }
                        });
                      }
                      if (name === 'download') {
                        this.downloadFiles(params.row.filePath)
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
                      }, '版本管理'),
                      h('DropdownItem', {
                        props: {
                          name: 'remove'
                        }
                      }, '删除版本'),
                      h('DropdownItem', {
                        props: {
                          name: 'download'
                        }
                      }, '下载版本')
                    ])
                ]);
            }
          }],
        tbData: [],
        fmData: {},
        fmModal: false,
        fileClass: [],
        fmView: false,
        organList: [],
        idOrgan: '',
        saveFile: false,
      }
    },
    mounted() {
      this.loadData();
    },
    watch: {
      fmView: {
        handler(value) {
          this.loadData()
        },
        deep: true
      },
      tbQuery: {
        handler(value) {
          if (value.like === '') {
            delete this.tbQuery.like;
          }
          this.loadData();
        },
        deep: true
      },
      idOrgan: {
        handler(value) {
          if (value) {
            this.tbQuery.filter.idOrgan = value
            this.loadData();
          } else {
            delete this.tbQuery.filter.idOrgan;
            this.loadData();
          }
        },
        deep: true
      }
    },
    methods: {
      async loadData() {
        const result = await this.$http.get(this.api, {params: this.tbQuery});
        const result2 = await this.$http.get(this.$config.api.loadFiles + '/bd_file/',{params: this.tbQuery});
        this.organList = (await this.$http.get(this.$config.api.schema + '/sys_organ/')).data.rows;
        if (this.idOrgan) {
          this.tbData = result2.data;

        } else {
          this.tbData = []
        }
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
        await this.$http.patch(this.api + ids, {'__r': 1});
        this.loadData();
      },
      async switch(rows) {
        let ids = [];
        if (rows[0]) {
          rows.forEach((row) => {
            ids.push(row.id);
          });
        }
        else {
          ids = rows.id;
        }
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
      },
      async downloadFiles(filePath){
        window.location =this.$config.downloadUrl + filePath;
      },
      changeFm(data){
        this.fmView = data
        this.isHis = data
        this.uidFiles =''
      }
    }
  }
</script>

<style scoped>

</style>
