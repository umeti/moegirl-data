
const fs = require('fs/promises')

async function main(arg){
  let no = arg[0] || 61
  let data =JSON.parse(await fs.readFile(`data/vocaran${no}.json`,"utf-8"))
  let wikitext = render(data,no)
 
  console.log(wikitext)
}

function render(data,no){
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

  let s = `{{VOCALOID Ranking
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

  return s
}

function fmt(date,_=null,add9h=true){
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
