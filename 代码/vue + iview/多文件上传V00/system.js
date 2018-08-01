'use strict';
const crypto = require('crypto');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const mongoose = require('mongoose');

const Controller = require('egg').Controller;

class SystemController extends Controller {
    constructor(ctx) {
        super(ctx);
        this.query = this.ctx.request.query;
        this.body = this.ctx.request.body;
    }

    async index() {
        this.ctx.redirect('/index.html');
    }

    async login() {
        const error = {
            code: '0',
        };
        const rows = await this.ctx.model.SysUser.findOne({userCode: this.body.userCode}).exec();
        if (!rows) {
            error.code = '800';
        } else {
            if (rows.userPwd !== crypto.createHash('md5').update(this.body.userPwd).digest('base64')) {
                error.code = '801';
            }
            if (rows.__s === 0) {
                error.code = '802';
            }
        }
        this.ctx.body = error.code === '0' ? {
            error,
            rows,
        } : {
            error,
        };
    }

    async changePwd() {
        const error = {
            code: '0',
        };
        const rows = await this.ctx.model.SysUser.where({userCode: this.body.userCode}).update({userPwd: crypto.createHash('md5').update(this.body.userPwdNew).digest('base64')}).exec();
        this.ctx.body = error.code === '0' ? {
            error,
            rows,
        } : {
            error,
        };
    }

    async uploadByFile() {
        const error = {
            code: '0',
        };
        const parts = this.ctx.multipart();
        let part;
        const files = [];
        while ((part = await parts()) != null) {
            if (part.length) {
                console.log('数组 数组 数组数组')
                // 如果是数组的话是 filed
                for (const p of part) {

                    const fileNameSpilt = p.filename.split('.');
                    const uploadFileName = mongoose.Types.ObjectId() + '.' + fileNameSpilt[fileNameSpilt.length - 1];
                    const wstream = await fs.createWriteStream(this.ctx.app.config.fileDir + uploadFileName);
                    await p.pipe(wstream);
                    wstream.on('error', err => {
                        console.log(err);
                    });
                    wstream.on('finish', () => {
                    });
                    const rows = await this.ctx.model.SysFile.create({
                        fileName: p.filename,
                        fileType: p.mime,
                        filePath: uploadFileName,
                    });
                    this.ctx.body = error.code === '0' ? {
                        error,
                        rows,
                    } : {
                        error,
                    };
                }

            } else {
                if (!part.filename) {
                    // 这时是用户没有选择文件就点击了上传(part 是 file stream，但是 part.filename 为空)
                    // 需要做出处理，例如给出错误提示消息
                    return;
                }
                console.log('单个单个单个')
                // part 是上传的文件流
                // 文件处理，上传到云存储等等
                const fileNameSpilt = part.filename.split('.');
                const uploadFileName = mongoose.Types.ObjectId() + '.' + fileNameSpilt[fileNameSpilt.length - 1];
                const wstream = await fs.createWriteStream(this.ctx.app.config.fileDir + uploadFileName);
                await part.pipe(wstream);
                wstream.on('error', err => {
                    console.log(err);
                });
                wstream.on('finish', () => {
                });
                const rows = await this.ctx.model.BdFile.create({
                    fileCode: part.filename,
                    fileName: part.filename,
                    fileType: part.mime,
                    filePath: uploadFileName,
                });
                this.ctx.body = error.code === '0' ? {
                    error,
                    rows,
                } : {
                    error,
                };
            }
        }
    }

    // async uploadByFile() {
    //   const error = {
    //     code: '0',
    //   };
    //   const files = [];
    //   this.ctx.req.files.forEach(value => {
    //     files.push({
    //       fileName: value.originalname,
    //       fileSize: value.size,
    //       fileType: value.mimetype,
    //       filePath: value.filename,
    //       createTime: new Date(),
    //     });
    //   });
    //   let rows = [];
    //   if (files) {
    //     rows = await this.ctx.model.SysFile.create(files);
    //   }
    //   this.ctx.body = error.code === '0' ? {
    //     error,
    //     rows,
    //   } : {
    //     error,
    //   };
    // }

    // 文件打包
    async loadFiles() {
        const error = {
            code: '0',
        };
        // .deepPopulate(this.query.populate.split(','))
        const listData = await this.ctx.model.BdFile.find({}).lean();
        let rows = [];
        for (let ld of listData) {
            let arr = [];
            for (let row of rows) {
                arr.push(row.uidFiles)
            }
            if (arr.indexOf(ld.uidFiles) <= -1) {
                rows.push(ld)
            }
        }
        let test = new Set()
        for (let i of listData) {
            test.add(i.uidFiles)
        }
        this.ctx.body = error.code === '0' ? {
            error,
            rows,
            test: [...test],
        } : {
            error,
        };
    }

        async uploadByBase64()
        {
            const error = {
                code: '0',
            };
            const objectID = mongoose.Types.ObjectId();
            if (!fs.existsSync(path.join(this.ctx.app.config.fileDir))) {
                mkdirp(path.join(this.ctx.app.config.fileDir), err => {
                });
            }
            await fs.writeFileSync(path.join(this.ctx.app.config.fileDir, objectID + '.png'), new Buffer(this.body.base64, 'base64'));
            const fileStat = await fs.statSync(path.join(this.ctx.app.config.fileDir, objectID + '.png'));
            const rows = await this.ctx.model.SysFile.create({
                fileName: objectID + '.png',
                fileSize: fileStat.size,
                fileType: 'image/png',
                filePath: objectID + '.png',
            });
            this.ctx.body = error.code === '0' ? {
                error,
                rows,
            } : {
                error,
            };
        }
    }

    module
.
    exports = SystemController;
