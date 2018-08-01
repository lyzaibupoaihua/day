<template>
  <Layout>
    <Content :style="{padding: '12px', background: '#fff'}">
      <Form >
        <FormItem  style="margin-bottom: 0px;" label="所属组织">
          <Row type="flex" justify="space-between" style="padding-bottom: 12px">
            <Select v-model="idOrgan" style="width:200px" clearable>
              <Option v-for="o in organList" :key="o._id" :value="o._id">{{o.organName}}</Option>
            </Select>
          </Row>
        </FormItem>
      </Form>
      <Row>
        <Button type="primary" icon="ios-plus-empty" @click="goCreate()">新建</Button>
      </Row>
      <Tree :data="fileClass" :render="renderContent"></Tree>
      <Modal v-model="fmModal" title="新增/修改" @on-ok="saveData(fmData)" :transfer="true">
        <Form :model="fmData" :label-width="80">
          <FormItem v-show="false">
            <Input v-model="fmData.p_id"></Input>
          </FormItem>
          <FormItem label="上级节点">
            <Input v-model="fmData.p_id_name" placeholder="上级文档节点" :disabled="true"></Input>
          </FormItem>
          <FormItem label="文档编码">
            <Input v-model="fmData.fileClassCode" placeholder="文档类别编码"></Input>
          </FormItem>
          <FormItem label="文档名称">
            <Input v-model="fmData.fileClassName" placeholder="文档类别名称"></Input>
          </FormItem>
          <FormItem label="同级排序">
            <Input v-model="fmData.order" placeholder="同级排序"></Input>
          </FormItem>
        </Form>
      </Modal>
    </Content>
  </Layout>
</template>
<script>
  export default {
    name: "fileClass",
    data() {
      return {
        api: this.$config.api.schema + "/bd_file_class/",
        fileClass: [],
        fmModal: false,
        fmData: {},
        idOrgan: '',
        organList: [],
        tbQuery: {
          order: "order",
          filter: {}
        }
      }
    },
    mounted() {
      this.loadData();
    },
    watch: {
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
        console.log(result)
        this.organList = (await this.$http.get(this.$config.api.schema + '/sys_organ/')).data.rows;
        if (this.idOrgan) {
          this.fileClass = this.$utils.convertJsonTree(result.data.rows, 0);
        } else {
          this.fileClass = []
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
        // 删除操作的限制条件
        console.log(rows)
        // 查询是否存在事件类别是否存在引用
        const childCount = (await this.$http.get(this.$config.api.schema + "/sys_user/", {
          params: {
            filter: {'idBranch': rows.id}
            // populate:'idEvent'
          }
        })).data.count
        console.log('childCount', childCount)
        if (childCount > 0) {
          this.$Message.error('存在在编人员' + childCount + '名' + '无法删除')
        } else {
          await this.$http.delete(this.api + ids);
          this.$Message.success('删除成功')
        }
        this.loadData();
      },
      async goCreate(pNode) {
        if (pNode) {
          this.fmData = {
            p_id: pNode.id, p_id_name: pNode.fileClassName, idGroup: pNode.idGroup,
            idOrgan: pNode.idOrgan
          };
          this.fmModal = true;
        }
        else {
          if (this.idOrgan) {
            let organ = await (await this.$http.get(this.$config.api.schema + '/sys_organ/' + this.idOrgan)).data.rows[0];
            this.fmData = {
              p_id: 0,
              p_id_name: organ.organName,
              idGroup: organ.idGroup,
              idOrgan: organ._id
            };
            this.fmModal = true;
          } else {
            console.log()
            this.$Message.error('请先选择组织')
          }
        }


      },
      goModify(data) {
        this.fmData = data;
        this.fmModal = true;
      },
      renderContent(h, {root, node, data}) {
        return h('span', {
          style: {
            display: 'inline-block',
            width: '100%'
          }
        }, [
          h('span', [
            h('Icon', {
              props: {
                type: 'social-buffer'
              },
              style: {
                marginRight: '8px'
              }
            }),
            h('span', data.fileClassCode + ' ' + data.fileClassName)
          ]),
          h('span', {
            style: {
              display: 'inline-block',
              float: 'right',
              marginRight: '32px'
            }
          }, [
            h('Button', {
              props: {
                icon: 'plus-round'
              },
              style: {
                marginRight: '8px'
              },
              on: {
                click: () => {
                  this.goCreate(data)
                }
              }
            }),
            h('Button', {
              props: {
                icon: 'compose'
              },
              style: {
                marginRight: '8px'
              },
              on: {
                click: () => {
                  this.goModify(data)
                }
              }
            }),
            h('Button', {
              props: {
                icon: 'minus-round'
              },
              on: {
                click: () => {
                  this.remove(data)
                }
              }
            })
          ])
        ]);
      },
    }
  }
</script>

<style scoped>

</style>
