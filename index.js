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
  $('a').map((i,el)=>{
    console.log($(el).attr('href'))
  })
}

test()
//main()
