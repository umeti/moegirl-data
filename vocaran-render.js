const LOCAL_TEST = false
const LOOP_L = 259
const LOOP_R = 393
const axios = require("axios")
const fs = require('fs/promises')
const yaml = require("yaml")
let namemap = {}

function getPeriod(no){
  no = parseInt(no) 
  const week_ms = 7*24*3600*1000
  const n100 = new Date('2009-08-24T05:00Z')
  
  let t1 = new Date(n100.getTime()+(no-100)*week_ms)
  let t2 = new Date(t1.getTime()+week_ms)
  let u1 = new Date(t1.getTime() - 190800000)
  let u2 = new Date(u1.getTime()+week_ms)

  return [t1,t2,u1,u2]
}

async function checkpic(arg) {
  let n = parseInt(arg[1])
  let m = parseInt(arg[2])
  let a = []
  for (; n <= m; n++) {
    console.log('#test ' + n);
    let res = await axios.get(`https://commons.moegirl.org.cn/File:V%2B%E5%91%A8%E5%88%8A${n}.png`, {
      method: 'HEAD',
      validateStatus: null,
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7"
      }
    })
    console.log(`${res.status} - ${n}`)
    if (res.status == 404) {
      let data = JSON.parse(await fs.readFile(`data/vocaran/${n}.json`, "utf-8"))
      let id = data.nicovideo.id.substr(2)
      console.log(`download - ${n} - ${id}`);
      let res = await axios.get(`https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}`, {
        //responseEncoding:'binary',
        responseType: 'arraybuffer',
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7"
        }
      })
      await fs.writeFile(`tmp/image/pic${n}.jpg`, res.data)
      a.push(n)
    }
    await later(500)
  }
  console.log('---------');
  console.log(a);
}

function fixNewFlag(st, item,no=0) {
  if (item.rank0 == 999 && st > item.time) {
    //console.log('Fix NEW flag: ' + item.rank)
    item.rank0 = 0
  }
  // 修复收藏权重（補正値B　上限40まで）
  let weight =  parseFloat(item.collect_weight.replace(/[^\d\.]/g,''))
  if(no < 223 && weight  > 40){
    // console.log('Fix collect weight:  '
    // + item.rank + '  *' +item.collect_weight)
    
    item.collect_weight = '40.00'
  }
  //五倍阀
  // limit
  item.limit = false
  let v = parseInt(item.watch.replace(/\D/g,''))
  let c = parseInt(item.collect.replace(/\D/g,''))
  if(no >= 223 && c * weight > v * 5){
    item.limit = true
    //console.log(`达到五倍阀 ${no}:${item.rank}`);
  }
  // 顺便验证数据
  if(!(item.time||item.title||item.watch)){
    console.log(`数据损坏 ${no}:${item.rank}`);
    //process.exit(1)
  }
}

async function get_history(no) {
  console.log("Fetch history " + no)
  no = no.match(/\d+/)[0]
  let res = await axios.get('https://mzh.moegirl.org.cn/%E5%91%A8%E5%88%8AVOCALOID_RANKING' + no + "?action=raw", {
    headers: {
      "user-agent": "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7"
    }
  })
  //let text = await fs.readFile("assets/28.wikitext","utf-8")
  let text = res.data
  let tag = "{{VOCALOID_&_UTAU_Ranking/bricks"
  let blocks = text.split(tag)
  let s = ""
  for (let i = 2; i <= 6; i++) {
    s += tag
    let b = blocks[i].split('\n')
    s += b[0] + "\n"
    for (let line of b) {
      let m = line.match(/(\|id\s*\=\s*\d+)/)
      m = m || line.match(/(\|曲名\s*\=\s*.+)/)
      m = m || line.match(/(\|后缀\s*\=\s*.+)/)
      m = m || line.match(/(\|条目\s*\=\s*.+)/)
      m = m || line.match(/(\|翻唱\s*\=\s*.+)/)
      m = m || line.match(/(\|时间\s*\=\s*.+)/)
      m = m || line.match(/(\|本周\s*\=\s*.+)/)
      m = m || line.match(/(\|image link\s*\=\s*.+)/)

      if (m) {
        s += m[0] + "\n"
      }
    }
    s += `|color = #663300
|bottom-column = {{color|#663300|H I S T O R Y}}
}}

`
  }

  return s
}

function takeName(item) {
  let m = namemap[item.sm]
  if (m) {
    let s = '' + (m.page || m.name)
    let name = s
    let sfix = ''
    let href = ''
    let p = s.indexOf("(")
    if (p != -1) {
      name = s.substr(0, p)
      sfix = s.substr(p)
    }
    let out = name
    if (sfix) {
      out += "\n|后缀 = " + sfix
    }
    if (m.path) {
      out += '\n|条目 = ' + m.path
    }
    if (item.sm == 'sm8619805') {
      out += '\n|image link = https://nicovideo.cdn.nimg.jp/thumbnails/8619805/8619805.51422.M'
    }
    return out
  }
  return takeNameFromTitle(item.title) + `<!--\n????? ${item.title} -->`
}

async function main(arg) {
  if (/^\d+$/.test(arg[0] || '')) {
    let text = await fs.readFile("data/namemap-bake.yml", "utf-8")
    for (let item of yaml.parse(text)) {
      namemap[item.sm] = item
    }
    await makePage(arg)
  } else if (arg[0] == 'pic') {
    await checkpic(arg)

  } else {
    await test(arg)
  }
}

async function makeNameMap() {
  let list = JSON.parse(await fs.readFile("data/namemap.json", "utf-8"))
  let s = '', i = 0
  for (let { sm, title, name, count } of list) {
    if (title)
      s += `
#${i++}
- sm: ${sm}
  count: ${count}
  title: ${title}
  name:  ${name}
`
  }
  console.log(s.replace(/\[/g, "【").replace(/\]/g, "】"))
}

async function makePage(arg) {
  let no = parseInt(arg[0] || 61)
  if(no == 0){
    for(let i = LOOP_L; i <= LOOP_R; i++){
      await makePage([i])
    }
    return 
  }
  let data = JSON.parse(await fs.readFile(`data/vocaran/${no}.json`, "utf-8"))
  let listdata = JSON.parse(await fs.readFile(`data/vocaran/${parseInt(no) - 1}.json`, "utf-8"))
  let wikitext = no < 222 ? 
    await render(data, no, listdata) :
    await renderUTAU(data, no, listdata) 

  //console.log(wikitext)
  fs.writeFile(`out/vocaran${no}.wikitext`, wikitext)
}

async function renderUTAU(data, no, lastdata) {
  let $ = data
  let utau_no = no - 58
  let lastrankmap = new Map()
  for (let _ of lastdata.ranklist) {
    lastrankmap.set(_.sm, _)
  }

  // $.bilivideo = {}
  // $.nicovideo = {}
  // $.bilivideo.aid = 0
  // $.nicovideo.desc = ''
  // $.nicovideo.id = 'sm0'
  let desc = $.nicovideo.desc
  // 获取统计时间
  let [start_time,end_time,utau_start_time,utau_end_time] = getPeriod(no)

  let out = `{{VOCALOID Ranking
|id = ${$.nicovideo.id.substr(2)}
|index = ${no}
|image =
|title-color = 
|发布时间 = ${fmt($.nicovideo.time)} 
|起始时间 = ${fmt(start_time, false, false)}
|终止时间 = ${fmt(end_time, false, false)}
|统计规则 = 2012
}}

'''周刊VOCALOID RANKING #${no}'''是${
  fmt($.nicovideo.time).substr(0, 11)
}由'''sippotan'''投稿于niconico的VOCALOID周刊。

==视频本体==
{{BilibiliVideo|id=${$.bilivideo.aid}}}
;视频简介
<poem>-{${
  desc.replace(/(.)○/g,'$1\n○')
  .replace(/(　+)/g,'\n$1')
  .replace(/\n([　 ]*上限40)/,'$1')
  .replace(/\n([　 ]*週刊)/g,'$1')
  .replace(/\n([　 ]*#\d+)/g,'$1')
  .replace(/([^　 ])週刊/g,'$1\n\n週刊')
  .replace(/PL：\n?/,'\n\nPL：')
  .replace(/(?<!PL：)(mylist\/\d+)/,'$1\n\n')
  .replace(/\n　ぼからん/,'　ぼからん')
  .replace(/(訂正)/,'\n\n$1')
  .replace(/UTAU\n/g,'UTAU')
  .replace(/＊\n/g,'＊')
  .replace(/\n　http/g,'　http')
  .replace(/\n\n\n*/g,'\n\n')
  .replace(/PL(.+)\n　直近5週/,'PL$1　直近5週')
}}-</poem>

==榜单==
`
  //OP
  let op = lastdata.ranklist[0]
  op.name = takeName(op)

  out += `{{VOCALOID_&_UTAU_Ranking/bricks${op.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${op.sm.substr(2)}
|曲名 = ${op.name}
|时间 = 20${op.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')}
|本周 = OP
|color = #AA0000
|bottom-column = {{color|#AA0000|上周冠军}}
}}

`
  let st = fmt(start_time, '-', false).substr(2)
  for (let i = 0; i < 30; i++) {
    let _ = $.ranklist[i]
    let name = takeName(_)
    _.time = _.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')
    fixNewFlag(st, _,no)
    out += `{{VOCALOID_&_UTAU_Ranking/bricks${_.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${_.sm.substr(2)}
|曲名 = ${name}
|翻唱 = 
|本周 = ${_.rank}
|上周 = ${_.rank0 == 999 ? 'NEW' : _.rank0 == 0 ? '--' : _.rank0}
|走势 = ${_.rank0 == 999 ? '' : _.rank0 == 0 ? 1 : _.rank < _.rank0 ? 1 : _.rank == _.rank0 ? 2 : 3}
|得点 = ${_.point}
|rate = ${calc_rate(_, lastrankmap)}
|时间 = 20${_.time}
|再生 = ${_.watch}
|评论 = ${_.comment}
|评论权重 = ${_.comment_weight}
|收藏 = ${_.collect}
|收藏权重 = ${_.collect_weight}
|五倍阀 = ${_.limit?'1':''}
}}

`
  }

  //pick up
  for (let _ of $.ranklist) {
    if (_.pickup) {
      let name = takeName(_)
      _.time = _.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')
      fixNewFlag(st, _,no)
      out += `
{{VOCALOID_&_UTAU_Ranking/bricks${_.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${_.sm.substr(2)}
|曲名 = ${name}
|翻唱 = 
|本周 = ${_.rank}
|上周 = ${_.rank0 == 999 ? 'NEW' : _.rank0 == 0 ? '--' : _.rank0}
|走势 = ${_.rank0 == 999 ? '' : _.rank0 == 0 ? 1 : _.rank < _.rank0 ? 1 : _.rank == _.rank0 ? 2 : 3}
|得点 = ${_.point}
|rate = ${calc_rate(_, lastrankmap)}
|时间 = 20${_.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')}
|再生 = ${_.watch}
|评论 = ${_.comment}
|评论权重 = ${_.comment_weight}
|收藏 = ${_.collect}
|收藏权重 = ${_.collect_weight}
|五倍阀 = ${_.limit?'1':''}
|color = #FF9999
|bottom-column = {{color|#FF9999|P I C K U P}}
}}

`
    }
  }

  // 历史榜单
  out += LOCAL_TEST ?'\n':await get_history($.history_no)
/*
  let history_data = JSON.parse(await fs.readFile(
    `data/vocaran/${$.history_no.substr(1)}.json`,
    'utf-8'
  ))
  for(let hi = 0; hi < 5; hi++){
    let _ = history_data.ranklist[hi]
    let name = takeName(_)
    out += `
{{VOCALOID_&_UTAU_Ranking/bricks${_.sm.substr(0,2)=='nm'?'-nm':''}
|id = ${_.sm.substr(2)}
|曲名 = ${name}
|翻唱 = 
|本周 = ${_.rank}
|时间 = 20${_.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|color = #663300
|bottom-column = {{color|#663300|H I S T O R Y}}
}}

`
  }*/
  
  //ED
  let ed = $.ranklist[$.ranklist.length - 1]
  ed.name = takeName(ed)

  out += `{{VOCALOID_&_UTAU_Ranking/bricks${ed.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${ed.sm.substr(2)}
|曲名 = ${ed.name} 
|时间 = 20${ed.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')}
|本周 = ED
|color = #4FC1E9
|bottom-column = {{color|#4FC1E9|岁落遗尘}}
}}
`
  out += `<!-- 历史回顾${$.history_no} -->`
  return out += `
==杂谈==
（待补）

== 注释 ==
<references/>
{{周刊VOCALOID RANKING|2012}}
[[Category:周刊VOCAL Character & UTAU RANKING]]
`
}

async function render(data, no, lastdata) {
  let $ = data
  let lastrankmap = new Map()
  for (let _ of lastdata.ranklist) {
    lastrankmap.set(_.sm, _)
  }

  let desc = $.nicovideo.desc
  // 获取统计时间
  let [start_time,end_time] = getPeriod(no)
  /*
  let end_time = new Date($.nicovideo.time)
  let start_time = new Date(end_time)

  let m = desc.match(/(\d+)月(\d+)日(\d+).*?(\d+)月(\d+)日(\d+)/)
  if (m.length == 7) {
    let [, M, D, h, M1, D1, h1] = m
    end_time.setUTCMonth(M1 - 1)
    end_time.setUTCDate(D1)
    end_time.setUTCHours(h1)
    end_time.setUTCMinutes(0)
    // 跨年处理 (未测试)
    if (start_time.getMonth < end_time.getMonth()) {
      end_time.setUTCFullYear(end_time.getUTCFullYear() + 1)
    }
    start_time.setTime(end_time.getTime() - 86400000 * 7)
    //console.log(end_time)
    //console.log(start_time)
  }
  */

  let out = `{{VOCALOID Ranking
|id = ${$.nicovideo.id.substr(2)}
|index = ${no}
|image = 
|title-color = 
|发布时间 = ${fmt($.nicovideo.time)} 
|起始时间 = ${fmt(start_time, false, false)}
|终止时间 = ${fmt(end_time, false, false)}
|统计规则 = 2010
}}

'''周刊VOCALOID RANKING #${no}'''是${fmt($.nicovideo.time).substr(0, 11)}由'''sippotan'''投稿于niconico的VOCALOID周刊。

==视频本体==
{{BilibiliVideo|id=${$.bilivideo.aid}}}
;视频简介
<poem>-{${
  desc.replace(/(.)○/g,'$1\n○')
  .replace(/(　+)/g,'\n$1')
  .replace(/\n([　 ]*上限40)/,'$1')
  .replace(/\n([　 ]*週刊)/g,'$1')
  .replace(/PL：\n?/,'\n\nPL：')
  .replace(/[^(?<=PL：)](mylist\/\d+)/,'$1\n\n')
  .replace(/\n　ぼからん/,'　ぼからん')
  .replace(/(訂正)/,'\n\n$1')
}}-</poem>

==榜单==
`
  //OP
  let op = lastdata.ranklist[0]
  op.name = takeName(op)

  out += `{{VOCALOID_&_UTAU_Ranking/bricks${op.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${op.sm.substr(2)}
|曲名 = ${op.name}
|时间 = 20${op.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')}
|本周 = OP
|color = #AA0000
|bottom-column = {{color|#AA0000|上周冠军}}
}}
`
  let st = fmt(start_time, '-', false).substr(2)
  for (let i = 0; i < 30; i++) {
    let _ = $.ranklist[i]
    let name = takeName(_)
    _.time = _.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')
    fixNewFlag(st, _,no)
    out += `
{{VOCALOID_&_UTAU_Ranking/bricks${_.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${_.sm.substr(2)}
|曲名 = ${name}
|翻唱 = 
|本周 = ${_.rank}
|上周 = ${_.rank0 == 999 ? 'NEW' : _.rank0 == 0 ? '--' : _.rank0}
|走势 = ${_.rank0 == 999 ? '' : _.rank0 == 0 ? 1 : _.rank < _.rank0 ? 1 : _.rank == _.rank0 ? 2 : 3}
|得点 = ${_.point}
|rate = ${calc_rate(_, lastrankmap)}
|时间 = 20${_.time}
|再生 = ${_.watch}
|评论 = ${_.comment}
|评论权重 = ${_.comment_weight}
|收藏 = ${_.collect}
|收藏权重 = ${_.collect_weight}
}}
`
  }

  //pick up
  for (let _ of $.ranklist) {
    if (_.pickup) {
      let name = takeName(_)
      _.time = _.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')
      fixNewFlag(st, _,no)
      out += `
{{VOCALOID_&_UTAU_Ranking/bricks${_.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${_.sm.substr(2)}
|曲名 = ${name}
|翻唱 = 
|本周 = ${_.rank}
|上周 = ${_.rank0 == 999 ? 'NEW' : _.rank0 == 0 ? '--' : _.rank0}
|走势 = ${_.rank0 == 999 ? '' : _.rank0 == 0 ? 1 : _.rank < _.rank0 ? 1 : _.rank == _.rank0 ? 2 : 3}
|得点 = ${_.point}
|rate = ${calc_rate(_, lastrankmap)}
|时间 = 20${_.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')}
|再生 = ${_.watch}
|评论 = ${_.comment}
|评论权重 = ${_.comment_weight}
|收藏 = ${_.collect}
|收藏权重 = ${_.collect_weight}
|color = #FF9999
|bottom-column = {{color|#FF9999|P I C K U P}}
}}

`
    }
  }

  // 历史榜单
  out += LOCAL_TEST ?'\n':await get_history($.history_no)

  /*
  for(let _ of $.history){
    
    let name = takeName(_)
    out += `
{{VOCALOID_&_UTAU_Ranking/bricks${_.sm.substr(0,2)=='nm'?'-nm':''}
|id = ${_.sm.substr(2)}
|曲名 = ${name}
|翻唱 = 
|本周 = ${_.rank}
|时间 = 20${_.time.replace(/[\/]/g,'-').replace(/\(.+?\)/g,'')}
|color = #663300
|bottom-column = {{color|#663300|H I S T O R Y}}
}}
`
  }
  */
  //ED
  let ed = $.ranklist[$.ranklist.length - 1]
  ed.name = takeName(ed)

  out += `{{VOCALOID_&_UTAU_Ranking/bricks${ed.sm.substr(0, 2) == 'nm' ? '-nm' : ''}
|id = ${ed.sm.substr(2)}
|曲名 = ${ed.name} 
|时间 = 20${ed.time.replace(/[\/]/g, '-').replace(/\(.+?\)/g, '')}
|本周 = ED
|color = #4FC1E9
|bottom-column = {{color|#4FC1E9|岁落遗尘}}
}}
 `
  out += `<!-- 历史回顾${$.history_no} -->`
  return out += `
==杂谈==
（待补）

== 注释 ==
<references/>
{{周刊VOCALOID RANKING|2010}}
[[Category:周刊VOCAL Character & UTAU RANKING]]
`
}




function calc_rate(item, lastrankmap) {

  if (item.rank0 == 999) {
    return 'NEW'
  }
  if (item.rank0 == 0 || !lastrankmap.has(item.sm)) {
    return 'NEW'
  }

  let p = parseInt(
    lastrankmap.get(item.sm)
    .point.replace(/\D/g,'')
  )
  let n = parseInt(
    item.point.replace(/\D/g,'')
  )
  
  let rate = (n-p)/p
  //console.log([item.rank0,item.rank,p,n,rate]);
  let s = rate.toFixed(4).split('.')
  s[0] += s[1].substr(0,2)
  s[0] += '.'
  s[0] += s[1].substr(2)
  rate = Number(s[0]) + '%'
  return rate
}


function takeNameFromTitle(title) {

  let t = title.replace(/\s*【.*?】\s*/g, '')
  let m = t.match(/「(.+?)」/)
  if (m) {
    t = m[1]
  }
  return t
}

function fmt(date, _ = null, add9h = true) {
  if (!date) {
    return 'D E L E T E D'
  }
  let d = new Date(date)
  add9h && d.setTime(d.getTime() + 3600000 * 9)
  let Y = d.getUTCFullYear()
  let M = d.getUTCMonth() + 1
  let D = d.getUTCDate()
  let h = d.getUTCHours()
  let m = d.getUTCMinutes()
  if (M < 10) M = '0' + M
  if (D < 10) D = '0' + D
  if (h < 10) h = '0' + h
  if (m < 10) m = '0' + m
  return `${Y}${_ || '年'}${M}${_ || '月'}${D}${_ ? '' : '日'} ${h}:${m}`
}

function later(delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
}

main(process.argv.slice(2))
