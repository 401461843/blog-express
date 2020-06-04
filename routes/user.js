const express = require('express');
const router = express.Router();
const token =require('../model/token')
const { login} = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')
const redis = require('../db/redis').redisClient
router.post('/login', function (req, res, next) {
    const { username, password } = req.body
    const result = login(username, password)
    return result.then(data => {
        if (data.username) {
            const payload =req.body
            payload.id = data.id
            const tok =token.createToken(payload) //登陆成功生成token ，并保存在redis中
            token.setToken(data.id,tok)
            res.json(
                new SuccessModel({"token":tok},'登录成功')
            )
            return
        }
        res.json(
            new ErrorModel('用户名和密码错误，登录失败')
        )
    })
    
})

router.post('/test', function (req, res, next) {
    var callback =function () {
        // 此处写处理事件的逻辑
        res.json(
            new SuccessModel('成功')
        )
    }
    token.checkToken(req,res,callback)//检验token
    
})

module.exports = router;
