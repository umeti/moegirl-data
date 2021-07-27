const {makeData} =  require('./lib.js')

async function main(){
  let data = await makeData('鬼影233')
  let report = await makeReport(data)

  // console.log(data)
  console.log(report.overview)
  
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

const PERIOD_OF_TIME = {
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
      mostEditedDay,
      mostEditedPage,
      timeHabit,
    }
  }
}

async function test() {
  let data = await makeData('梦吉')
  let report = await makeReport(data)

  // console.log(data)
  console.log(report.overview)
}


//test()
main()
