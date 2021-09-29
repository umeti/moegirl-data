
!function(){
  const msg = "亲爱的用户：根据《XXX通知》，未成年用户仅可在周五、周六和周日的19:00时至20:00时登录萌娘百科。"
  const jump = 'https://www.zxxk.com/'

  let d = new Date()
  if(d.getDay() < 5 || d.getDay() == 0 || d.getHours() < 19 || d.getHours() > 20){
    document.body.innerHTML = `
<div style="display:flex;align-items:center;justify-content: center;flex-direction:column;height:100%;font-size:20px;">
  <div style="max-width:320px; margin-bottom: 70px;">
${msg}
  </div>
  <div style="background:#07C5B8;color:#fff;padding:10px 30px; " onclick="document.location = '${jump}'">我知道了</div>
</div>
    `
  }
}()
