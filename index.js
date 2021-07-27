const axios = require('axios').default
const fs = require('fs/promises')
const cheerio = require('cheerio')

function genURL(userName,params){
  let param =  new URLSearchParams({
    title:'Special:用户贡献',
    contribs:'contribs',
    target:userName,
    namespace:'',
    tagfilter:'',
    limit:5000,
    // start:'2020-01-01',
    // end:'2020-12-31',
    ...params
  })

  return 'https://zh.moegirl.org.cn/index.php?'+
    param
}

async function main (){
  let url = genURL('eye',{limit:50})
  let res = await axios.get(url,{
    headers:{
      'user-agent':'googlebot/2.0'
    }
  })
  await fs.writeFile('tmp/eye.html',res.data)
  delete res.data
  console.log(res)

}


async function makeData(){
  let $ = cheerio.load(await fs.readFile('tmp/eye.html'))
  let data = []
  $('.mw-contributions-list > li').map((i,el)=>{
    let date = $('.mw-changeslist-date',el).text()
      .match(/(\d{4})年(\d\d?)月(\d\d?)日.+?(\d\d\:\d\d)/,'$1-$2-$3 $4')

    let y = date[1]
    let m = date[2]
    let d = date[3]
    let t = date[4]
    m = m.length == 1?'0'+m:m
    d = d.length == 1?'0'+d:d
    date = new Date(`${y}-${m}-${d}T${t}Z`)
    let page = $('.mw-contributions-title',el).attr('title')
    let href = $('.mw-contributions-title',el).attr('href')
    let comment = $('.comment',el).text()
    let isMinor =  $('.minoredit',el).length > 0
    let plusBytes = $('.mw-plusminus-pos,.mw-plusminus-neg',el).text()
    plusBytes = parseInt( plusBytes.replace(/[^\d\+\-]/g,'')||0)

    data.push({
      date,
      page,
      href,
      comment,
      isMinor,
      plusBytes
    })
    //console.log(`${date.toISOString()} ${page}`)
  })
  //console.log(data)
  return data
}


function analyzePages(data){
  pages = new Map()
  for(let item of data){
    let bake = pages.get(item.page) || {}
    if(bake.editCount){
      bake.editCount++
    }else{
      bake.editCount = 1
      pages.set(item.page,bake)
    }
  }
  return pages
}

function analyzeDays(data){
  //times.mostEditedDay 

  let days = new Map()
  for(let item of data){
    let i = Math.floor(item.date.getTime() / 86400000) * 86400000
    let bake = days.get(i)
    if(bake){
      bake.editCount ++
    }else{
      days.set(i,{
        day:new Date(i),
        editCount:1
      })
    }
  }

  return days
}

async function report(data){

  let pages = analyzePages(data)
  let days = analyzeDays(data)
  return {
    editCount: data.length,
    pageCount: pages.size,
    pages,
    days,
  }
}

async function test(){
  let data = await makeData()
  console.log(data)
  console.log(await report(data))
}


test()
//main()
