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


async function test(){
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
  console.log(data)
}

test()
//main()
