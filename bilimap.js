const fs = require('fs/promises')
const cheerio = require('cheerio')

async function main(){
  let html = await fs.readFile('assets/list.html','utf-8')
  let data = makeData(html)
  bake(data)
 
  let arranged = arrange(data)
  //show(arranged)
  fs.writeFile('data/bilimap.json',JSON.stringify(arranged,2,' '))
}

function arrange(data){
  let v = []
  let u = []
  let vau = []
  for(let _ of data){
    if(!_.utau){
      v.push(_)
    }else if(!_.vocaloid){
      u.push(_)
    }else{
      vau.push(_)
    }
  }

  v.sort((a,b)=>(a.vocaloid-b.vocaloid))
  vau.sort((a,b)=>(a.vocaloid-b.vocaloid))
  u.sort((a,b)=>(a.utau-b.utau))
  return {
    vocaloid:v,
    utau:u,
    vocaloid_and_utau:vau
  }
}


function bake(data){
  for(_ of data){
    let v = 0
    let u = 0
    let t = _.title
    let i = t.lastIndexOf('#')
    t = t.substr(i)
    let m = t.match(/\d+/g) || []
    if(m.length == 2){
      v = m[0]
      u = m[1]
    }else if(m.length == 1){
      if(/UTAU/i.test(_.title)){
        u = m[0]
      }else{
        v = m[0]
      }
    }else{
      _.error = m.join(' ')
    }
  
    _.vocaloid = parseInt(v)
    _.utau = parseInt(u)
  }
}

function makeData(html){
  let $ = cheerio.load(html)
  let data = []
  $(".player-auxiliary-playlist-item").each((i,e)=>{
    let $e = $(e)
    let title = $('.player-auxiliary-playlist-item-title',$e).text()
    let aid = $e.data('aid')
    let cid = $e.data('cid')
    let bvid = $e.data('bvid')
    let _ = {title,aid,cid,bvid}
    data.push(_)
  })
  return data
}


function show(s,n='---'){
  console.log(`===== ${n} =====`);
  console.log(s);
}


main()