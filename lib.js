const axios = require('axios').default
const fs = require('fs/promises')
const cheerio = require('cheerio')
const { contains } = require('cheerio/lib/static')

const CACHE_EXPIRE_TIME = 86400000

async function loadUserContribsData(userName,params={}){ 
  let cacheFile =`tmp/${userName}.json`
  let contribs 
  try{
    let stat = await fs.stat(cacheFile)
    let t = stat.mtime.getTime()
    let now = new Date().getTime()
    if(now > t +CACHE_EXPIRE_TIME){
      throw "cache expired"
    }

    console.debug('loading from cache')
    contribs = JSON.parse(await fs.readFile(cacheFile))
    if(contribs.data.length == 0){
      console.debug('  data is emtry\n')
      throw 'data is emtry'
    }
  }catch(e){
    console.debug('loading from network')
    contribs = {
      userName,
      params,
      time: new Date().toISOString()
    }

    contribs.data = await makeData(userName,params)
    fs.open(cacheFile,'w')
      .then(async (f)=>{
        f.write(JSON.stringify(contribs,' ',2))
          .finally(()=>f.close())
      })
  }
  for (let item of contribs.data){
    item.date = new Date(item.date)
  }
  return contribs.data
}


async function fetchUserContribs(userName, params) {
  let param = new URLSearchParams({
    title: 'Special:用户贡献',
    contribs: 'contribs',
    target: userName,
    namespace: '',
    tagfilter: '',
    limit: 5000,
    // start:'2020-01-01',
    // end:'2020-12-31',
    ...params
  })

  let url = 'https://zh.moegirl.org.cn/index.php?' +
    param

  let res = await axios.get(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  })

  fs.writeFile(`tmp/last-page.html`,res.data)
  return res
}




async function makeData(userName,params) {
  let html
  try{
    let res = await fetchUserContribs(userName,params)
    html = res.data
  }catch(e){
    console.error(''+e)
    return []
  }
  
  console.debug('making up ')

  let $ = cheerio.load(html)
  testPage($)
  let data = []
  $('.mw-contributions-list > li').map((i, el) => {
    let date = $('.mw-changeslist-date', el).text()
      .match(/(\d{4})年(\d\d?)月(\d\d?)日.+?(\d\d\:\d\d)/, '$1-$2-$3 $4')

    let y = date[1]
    let m = date[2]
    let d = date[3]
    let t = date[4]
    m = m.length == 1 ? '0' + m : m
    d = d.length == 1 ? '0' + d : d
    date = `${y}-${m}-${d}T${t}Z`
    let page = $('.mw-contributions-title', el).attr('title')
    let href = $('.mw-contributions-title', el).attr('href')
    let comment = $('.comment', el).text()
    let isMinor = $('.minoredit', el).length > 0
    let plusBytes = $('.mw-plusminus-pos,.mw-plusminus-neg', el).text()
    plusBytes = parseInt(plusBytes.replace(/[^\d\+\-]/g, '') || 0)

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
  //TODO: get next pages

  return data
}

function testPage($){
  let t = $('title').text()
  if (t.indexOf('萌娘百科') == -1){
    console.error('请求似乎被拦截')
    return false
  }
  return true
}


module.exports = {
  fetchUserContribs,
  makeData,
  loadUserContribsData
}

