
const fs = require("fs")

let f = process.argv[2] 
let text = fs.readFileSync(f,"utf-8")
s = text.replace(/\<!--[\s\S]*?--\>/g,'')

console.log(s)
