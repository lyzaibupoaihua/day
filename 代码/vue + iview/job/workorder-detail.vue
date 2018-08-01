<!--详细工单-->
<template>
  <Content :style="{padding: '12px', background: '#fff'}">
    <Card :bordered="false" style="margin-bottom: 10px;">
      <Steps @click.navtive="console.log('click step')" :current="workOrderData.workOrderState">
        <Step @click.navtive.stop="console.log('click step')" title="已提交"></Step>
        <Step @click.navtive="console.log('click step')" title="已分派"></Step>
        <Step @click.navtive="console.log('click step')" title="处理中"></Step>
        <Step @click.navtive="console.log('click step')" title="待评价"></Step>
        <Step @click.navtive="console.log('click step')" title="已关闭"></Step>
      </Steps>
    </Card>
    <Card :bordered="false" style="margin-bottom: 10px">
      <Row style="margin:10px">
        <Col span="6">
          <h4>工单标题：{{this.workOrderData.workOrderTitle || this.nullData}}</h4>
        </Col>
        <Col span="6">
          <h4>工单编号：{{this.workOrderData.workOrderNo || this.nullData}}</h4>
        </Col>
        <Col span="6">
          <h4>工单类别：{{this.workOrderData.workOrderClass || this.workOrderData.workOrderClass}}</h4>
        </Col>
        <Col span="6">
          <h4>提交时间：{{this.workOrderDate || this.nullData}}</h4>
        </Col>
      </Row>
      <Row style="margin:10px"><span v-html="workOrderData.workOrderContent"></span></Row>
      <Row>
        <Button style="float: right" @click="workOrderEnd">处理完毕</Button>
      </Row>
    </Card>
    <Card :bordered="false">
      <p slot="title">
        沟通记录
      </p>
      <Row style="text-align: center" v-if="records.length ===0">
        <span>暂无记录</span>
      </Row>
      <div v-for="r in records" style="border-bottom: dashed 1px rgba(0,0,0,0.28);min-height:30px;margin: 12px"
           v-else>
        <Row v-if="r.idUser">
          <Col span="20">
            <p style="width:90%;word-wrap:break-word;text-indent: 2em;">{{r.content}}</p>
          </Col>
          <Col span="4" style="padding-bottom: 20px">
            <div :bordered="false">
              {{r.idUser.userName}}[{{r.idUser.job}}]
              <Avatar size="large" :style="{background:r.idUser.avatarColor||red}">{{
                r.idUser.userName.slice(0,1).toUpperCase() || '无'}}
              </Avatar>
            </div>
          </Col>
        </Row>
        <Row v-else>
          <Col span="4" style="padding-bottom: 20px">
            <div :bordered="false">
              <Avatar size="large" :style="{background:'#F00'}">{{
                r.userName.slice(0,1).toUpperCase() || '无'}}
              </Avatar>
              {{r.userName}}[{{'客户'}}]
            </div>
          </Col>
          <Col span="20">
            <p style="width:90%;word-wrap:break-word;text-indent: 2em;">{{r.content}}</p>
          </Col>
        </Row>
      </div>
    </Card>
    <Form style="margin-top: 24px" v-if="workOrderData.workOrderState < 3">
      <FormItem>
        <Input type="textarea" :autosize="{minRows: 4}" v-model="record.content" placeholder="回复:"></Input>
      </FormItem>
      <FormItem>
        <Button @click="sendContent">回复</Button>
      </FormItem>
    </Form>
    <Card style="margin-top: 24px;text-align: center" v-else-if="workOrderData.workOrderState === 3 ">
      <span>工单处理完毕，等待用户评价</span>
    </Card>
    <Card style="margin-top: 24px" v-else-if="workOrderData.workOrderState === 4 ">
      <h3 style="margin-top: 5px">工单评价:</h3>
      <Row style="margin-top: 5px">
        <Col span="2"><h4>满意度：</h4></Col>
        <Col span="20">
          <Rate show-text allow-half v-model="workOrderData.workOrderRate.level" disabled>
            <span style="color: #f5a623">{{ workOrderData.workOrderRate.level }}</span>
          </Rate>
        </Col>
      </Row>
      <Row style="margin-top: 5px">
        <Col span="2"><h4>评语：</h4></Col>
        <Col span="20">
          <span>{{workOrderData.workOrderRate.content}}</span>
        </Col>
      </Row>
    </Card>
  </Content>
</template>
<script>
  export default {
    name: "workorder-view",
    data() {
      return {
        api: this.$config.api.schema + "/sys_work_order/",
        ltApi: this.$config.ltPmp, // lentrue工单接口地址
        workOrderData: {},
        workOrderUser: '',
        workOrderDate: '',
        Content: '',
        record: {},
        recordData: {},
        records: [],
        idrecord: '',
        workOrderRate: {},
        nullData: '暂无数据'
      }
    },
    async mounted() {
      this.loadData();
      this.loadRecords();
      this.$nextTick(function () {
        setInterval(this.loadRecords, 6000);
      })
      // this.loadpatchuser();
    },
    watch: {
      // '$route': "loadData",
    },
    methods: {
      async loadData() {
        // if(this.$route.query.state)
        if (this.$route.query.state === '11') {
          this.workOrderData = (await this.$http.get(this.ltApi + '/sys_work_order/' +
            this.$route.query.id, {
            params: {
              populate: 'idEngineer,idUser'
            }
          })).data.rows[0];
          console.log(' this.workOrderData', this.workOrderData)
        } else {
          this.workOrderData = (await this.$http.get(this.api +
            this.$route.query.id, {
            params: {
              populate: 'idUser,idEngineer,idWorkOrderCl'
            }
          })).data.rows[0];
        }
        this.workOrderDate = this.$moment(this.workOrderData.createdAt).format("LLL");
      },
      async loadRecords() {
        if (this.$route.query.state === '11') {
          this.records = (await this.$http.get(this.ltApi + '/sys_work_order_record/', {
            params: {
              filter: {idWorkOrder: this.$router.history.current.params.id},
              order: 'createdAt',
              populate: 'idUser'
            }
          })).data.rows;
        } else {
          this.records = (await this.$http.get(this.$config.api.schema + '/sys_work_order_record/', {
            params: {
              filter: {idWorkOrder: this.$router.history.current.params.id},
              order: 'createdAt',
              populate: 'idUser'
            }
          })).data.rows;
        }

      },
      async sendContent() {
        // 若数据库无此id关联则视为  “客户”
        this.record.userName = JSON.parse(this.$cookie.get('LOGIN_USER')).userName;
        this.record.idUser = JSON.parse(this.$cookie.get('LOGIN_USER')).id;
        this.record.idWorkOrder = this.workOrderData.id;
        await this.$http.post(this.ltApi + '/sys_work_order_record/', this.record)
        this.loadRecords();
        this.record.content = ''
      },
      async workOrderEnd() {
        let id = this.$route.query.id
        const check = (await this.$http.get(this.ltApi + "/sys_work_order/" + id)).data.rows[0]
        if (check.idEngineer === JSON.parse(this.$cookie.get('LOGIN_USER')).id) {
          switch (check.workOrderState) {
            case 3: {
              this.$Message.success('工单已处理完毕，禁止重复发起！')
              break;
            }
            case 2: {
              const time = new Date()
              await this.$http.patch(this.$config.api.schema + "/sys_work_order/" + id,
                {'workOrderState': 3, 'workOrderEndTime': time})
              this.$Message.success('工单状态变更成功！')
              break;
            }
            case 4: {
              this.$Message.error('工单已关闭，无法发起评价！')
              break;
            }
          }
        } else {
          this.$Message.error('无权结束该工单！')
        }
        this.loadData()
      },
    }
  }
</script>

<style scoped>
  .backgroundGray {
    background: #f5f7f9;
  }
</style>


