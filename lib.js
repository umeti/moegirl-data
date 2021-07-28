const axios = require('axios').default
const fs = require('fs/promises')
const cheerio = require('cheerio')
const { contains } = require('cheerio/lib/static')

const CACHE_EXPIRE_TIME = 86400000

async function loadUserContribsData(userName, params = {}) {
  let cacheFile = `tmp/${userName}.json`
  let contribs
  try {
    let stat = await fs.stat(cacheFile)
    let t = stat.mtime.getTime()
    let now = new Date().getTime()
    if (now > t + CACHE_EXPIRE_TIME) {
      throw "cache expired"
    }

    console.debug('loading from cache')
    contribs = JSON.parse(await fs.readFile(cacheFile))
    if (contribs.data.length == 0) {
      console.debug('  data is emtry\n')
      throw 'data is emtry'
    }
  } catch (e) {
    console.debug('loading from network')
    contribs = {
      userName,
      params,
      time: new Date().toISOString()
    }

    contribs.data = await makeData(userName, params)
    fs.open(cacheFile, 'w')
      .then(async (f) => {
        f.write(JSON.stringify(contribs, ' ', 2))
          .finally(() => f.close())
      })
  }
  for (let item of contribs.data) {
    item.date = new Date(item.date)
  }
  return contribs.data
}

async function makeData(userName, params) {
  let html
  try {
    let res = await fetchUserContribs(userName, params)
    html = res.data
  } catch (e) {
    console.error('' + e)
    return []
  }

  console.debug('making up ')

  let $ = cheerio.load(html)
  let data = await parseUserContribsPage($)

  return data
}

async function parseUserContribsPage($) {
  testPage($)
  let nextlink = $('.mw-nextlink').attr('href')
  let nextPage = ''
  if (nextlink) {
    nextPage = fetchPage(nextlink)
  }

  let data = []
  let unknownItemCount = 0
  $('.mw-contributions-list > li').map((i, el) => {
    try {
      let date = $('.mw-changeslist-date', el).text()
        .match(/(\d{4})年(\d\d?)月(\d\d?)日.+?(\d\d\:\d\d)/)

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
    } catch (err) {
      await tracklog($(el).html())
      unknownItemCount++
    }
  })

  if(unknownItemCount){
    console.error(' '+unknownItemCount+' items is unknown')
  }

  let nextData = []
  if (nextlink) {
    console.debug('loading next')
    try {
      let nextRes = await nextPage
      let _ = cheerio.load(nextRes.data)
      nextData = await parseUserContribsPage(_)
    } catch (e) {
      console.error(e)
    }
  }
  return [...data, ...nextData]
}

function testPage($) {
  let t = $('title').text()
  if (t.indexOf('萌娘百科') == -1) {
    console.error('请求似乎被拦截')
    return false
  }
  return true
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

  let url = '/index.php?' + param
  return await fetchPage(url)
}

async function fetchPage(url, base = 'https://zh.moegirl.org.cn/') {
  let res = await axios.get(new URL(url, base).toString(), {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  })

  fs.writeFile(`tmp/last-page.html`, res.data)
  return res
}

async function tracklog(msg) {
  await fs.writeFile('tmp/track.log', msg, { flag: 'a' })
  //console.error(msg)
}

module.exports = {
  makeData,
  loadUserContribsData
}

