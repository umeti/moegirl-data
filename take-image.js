const fetch = require("node-fetch")
const cheerio = require("cheerio")

async function main(){
  let req  = await fetch("https://zh.moegirl.org.cn/%E5%88%AB%E5%BD%93%E6%AC%A7%E5%B0%BC%E9%85%B1%E4%BA%86",{
    "user-agent":"googlebot/2.0"
  })
  let html = await req.text()
  let $ = cheerio.load(html)
  $(".mw-parser-output img").map((i,e)=>{
    let url = $(e).attr("src")
    let _ = decodeURI(url)
    console.log(_)
  })


}

main()
