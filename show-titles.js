const data = require("./tmp/4O74Y74L74J7.json")


titles = new Set()
for(i in data.data){
  let _ = data.data[i]
  titles.add(_.page)
}

console.log(JSON.stringify([...titles],2,' '))
