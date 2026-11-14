self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){}
  const isCall=!!data.inviteId;
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  if(isCall&&clients.some(client=>client.visibilityState==='visible'))return;
  if(!isCall&&data.type!=='announcement')return;
  const title=data.title||(isCall?'Входящий звонок PIXY':'PIXY');
  const options={
   body:data.body||(isCall?'Тебе звонят. Нажми, чтобы открыть звонок.':'В PIXY есть обновление.'),
   tag:isCall?'pixy-call-'+data.inviteId:'pixy-announcement-'+(data.tag||'update'),
   renotify:true,
   requireInteraction:isCall,
   silent:false,
   data:{inviteId:data.inviteId||null,url:data.url||(isCall?('/?incomingCall='+encodeURIComponent(data.inviteId)):'/')}
  };
  if(isCall)options.vibrate=[500,250,500,250,500];
  await self.registration.showNotification(title,options);
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const inviteId=event.notification.data?.inviteId;
 const url=new URL(event.notification.data?.url||('/?incomingCall='+encodeURIComponent(inviteId||'')),self.location.origin).href;
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){
   if(new URL(client.url).origin===self.location.origin){
    try{await client.navigate(url)}catch(_){}
    await client.focus();
    return;
   }
  }
  await self.clients.openWindow(url);
 })());
});