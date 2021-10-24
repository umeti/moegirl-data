const NeDB = require('nedb')

const db = new NeDB({
  filename: 'data/vocaran.db',
  autoload: true,
})

function query(){
  db.find({'ranking.0.title':/初音/},(err,docs)=>{
    for (let data of docs){
      console.log('#'+data.index);
      console.log(data.ranking[0].title);
    }
  })
}


async function main(){
  query()
}


function importData(){
  for (let i = 1; i <= 500; i++) {
    let data = require(`./data/vocaran/${i}.json`)
    let ranking = data.ranklist.map(bakeItem)
    db.insert({
      type: 'ranking',
      index: i,
      ranking,
      bilivideo: data.bilivideo,
      nicovideo: data.nicovideo
    })
  }
  
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