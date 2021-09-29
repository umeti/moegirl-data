
const fs = require("fs")
const yaml = require("yaml")
const fetch = require("node-fetch")
async function main(arg){
  let ipt = fs.readFileSync("vc.yml","utf-8")
  let param = yaml.parse(ipt)
  if(!arg[2] ||  param.bv == arg[2]){
    let opt = make(param)
    fs.writeFileSync(param.标题+".wiki",opt)
  }else{ 
    if(/^BV.+/.test(arg[2])){
      await init(arg[2])
      return 
    }
  }
}

async function init(bv){
    let res = await fetch('https://api.bilibili.com/x/web-interface/view?bvid='+bv)
    console.log('fetch '+bv+' '+res.status)
    let data = await res.json()
    let _ = data.data
    fs.writeFileSync('vc.yml',`

标题:  
歌手:  
up: ${_.owner.name} 
staff:  


m163: 

bv: ${_.bvid}
time: ${_.pubdate}
pic: ${_.pic}

## 简介
#${_.desc.replace(/\n/g,"\n#")}
    `)

}

function make(param){
  let time = new Date(param.time*1000)
  let [年,月,日]= [
    time.getFullYear(),
    time.getMonth()+1,
    time.getDate()
  ]
  let 歌词 = takeLyirc(param.m163)
  param.歌手 = param.歌手.split("/")
  with(param)
    /*return `<div style="width:280px;margin:auto">{{NoReferer}}<img style="width:280px" src="${pic.replace("http://","https://")}"></div>`
      */
  return `{{VOCALOID_Songbox
|image    = ${标题}.jpg 
|图片信息 = 
|颜色     = 
|演唱     = ${歌手.map((v)=>"[["+v+"]]").join("、")}
|歌曲名称 = ${标题}
|UP主     = [[${up}]]
|bb_id    = ${bv}
|投稿时间 =  ${年}年${月}月${日}日
|再生     = {{bilibiliCount|id=${bv}}}
}}

== 简介 ==
《'''${标题}'''》是[[${up}]]于${年}年${月}月${日}日投稿至[[bilibili]]的[[VOCALOID]]中文原创歌曲，由${歌手.map((v)=>"[["+v+"]]").join("、")}演唱。截至现在已有{{bilibiliCount|id=${bv}}}次观看，{{bilibiliCount|id=${bv}|type=4}}人收藏。

== 歌曲 ==
{{BilibiliVideo|id=${bv}}}

== 歌词 ==
{{VOCALOID Songbox Introduction
|lbgcolor = 
|ltcolor = 
|rbdcolor = 
${Object.keys(staff).map((k,i)=>(
'|group'+ ++i+' = '+k.replace(/(\/)/g,'<br>')+'\n'+
'|list'+i+' = '+staff[k].replace(/(\/)/g,'<br>')
)).join("\n")}
|group0=演唱
|list0=${歌手.map((v)=>"[["+v+"]]").join("<br>")}

}}

<poem>
${歌词}
</poem>

${歌手.map((v)=>"{{"+v+"/"+年+"|collapsed}}").join("\n")}
[[分类:中国音乐作品]]
`
}

SCAN_DIR=["/sdcard/netease/cloudmusic/Cache/Lyric/","/sdcard/netease/cloudmusic/Download/Lyric/"]
function takeLyirc(link){
  let id = link.match(/song\/(\d+)/)[1]
  let data = null
  for(let dir of SCAN_DIR){
    let path = dir + id
    if(fs.existsSync(path)){
      data = fs.readFileSync(path,"utf-8")
      break
    }
  }
  data = JSON.parse(data)
  
  opt = data.lyric
    .replace(/\[[\d\.\:]+?\]/g,"")
    .replace(/.*作(曲|词) :.*/g,'')
    .replace(/ /g,'\u3000')

    

  return opt
}

main(process.argv)
