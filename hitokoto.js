const fetch = require('node-fetch')

async function main(){
  let _ = await hitokoto()
  let msg =  _.hitokoto
  let by = ` --[[${_.source}]]`
  console.log(_)
  console.log(msg+by)
}

      STOP = true
async function hitokoto(){
  let res = await fetch('https://api.imjad.cn/hitokoto/?encode=json&cat='+'abc'.charAt(2 || Math.floor(Math.random()*3)))
  return await res.json()
}

main()
