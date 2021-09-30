
const fs = require('fs/promises')
const cheerio = require('cheerio')
const fetch = require('node-fetch')

const bilimap = require('./data/bilimap.json')

async function main(arg) {
  if (arg[0] == 'live') {
    return live(arg[1])
  }
  const html = await fs.readFile("assets/vocaran61.html", "utf-8")
  let data = await makeData(html)
  data.bilivideo = await biliget(61)

  let m = data.bilivideo.desc.match(/sm\d+/)
  data.nicovideo = await nicometa(m[0])

  console.log(data.nicovideo)
  fs.writeFile('data/vocaran61.json', JSON.stringify(data, 2, ' '))
}

async function live(no) {
  let res = await fetch('http://web.archive.org/web/20180323041737/http://vocaran.jpn.org/vocaran/' + no)
  let html = await res.text()
  let data = makeData(html)
  data.bilivideo = biliget(no)
  
  let m = data.bilivideo.desc.match(/sm\d+/)
  data.nicovideo = await nicometa(m[0])

  fs.writeFile(`data/vocaran${no}.json`, JSON.stringify(data, 2, ' '))
}

async function nicometa(sm){
  // let res = await fetch('https://ext.nicovideo.jp/api/getthumbinfo/'+sm)
  // let xml = await res.text()
  let xml = await fs.readFile('data/sm5490544.xml','utf-8')
  let $ = cheerio.load(xml)
  let id = $('video_id').text()
  let time = $('first_retrieve').text()
  let title = $('title').text()
  let desc= $('description').text()
  let meta = {id,time,title,desc}
  return meta
}

async function biliget(no) {
  for (let _ of bilimap.vocaloid) {
    if (_.vocaloid == no) {
      return { ..._, ...(await bilimeta(_.aid)) }
    }
  }
  return null
}

async function bilimeta(aid) {
  let res = await fetch('https://api.bilibili.com/x/web-interface/view?aid=' + aid)
  if (res.status != 200) {
    return {}
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
  })

  $('img[alt^=rank]', $history).each((i, e) => {
    let $e = $(e)
    let rank = $e.attr('alt').substr(-1)
    let title = $e.attr('title')
    let sm = $e.attr('src').match(/\d+$/) || ''
    sm = sm && 'sm' + sm[0]
    let _ = { rank, title, sm }
    history.push(_)
  })

  return { ranklist, history }
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

main(process.argv.slice(2))