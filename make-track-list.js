
const raw = `Music: Yamato Kasai Tr. 01 02 03 04 05 06 07 08 09 10 13 18 20 21 23 24 26 27 28 29 30 31 32 33 34 35 36 41 43 50 51
Arrange: Yamato Kasai Tr. 48 49
Music: Mizuki Kamada Tr. 11 12 14 15 16 17 19 22 25 38 46
Arrange: Mizuki Kamada  Tr. 02 37 39 40 42 44 45 47
Music:Yoshino Aoki Tr. 37 39 42 44 45 47 48 49
Music:Kenichi Tendo Tr. 40`

let data = {}
raw.split("\n").map((v,i)=>{
  let m = v.match(/(Music|Arrange):\s*(.+?)\s*Tr\.\s*(.+)/)
  let [,work,name,nums] = m
  //console.log(`${work} by ${name}: ${nums}`)
  nums.split(/\s+/).map((id)=>{
    data[id] = data[id] || {}
    data[id][work] = name
  })
  
})


const rawTrack = `01 Main theme 1:52
02 Main theme ～Piano & Strings Version～ 1:57
03 The theme of You and Merc 1:04
04 Go flat 1:12
05 Healer's journey 1:24
06 Morning break 1:38
07 Castle town 1:42
08 Clown's smile 1:18
09 LRLR 1:40
10 Sound of komorebi 1:19
11 Castle 1:38
12 End of the Day 1:38
13 Bonk 1:15
14 Palensee 1:11
15 Hurry up!! 1:37
16 I'm Furious! 1:32
17 Child fight 1:21
18 Sweet 1:36
19 Encouragement 1:39
20 Eternity 1:55
21 Don't cry, pretty human, don't cry 1:32
22 Sadness 1:29
23 Blue days 1:31
24 Dizziness 1:32
25 Cautiously 1:27
26 Erosion 1:42
27 Melting points 1:30
28 Mysterious civilization 1:31
29 Activity 1:13
30 From left to right 1:16
31 Struggle 1:40
32 Heat of evaporation 1:18
33 Counter attack 1:34
34 Upset 1:25
35 Relief 1:17
36 Termitidae 1:37
37 深緑な森の先に (Arrange) 0:55
38 Spring Hill 1:29
39 闇にあらがって (Arrange) 0:56
40 失われゆく闇 (Arrange) 0:48
41 Kiinseido 1:28
42 神獣奇譚 (Arrange) 1:02
43 The world after death 1:19
44 夢が踊れば (Arrange) 0:44
45 誰のための (Arrange) 0:51
46 Sky country 2:14
47 聖天の万祈 (Arrange) 0:48
48 eyecatch Ver.1 0:07
49 eyecatch Ver.2 0:08
50 The theme of titi and chacha Ver.1 0:18
51 The theme of titi and chacha Ver.2 0:19`

rawTrack.split("\n").map((v,i)=>{
  let [,id,title,time] = v.match(/(\d+)\s+(.+?)\s+(\d+\:\d+)/)
  //console.log(`${id}: ${title} -- ${time}`)
  data[id].title = title
  data[id].length = time
})

//console.log(data)

wikitext = `{{Tracklist
|music_credits=yes
|arranger_credits=yes
|all_producer=Yamato Kasai`
for(let id of Object.keys(data).sort()){
  let {title,Music,Arrange,length} = data[id]
  wikitext +=`
|title${id}=${title}
|music${id}=${Music}
|arranger${id}=${Arrange||Music}
|length${id}=${length}`
}

wikitext += '\n}}'

console.log(wikitext)
