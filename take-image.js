const fetch = require("node-fetch")
const cheerio = require("cheerio")

async function main(){
  let req  = await fetch("",{
    "user-agent":"googlebot/2.0"
  })
  let html = await req.text()
  let $ = cheerio.load(html)
  $("img").map((i,e)=>{
    let url = $(e).attr("src")
    let _ = decodeURI(url)
    console.log(_)
  })


}

main()
