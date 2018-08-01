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
            <Button type="primary" icon="ios-plus-empty" @click="fmView=true;loadFile()">上传文档</Button>
          </ButtonGroup>
          <div><Input v-model="tbQuery.like" placeholder="请输入关键字..." icon="search"></Input></div>
        </Row>
        <Table ref="table" :columns="tbColumns" :data="tbData.rows" size="small"></Table>
        <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
              @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
              :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
      </div>
      <div v-show="fmView">
        <Row type="flex" justify="space-between" style="padding-bottom: 12px">
          <ButtonGroup>
            <Button type="primary" icon="ios-plus-empty" @click="fmView=false">返回</Button>
          </ButtonGroup>
        </Row>
        <Form :model="fmData" :label-width="80">
          <Row>
            <Col span="6">
              <FormItem label="文档名称">
                <Input v-model="fmData.fileName" placeholder="文档名称"></Input>
              </FormItem>
            </Col>
            <Col span="6">
              <FormItem label="文档类别">
                <Select v-model="fmData.idFileClass">
                  <Tree :data="fileClass" :render="renderContent" :expand="true"></Tree>
                </Select>
              </FormItem>
            </Col>
          </Row>
          <Form v-if='!isHis'>
            <Upload
              :on-success="getIdFile"
              style="margin-bottom: 8px"
              ref="upload"
              :show-upload-list=false
              :before-upload="handleUpload"
              :action="$config.host+$config.api.upload" multiple>
              <Button type="ghost" icon="ios-cloud-upload-outline">上传附件</Button>
            </Upload>
            <span v-for="file of files">{{ file.name }}</span>
            <FormItem>
              <Input type="textarea" :rows=4 placeholder="写入备注信息" v-model="fmData.memo"></Input>
            </FormItem>
            <FormItem>
              <Button type="primary" @click="upload" style="float: right">确认</Button>
            </FormItem>
          </Form>
          <Form v-else>
            <card style="margin-bottom: 12px">
              <h4 slot="title">已传附件</h4>
              <a v-for="fl of fileList" :href="$config.downloadUrl+ fl.filePath" :download="fl.fileName">{{ fl.fileName
                }}</a>
            </card>
            <card>
              <h4 slot="title">备注信息</h4>
              <span>{{this.fileList[0]?this.fileList[0].memo:'这个人很懒，没有备注信息'}}</span>
            </card>
          </Form>
        </Form>
      </div>
    </Content>
  </Layout>
</template>

<script>
  import uuidv1 from 'uuid/v1';

  export default {
    name: "file",
    data() {
      return {
        api: this.$config.api.schema + '/bd_file/',
        tbQuery: {
          order: 'id',
          limit: 10,
          page: 1,
          populate: 'idFileClass',
          likeBy: 'fileCode,fileName',
          filter: {__r: 0}
        },
        isHis: false,
        files: [],
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
              if (params.row.version === 0) {
                return h('span', {
                  style: {
                    color: '#ff0000'
                  }
                }, 'V1')
              }
              else if (params.row.version === 1) {
                return h('span', {
                  style: {
                    color: '#00ff00'
                  }
                }, 'V2')
              }
            }
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
                        this.fmData = params.row;
                        if (this.fmData.idFileClass) {
                          this.fmData.idFileClass = this.fmData.idFileClass.id;
                        }
                        this.loadFile(params.row)
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
                        this.downloadFiles(params.row.id)
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
                          name: 'download'
                        }
                      }, '下载')
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
      fmData: {
        handler(value) {
          console.log('fmData', this.fmData)
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
        const result2 = await this.$http.get(this.$config.api.loadFiles);
        console.log(result2)
        this.organList = (await this.$http.get(this.$config.api.schema + '/sys_organ/')).data.rows;
        if (this.idOrgan) {
          this.tbData = result.data;
        } else {
          this.tbData = []
        }
      },
      async loadFile(data) {
        const fileClass = (await this.$http.get(this.$config.api.schema + "/bd_file_class/")).data.rows;
        this.fileClass = this.$utils.convertJsonTree(fileClass, 0);
        console.log('data',data)
        if (data.uidFiles) {
          this.fileList = (await this.$http.get(this.api ,{params:{filter:{uidFiles:data.uidFiles}}})).data.rows;
          console.log('fileList',this.fileList)
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
      renderContent(h, {root, node, data}) {
        return h('Option', {
          props: {
            value: data.id,
            label: data.fileClassName
          },
          style: {
            display: 'inline-block'
          }
        })
      },
      async getIdFile(response) {
        this.fmData['idOrgan'] = this.idOrgan
        const rows = (await this.$http.get(this.$config.api.schema + "/sys_organ/" + this.idOrgan)).data.rows[0];
        this.fmData['idGroup'] = rows.idGroup
        this.fmData['uidFiles'] = this.uidFiles
        this.fmData['filePath'] = response.rows.filePath
        console.log(this.fmData)
        await this.$http.patch(this.api + response.rows.id, this.fmData)
      },
      handleUpload(file) {
        if (file) {
          this.files.push(file);
        }
        return this.saveFile;
      },
      async upload() {
        this.uidFiles = uuidv1()
        if (this.idOrgan) {
          for (let file of this.files) {
            await this.$refs.upload.post(file)
          }
          this.handleUpload()
          setTimeout(() => {
            this.files = [];
            this.$Message.success('Success')
          }, 1500);
        } else {
          this.$Message.error('请先选择组织')
        }
      },
      async downloadFiles(id){
        const uidFiles = (await this.$http.get(this.api + id)).data.rows[0].uidFiles;
        const row = (await this.$http.get(this.api ,{params:{filter:{uidFiles:uidFiles}}})).data.rows;
        console.log('row',row)
        for(let r of row){
          console.log(' r in row',r)
          window.open(this.$config.downloadUrl+ r.filePath);
        }
      }
    }
  }
</script>

<style scoped>

</style>
