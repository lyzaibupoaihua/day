<template>
  <Content>
    <Row type="flex" justify="space-between" style="padding-bottom: 12px">
      <ButtonGroup>
        <Button type="primary" icon="ios-plus-empty" @click="porpView">返回</Button>
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
            <Select v-model="fmData.idFileClass" :disabled= 'isHis' >
              <Tree :data="fileClass" :render="renderContent" :expand="true"></Tree>
            </Select>
          </FormItem>
        </Col>
      </Row>
      <Form v-show='isHis'>
        <card style="margin-bottom: 12px">
          <h4 slot="title">历史版本</h4>
          <Table ref="table" :columns="tbColumns" :data="tbData.rows" size="small"></Table>
          <Page show-elevator show-sizer show-total @on-change='changPage' placement="top"
                @on-page-size-change="changPageSize" :total="tbData.count" :current="tbQuery.page"
                :page-size="tbQuery.limit" :page-size-opts="[10, 25, 50, 100]" :style="{padding:'12px'}"></Page>
        </card>
      </Form>
      <Form>
        <Upload
          ref="upload"
          :before-upload="handleUpload"
          type="drag"
          :action="$config.host+$config.api.upload">
          <div style="padding: 20px 0">
            <Icon type="ios-cloud-upload" size="52" style="color: #3399ff"></Icon>
            <p>点击或拖拽上传</p>
          </div>
        </Upload>
        <Upload
          :on-success="getIdFile"
          style="margin-bottom: 8px"
          ref="upload"
          :show-upload-list=false
          :before-upload="handleUpload"
          :action="$config.host+$config.api.upload">
          <Button type="ghost" icon="ios-cloud-upload-outline">上传文件</Button>
        </Upload>
        <span>{{ files.name }}</span>
        <FormItem>
          <Input type="textarea" :rows=4 placeholder="写入备注信息" v-model="fmData.memo"></Input>
        </FormItem>
        <FormItem>
          <Button type="primary" @click="upload" style="float: right">{{isHis?'版本更新':'添加文档'}}</Button>
        </FormItem>
      </Form>
    </Form>
  </Content>

</template>

<script>
  import uuidv1 from 'uuid/v1';
  export default {
    name: "file-detail",
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
        uidFile:'',
        files: {},
        fileList: [],
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
        tbData: {},
        fmData:{},
        fmModal: false,
        fileClass: [],
        fmView: false,
        organList: [],
        saveFile: false,
      }
    },
    props: ['isHis','uidFiles','idOrgan'],
    mounted() {
      this.loadData();
    },
    watch: {
      uidFiles: {
        handler(value) {
          this.tbQuery.filter.uidFiles = value
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
        // const result = await this.$http.get(this.api, {params: this.tbQuery});
        const fileClass = (await this.$http.get(this.$config.api.schema + "/bd_file_class/")).data.rows;
        this.fileClass = this.$utils.convertJsonTree(fileClass, 0);
        this.organList = (await this.$http.get(this.$config.api.schema + '/sys_organ/')).data.rows;
        if (this.idOrgan) {
          if (this.uidFiles) {
            let result = (await this.$http.get(this.api, {params:this.tbQuery}));
            this.fmData.idFileClass = result.data.rows[0].idFileClass.id
            this.tbData = result.data;
          }
        } else {
          this.tbData = {}
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
       console.log('response',response)
        if(response.error.code === '0'){
          this.fmData['idOrgan'] = this.idOrgan
          const rows = (await this.$http.get(this.$config.api.schema + "/sys_organ/" + this.idOrgan)).data.rows[0];
          this.fmData['idGroup'] = rows.idGroup
          this.fmData['uidFiles'] = this.uidFile
          console.log('this.tbData',this.tbData.row)
          if(this.tbData.row){
            this.fmData['version'] = this.tbData.rows[0].version + 1
          }
          // this.fmData['filePath'] = response.rows.filePath
          await this.$http.patch(this.api + response.rows.id, this.fmData)
          this.files = {};
          this.loadData()
          this.$Message.success('success')
        }else if(response.error.code === '400'){
         this.$Message.error('请选择上传文件')
        }else{
          this.$Message.error('系统故障')
        }
      },
      handleUpload(file) {
        if (file) {
          this.files = file;
        }
        return this.saveFile;
      },
      async upload() {
        if(!this.uidFiles){
          this.uidFile = uuidv1()
        }else{
          this.uidFile = this.uidFiles
        }
        if (this.idOrgan) {
          if(this.fmData.idFileClass){
            await this.$refs.upload.post(this.files)
            this.handleUpload()
            console.log('this.fmData.idFileClass',this.fmData.idFileClass)
          }else{
            this.$Message.error('请先选择文档类别')
          }
        } else {
          this.$Message.error('请先选择组织')
        }
      },
      async downloadFiles(filePath) {
          window.location =this.$config.downloadUrl + filePath;
      },
      porpView() {
        this.clearData()
        this.$emit('fmView',false); //主动触发test方法，'123'为向父组件传递的数据
      },
      clearData(){
        this.fmData = {}
        this.files = {}
      }
    }
  }
</script>

<style scoped>

</style>
