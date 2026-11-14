self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  if(clients.some(client=>client.visibilityState==='visible'))return;
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){}
  const inviteId=String(data.inviteId||'');
  if(!inviteId)return;
  await self.registration.showNotification(data.title||'Входящий звонок PIXY',{
   body:data.body||'Тебе звонят. Нажми, чтобы открыть звонок.',
   tag:'pixy-call-'+inviteId,
   renotify:true,
   requireInteraction:true,
   silent:false,
   vibrate:[500,250,500,250,500,250,500,250,500,250,500,250,500,250,500,250,500,250,500],
   data:{inviteId,url:data.url||('/?incomingCall='+encodeURIComponent(inviteId))}
  });
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