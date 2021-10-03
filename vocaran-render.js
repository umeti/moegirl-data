
const fs = require('fs/promises')

async function main(arg){
  if(/^\d+$/.test(arg[0]||'')){
    render(arg)
  }else {
    makeNameMap()
  }
}

async function makeNameMap(){
  let list = JSON.parse(await fs.readFile("data/namemap.json","utf-8"))
  let s = ''
  for(let {sm,title,name,count} of list){
    if(title)
      s += `=== ${title} ===
{{ptl|use=f
|name = ${name}
|sm= ${sm}
|count= ${count}
}}
`
  }
  console.log(s.replace(/\[/g,"【").replace(/\]/g,"】"))
}

async function render(arg){
  let no = arg[0] || 61
  let data =JSON.parse(await fs.readFile(`data/vocaran${no}.json`,"utf-8"))
  let listdata =JSON.parse(await fs.readFile(`data/vocaran${parseInt(no)-1}.json`,"utf-8"))
  let wikitext = render(data,no,listdata)
 
  //console.log(wikitext)
  fs.writeFile(`out/vocaran${no}.wikitext`,wikitext)
}

function render(data,no,lastdata){
  let $ = data

  // 获取统计时间
  let end_time = new Date($.nicovideo.time)
  let start_time = new Date(end_time)

  for(let line of  $.bilivideo.desc.split("\n")){
    let p = line.indexOf("集計期間")
    if(p != -1){
      let m =  line.match(/(\d+)月(\d+)日(\d+).*?(\d+)月(\d+)日(\d+)/)
      if(m.length == 7){
        let [,M,D,h,M1,D1,h1] = m
        end_time.setUTCMonth(M1-1)
        end_time.setUTCDate(D1)
        end_time.setUTCHours(h1)
        end_time.setUTCMinutes(0)
        // 跨年处理 (未测试)
        if(start_time.getMonth < end_time.getMonth()){
          end_time.setUTCFullYear(end_time.getUTCFullYear()+1)
        }
        start_time.setTime(end_time.getTime()-86400000*7)
        //console.log(end_time)
        //console.log(start_time)
        break
      }
    }
    
  }

  let out = `{{VOCALOID Ranking
|id = ${$.nicovideo.id.substr(2)}
|index = ${no}
|image = 
|title-color = 
|发布时间 = ${fmt($.nicovideo.time)} 
|起始时间 = ${fmt(start_time,false,false)}
|终止时间 = ${fmt(end_time,false,false)}
|统计规则 = 2008
}}

'''周刊VOCALOID RANKING #${no}'''是${fmt($.nicovideo.time).substr(0,11)}由'''sippotan'''投稿于niconico的VOCALOID周刊。

==视频本体==
{{BilibiliVideo|id=${$.bilivideo.aid}}}
;视频简介
<poem>-{${$.bilivideo.desc.split("\n").slice(1).join("\n")}}-</poem>

==榜单==
`

  //OP
  let op = lastdata.ranklist[0]
  op.name = takeName(op.title)

  out += `
{{VOCALOID_&_UTAU_Ranking/bricks
|id = ${op.sm.substr(2)}
|曲名 = ${op.name}<!--
|标题 = ${op.title}--> 
|时间 = 20${op.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|本周 = OP
|color = #AA0000
|bottom-column = {{color|#AA0000|上周冠军}}
}}
 `
  for(let i=0; i < 30; i++){
    let _ = $.ranklist[i]
    let name = takeName(_.title)
    out += `
{{VOCALOID_&_UTAU_Ranking/bricks
|id = ${_.sm.substr(2)}
|曲名 = ${name}<!--
|标题 = ${_.title} (用于复核曲名)-->
|翻唱 = 
|本周 = ${_.rank}
|上周 = ${_.rank0 == 999? 'NEW': _.rank0}
|走势 = ${_.rank < _.rank0?1:_.rank == _.rank0?2:3}
|得点 = ${_.point}
|时间 = 20${_.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|再生 = ${_.watch}
|评论 = ${_.comment}
|评论权重 = ${_.comment_weight}
|收藏 = ${_.collect}
}}
` 
  }

  //pick up
  for(let _ of $.ranklist){
    if(_.pickup){
      let name = takeName(_.title)
      out += `
{{VOCALOID_&_UTAU_Ranking/bricks
|id = ${_.sm.substr(2)}
|曲名 = ${name}<!--
|标题 = ${_.title} (用于复核曲名)-->
|翻唱 = 
|本周 = ${_.rank}
|上周 = ${_.rank0 == 999? 'NEW': _.rank0}
|走势 = ${_.rank < _.rank0?1:_.rank == _.rank0?2:3}
|得点 = ${_.point}
|时间 = 20${_.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|再生 = ${_.watch}
|评论 = ${_.comment}
|评论权重 = ${_.comment_weight}
|收藏 = ${_.collect}
|color = #FF9999
|bottom-column = {{color|#FF9999|P I C K U P}}
}}
` 
    }
  }

  // 历史榜单
  out += `\n<!-- 历史榜单(来自${$.history_no}) -->`
  for(let _ of $.history){
    
    let name = takeName(_.title)
    out += `
{{VOCALOID_&_UTAU_Ranking/bricks
|id = ${_.sm.substr(2)}
|曲名 = ${name}<!--
|标题 = ${_.title} (用于复核曲名)-->
|翻唱 = 
|本周 = ${_.rank}
|时间 = 20${_.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|color = #663300
|bottom-column = {{color|#663300|H I S T O R Y}}
}}
`
  }

  //ED
  let ed = $.ranklist[$.ranklist.length-1]
  ed.name = takeName(ed.title)

  out += `
{{VOCALOID_&_UTAU_Ranking/bricks
|id = ${ed.sm.substr(2)}
|曲名 = ${ed.name}<!--
|标题 = ${ed.title} (用于复核曲名)--> 
|时间 = 20${ed.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|本周 = ED
|color = #4FC1E9
|bottom-column = {{color|#4FC1E9|岁落遗尘}}
}}
 `

  return out +=`
==杂谈==
（待补）

== 注释 ==
<references/>
{{周刊VOCALOID RANKING|2008}}
[[Category:周刊VOCAL Character & UTAU RANKING]]
`
}

function takeName(title){
  let t =  title.replace(/\s*【.*?】\s*/g,'')
  let m = t.match(/「(.+?)」/)
  if(m){
    t = m[1]
  }
  return t
}

function fmt(date,_=null,add9h=true){
  if(!date){
    return 'D E L E T E D'
  }
  let d = new Date(date)
  add9h && d.setTime(d.getTime()+3600000*9)
  let Y = d.getUTCFullYear()
  let M = d.getUTCMonth()+1
  let D = d.getUTCDate()
  let h = d.getUTCHours()
  let m = d.getUTCMinutes()
  if(M < 10)M='0'+M
  if(D < 10)D='0'+D
  if(h < 10)h='0'+h
  if(m < 10)m='0'+m
  return `${Y}${_||'年'}${M}${_||'月'}${D}${_?'':'日'} ${h}:${m}`
}

main(process.argv.slice(2))
