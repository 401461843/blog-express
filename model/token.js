const crypto=require("crypto");
const redis = require('../db/redis').redisClient
const { SuccessModel, ErrorModel } = require('../model/resModel')

const token={
    createToken:function(obj){
        var obj2={
            data:obj,//payload
            created:parseInt(Date.now()/1000),//token生成的时间的，单位秒
        };

        //payload信息
        var base64Str=Buffer.from(JSON.stringify(obj2),"utf8").toString("base64");

        //添加签名，防篡改
        var secret="baid";
        var hash=crypto.createHmac('sha256',secret);
            hash.update(base64Str);
        var signature=hash.digest('base64');


        return  base64Str+"."+signature;
    },
    setToken:function (id,token) { 
        redis.set('users:'+id+':tok',token)
        redis.expire('users:'+id+':tok',10)
    },
    getToken:async function (id) {  
        var tok = ''
        tok =await redis.get('users:'+id+':tok')
         
        console.log(tok)
    },

    updateTokenExp:function (id) { 
        redis.expire('users:'+id+':tok',10);
        
    },
    decodeToken:function(token){
 
        var decArr=token.split(".");
        if(decArr.length<2){
            //token不合法
            return false;
        }

        var payload={};
        //将payload json字符串 解析为对象
        try{
            payload=JSON.parse(Buffer.from(decArr[0],"base64").toString("utf8"));
        }catch(e){
            return false;
        }

        //检验签名
        var secret="baidu";        
        var hash=crypto.createHmac('sha256',secret);
            hash.update(decArr[0]);
        var checkSignature=hash.digest('base64');

        return {
            payload:payload,
            signature:decArr[1],
            checkSignature:checkSignature
        }
    },
    checkToken:function(req,res,callback){
        let me =this 
        if(req.headers.authorization ==''){
            res.json(
                new SuccessModel('token值丢失')
            )
            return
        }else{
            let id = token.decodeToken(req.headers.authorization).payload.data.id
            redis.get('users:'+id+':tok',function (err,restoken) { 
                if (restoken ){
                        if(restoken  != req.headers.authorization){
                            res.json(
                                new SuccessModel('token错误')
                            )
                        }else{

                            me.updateTokenExp(id) // 更新token的时间
                            callback()
                        }
                    }else{
                        res.json(
                            new SuccessModel('token失效')
                        )
                    }
            })
        }
    }
    
}
module.exports=exports=token;