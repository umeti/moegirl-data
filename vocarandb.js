const NeDB = require('nedb')
const nedb = require('nedb-promises')

const db = new NeDB({
  filename: 'data/vocaran.db',
  autoload: true,
})

async function main(){
  //query()
  importDataForSep()
}

function query(){
  db.find({},(err,docs)=>{
    for(let data of docs)
    console.log("#%s -  %s",data.index,data.pickup)
  })
}

// 查询以2万收藏达到冠军的作品
function query1(){
  db.find({'ranking.0.mylist':{$gt:20000}},(err,docs)=>{
    for (let data of docs){
      console.log('#'+data.index);
      console.log(data.ranking[0].title);
      console.log(data.ranking[0].mylist)
    }
  })
}


/******** 一次性写入操作  ********/

// 分表导入
async function importDataForSep(){
  const rdb = nedb.create('data/ranking.db')
  const wdb = nedb.create('data/work.db')
  const pdb = nedb.create('data/producer.db')
  
  for (let i = 1; i <= 500; i++) {
    let data = require(`./data/vocaran/${i}.json`)
    let pickup = 0
    let ranking = []
    
    for(let item of data.ranklist){
      if(item.pickup){
        pickup = item.rank
      }
      item = bakeItem(item)

      let work = {
        _id:item.nicoid,
        title:item.title,
        time:item.time,
        pic:item.pic_archive,
        uid:item.producer_id
      }

      let doc = await wdb.findOne({_id:item.nicoid+''})
      if(!doc){
        // console.log('insert work to table');
        // console.log(doc);
        await wdb.insert(work)
      }

      let producer = {
        _id: item.producer_id,
        name: item.producer,
        works:[item.nicoid]
      } 

      doc = await pdb.findOne({_id:item.producer_id+''})

      if(doc){
        if(doc.works.indexOf(item.nicoid) == -1){
          //doc.works.push(item.producer_id)
          await pdb.update({ _id: item.producer_id }, { $push: { works: item.nicoid } })
          //console.log("push work "+ item.producer + ' : '+item.title)
          
        }
      }else{
        await pdb.insert(producer)
      }
     

      delete item.title
      delete item.pic_archive
      delete item.time
      delete item.producer
      delete item.producer_id


      ranking.push(item)
    }

    
    await rdb.insert({
      index: i,
      ranking,
      pickup,
      bilivideo: data.bilivideo,
      nicovideo: data.nicovideo
    })
  }
  
  console.log('导入完成')
}

// 导入
function importData(){
  for (let i = 1; i <= 500; i++) {
    let data = require(`./data/vocaran/${i}.json`)
    let pickup = 0
    let ranking = data.ranklist.map((item)=>{
      if(item.pickup){
        console.log('#%d: %d',i,item.rank)
        pickup = item.rank
      }
      return  bakeItem(item)
    })
    db.insert({
      type: 'ranking',
      index: i,
      ranking,
      pickup,
      bilivideo: data.bilivideo,
      nicovideo: data.nicovideo
    })
  }
  
  console.log('导入完成')
}
function bakeItem(item) {
  let _ = {
    rank: item.rank,
    point: Number(item.point.replace(/[^\d\.]/g, '')),
    nicoid: item.sm,
    pic_archive: item.pic_archive,
    time: '20' + item.time
      .replace(/\((.+)\)\s*/, 'T')
      .replace(/[\/]/g, '-')
      + '+09:00',
    title: item.title,
    mylist: Number(item.collect.replace(/[^\d\.]/g, '')),
    mylist_weight: Number(item.collect_weight.replace(/[^\d\.]/g, '')),
    view: Number(item.watch.replace(/[^\d\.]/g, '')),
    view_weight: Number(item.watch_weight.replace(/[^\d\.]/g, '')) || 1,
    comment: Number(item.comment.replace(/[^\d\.]/g, '')),
    comment_weight: Number(item.comment_weight.replace(/[^\d\.]/g, '')),
    producer: item.producer,
    producer_id: item.producer_id,
  }
  return _
}

main()
