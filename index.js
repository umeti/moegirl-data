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
总编辑数 ${_.editCount}
总页面数 ${_.pageCount}
活动天数 ${_.dayCount}
编辑最多的一天 ${_.mostEditedDay.day.toISOString().substr(0,10)} (${_.mostEditedDay.editCount})
编辑最多的页面 ${_.mostEditedPage.title} (${_.mostEditedPage.editCount})
时段活跃度
`
  for(let p in _.timeHabit){
    text += `  ${p} ${_.timeHabit[p].all}\n`
  }
  console.log(text)

}

async function makeReport(data) {
  
  let pages = analyzePages(data)
  let days = analyzeDays(data)
  let mostEditedDay = null
  for (let day of days.values()) {
    day.periods = analyzePeriod(day.items)
    
    if(mostEditedDay){
      if(mostEditedDay.editCount < day.editCount){
        mostEditedDay = day
      }
    }else{
      mostEditedDay = day
    }
  }

  let mostEditedPage = null
  for(let page of pages.values()){
    if(mostEditedPage){
      if(mostEditedPage.editCount < page.editCount){
        mostEditedPage = page
      }
    }else{
      mostEditedPage = page
    }
  }

  let timeHabit  = analyzeTimeHabit(days)

  return {
    pages,
    days,
    overview: {
      editCount: data.length,
      pageCount: pages.size,
      dayCount: days.size,
      mostEditedDay,
      mostEditedPage,
      timeHabit,
    }
  }
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
    let i = Math.floor(item.date.getTime() / 86400000) * 86400000
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
