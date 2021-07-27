const axios = require('axios').default
const fs = require('fs/promises')
const cheerio = require('cheerio')

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
  let cacheFile =`tmp/${userName}.html`
  let html
  try{
    html = await fs.readFile(cacheFile)
    console.log('loading from cache')
  }catch(e){
    console.log('loading from network')
    let res = await fetchUserContribs(userName,params)
    html = res.data
    await fs.writeFile(cacheFile, res.data)
  }
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
    date = new Date(`${y}-${m}-${d}T${t}Z`)
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
  return data
}


module.exports = {
  fetchUserContribs,
  makeData,
}
