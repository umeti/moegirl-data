
const fs = require('fs/promises')
const cheerio = require('cheerio')

async function main(arg){
  const html = await fs.readFile("vr.html","utf-8")
  let data = await makeData(html)
  console.log(data.history)
}

async function makeData(html){
  const $ = cheerio.load(html)
  const ranklist = []
  const history = [] 
  let $history = $
  $(".rank").parent().map((i,e)=>{
    let p = $("p",$(e))
    let _ = {}
    _.rank = $(p[0]).text()
    _.rank0 = $(p[1]).text()
    _.point = $(p[2]).text()
    
    let $img = $(e).next()
    let $meta = $img.next()
    let $data = $meta.next()
    let $info = $data.next()

    let img = $("img",$img).first()
    _.sm = img.attr("alt")
    _.pic_archive = img.attr("src")

    _.time = $("p",$meta).first().text()
    _.title = $("a",$meta).first().text()
    _.pickup = $("a+span",$meta).first().text()
    
    let d = $(".mvlistdata",$data);
    [_.collect,_.collect_weight] = getWeight($(d[0]).text());
    [_.watch,_.watch_weight] = getWeight($(d[1]).text());
    [_.comment,_.comment_weight] = getWeight($(d[2]).text());

    let producer = $("a",$data).last()
    _.producer = producer.text()
    
    let uid = producer.attr("href")
    uid = uid && uid.match(/\d+$/)
    _.producer_id = uid && uid[0]

    for(let k in _)
      _[k] = trim(_[k])
    ranklist.push(_)

    if(_.rank == "10"){
      $history = $(e).parent().next().next()
    }
  })

  console.log($history.html())
  //TODO: 抽取历史排行
  return {ranklist,history}
}

function getWeight(text){
  let m = text.match(/\d[\d, \.]*/g)
  let num , weight = ''
  if(m) [num,weight] = m 

  return [num,weight]
}

function trim(str){
  return str ? str.replace(/^\s+|\s+$/g,'') : ''
}

main(process.argv.slice(2))
