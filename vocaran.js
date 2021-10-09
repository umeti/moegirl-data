const axios = require("axios")
const fs = require('fs/promises')
const cheerio = require('cheerio')
const fetch = require('node-fetch')

const bilimap = require('./data/bilimap.json')

async function test(){
  let html = await fs.readFile("assets/vocaran67.html","utf-8")
  let data = await makeData(html)
  for(let _ of data.ranklist){
    if(_.rank == 13 || _.rank == 14){
      console.log(_)
    }
  }
}


async function main(arg) {
  if (arg[0] == 'live') {
    return live(arg[1])
  } else if (arg[0] == 'nicofix') {
    return nicofix()
  } else if (arg[0] == 'pack') {
    return packdata()
  } else if (arg[0] == 'fixhis') {
    return fixhistory() // TODO
  } else if (arg[0] == 'namemap') {
    return namemap()
  } else if (arg[0] == 'check') {
    return check()
  } else if (arg[0] == 'test') {
    return test()
  } else if (arg[0] == 'fixpoint') {
    return await fixpoint()
  }

  let bug_item = JSON.parse(await fs.readFile(`data/vocaran/120.json`, 'utf-8'))
  bug_item.nicovideo = await nicometa("sm9430036")
  fs.writeFile('data/vocaran/120.json', JSON.stringify(bug_item, 2, ' '))

  return '抓取阶段先告一段落'
  //93(无简介)
  //109(标题格式错乱)
  //119,120(连体)
  //154(缺少/已处理)
  //179-191(连体)
  //259-500(未抓取)
  //386-393(连体)
  //394-401(缺少)
  for (let i = 1; i <= 60; i++) {
    await live(i)
  }

  return

  const html = await fs.readFile("assets/vocaran61.html", "utf-8")
  let data = await makeData(html)
  data.bilivideo = await biliget(61)

  let m = data.bilivideo.desc.match(/sm\d+/)
  data.nicovideo = await nicometa(m[0])

  console.log(data.nicovideo)
  fs.writeFile('data/vocaran61.json', JSON.stringify(data, 2, ' '))
}

async function live(no) {
  if (no > 60 && no < 394 || no > 401) {
    console.log('#' + no + ' is locked')
    return
  }

  console.log("Fetch vocaran " + no)
  let res = await fetch('http://web.archive.org/web/20180323041737/http://vocaran.jpn.org/vocaran/' + no)
  let html = await res.text()

  console.log("  make local data...")
  let data = await makeData(html)
  console.log("  fetch bilibili data...")
  data.bilivideo = await biliget(no)
  let m = data.bilivideo.desc.match(/sm\d+/)
  console.log("  fetch niconico data...")
  data.nicovideo = await nicometa(no == 93 ? 'sm7634428' : m[0])

  /*for(let his of data.history){
    let meta = await nicometa(his.sm)
    his.time = meta.time
  }*/
  console.log("  save local data...")
  fs.writeFile(`data/vocaran${no}.json`, JSON.stringify(data, 2, ' '))
}

async function check(){
  let map = {}
  let dir = await fs.readdir('data')
  let list = []
  for (let f of dir) {
    if (/^vocaran\d+/.test(f)) {
      let _ = JSON.parse(await fs.readFile('data/' + f, 'utf-8'))
      for (let item of _.ranklist) {
        if(!item.point){
          console.log(`${f}:${item.rank}`);
          list.push(item)
        }
      }
    }
  }
  console.log(list.length);
}

async function fixpoint(){
  let dir = await fs.readdir('data')
  for (let no = 116; no <= 500;) {
    await later(500)
    let _
    try {
    _ = JSON.parse(await fs.readFile(`data/vocaran${no}.json`, 'utf-8'))
    }catch(e){
      console.log('缺省 #'+no)
      no ++
      continue
    }
    //  重新抓取榜单数据
    let res
    try{
      console.log("Fetch vocaran " + no)
      // fetch用得我很郁闷...，要什么缺什么....
      res = await axios.get('http://web.archive.org/web/20180323041737/http://vocaran.jpn.org/vocaran/' + no,{
        timeout: 3000
      })
      
    }catch(e){
      console.log("  "+e)
      continue
    }
    let html = await res.data

    console.log("  make local data...")
    let data = await makeData(html)
    console.log("  mix old data...")
    _.ranklist = data.ranklist
    await fs.writeFile(`data/vocaran/${no}.json`, JSON.stringify(_, 2, ' '))
    no ++
  }
}

async function namemap() {
  let map = {}
  let dir = await fs.readdir('data')
  for (let f of dir) {
    if (/^vocaran\d+/.test(f)) {
      let _ = JSON.parse(await fs.readFile('data/' + f, 'utf-8'))
      for (let item of _.ranklist) {
        let { sm, title } = item;
        let name = takeName(title)
        if (item.rank <= 30) {
          if (map[sm]) {
            map[sm].count++
            if (map[sm].title == '') {
              map[sm].title = title
              map[sm].name = name
            }
          } else {
            map[sm] = {
              sm,
              title,
              name,
              count: 1
            }
          }
        }
      }
    }
  }

  let arr = []
  for (let o of Object.values(map)) {
    if (o.count > 1)
      arr.push(o)
  }
  arr.sort((a, b) => b.count - a.count)
  fs.writeFile(`data/namemap.json`, JSON.stringify(arr, 2, ' '))
}

function takeName(title) {
  let t = title.replace(/\s*【.*?】\s*/g, '')
  let m = t.match(/「(.+?)」/)
  if (m) {
    t = m[1]
  }
  return t
}

async function packdata() {
  let db = []
  for (let f of await fs.readdir('data')) {
    if (/^vocaran\d+/.test(f)) {
      let _ = JSON.parse(await fs.readFile('data/' + f, 'utf-8'))
      let no = f.match(/\d+/)[0]

      _.no = parseInt(no)
      db.push(_)
      console.log('process: ' + no)
    }
  }
  db.sort((a, b) => a.no - b.no)
  fs.writeFile(`data/vocarandb.json`, JSON.stringify(db, 2, ' '))
}

async function fixhistory() {
  let dir = await fs.readdir('data')
  dir = dir.sort((a, b) => {
    if (a == b) {
      return 0
    }
    if (a.length < b.length) {
      return -1
    } else if (a < b) {
      return -1
    }
    return 1
  })
  //return console.log(dir)
  for (let i = 62; i < 70; i++) {
    let f = "vocaran" + i + ".json"
    if (/^vocaran\d+/.test(f)) {
      let _ = JSON.parse(await fs.readFile('data/' + f, 'utf-8'))
      if (_.history.length > 0) {
        console.log('process: ' + f)
        let real_his = JSON.parse(await fs.readFile(`data/vocaran${_.history_no.substr(1)}.json`))
        let timemap = {}
        for (let his_item of real_his.ranklist) {
          timemap[his_item.sm] = his_item.time
        }
        for (let his of _.history) {
          his.time = timemap[his.sm]
        }
        if (!_.history[0].time) {
          console.log(`${f}  ${_.history_no}`)
        }
        //console.log(_.history)
        //console.log(timemap)
        //await fs.writeFile(`data/${f}`, JSON.stringify(_, 2, ' '))
      }
    }
  }
}
async function nicofix() {
  for (let f of dir) {
    if (/^vocaran/.test(f)) {
      let _ = JSON.parse(await fs.readFile('data/' + f, 'utf-8'))
      if (!_.nicovideo.desc) {
        let m = _.bilivideo.desc.match(/sm\d+/)
        console.log(`fix ${f} ${m[0]}`)
        _.nicovideo = await nicometa(m[0])
        fs.writeFile(`data/${f}`, JSON.stringify(_, 2, ' '))
      }
    }
  }
}

async function nicometa(sm) {
  let res = await fetch('https://ext.nicovideo.jp/api/getthumbinfo/' + sm)
  let xml = await res.text()
  //let xml = await fs.readFile('data/sm5490544.xml','utf-8')
  let $ = cheerio.load(xml)
  let id = $('video_id').text()
  let time = $('first_retrieve').text()
  let title = $('title').text()
  let desc = $('description').text()
  let meta = { id, time, title, desc }
  return meta
}

async function biliget(no) {
  let key = no < 259 ? "vocaloid" : "vocaloid_and_utau"
  for (let _ of bilimap[key]) {
    if (_.vocaloid == no) {
      return { ..._, ...(await bilimeta(_.aid)) }
    }
  }
  if (no == 154) {
    return {
      id: 0,
      title: '这期搬运视频未找到',
      desc: 'sm12100064 手动贴上sm号'
    }
  }
  return null
}

async function bilimeta(aid) {
  let res = await fetch('https://api.bilibili.com/x/web-interface/view?aid=' + aid)
  if (res.status != 200) {
    console.log("bilimeta return " + res.status)

    return { desc: '', }
  }

  let data = await res.json()

  with (data.data) {
    return {
      pubdate, desc, pic
    }
  }
}

async function makeData(html) {
  const $ = cheerio.load(html)
  const ranklist = []
  const history = []
  let $history = $
  $(".rank").parent().map((i, e) => {
    let p = $("p", $(e))
    let _ = {}
    _.rank = $(p[0]).text()
    _.rank0 = $(p[1]).text()
    _.point = $(p[2]).text()

    let $img = $(e).next()
    let $meta = $img.next()
    let $data = $meta.next()
    let $info = $data.next()

    let img = $("img", $img).first()
    _.sm = img.attr("alt")
    _.pic_archive = img.attr("src")

    _.time = $("p", $meta).first().text()
    _.title = $("a", $meta).first().text()
    _.pickup = $("a+span", $meta).first().text()

    let d = $(".mvlistdata", $data);
    [_.collect, _.collect_weight] = getWeight($(d[0]).text());
    [_.watch, _.watch_weight] = getWeight($(d[1]).text());
    [_.comment, _.comment_weight] = getWeight($(d[2]).text());

    let producer = $("a", $data).last()
    _.producer = producer.text()

    let uid = producer.attr("href")
    uid = uid && uid.match(/\d+$/)
    _.producer_id = uid && uid[0]

    for (let k in _)
      _[k] = trim(_[k])
    ranklist.push(_)

    if (_.rank == "10") {
      $history = $(e).parent().next().next()
    }
    if(!_.point){
      _.point = _.rank0
      _.rank0 = 0
    } 
    _.rank = parseInt(_.rank)
    _.rank0 = parseInt(_.rank0)
    if (isNaN(_.rank0)) {
      _.rank0 = 999
    }
  })
  // 处理历史榜单
  let history_no = $("a", $history).first().text()
  $('img[alt^=rank]', $history).each((i, e) => {
    let $e = $(e)
    let rank = $e.attr('alt').substr(-1)
    let title = $e.attr('title')
    let sm = $e.attr('src').match(/\d+$/) || ''
    sm = sm && 'sm' + sm[0]
    let _ = { rank, title, sm }
    history.push(_)
  })

  return { ranklist, history, history_no }
}

function getWeight(text) {
  let m = text.match(/\d[\d, \.]*/g)
  let num, weight = ''
  if (m) [num, weight] = m

  return [num, weight]
}

function trim(str) {
  return str ? str.replace(/^\s+|\s+$/g, '') : ''
}

function later(delay) {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay);
  });
}

main(process.argv.slice(2))
