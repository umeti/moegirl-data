const fetch = require("node-fetch")

fetch("http://ip-api.com/json")
  .then(res=>res.json())
  .then(data=>console.log(data))
