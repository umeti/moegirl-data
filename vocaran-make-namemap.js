const fs = require('fs/promises')
const yaml = require('yaml')
const fetch = require('node-fetch')

async function main() {
  let data = yaml.parse(await fs.readFile("data/namemap.yml", 'utf-8'))

  function gen_iter() {
    let i = 152
    return function () {
      if (i < data.length) {
        return i++
      } else {
        return false
      }
    }
  }
  let iter = gen_iter()

  function proc() {
    let i = iter()
    if (i === false) {
      return console.log('Done.');
    }
    let ctx = data[i]
    console.log(`process [${i}/${data.length}]: ${ctx.name}`)
    fetch('https://mzh.moegirl.org.cn/index.php?action=raw&title=' + encodeURI((ctx.name+'').replace(/\s/g,'_')), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Mobile Safari/537.36'
      }
    })
      .then(async(res) => {
        let dest = ''
        if (res.status > 199 && res.status < 300) {
          // let dest = res.headers.get('location')
          // dest = new URL(dest).pathname.substr(1)
          let text = await res.text()
          let m = text.match(/#(重定向|redirect)\s*\[\[(.+?)\]\]/i)
          dest = m && m.length > 2 ? m[2] : ''
          console.log(`${ctx.name}  -> ${dest}`)
        }else{
          console.log(`[Error] ${res.status} ${ctx.name}`)
          if(res.status == 403){
            process.abort()
          }
        }

        await fs.writeFile('data/namemap-bake.yml',`
#${i}
- sm: ${ctx.sm}
  count: ${ctx.count}
  title: ${ctx.title}
  name:  ${ctx.name}
  page:  ${dest.replace(/_/g,' ')}
`,{flag:'a'}//------------//
               )
      })
      .finally(() => {
        setTimeout(proc,500)
      })
  }

  proc()
}

main()