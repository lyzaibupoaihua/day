<!--提交工单-->
<template>
    <Content :style="{padding: '12px', background: '#fff'}">
      <Form :model="fmData" :label-width="80">
        <FormItem label="工单类别">
          <Select v-model="fmData.workOrderClass">
            <Option v-for="c in classList" :key="c.workOrderClassName" :value="c.workOrderClassName">{{c.workOrderClassName}}</Option>
          </Select>
        </FormItem>
        <FormItem label="工单标题">
          <Input v-model="fmData.workOrderTitle"></Input>
        </FormItem>
        <FormItem label="问题描述">
          <div id="editorElem"></div>
        </FormItem>
        <FormItem>
          <Row type="flex" justify="space-between" style="padding-bottom: 12px">
            <Button type="primary" @click="saveData()">提交工单</Button>
          </Row>
        </FormItem>
      </Form>
    </Content>
</template>

<script>
  import E from 'wangeditor'

  export default {
    name: "workOrder",
    data() {
      return {
        api: this.$config.api.schema + "/sys_work_order/",
        fmData: {
          idUser: JSON.parse(this.$cookie.get('LOGIN_USER')).id,
          submitterName: JSON.parse(this.$cookie.get('LOGIN_USER')).userName
        },
        fmModal: false,
        editor: new E('#editorElem'),
        classList: [],
      }
    },
    mounted() {
      this.loadData();
      this.editor.customConfig.onchange = (html) => {
        this.fmData.workOrderContent = html
      };
      this.editor.customConfig.uploadImgShowBase64 = true;
      this.editor.customConfig.zIndex = 1;
      this.$nextTick(function () {
        this.editor.create();
      })
    },
    methods: {
      async loadData() {
       this.classList =  (await this.$http.get(this.$config.api.schema + "/sys_work_order_class/")).data.rows;
      },
      //提交工单
      async saveData() {
        await this.$http.post(this.$config.api.schema + "/sys_work_order/", this.fmData);
        this.$router.push({
          name: 'workOrderAll'
        });
      },
    }
  }
</script>

<style scoped>

</style>
