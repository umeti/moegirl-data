const {loadUserContribsData} =  require('./lib.js')
async function main(){
  let userName = process.argv[2] || '梦吉'
  let data = await loadUserContribsData(userName)
  let report = await makeReport(data)

  // console.log(data)
 // console.log(report.overview)
  showReport(report)
}

function showReport(report){
  let _ = report.overview
  if(_.editCount == 0){
    console.log('无任何编辑')
    return
  }
  let text = 
`
总编辑数： ${_.editCount}
自动化编辑数： ${_.editCountOfAuto}
讨论页编辑数： ${_.editCountOfTalk}
用户页编辑数： ${_.editCountOfUser}
常规页编辑数： ${_.editCountOfCommon}
总页面数： ${_.pageCount}
常规页面数： ${_.pageCountOfCommon} 
创建的常规页面数： ${_.createCount} 
最多编辑的一天： ${_.mostEditedDay.key} (${_.mostEditedDay.count})
最多编辑的页面： ${_.mostEditedPage.key} (${_.mostEditedPage.count})
最多常规编辑的一天： ${_.mostEditedDayOfCommon.key} (${_.mostEditedDayOfCommon.count})
最多常规编辑的页面： ${_.mostEditedPageOfCommon.key} (${_.mostEditedPageOfCommon.count})
活动天数： ${_.dayCount}
活动时段统计：
`
  let rem = {
    '凌晨': '04:00-06:00',
    '清晨': '06:00-08:00',
    '上午': '08:00-11:00',
    '中午': '11:00-13:00',
    '下午': '13:00-17:00',
    '傍晚': '17:00-19:00',
    '晚上': '19:00-23:00',
    '深夜': '23:00-04:00',
  }
  let times = []
  for(let p in _.timeHabit){
    //text += `  ${p}(${rem[p]}) ${_.timeHabit[p].all}\n`
    times.push({key:p,val:_.timeHabit[p].all})
  }
  times = times.sort((a,b)=>b.val-a.val)
  for (let t of times){
    text += ` ${rem[t.key]} ${t.val}\n`
  }
  console.log(text)

}

function findMostEdit(map){
  let key="",count=0
  for(let k of map.keys()){
    let item = map.get(k) 
    if(count < item.editCount){
      key = k
      count = item.editCount
    }

  }

  return {
    key,
    count,
  }
}

async function makeReport(data) {
  
  let pages = analyzePages(data)
  let days = analyzeDays(data)
  for (let day of days.values()) {
    day.periods = analyzePeriod(day.items)
  }

  
  let mostEditedDay = findMostEdit(days)
  let mostEditedPage = findMostEdit(pages)

  let timeHabit  = analyzeTimeHabit(days)

  let filteredData = filterData(data)
  let commonPages = analyzePages(filteredData.common)
  let commonDays = analyzeDays(filteredData.common)
  let mostEditedDayOfCommon = findMostEdit(commonDays)
  let mostEditedPageOfCommon =  findMostEdit(commonPages)

  return {
    pages,
    days,
    filterData,
    overview: {
      editCount: data.length,
      editCountOfAuto:filteredData.auto.length,
      editCountOfTalk:filteredData.talk.length,
      editCountOfUser:filteredData.user.length,
      editCountOfCommon:filteredData.common.length,
      pageCount: pages.size,
      pageCountOfCommon: commonPages.size,
      createCount: filteredData.create.length,
      dayCount: days.size,
      mostEditedDay,
      mostEditedPage,
      mostEditedDayOfCommon,
      mostEditedPageOfCommon,
      timeHabit,
    }
  }
}

function isAuto(item){
  if(item.tags.Automation_tool){
    return true
  }
  return false
}

function isUser(item){
  return /^User\:/i.test(item.page)
}

function isTalk(item){
  return /^.*?Talk\:/i.test(item.page)
}

function filterData(data){
  let _ = {
    auto:[],
    talk:[],
    user:[],
    common:[],
    create:[]
  }
  
  for (let item of data){
    if(isAuto(item)){
      _.auto.push(item)
    }else if(isUser(item)){
      _.user.push(item)
    }else if(isTalk(item)){
      _.talk.push(item)
    }else{
      _.common.push(item)
      if(item.isNew){
        _.create.push(item)
      }
    }
    
  }
  
  //console.debug(_)
  return _
}


function analyzePages(data) {
  pages = new Map()
  for (let item of data) {
    let bake = pages.get(item.page)
    if (bake) {
      bake.editCount++
      bake.items.push(item)
    } else {
      pages.set(item.page, {
        title: item.page,
        editCount: 1,
        items: [item]
      })
    }
  }
  return pages
}

function analyzeDays(data) {
  let days = new Map()
  for (let item of data) {
    let i = item.date.toISOString().substr(0,10)
    let bake = days.get(i)
    if (bake) {
      bake.editCount++
      bake.items.push(item)
    } else {
      days.set(i, {
        day: new Date(i),
        editCount: 1,
        items: [item]
      })
    }
  }

  return days
}

const PERIOD_OF_TIME_EN = {
  0: 'night',
  1: 'night',
  2: 'night',
  3: 'night',
  4: 'dawn',
  5: 'dawn',
  6: 'earlymorning',
  7: 'earlymorning',
  8: 'morning',
  9: 'morning',
  10: 'morning',
  11: 'noon',
  12: 'noon',
  13: 'afternoon',
  14: 'afternoon',
  15: 'afternoon',
  16: 'afternoon',
  17: 'dusk',
  18: 'dusk',
  19: 'evening',
  20: 'evening',
  21: 'evening',
  22: 'evening',
  23: 'night',
}
const PERIOD_OF_TIME = {
  0: '深夜',
  1: '深夜',
  2: '深夜',
  3: '深夜',
  4: '凌晨',
  5: '凌晨',
  6: '清晨',
  7: '清晨',
  8: '上午',
  9: '上午',
  10: '上午',
  11: '中午',
  12: '中午',
  13: '下午',
  14: '下午',
  15: '下午',
  16: '下午',
  17: '傍晚',
  18: '傍晚',
  19: '晚上',
  20: '晚上',
  21: '晚上',
  22: '晚上',
  23: '深夜',
}
/*
各时段对应如下
凌晨04-06
清晨06-08
上午08-11
中午11-13
下午13-17
傍晚17-19
晚上19-23
深夜23-04
*/

function analyzePeriod(data) {
  let periods = {}
  for (let item of data) {
    let p = PERIOD_OF_TIME[item.date.getUTCHours()]
    if (periods[p]) {
      periods[p].editCount++
      periods[p].items.push(item)
    } else {
      periods[p] = {
        editCount: 1,
        items: [item]
      }
    }
  }
  return periods
}

function analyzeTimeHabit(days){
  const week = ['sun','mon','tue','wed','thu','fri','sat']
  let periodCounts = {}
  for (let day of days.values()) {
    for(let p in day.periods){
      if(!periodCounts[p]){
        periodCounts[p] = {all:0,}
        for(let k of week){
          periodCounts[p][k] = 0
        }
        
      }
      periodCounts[p].all++
      periodCounts[p][week[day.day.getUTCDay()]]++
    }
  }
  return periodCounts
}

async function test() {
  let data = await makeData('梦吉')
  let report = await makeReport(data)

  // console.log(data)
  console.log(report.overview)
}


//test()
main()
