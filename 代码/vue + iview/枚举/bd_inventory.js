'use strict';
const Controller = require('egg').Controller;

function appendOneZero(obj) {
  if (obj < 10) return '0' + '' + obj;
  return obj;
}

function appendFourZero(obj) {
  if (obj < 10 > 0) {
    return '000' + '' + obj;
  } else if (obj >= 10 && obj < 100) {
    return '00' + '' + obj;
  } else if (obj >= 100 && obj < 1000) {
    return '0' + '' + obj;
  }
  return obj;
}

class schemaController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.query = this.ctx.request.query;
    this.body = this.ctx.request.body;
    this.params = this.ctx.params;

    this.filter = this.query.filter === undefined ? {} : JSON.parse(this.query.filter);
    this.order = this.query.order === undefined ? '_id' : this.query.order;
    this.limit = this.query.limit === undefined ? 0 : parseInt(this.query.limit);
    this.skip = this.query.page === undefined ? 0 : (parseInt(this.query.page) - 1) * this.limit;

    if (this.query.like) {
      this.filter.$or = [];
      for (const key of this.query.likeBy.split(',')) {
        this.filter.$or.push({ [key]: new RegExp(this.query.like, 'i') });
      }
    }
  }

  async creatCode() {
    const error = {
      code: '0',
    };
    const version = (await this.ctx.model.BdInventory.findOne({ _id: this.params.id })).version;
    const rows = await this.setProductAttr(this.params.id);
    for (const r of rows) {
      r.version = version;
    }
    await this.ctx.model.BdInventoryDetail.create(rows);
    this.ctx.body = error.code === '0' ? { error, rows } : { error };
  }

  async upRange() {
    const error = {
      code: '0',
    };
    const version = await this.ctx.model.BdInventoryClass.find({});
    const idChild = (this.params.id + this.getAllChild(version, this.params.id)).split(',');
    const childData = await this.ctx.model.BdInventory.find({ idInventoryClass: { $in: idChild } });
    const ids = [];
    for (const r of childData) {
      ids.push(r.id);
    }
    const rows = await this.ctx.model.BdInventoryAttr.update({ idInventory: { $in: ids } }, this.body, { multi: true });
    this.ctx.body = error.code === '0' ? { error, rows } : { error };
  }

  getAllChild(data, id) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      if (id == data[i].p_id) {
        result += (this.getAllChild(data, data[i].id));
        result += ',' + data[i].id;
      }
    }
    return result;
  }

  async setProductAttr(id) {
    const version = (await this.ctx.model.BdInventory.findOne({ _id: id })).version;
    const rows = await this.ctx.model.BdInventoryAttr.find({ idInventory: id, isRange: 'true', version });
    const inventoryCode = (await this.ctx.model.BdInventory.findOne({ _id: id })).inventoryCode;
    const sps = rows;
    const iTar = [];
    for (const key in sps) {
      iTar.push(sps[key]);
    }
    let oTar = [[]];
    for (let i = 0; i < iTar.length; i++) {
      const tar = [];
      for (let j = 0; j < oTar.length; j++) {
        for (let k = 0; k < iTar[i].range.length; k++) {
          tar.push(oTar[j].concat(iTar[i].range[k]));
        }
      }
      oTar = tar;
    }
    const Json = [];
    for (let i = 0; i < oTar.length; i++) {
      const json = {};
      for (let j = 0; j < iTar.length; j++) {
        json[iTar[j].column] = oTar[i][j];
        json.idInventory = id;
        json.version = version;
        json.code = inventoryCode + '-' + appendFourZero(i);
      }
      Json.push(json);
    }
    return Json;
  }

}

module.exports = schemaController;
