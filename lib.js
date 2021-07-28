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
    
  }catch(e){
    console.debug('loading from network')
    contribs = {
      userName,
      params,
      time: new Date().toISOString()
    }

    contribs.data = await makeData(userName,params)
    await fs.writeFile(cacheFile, JSON.stringify(contribs,' ',2))
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
      'user-agent': 'googlebot/2.0'
    }
  })
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


module.exports = {
  fetchUserContribs,
  makeData,
  loadUserContribsData
}
