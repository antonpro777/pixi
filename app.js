(() => {
const cfg=window.PIXY_CONFIG||{};const ready=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_URL.includes('YOUR_')&&!cfg.SUPABASE_ANON_KEY.includes('YOUR_'));
const sb=ready&&window.supabase?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);let user=null,profile=null,pendingEmail='',authMode='login',verifyPurpose='signup',selectedFile=null,selectedFiles=[],availableMusic=[];
function revealStartupFallback(message){
 const splash=$('splash'),app=$('app'),auth=$('auth');
 if(splash)splash.style.display='none';
 if(app?.classList.contains('hidden')&&auth?.classList.contains('hidden')){
  setAuth('login');
  authStatus(message,true);
 }
}
window.addEventListener('error',event=>{
 console.error('PIXY startup error:',event.error||event.message);
 revealStartupFallback('Не удалось полностью запустить PIXY. Проверь подключение и обнови страницу.');
});
window.addEventListener('unhandledrejection',event=>{
 console.error('PIXY startup request failed:',event.reason);
 revealStartupFallback('Не удалось подключиться к сервису. Попробуй обновить страницу.');
});
const toast=(m)=>{const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};
const authStatus=(m,err=false)=>{$('authStatus').textContent=m;$('authStatus').style.color=err?'#ff9dba':'#9debd6'};
const setAuth=(mode)=>{authMode=mode;['loginForm','signupForm','verifyForm','resetForm','newPasswordForm'].forEach(id=>$(id).classList.add('hidden'));$(mode+'Form').classList.remove('hidden');$('auth').classList.remove('hidden');$('app').classList.add('hidden');$('authStatus').textContent='';$('authSwitch').classList.toggle('hidden',mode==='verify'||mode==='reset'||mode==='newPassword');$('authTitle').textContent=mode==='signup'?'Создай свой мир.':mode==='verify'?'Проверь почту.':mode==='reset'?'Восстановим доступ.':mode==='newPassword'?'Новый пароль.':'С возвращением.';$('authSub').textContent=mode==='signup'?'Присоединяйся к PIXY.':mode==='verify'?'Мы отправили тебе код подтверждения.':mode==='reset'?'Отправим код для восстановления.':mode==='newPassword'?'Придумай новый надёжный пароль.':'Войди в свой мир PIXY.';$('authSwitch').innerHTML=mode==='signup'?'Уже есть аккаунт? <button id="showLogin">Войти</button>':mode==='login'?'Впервые здесь? <button id="showSignup">Создать аккаунт</button>':'<button id="backLogin">← Вернуться ко входу</button>';if($('showLogin'))$('showLogin').onclick=()=>setAuth('login');if($('showSignup'))$('showSignup').onclick=()=>setAuth('signup');if($('backLogin'))$('backLogin').onclick=()=>setAuth('login')};
function showApp(){initIncomingCallListeners(); $('auth').classList.add('hidden');$('app').classList.remove('hidden');$('sideName').textContent=profile?.display_name||user?.email?.split('@')[0]||'Гость PIXY';$('sideHandle').textContent=profile?.username?'@'+profile.username:'@welcome';$('sideAvatar').textContent=(profile?.display_name||'P').slice(0,1).toUpperCase();$('profileAvatar').textContent=(profile?.display_name||'P').slice(0,1).toUpperCase();if(profile?.avatar_url){$('profileAvatar').style.backgroundImage='url('+profile.avatar_url+')';$('profileAvatar').style.backgroundSize='cover';$('profileAvatar').style.backgroundPosition='center'}else{$('profileAvatar').style.backgroundImage='';}$('profileName').textContent=profile?.display_name||'Твой профиль';$('profileHandleText').textContent=profile?.username?'@'+profile.username:'@username';$('profileVerified').classList.toggle('hidden',!profile?.is_verified);$('moderationNav').classList.toggle('hidden',profile?.username!=='anpro777');$('profileModerationBtn').classList.toggle('hidden',profile?.username!=='anpro777');loadModerationStatus();$('profileBio').textContent=profile?.bio||'Расскажи немного о себе — пусть тебя узнают.';if(profile?.avatar_url){$('profileAvatar').style.backgroundImage='url('+profile.avatar_url+')';$('profileAvatar').style.backgroundSize='cover';$('sideAvatar').style.backgroundImage='url('+profile.avatar_url+')';$('sideAvatar').style.backgroundSize='cover';$('sideAvatar').textContent=''}if(profile?.profile_background&&bgColors[profile.profile_background]){const c=bgColors[profile.profile_background];document.querySelector('.profile-cover').style.background='linear-gradient(135deg,'+c[0]+','+c[1]+')'}loadFeed();loadStories();loadSocialStats();loadWallet()}
function nav(view){
 $('profileMoreMenu')?.classList.add('hidden');$('profileMoreBtn')?.setAttribute('aria-expanded','false');
 document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));
 const target=$('view-'+view);
 if(target){target.classList.remove('hidden');target.classList.remove('view-enter');void target.offsetWidth;target.classList.add('view-enter')}
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 const titles={home:['ТВОЯ ЛЕНТА','Главная'],videos:['КОРОТКИЙ ФОРМАТ','PIX Video'],search:['ЛЮДИ PIXY','Поиск'],profile:['ТВОЁ ПРОСТРАНСТВО','Мой профиль'],messages:['ЛИЧНОЕ','Сообщения'],notifications:['ТВОЯ АКТИВНОСТЬ','Уведомления'],wallet:['ТВОЙ БАЛАНС','Мои XION'],shop:['КАСТОМИЗАЦИЯ','Магазин'],moderation:['УПРАВЛЕНИЕ PIXY','Модерация']};
 $('pageEyebrow').textContent=titles[view]?.[0]||'PIXY';$('pageTitle').textContent=titles[view]?.[1]||'PIXY';
 if(view==='profile'&&user)loadProfilePosts();if(view==='videos'&&user)loadVideos();if(view==='messages'&&user)loadChatList();if(view==='notifications'&&user)loadNotifications();if(view==='shop'&&user)loadShop();if(view==='wallet'&&user)loadWallet();
}
document.addEventListener('click',e=>{const v=e.target.closest('[data-view]');if(v){e.preventDefault();nav(v.dataset.view)}const c=e.target.closest('[data-close]');if(c){if(c.dataset.close==='composerModal'&&typeof stopCamera==='function')stopCamera();$(c.dataset.close).classList.add('hidden')}});
$('showSignup').onclick=()=>setAuth('signup');
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!sb)return authStatus('Сервис входа пока недоступен.',true);
 const username=$('loginUsername').value.trim().toLowerCase();
 if(!/^[a-z0-9_.]{3,24}$/.test(username))return authStatus('Проверь username: 3–24 символа, латиница, цифры, точка или _.',true);
 authStatus('Входим в PIXY…');
 try{
  const result=await withTimeout(sb.auth.signInWithPassword({email:username+'@login.pixy.invalid',password:$('loginPassword').value}),12000,'Сервис входа не ответил за 12 секунд. Попробуй ещё раз.');
  if(result.error)throw result.error;
  user=result.data.user;
  await loadProfile();
  showApp();
 }catch(error){console.error('PIXY login error:',error);authStatus(error?.message||'Не удалось войти. Проверь username и пароль.',true)}
});
$('signupForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=$('signupForm'),button=form.querySelector('button[type="submit"]');
 if(!sb)return authStatus('Сервис регистрации недоступен. Обнови страницу и попробуй снова.',true);
 if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Создаём аккаунт…'}
 try{
  const username=$('signupUsername').value.trim().toLowerCase();
  const name=$('signupName').value.trim();
  const password=$('signupPassword').value;
  const passwordConfirm=$('signupPasswordConfirm').value;
  if(!/^[a-z0-9_.]{3,24}$/.test(username))return authStatus('Username: 3–24 символа, латиница, цифры, точка или _.',true);
  if(!name)return authStatus('Введи имя.',true);
  if(password.length<8)return authStatus('Пароль должен содержать минимум 8 символов.',true);
  if(password!==passwordConfirm)return authStatus('Пароли не совпадают.',true);
  // Не делаем предварительный SELECT profiles: он зависает на REST API.
  // Уникальный индекс profiles_username_key сам защитит username от дублей.
  authStatus('Отправляем регистрацию в PIXY…');
  const {data,error}=await withTimeout(sb.auth.signUp({email:username+'@login.pixy.invalid',password,options:{data:{display_name:name,username}}}),12000,'Сервис регистрации не ответил за 12 секунд. Если аккаунт успел создаться, попробуй войти с теми же данными.');
  if(error)throw error;
  if(!data.user)throw new Error('Сервис не вернул созданный аккаунт. Попробуй ещё раз.');
  let session=data.session;
  if(!session){
   const loginResult=await withTimeout(sb.auth.signInWithPassword({email:username+'@login.pixy.invalid',password}),10000,'Аккаунт создан, но вход пока не ответил. Попробуй войти с теми же данными.');
   if(loginResult.error)throw new Error('Аккаунт создан, но Supabase не выдал вход: '+loginResult.error.message);
   session=loginResult.data.session;
   user=loginResult.data.user;
  }else user=data.user;
  // Профиль создаётся триггером в базе одновременно с auth.users.
  // Не отправляем отдельный REST-запрос profiles из браузера.
  profile={id:user.id,display_name:name,username};
  showApp();
  toast('Добро пожаловать в PIXY!');
 }catch(error){
  console.error('PIXY signup error:',error);
  authStatus(error?.message||'Не удалось создать аккаунт. Попробуй ещё раз.',true);
 }finally{
  if(button){button.disabled=false;button.textContent=button.dataset.originalText||'Создать аккаунт ↗'}
 }
});
$('verifyForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return;authStatus('Проверяем код…');const {data,error}=await sb.auth.verifyOtp({email:pendingEmail,token:$('verifyCode').value.trim(),type:verifyPurpose});if(error)return authStatus(error.message,true);if(verifyPurpose==='recovery'){setAuth('newPassword');authStatus('Почта подтверждена. Теперь задай новый пароль.');return}user=data.user;await loadProfile();showApp();toast('Добро пожаловать в PIXY!')});
$('resendCode').onclick=async()=>{if(!sb||!pendingEmail)return;const result=verifyPurpose==='recovery'?await sb.auth.resetPasswordForEmail(pendingEmail):await sb.auth.resend({type:'signup',email:pendingEmail});authStatus(result.error?result.error.message:'Новый код отправлен.',!!result.error)};
$('resetForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return;pendingEmail=$('resetEmail').value.trim();verifyPurpose='recovery';const {error}=await sb.auth.resetPasswordForEmail(pendingEmail);if(error)return authStatus(error.message,true);setAuth('verify');authStatus('Код восстановления отправлен на '+pendingEmail)});
$('newPasswordForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return;const {error}=await sb.auth.updateUser({password:$('newPassword').value});if(error)return authStatus(error.message,true);toast('Пароль обновлён');setAuth('login')});
async function signOutOfPixy(){
 try{if(sb){const {error}=await sb.auth.signOut();if(error)throw error}
  user=null;profile=null;activeConversation=null;activeChatUser=null;document.body.classList.remove('chat-open','call-active');
  setAuth('login');toast('Ты вышел из аккаунта PIXY.');
 }catch(error){console.error('PIXY sign out:',error);toast('Не удалось выйти: '+(error?.message||'ошибка'))}
}
$('signOut').onclick=signOutOfPixy;
$('signOutProfile')?.addEventListener('click',signOutOfPixy);
$('profileMoreBtn')?.addEventListener('click',()=>{const menu=$('profileMoreMenu');menu.classList.remove('hidden');$('profileMoreBtn').setAttribute('aria-expanded','true');});
$('profileMoreClose')?.addEventListener('click',()=>{$('profileMoreMenu')?.classList.add('hidden');$('profileMoreBtn')?.setAttribute('aria-expanded','false');});
$('refreshNotifications')?.addEventListener('click',loadNotifications);
document.addEventListener('click',e=>{if(!e.target.closest('.profile-actions')){$('profileMoreMenu')?.classList.add('hidden');$('profileMoreBtn')?.setAttribute('aria-expanded','false')}});

function withTimeout(promise,ms,message){
 let timer;
 return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms)})]).finally(()=>clearTimeout(timer));
}
async function loadNotifications(){
 if(!sb||!user)return;
 const box=$('notificationFeed');if(!box)return;
 box.innerHTML='<div class="notification-empty"><span class="notification-spinner">✦</span><b>Собираем активность…</b></div>';
 const items=[];
 try{
  const {data:chats}=await sb.rpc('list_my_direct_chats');
  for(const chat of (chats||[]).slice(0,25)){
   const {data:msgs}=await sb.from('messages').select('id,sender_id,body,created_at').eq('conversation_id',chat.conversation_id).neq('sender_id',user.id).order('created_at',{ascending:false}).limit(2);
   for(const m of msgs||[])items.push({type:'message',name:chat.username||'Пользователь',text:m.body||'Отправил(а) вложение',date:m.created_at,action:'messages',id:m.id});
  }
 }catch(err){console.warn('PIXY message notifications:',err)}
 try{
  const {data:followers}=await sb.from('follows').select('follower_id,created_at').eq('following_id',user.id).order('created_at',{ascending:false}).limit(20);
  const ids=[...new Set((followers||[]).map(x=>x.follower_id))];
  const {data:people}=ids.length?await sb.from('profiles').select('id,username,display_name').in('id',ids):{data:[]};
  const map=Object.fromEntries((people||[]).map(p=>[p.id,p]));
  for(const f of followers||[]){const p=map[f.follower_id];items.push({type:'follow',name:p?.username||'Новый пользователь',text:'подписался на тебя',date:f.created_at,action:'profile',id:f.follower_id})}
 }catch(err){console.warn('PIXY follower notifications:',err)}
 try{
  const {data:posts}=await sb.from('posts').select('id').eq('author_id',user.id).limit(100);
  const ids=(posts||[]).map(p=>p.id);
  if(ids.length){
   const [{data:comments},{data:reactions}]=await Promise.all([
    sb.from('comments').select('id,post_id,author_id,body,created_at,profiles(username)').in('post_id',ids).neq('author_id',user.id).order('created_at',{ascending:false}).limit(25),
    sb.from('reactions').select('post_id,user_id,reaction,created_at,profiles(username)').in('post_id',ids).neq('user_id',user.id).order('created_at',{ascending:false}).limit(25)
   ]);
   for(const x of comments||[])items.push({type:'comment',name:x.profiles?.username||'Пользователь',text:'оставил комментарий: '+(x.body||''),date:x.created_at,action:'profile',id:x.id});
   for(const x of reactions||[])items.push({type:'like',name:x.profiles?.username||'Пользователь',text:x.reaction==='like'?'поставил лайк твоей публикации':'оставил реакцию '+x.reaction,date:x.created_at,action:'profile',id:x.id});
  }
 }catch(err){console.warn('PIXY post notifications:',err)}
 items.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
 const icons={message:'✉',follow:'＋',comment:'▤',like:'♥'};
 const colors={message:'message',follow:'follow',comment:'comment',like:'like'};
 box.innerHTML=items.length?items.slice(0,60).map(x=>'<article class="notification-item"><span class="notification-icon '+colors[x.type]+'">'+icons[x.type]+'</span><div class="notification-copy"><b>@'+safe(x.name)+'</b><p>'+safe(x.text)+'</p><small>'+new Date(x.date).toLocaleString()+'</small></div><span class="notification-arrow">›</span></article>').join(''):'<div class="notification-empty"><span>✦</span><b>Пока тихо — и это нормально</b><p>Новые сообщения, подписки, комментарии и реакции появятся здесь.</p></div>';
 const dot=$('notificationDot');if(dot)dot.classList.toggle('hidden',!items.length);
}
async function loadProfile(){
 if(!sb||!user)return;
 const ownerId=user.id,meta=user.user_metadata||{};
 profile={id:ownerId,display_name:meta.display_name||'Новый пользователь',username:meta.username||('pixy_'+ownerId.slice(0,8)),bio:'',avatar_url:null,profile_background:'Aurora',is_verified:false};
 try{
  const result=await withTimeout(sb.from('profiles').select('*').eq('id',ownerId).maybeSingle(),5000,'Профиль загружается дольше обычного');
  if(user?.id!==ownerId)return;
  if(result.error)throw result.error;
  if(result.data)profile=result.data;
 }catch(error){if(user?.id===ownerId)console.warn('PIXY profile fallback:',error)}
}
function renderPostMedia(p){
 const items=Array.isArray(p.media_items)&&p.media_items.length?p.media_items:[{url:p.media_url,type:p.media_type}];
 if(p.media_type==='video')return '<div class="post-video-wrap"><video controls playsinline preload="metadata" '+(p.music_url?'muted data-video-music="1"':'')+' src="'+safe(p.media_url)+'"></video>'+(p.music_url?'<audio data-video-audio="1" preload="auto" loop src="'+safe(p.music_url)+'"></audio>':'')+'</div>';
 const first=items[0]||{url:p.media_url};
 if(items.length>1)return '<div class="post-carousel" data-carousel data-items="'+safe(JSON.stringify(items))+'" data-index="0"><img data-carousel-image draggable="false" src="'+safe(first.url)+'" alt="Фото 1 из '+items.length+'">'+(p.music_url?'<button type="button" class="carousel-play-overlay" data-carousel-toggle>Нажмите, чтобы включить</button>':'')+'<span class="carousel-count" data-carousel-count>1 / '+items.length+'</span><span class="carousel-hint">‹ Листай ›</span></div>'+(p.music_url?'<audio class="post-music" data-carousel-music preload="auto" loop src="'+safe(p.music_url)+'"></audio>':'');
 return '<img src="'+safe(first.url||p.media_url)+'" alt="Публикация">';
}
function bindVideoAudio(root){
 if(!root)return;
 root.querySelectorAll('video[data-video-music]').forEach(video=>{
  if(video.dataset.audioBound)return;video.dataset.audioBound='1';
  const audio=video.closest('.post-video-wrap')?.querySelector('audio[data-video-audio]');if(!audio)return;
  const sync=()=>{if(Math.abs(audio.currentTime-video.currentTime)>.35){try{audio.currentTime=video.currentTime}catch(_){}}};
  video.addEventListener('play',()=>{sync();audio.play().catch(()=>{})});
  video.addEventListener('pause',()=>audio.pause());
  video.addEventListener('seeking',sync);
  video.addEventListener('timeupdate',sync);
  video.addEventListener('ended',()=>{audio.pause();audio.currentTime=0});
 });
}
async function loadFeed(){
 if(!sb)return;
 const {data,error}=await sb.from('posts').select('id,author_id,caption,media_url,media_type,media_items,music_url,music_title,created_at,profiles!posts_author_id_fkey(username,display_name,avatar_url,is_verified),comments(count),reactions(user_id,reaction)').in('visibility',['public','friends']).order('created_at',{ascending:false}).limit(30);
 if(error){console.warn(error);toast('Не удалось загрузить ленту: '+error.message);return}
 const feed=$('feed');
 if(!data?.length){feed.innerHTML='<div class="empty-state"><div class="empty-icon">✧</div><h2>Лента только начинается</h2><p>Опубликуй первый момент и позови друзей в PIXY.</p></div>';return}
 feed.innerHTML=data.map(p=>{
  const own=(p.reactions||[]).find(r=>r.user_id===user?.id);
  const liked=own?.reaction==='like';
  const commentCount=p.comments?.[0]?.count||0;
  const reactionCount=(p.reactions||[]).filter(r=>r.reaction==='like').length;
  return '<article class="post-card" data-post-card="'+p.id+'"><div class="post-head"><button class="post-author-link" type="button" data-open-profile="'+p.author_id+'"><span class="avatar avatar-gradient">'+safe((p.profiles?.display_name||'P').slice(0,1))+'</span></button><button class="post-user post-author-link" type="button" data-open-profile="'+p.author_id+'"><strong>'+safe(p.profiles?.username||'pixy_user')+(p.profiles?.is_verified?' <span class="verified-badge">✓</span>':'')+'</strong><small>'+new Date(p.created_at).toLocaleString()+'</small></button></div><div class="post-image">'+renderPostMedia(p)+'</div>'+(p.music_title?'<small class="post-music-title">♫ '+safe(p.music_title)+'</small>':'')+'<p class="post-caption">'+safe(p.caption||'')+'</p><div class="post-actions"><button class="'+(liked?'is-liked':'')+'" data-like="'+p.id+'">'+(liked?'♥':'♡')+' <span data-like-count>'+reactionCount+'</span></button><button data-comment="'+p.id+'">▢ <span data-comment-count>'+commentCount+'</span> Комментарии</button></div><div class="reaction-row">'+['❤️','🤩','😎','😂','🔥'].map(em=>' <button class="'+(own?.reaction===em?'is-reacted':'')+'" data-react-post="'+p.id+'" data-reaction="'+em+'" aria-label="Реакция '+em+'">'+em+'</button>').join('')+'</div></article>';
 }).join('');
 bindVideoAudio(feed);
}
async function loadVideos(){
 if(!sb)return;
 const {data,error}=await sb.from('posts').select('id,author_id,caption,media_url,music_url,music_title,created_at,profiles!posts_author_id_fkey(username,display_name)').eq('media_type','video').in('visibility',['public','friends']).order('created_at',{ascending:false}).limit(30);
 if(error){$('view-videos').innerHTML='<p class="hint">'+safe(error.message)+'</p>';return}
 $('view-videos').innerHTML=(data||[]).map(p=>'<article class="post-card" data-post-card="'+p.id+'"><div class="post-head"><b>@'+safe(p.profiles?.username||'user')+'</b><small>'+new Date(p.created_at).toLocaleString()+'</small></div><div class="post-video-wrap"><video controls playsinline '+(p.music_url?'muted data-video-music="1"':'')+' preload="metadata" src="'+safe(p.media_url)+'"></video>'+(p.music_url?'<audio data-video-audio="1" preload="none" loop src="'+safe(p.music_url)+'"></audio>':'')+'</div>'+(p.music_title?'<small class="post-music-title">♫ '+safe(p.music_title)+'</small>':'')+'<p>'+safe(p.caption||'')+'</p>'+(p.author_id===user?.id?'<button class="post-delete-btn" type="button" title="Удалить публикацию" aria-label="Удалить публикацию" data-delete-post="'+p.id+'">🗑</button>':'')+'</article>').join('')||'<div class="empty-state"><h2>Пока нет видео</h2><button class="primary-btn" id="videoCreate">＋ Загрузить видео</button></div>';
 const b=$('view-videos').querySelector('#videoCreate');if(b)b.onclick=()=>openComposer('video');
 bindVideoAudio($('view-videos'));
}
async function loadStories(){
 if(!sb)return;
 const {data,error}=await sb.from('stories').select('id,media_url,media_type,created_at,profiles(username)').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(25);
 if(error){console.warn(error);return}
 const box=$('stories');if(!box)return;
 box.innerHTML='<button class="story add-story" id="storyAdd"><span>＋</span><small>Твоя история</small></button>'+((data||[]).map(s=>'<a class="story" href="'+safe(s.media_url)+'" target="_blank" rel="noopener"><div class="story-ring"><span class="story-face face-a">'+safe((s.profiles?.username||'P').slice(0,1).toUpperCase())+'</span></div><small>'+safe(s.profiles?.username||'user')+'</small></a>').join(''));
 $('storyAdd').onclick=createStoryPicker;
}
function createStoryPicker(){
 if(!user)return toast('Сначала войди в PIXY.');
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,video/mp4,video/webm';
 input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(file.size>50*1024*1024)return toast('Максимум 50 МБ.');if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type))return toast('Выбери фото или MP4/WebM.');
 const path=user.id+'/story-'+crypto.randomUUID()+'.'+file.name.split('.').pop().toLowerCase();toast('Загружаю историю…');
 const {error:uploadError}=await sb.storage.from('pixy-media').upload(path,file,{contentType:file.type});if(uploadError)return toast(uploadError.message);
 const media_url=sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl;
 const {error}=await sb.from('stories').insert({author_id:user.id,media_url,media_type:file.type.startsWith('video/')?'video':'image'});
 if(error)return toast(error.message);toast('История опубликована на 24 часа');loadStories();
 };input.click();
}



// PIXY interface sounds (Web Audio; no external sound files required)
let pixyAudioContext=null,callToneTimer=null,callToneOscillators=[];
async function unlockCallAudio(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 if(!pixyAudioContext)pixyAudioContext=new AC();
 if(pixyAudioContext.state==='suspended')await pixyAudioContext.resume();
}
function playPixyBeep(kind='tap'){
 try{
  if(!pixyAudioContext){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;pixyAudioContext=new AC()}
  const ctx=pixyAudioContext;if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const patterns=kind==='record-start'?[[660,0,.12],[880,.16,.16]]:kind==='record-stop'?[[880,0,.12],[550,.16,.2]]:kind==='call-end'?[[660,0,.12],[440,.15,.2]]:kind==='connected'?[[880,0,.1],[1100,.13,.13]]:[[740,0,.1]];
  const now=ctx.currentTime;
  patterns.forEach(([freq,delay,duration])=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(.12,now+delay+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+delay);osc.stop(now+delay+duration+.02)});
 }catch(err){console.warn('PIXY sound:',err)}
}
function stopCallTone(){if(callToneTimer){clearInterval(callToneTimer);callToneTimer=null}callToneOscillators.forEach(o=>{try{o.stop()}catch(_){}});callToneOscillators=[]}
function startCallTone(kind){
 stopCallTone();
 const playPattern=()=>{
  if(!pixyAudioContext){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;pixyAudioContext=new AC()}
  const ctx=pixyAudioContext;if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const freqs=kind==='incoming'?[440,480]:[425,0];
  freqs.forEach((freq,i)=>{if(!freq)return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.07,ctx.currentTime+.04);gain.gain.setValueAtTime(.07,ctx.currentTime+.75);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.9);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.92);callToneOscillators.push(osc)});
 };
 playPattern();callToneTimer=setInterval(playPattern,kind==='incoming'?2600:3600);
}

let activeConversation=null,activeChatUser=null,activeChatChannel=null,voiceRecorder=null,voiceChunks=[];
let activeCallChannel=null,callChannelConversation=null,callPeer=null,callLocalStream=null,callPendingOffer=null,callPendingIce=[],callTimer=null,callStartedAt=0,callMuted=false,callSpeakerOn=true,callDirection='',callPeerName='',callPeerAvatarUrl='';

function callUi(show,status){$('callOverlay').classList.toggle('hidden',!show);document.body.classList.toggle('call-active',!!show);$('callStatus').textContent=status||'';$('callName').textContent=callPeerName||$('chatTitle').textContent||'Контакт';const av=$('callAvatar');av.textContent=(callPeerAvatarUrl?'':(callPeerName||'P').replace(/^@/,'').slice(0,1).toUpperCase());try{const u=new URL(callPeerAvatarUrl);av.style.backgroundImage=u.protocol==='https:'?'url("'+u.href.replaceAll('"','%22')+'")':'';av.style.backgroundSize='cover';av.style.backgroundPosition='center'}catch(_){av.style.backgroundImage=''}}
async function loadCallPeerProfile(uid,fallback){try{const {data}=await sb.from('profiles').select('display_name,avatar_url').eq('id',uid).maybeSingle();callPeerName=data?.display_name||fallback||'Контакт';callPeerAvatarUrl=data?.avatar_url||''}catch(_){callPeerName=fallback||'Контакт';callPeerAvatarUrl=''}}
function updateCallTimer(){if(!callStartedAt)return;const n=Math.floor((Date.now()-callStartedAt)/1000);$('callTimer').textContent=String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
const callChannels=new Map();
async function subscribeCallChannel(cid){
 if(!cid)throw new Error('Не найдена переписка для звонка.');
 if(callChannels.has(cid))return callChannels.get(cid);
 const ch=sb.channel('pixy-call-'+cid,{config:{private:true}})
  .on('broadcast',{event:'signal'},m=>{activeCallChannel=ch;callChannelConversation=cid;handleCallSignal(m?.payload||m,cid).catch(err=>console.error('PIXY incoming call:',err))});
 callChannels.set(cid,ch);
 await new Promise((resolve,reject)=>{let done=false;const timeout=setTimeout(()=>{if(!done){done=true;callChannels.delete(cid);reject(new Error('Не удалось подключить канал звонка: тайм-аут.'))}},12000);ch.subscribe(status=>{if(status==='SUBSCRIBED'&&!done){done=true;clearTimeout(timeout);resolve()}else if((status==='CHANNEL_ERROR'||status==='TIMED_OUT')&&!done){done=true;clearTimeout(timeout);callChannels.delete(cid);reject(new Error('Realtime отклонил канал звонка: '+status))}})});
 return ch;
}
async function ensureCallChannel(cid=activeConversation){
 if(!cid)throw new Error('Сначала открой переписку.');
 const ch=await subscribeCallChannel(cid);activeCallChannel=ch;callChannelConversation=cid;return ch;
}
async function initIncomingCallListeners(){
 if(!sb||!user)return;
 const {data,error}=await sb.rpc('list_my_direct_chats');
 if(error){console.warn('PIXY incoming calls list:',error.message);return}
 for(const row of data||[]){try{await subscribeCallChannel(row.conversation_id)}catch(err){console.warn('PIXY incoming channel failed:',row.conversation_id,err)}}
}
async function sendCallSignal(type,extra={}){if(!activeCallChannel){if(!callChannelConversation)await ensureCallChannel();else activeCallChannel=callChannels.get(callChannelConversation)}if(!activeCallChannel)throw new Error('Канал звонка не подключён.');return activeCallChannel.send({type:'broadcast',event:'signal',payload:{type,from:user.id,name:profile?.display_name||profile?.username||'Пользователь',...extra}})}
async function createCallPeer(){
 if(callPeer)return callPeer;
 const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});callPeer=pc;
 pc.onicecandidate=e=>{if(e.candidate)sendCallSignal('ice',{candidate:e.candidate}).catch(console.warn)};
 pc.ontrack=e=>{const a=$('callRemoteAudio');if(!a.srcObject)a.srcObject=e.streams?.[0]||new MediaStream([e.track]);a.play().catch(()=>{$('callStatus').textContent='Нажми «Включить громкую связь» для звука.'})};
 pc.onconnectionstatechange=()=>{if(callPeer!==pc)return;if(pc.connectionState==='connected'){stopCallTone();playPixyBeep('connected'); $('callStatus').textContent='На связи';if(!callStartedAt){callStartedAt=Date.now();callTimer=setInterval(updateCallTimer,1000);updateCallTimer()} }else if(pc.connectionState==='connecting')$('callStatus').textContent='Соединяем…';else if(pc.connectionState==='failed')$('callStatus').textContent='Сеть не пропускает прямое соединение. Может потребоваться TURN-сервер.';else if(pc.connectionState==='disconnected')$('callStatus').textContent='Связь прервана…'};
 callLocalStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
 callLocalStream.getAudioTracks().forEach(t=>{t.enabled=!callMuted;pc.addTrack(t,callLocalStream)});return pc;
}
async function startVoiceCall(){
 try{await unlockCallAudio();}catch(_){}
 if(!activeConversation||!activeChatUser)return toast('Открой чат с человеком, которому хочешь позвонить.');
 if(callDirection||callPeer)return toast('Звонок уже идёт.');
 if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)return toast('Браузер не поддерживает интернет-звонки.');
 callDirection='outgoing';callPeerName=$('chatTitle').textContent||'Контакт';callUi(true,'Вызов…');startCallTone('outgoing');$('callAcceptBtn').classList.add('hidden');$('callDeclineBtn').classList.add('hidden');$('callHangupBtn').classList.remove('hidden');
 try{await ensureCallChannel(activeConversation);await sendCallSignal('ring');const pc=await createCallPeer();const offer=await pc.createOffer();await pc.setLocalDescription(offer);await sendCallSignal('offer',{description:pc.localDescription})}
 catch(err){console.error('PIXY call start:',err);toast('Не удалось начать звонок: '+(err?.message||'ошибка'));await endVoiceCall(true)}
}
async function acceptVoiceCall(){
 stopCallTone();try{await unlockCallAudio()}catch(_){}
 if(!callPendingOffer){$('callAcceptBtn').dataset.acceptRequested='1';$('callStatus').textContent='Ожидаем сигнал звонка…';return}
 try{$('callAcceptBtn').classList.add('hidden');$('callDeclineBtn').classList.add('hidden');$('callHangupBtn').classList.remove('hidden');const pc=await createCallPeer();await pc.setRemoteDescription(new RTCSessionDescription(callPendingOffer));for(const c of callPendingIce.splice(0)){try{await pc.addIceCandidate(new RTCIceCandidate(c))}catch(err){console.warn(err)}}const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await sendCallSignal('answer',{description:pc.localDescription});$('callStatus').textContent='Соединяем…'}
 catch(err){console.error('PIXY accept:',err);toast('Не удалось принять звонок: '+(err?.message||'ошибка'));await endVoiceCall(true)}
}
async function handleCallSignal(s,cid=callChannelConversation){
 if(!s||s.from===user?.id)return;
 if(cid){activeCallChannel=callChannels.get(cid)||activeCallChannel;callChannelConversation=cid;}
 if(s.type==='ring'){if(callDirection||callPeer){sendCallSignal('busy').catch(()=>{});return}callDirection='incoming';activeConversation=cid||activeConversation;activeChatUser=s.from;await loadCallPeerProfile(s.from,s.name||'Контакт');callUi(true,'Входящий звонок…');startCallTone('incoming');$('callAcceptBtn').classList.remove('hidden');$('callDeclineBtn').classList.remove('hidden');$('callHangupBtn').classList.add('hidden')}
 else if(s.type==='offer'){stopCallTone();callPendingOffer=s.description;if(!callDirection){callDirection='incoming';await loadCallPeerProfile(s.from,s.name||'Контакт');callUi(true,'Входящий звонок…');$('callAcceptBtn').classList.remove('hidden');$('callDeclineBtn').classList.remove('hidden')}if($('callAcceptBtn').dataset.acceptRequested==='1')await acceptVoiceCall()}
 else if(s.type==='answer'&&callPeer){stopCallTone();try{await callPeer.setRemoteDescription(new RTCSessionDescription(s.description));for(const c of callPendingIce.splice(0)){await callPeer.addIceCandidate(new RTCIceCandidate(c))}}catch(err){console.warn(err)}}
 else if(s.type==='ice'){if(callPeer?.remoteDescription){try{await callPeer.addIceCandidate(new RTCIceCandidate(s.candidate))}catch(err){console.warn(err)}}else callPendingIce.push(s.candidate)}
 else if(['hangup','decline','busy'].includes(s.type)){stopCallTone();await endVoiceCall(false);toast(s.type==='busy'?'Собеседник уже разговаривает.':s.type==='decline'?'Вызов отклонён.':'Звонок завершён.')}
}
async function endVoiceCall(notify=true){
 stopCallTone();playPixyBeep('call-end');if(notify&&activeCallChannel){try{await sendCallSignal(callDirection==='incoming'?'decline':'hangup')}catch(_){}}
 if(callTimer){clearInterval(callTimer);callTimer=null}if(callPeer){try{callPeer.close()}catch(_){}callPeer=null}if(callLocalStream){callLocalStream.getTracks().forEach(t=>t.stop());callLocalStream=null}
 const a=$('callRemoteAudio');a.pause();a.srcObject=null;a.muted=false;callPendingOffer=null;callPendingIce=[];callStartedAt=0;callMuted=false;callSpeakerOn=true;callDirection='';
 $('callTimer').textContent='00:00';$('callMuteBtn').textContent='Выключить микрофон';$('callSpeakerBtn').textContent='Выключить громкую связь';$('callAcceptBtn').dataset.acceptRequested='0';callUi(false,'');
}
$('chatCallBtn').onclick=startVoiceCall;$('callAcceptBtn').onclick=acceptVoiceCall;$('callDeclineBtn').onclick=()=>endVoiceCall(true);$('callHangupBtn').onclick=()=>endVoiceCall(true);
$('callMuteBtn').onclick=()=>{callMuted=!callMuted;callLocalStream?.getAudioTracks().forEach(t=>t.enabled=!callMuted);$('callMuteBtn').textContent=callMuted?'Включить микрофон':'Выключить микрофон'};
$('callSpeakerBtn').onclick=()=>{callSpeakerOn=!callSpeakerOn;$('callRemoteAudio').muted=!callSpeakerOn;$('callSpeakerBtn').textContent=callSpeakerOn?'Выключить громкую связь':'Включить громкую связь'};

async function loadChatList(){
 if(!sb||!user)return;
 const {data,error}=await sb.rpc('list_my_direct_chats');
 if(error){$('chatList').textContent=error.message;return}
 const rows=data||[];
 for(const row of rows){try{await subscribeCallChannel(row.conversation_id)}catch(err){console.warn('PIXY call subscription:',err)}}
 $('chatList').innerHTML=rows.map(x=>'<button class="chat-person" data-chat="'+x.conversation_id+'" data-chat-user="'+x.other_user_id+'" data-chat-name="'+safe(x.username||'user')+'"><span class="chat-person-avatar">'+safe((x.username||'P').slice(0,1).toUpperCase())+'</span><span><b>@'+safe(x.username||'user')+'</b><small>Открыть переписку</small></span><span class="chat-person-arrow">›</span></button>').join('')||'<div class="chat-empty"><span>✉</span><b>Пока никого нет</b><p>Когда появятся переписки, люди будут отображаться здесь.</p></div>';
 $('chatPeoplePanel').classList.remove('hidden');$('chatConversationPanel').classList.add('hidden');
}
async function refreshChatMessages(cid){
 const {data,error}=await sb.from('messages').select('id,sender_id,body,attachment_url,attachment_type,created_at').eq('conversation_id',cid).order('created_at',{ascending:true}).limit(100);
 if(error){$('chatMessages').textContent=error.message;return}
 $('chatMessages').innerHTML=(data||[]).map(m=>'<div style="margin:8px 0;padding:10px 12px;border-radius:12px;background:'+(m.sender_id===user.id?'var(--accent-soft)':'var(--surface)')+';max-width:85%;margin-left:'+(m.sender_id===user.id?'auto':'0')+'">'+(m.body?safe(m.body):'')+(m.attachment_type==='audio'&&m.attachment_url?'<audio controls src="'+safe(m.attachment_url)+'"></audio>':'')+'<small style="display:block;opacity:.6">'+new Date(m.created_at).toLocaleTimeString()+'</small></div>').join('')||'<p class="hint">Начни переписку!</p>';
 $('chatMessages').scrollTop=$('chatMessages').scrollHeight;
}
async function openChat(cid,uid,name){
 activeConversation=cid;activeChatUser=uid;document.body.classList.add('chat-open');$('chatTitle').textContent='@'+name;await loadCallPeerProfile(uid,'@'+name);$('chatPeoplePanel').classList.add('hidden');$('chatConversationPanel').classList.remove('hidden');
 if(activeChatChannel){await sb.removeChannel(activeChatChannel);activeChatChannel=null}
 await refreshChatMessages(cid);
 activeChatChannel=sb.channel('pixy-chat-'+cid).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+cid},payload=>{if(activeConversation===cid)refreshChatMessages(cid)}).subscribe();
 try{await ensureCallChannel(cid)}catch(err){console.warn('PIXY call channel:',err);toast('Звонки не подключены: '+err.message)}
}
$('chatList').addEventListener('click',e=>{const b=e.target.closest('[data-chat]');if(b)openChat(b.dataset.chat,b.dataset.chatUser,b.dataset.chatName)});
$('chatBackBtn').onclick=async()=>{if(activeChatChannel){await sb.removeChannel(activeChatChannel);activeChatChannel=null}if(activeCallChannel&&!callDirection){await sb.removeChannel(activeCallChannel);activeCallChannel=null;callChannelConversation=null}activeConversation=null;activeChatUser=null;document.body.classList.remove('chat-open');$('chatConversationPanel').classList.add('hidden');$('chatPeoplePanel').classList.remove('hidden');};
$('chatSendForm').onsubmit=async e=>{
 e.preventDefault();const body=$('chatMessageInput').value.trim();if(!activeConversation||!body)return;
 const {error}=await sb.from('messages').insert({conversation_id:activeConversation,sender_id:user.id,body});
 if(error)return toast(error.message);$('chatMessageInput').value='';await openChat(activeConversation,activeChatUser,$('chatTitle').textContent.replace('@',''));
};
$('voiceRecord').onclick=async()=>{
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast('Запись голосовых не поддерживается этим браузером.');
 if(voiceRecorder?.state==='recording'){voiceRecorder.stop();$('voiceRecord').textContent='🎙';return}
 try{
 const stream=await navigator.mediaDevices.getUserMedia({audio:true});voiceChunks=[];voiceRecorder=new MediaRecorder(stream);
 voiceRecorder.ondataavailable=e=>{if(e.data.size)voiceChunks.push(e.data)};
 voiceRecorder.onstop=async()=>{
 stream.getTracks().forEach(t=>t.stop());if(!activeConversation)return toast('Сначала открой диалог.');
 const blob=new Blob(voiceChunks,{type:voiceRecorder.mimeType||'audio/webm'});if(blob.size>10*1024*1024)return toast('Голосовое слишком большое (лимит 10 МБ).');
 const path=user.id+'/voice-'+crypto.randomUUID()+'.webm';const {error:upErr}=await sb.storage.from('pixy-media').upload(path,blob,{contentType:blob.type});if(upErr)return toast(upErr.message);
 const url=sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl;
 const {error}=await sb.from('messages').insert({conversation_id:activeConversation,sender_id:user.id,body:'',attachment_url:url,attachment_type:'audio'});if(error)return toast(error.message);await openChat(activeConversation,activeChatUser,$('chatTitle').textContent.replace('@',''));toast('Голосовое отправлено');
 };voiceRecorder.start();$('voiceRecord').textContent='■';toast('Запись началась. Нажми ■ для отправки.');
 }catch(err){toast('Нет разрешения на микрофон.')}
};



async function loadSocialStats(){
 if(!sb||!user)return;
 const [{count:followers},{count:following}]=await Promise.all([
  sb.from('follows').select('*',{count:'exact',head:true}).eq('following_id',user.id),
  sb.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',user.id)
 ]);
 document.querySelectorAll('[data-stat="followers"]').forEach(n=>n.textContent=followers||0);
 document.querySelectorAll('[data-stat="following"]').forEach(n=>n.textContent=following||0);
}
let activePublicProfile=null;
function avatarMarkup(p,cls='profile-list-avatar'){return '<span class="'+cls+'" '+(p.avatar_url?'style="background-image:url('+safe(p.avatar_url)+');background-size:cover;background-position:center"':'')+'>'+(p.avatar_url?'':safe((p.display_name||p.username||'P').slice(0,1).toUpperCase()))+'</span>'}
async function startDirectChatWith(profileUser,callAfter=false){
 if(!user)return toast('Войди в PIXY, чтобы написать сообщение.');
 if(!profileUser?.id||profileUser.id===user.id)return;
 const {data:cid,error}=await sb.rpc('create_direct_conversation',{other_user:profileUser.id});
 if(error||!cid)return toast(error?.message||'Не удалось открыть переписку.');
 $('publicProfileModal').classList.add('hidden');
 nav('messages');
 await loadChatList();
 await openChat(cid,profileUser.id,profileUser.username||'user');
 if(callAfter)await startVoiceCall();
}
async function openPublicProfile(id){
 if(!sb||!id)return;if(id===user?.id){nav('profile');return}
 $('publicProfileModal').classList.remove('hidden');$('publicProfileContent').innerHTML='<div class="profile-view-loading">Загружаем профиль…</div>';
 const [{data:p,error},{count:followers},{count:following},{data:posts}]=await Promise.all([
  sb.from('profiles').select('id,username,display_name,bio,avatar_url,is_verified').eq('id',id).maybeSingle(),
  sb.from('follows').select('*',{count:'exact',head:true}).eq('following_id',id),
  sb.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',id),
  sb.from('posts').select('id,media_url,media_type,caption,created_at').eq('author_id',id).in('visibility',['public','friends']).order('created_at',{ascending:false}).limit(60)
 ]);
 if(error||!p){$('publicProfileContent').innerHTML='<div class="profile-view-loading">Не удалось загрузить профиль.</div>';return}
 const {data:rel}=user?await sb.from('follows').select('following_id').eq('follower_id',user.id).eq('following_id',id).maybeSingle():{data:null};
 activePublicProfile=p;
 $('publicProfileContent').innerHTML='<header class="public-profile-head">'+avatarMarkup(p,'public-profile-avatar')+'<div><h2>'+safe(p.display_name||p.username)+'</h2><small>@'+safe(p.username)+(p.is_verified?' ✓':'')+'</small></div>'+(user?'<button type="button" class="follow-action '+(rel?'following':'')+'" data-follow-toggle="'+p.id+'" data-following="'+(rel?'1':'0')+'">'+(rel?'Вы подписаны':'Подписаться')+'</button>':'')+'</header>'+(user?'<div class="public-profile-actions"><button type="button" class="primary-btn" data-start-chat="'+p.id+'" data-chat-name="'+safe(p.username)+'">✉ Написать</button><button type="button" class="chat-call-btn" data-start-call="'+p.id+'" data-chat-name="'+safe(p.username)+'">☎ Позвонить</button></div>':'')+'<p class="public-profile-bio">'+safe(p.bio||'')+'</p><div class="profile-stats public-profile-stats"><button type="button" data-open-follow-list="'+p.id+'" data-list-kind="followers"><b>'+(followers||0)+'</b><span>подписчиков</span></button><button type="button" data-open-follow-list="'+p.id+'" data-list-kind="following"><b>'+(following||0)+'</b><span>подписок</span></button></div><h3>Публикации</h3><div class="profile-grid public-profile-grid">'+((posts||[]).map(x=>'<div class="my-post">'+(x.media_type==='video'?'<video src="'+safe(x.media_url)+'" controls playsinline></video>':'<img src="'+safe(x.media_url)+'" alt="Публикация">')+'</div>').join('')||'<div class="empty-hint">Пока нет публикаций.</div>')+'</div>';
}
async function openFollowList(profileId,kind){
 if(!profileId)return;$('followListModal').classList.remove('hidden');$('followListTitle').textContent=kind==='followers'?'Подписчики':'Подписки';$('followListContent').innerHTML='<div class="profile-view-loading">Загружаем список…</div>';
 const col=kind==='followers'?'follower_id':'following_id',filter=kind==='followers'?'following_id':'follower_id';
 const {data:rels,error}=await sb.from('follows').select(col).eq(filter,profileId).limit(300);
 if(error){$('followListContent').textContent='Не удалось загрузить список: '+error.message;return}
 const ids=(rels||[]).map(x=>x[col]);if(!ids.length){$('followListContent').innerHTML='<div class="profile-view-loading">Пока здесь никого нет.</div>';return}
 const {data:people,error:pe}=await sb.from('profiles').select('id,username,display_name,avatar_url,is_verified').in('id',ids);
 if(pe){$('followListContent').textContent=pe.message;return}
 $('followListContent').innerHTML=(people||[]).map(p=>'<div class="follow-list-person"><button type="button" class="search-person-main" data-open-profile="'+p.id+'">'+avatarMarkup(p)+'<span><b>'+safe(p.display_name||p.username)+'</b><small>@'+safe(p.username)+(p.is_verified?' ✓':'')+'</small></span></button>'+(user&&p.id!==user.id?'<button type="button" class="follow-action" data-follow-toggle="'+p.id+'" data-following="0">Подписаться</button>':'')+'</div>').join('')||'<div class="profile-view-loading">Список пуст.</div>';
}
document.addEventListener('click',async e=>{
 const message=e.target.closest('[data-start-chat],[data-start-call]');
 if(message){e.preventDefault();e.stopPropagation();await startDirectChatWith({id:message.dataset.startChat||message.dataset.startCall,username:message.dataset.chatName},!!message.dataset.startCall);return}
 const open=e.target.closest('[data-open-profile]');if(open){e.preventDefault();e.stopPropagation();await openPublicProfile(open.dataset.openProfile);return}
 const stats=e.target.closest('[data-open-follow-list]');if(stats){e.preventDefault();await openFollowList(stats.dataset.openFollowList==='self'?user?.id:stats.dataset.openFollowList,stats.dataset.listKind);return}
 const follow=e.target.closest('[data-follow-toggle]');
 if(follow&&!follow.closest('#searchResults')){
  e.preventDefault();if(!user)return toast('Войди в PIXY, чтобы подписываться.');
  const id=follow.dataset.followToggle;if(id===user.id)return;const was=follow.dataset.following==='1';follow.disabled=true;
  const r=was?await sb.from('follows').delete().eq('follower_id',user.id).eq('following_id',id):await sb.from('follows').upsert({follower_id:user.id,following_id:id},{onConflict:'follower_id,following_id'});
  follow.disabled=false;if(r.error)return toast(r.error.message);follow.dataset.following=was?'0':'1';follow.textContent=was?'Подписаться':'Вы подписаны';follow.classList.toggle('following',!was);toast(was?'Подписка отменена':'Подписка оформлена');loadSocialStats();if(activePublicProfile?.id===id)openPublicProfile(id);return;
 }
});

let activeCommentsPost=null;
async function renderComments(){
 if(!sb||!activeCommentsPost)return;
 $('commentsList').innerHTML='<p class="comments-empty">Загружаем комментарии…</p>';
 const {data,error}=await sb.from('comments').select('id,body,created_at,author_id,profiles(username,display_name,avatar_url),comment_reactions(user_id)').eq('post_id',activeCommentsPost).order('created_at',{ascending:true}).limit(100);
 if(error){$('commentsList').innerHTML='<p class="comments-empty">Не удалось загрузить комментарии: '+safe(error.message)+'</p>';return}
 const rows=data||[];
 $('commentsCount').textContent=rows.length+' комментариев';
 $('commentsList').innerHTML=rows.length?rows.map(x=>{
  const likes=x.comment_reactions||[],mine=likes.some(v=>v.user_id===user?.id);
  return '<article class="comment-item"><div class="comment-avatar">'+safe((x.profiles?.display_name||x.profiles?.username||'P').slice(0,1).toUpperCase())+'</div><div class="comment-body"><div class="comment-meta"><b>@'+safe(x.profiles?.username||'user')+'</b><time>'+new Date(x.created_at).toLocaleString()+'</time></div><p>'+safe(x.body)+'</p></div><button class="comment-like '+(mine?'liked':'')+'" type="button" data-comment-like="'+x.id+'" data-liked="'+(mine?'1':'0')+'" aria-label="Нравится комментарий">♥ <span>'+likes.length+'</span></button></article>';
 }).join(''):'<p class="comments-empty">Пока комментариев нет.</p>';
}
async function openComments(postId){
 if(!user)return toast('Войди в PIXY, чтобы комментировать.');
 activeCommentsPost=postId;
 const d=$('commentsDrawer');d.classList.remove('hidden');d.setAttribute('aria-hidden','false');
 requestAnimationFrame(()=>d.classList.add('open'));
 $('commentInput').value='';
 await renderComments();
 setTimeout(()=>$('commentInput').focus({preventScroll:true}),180);
}
function closeComments(){
 const d=$('commentsDrawer');d.classList.remove('open');d.setAttribute('aria-hidden','true');
 setTimeout(()=>{if(!d.classList.contains('open'))d.classList.add('hidden')},260);
 activeCommentsPost=null;
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-comments-close]'))closeComments();
 const like=e.target.closest('[data-comment-like]');
 if(like){
  if(!user)return toast('Войди, чтобы лайкать комментарии.');
  const commentId=like.dataset.commentLike,wasLiked=like.dataset.liked==='1';
  (async()=>{
   const result=wasLiked?await sb.from('comment_reactions').delete().eq('comment_id',commentId).eq('user_id',user.id):await sb.from('comment_reactions').insert({comment_id:commentId,user_id:user.id});
   if(result.error)return toast(result.error.message);
   await renderComments();
  })();
 }
});
$('commentForm').onsubmit=async e=>{
 e.preventDefault();const body=$('commentInput').value.trim();
 if(!body||!activeCommentsPost)return;
 const submit=$('commentForm').querySelector('button');submit.disabled=true;
 const {error}=await sb.from('comments').insert({post_id:activeCommentsPost,author_id:user.id,body:body.slice(0,1000)});
 if(error)toast('Комментарий не отправлен: '+error.message);
 else{$('commentInput').value='';await renderComments();const count=document.querySelector('[data-post-card="'+activeCommentsPost+'"] [data-comment-count]');if(count)count.textContent=String(Number(count.textContent||0)+1)}
 submit.disabled=false;
};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeCommentsPost)closeComments()});
function syncCommentsKeyboard(){
 const vv=window.visualViewport;
 const inset=vv?Math.max(0,window.innerHeight-vv.height-vv.offsetTop):0;
 document.documentElement.style.setProperty('--comments-keyboard-inset',inset+'px');
}
if(window.visualViewport){window.visualViewport.addEventListener('resize',syncCommentsKeyboard);window.visualViewport.addEventListener('scroll',syncCommentsKeyboard)}
window.addEventListener('resize',syncCommentsKeyboard);

function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

$('feed').addEventListener('click',async e=>{
 const rb=e.target.closest('[data-react-post]');
 if(rb){
  if(!sb||!user)return toast('Войди в PIXY, чтобы реагировать.');
  const card=rb.closest('[data-post-card]');
  const selected=rb.classList.contains('is-reacted');
  const {error}=selected?await sb.from('reactions').delete().eq('post_id',rb.dataset.reactPost).eq('user_id',user.id):await sb.from('reactions').upsert({post_id:rb.dataset.reactPost,user_id:user.id,reaction:rb.dataset.reaction},{onConflict:'post_id,user_id'});
  if(error)return toast('Не удалось поставить реакцию: '+error.message);
  if(card){card.querySelectorAll('[data-react-post]').forEach(x=>x.classList.toggle('is-reacted',x===rb&&!selected));}
  toast(selected?'Реакция убрана':'Реакция добавлена');return;
 }
 const b=e.target.closest('[data-like]');
 if(b){
  if(!sb||!user)return toast('Войди в PIXY, чтобы ставить лайки.');
  const card=b.closest('[data-post-card]'),was=b.classList.contains('is-liked');
  const result=was?await sb.from('reactions').delete().eq('post_id',b.dataset.like).eq('user_id',user.id):await sb.from('reactions').upsert({post_id:b.dataset.like,user_id:user.id,reaction:'like'},{onConflict:'post_id,user_id'});
  if(result.error)return toast('Не удалось изменить лайк: '+result.error.message);
  b.classList.toggle('is-liked',!was);b.firstChild.textContent=was?'♡':'♥';
  const count=b.querySelector('[data-like-count]');if(count)count.textContent=String(Math.max(0,Number(count.textContent||0)+(was?-1:1)));
  return;
 }
 const c=e.target.closest('[data-comment]');
 if(c){openComments(c.dataset.comment);return}
});

let cameraStream=null,mediaRecorder=null,recordedChunks=[],recordTimer=null,recordCountdownTimer=null,recordStartedAt=0,cameraFacing='environment',captureMode='photo',cameraBusy=false;
let selectedMusicId='',pickerMusicId='',recordAudioContext=null,recordMusicElement=null,cameraZoomHardware=false,zoomCanvasStream=null,zoomRenderFrame=0;
function stopRecordingAudio(){
 if(recordMusicElement){try{recordMusicElement.pause();recordMusicElement.currentTime=0}catch(_){}recordMusicElement=null}
 if(recordAudioContext){const ctx=recordAudioContext;recordAudioContext=null;try{ctx.close()}catch(_){}}
}
function stopCamera(){
 stopZoomRender();
 if(recordTimer){clearTimeout(recordTimer);recordTimer=null}
 if(mediaRecorder?.state==='recording'){try{mediaRecorder.stop()}catch(_){}}
 stopRecordingAudio();
 if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}
 const p=$('cameraPreview');if(p)p.srcObject=null;
}

let cameraMask='none',lastFxFrameAt=0;
let faceLandmarker=null,faceLandmarkerLoading=null,faceLandmarks=null,lastFaceDetectAt=0,cameraStartPromise=null;
async function loadFaceLandmarker(){
 if(faceLandmarker||faceLandmarkerLoading)return faceLandmarkerLoading;
 faceLandmarkerLoading=(async()=>{
  try{
   const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
   const files=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
   const options={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1};
   try{faceLandmarker=await vision.FaceLandmarker.createFromOptions(files,options)}
   catch(_){options.baseOptions.delegate='CPU';faceLandmarker=await vision.FaceLandmarker.createFromOptions(files,options)}
   return faceLandmarker;
  }catch(err){console.warn('PIXY face tracking unavailable:',err);return null}
 })();
 return faceLandmarkerLoading;
}
function setupCameraZoom(){
 const input=$('cameraZoom'),track=cameraStream?.getVideoTracks?.()[0];if(!input||!track)return;
 try{
  const z=track.getCapabilities?.().zoom;
  if(z){cameraZoomHardware=true;input.min=String(z.min??1);input.max=String(Math.min(z.max??4,8));input.step=String(z.step??0.1);const v=track.getSettings?.().zoom??z.min??1;input.value=String(Math.min(Number(input.max),Math.max(Number(input.min),v)))}
  else{cameraZoomHardware=false;input.min='1';input.max='4';input.step='0.1';input.value='1'}
  updateZoomControl();
 }catch(err){cameraZoomHardware=false;input.min='1';input.max='4';input.step='0.1';input.value='1';updateZoomControl();console.warn('PIXY zoom:',err)}
}
function updateZoomControl(){
 const input=$('cameraZoom'),value=Number(input?.value)||1,min=Number(input?.min)||1,max=Number(input?.max)||4,ratio=max===min?0:(value-min)/(max-min);
 $('cameraZoomValue').textContent=value.toFixed(1)+'×';
 $('cameraZoomFill').style.width=(ratio*100)+'%';
 $('cameraZoomScrub').setAttribute('aria-valuenow',value.toFixed(1));
}
async function applyCameraZoom(value){
 const input=$('cameraZoom'),track=cameraStream?.getVideoTracks?.()[0];if(!input)return;
 const min=Number(input.min)||1,max=Number(input.max)||4,v=Math.min(max,Math.max(min,Number(value)||1));
 input.value=String(v);updateZoomControl();
 if(track&&cameraZoomHardware){try{await track.applyConstraints({advanced:[{zoom:v}]})}catch(err){console.warn(err);toast('Не удалось изменить аппаратный зум.')}}
}
const zoomScrub=$('cameraZoomScrub');
function setZoomFromPointer(e){
 const r=zoomScrub.getBoundingClientRect(),ratio=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),min=Number($('cameraZoom').min)||1,max=Number($('cameraZoom').max)||4;
 applyCameraZoom(min+ratio*(max-min));
}
zoomScrub?.addEventListener('pointerdown',e=>{e.preventDefault();zoomScrub.setPointerCapture?.(e.pointerId);setZoomFromPointer(e)});
zoomScrub?.addEventListener('pointermove',e=>{if(e.buttons||e.pressure>0)setZoomFromPointer(e)});
zoomScrub?.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();applyCameraZoom((Number($('cameraZoom').value)||1)+(e.key==='ArrowRight'?.2:-.2))});
let pinchStartDistance=0,pinchStartZoom=1,lastPinchUpdate=0;
const cameraGesture=$('cameraStage');
function touchDistance(touches){const dx=touches[0].clientX-touches[1].clientX,dy=touches[0].clientY-touches[1].clientY;return Math.hypot(dx,dy)}
cameraGesture?.addEventListener('touchstart',e=>{if(e.touches.length===2){pinchStartDistance=touchDistance(e.touches);pinchStartZoom=Number($('cameraZoom')?.value)||1;lastPinchUpdate=0}},{passive:true});
cameraGesture?.addEventListener('touchmove',e=>{if(e.touches.length!==2||!pinchStartDistance)return;e.preventDefault();const distance=touchDistance(e.touches),factor=distance/pinchStartDistance;if(Math.abs(distance-pinchStartDistance)<2)return;const next=pinchStartZoom*factor;const now=performance.now();if(now-lastPinchUpdate>12){lastPinchUpdate=now;applyCameraZoom(next)}},{passive:false});
cameraGesture?.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStartDistance=0},{passive:true});
cameraGesture?.addEventListener('touchcancel',()=>{pinchStartDistance=0},{passive:true});
function setCameraMask(mask){
 cameraMask=['none','fat','thin','twist','eyes'].includes(mask)?mask:'none';
 document.querySelectorAll('[data-mask]').forEach(b=>b.classList.toggle('active',b.dataset.mask===cameraMask));
 const labels={none:'Без маски',fat:'Пухлое лицо',thin:'Худое лицо',twist:'Кривое лицо',eyes:'Большие глаза'};
 $('cameraHint').textContent='Маска: '+labels[cameraMask];
}
$('cameraMaskPicker')?.addEventListener('click',e=>{const b=e.target.closest('[data-mask]');if(b)setCameraMask(b.dataset.mask)});
let maskSwipeStartX=0;
$('cameraMaskPicker')?.addEventListener('pointerdown',e=>{maskSwipeStartX=e.clientX});
$('cameraMaskPicker')?.addEventListener('pointerup',e=>{const dx=e.clientX-maskSwipeStartX;if(Math.abs(dx)<35)return;const masks=['none','fat','thin','twist','eyes'],i=masks.indexOf(cameraMask);setCameraMask(masks[Math.max(0,Math.min(masks.length-1,i+(dx<0?1:-1)))])});
function startCameraFxRender(){
 const video=$('cameraPreview'),canvas=$('cameraFxCanvas');if(!video?.videoWidth||!canvas)return;
 const scale=Math.min(1,720/video.videoWidth,720/video.videoHeight),w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
 canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
 if(zoomCanvasStream)zoomCanvasStream.getTracks().forEach(t=>t.stop());
 zoomCanvasStream=canvas.captureStream(30);lastFxFrameAt=0;
 const draw=now=>{
  if(!cameraStream||!zoomCanvasStream)return;
  if(now-lastFxFrameAt>=30&&video.readyState>=2){
   lastFxFrameAt=now;
   if(cameraMask==='eyes'&&faceLandmarker&&now-lastFaceDetectAt>90){
    lastFaceDetectAt=now;
    try{const result=faceLandmarker.detectForVideo(video,now);faceLandmarks=result.faceLandmarks?.[0]||null}catch(_){faceLandmarks=null}
   }
   const z=cameraZoomHardware?1:Math.max(1,Number($('cameraZoom').value)||1),sw=video.videoWidth/z,sh=video.videoHeight/z;
   ctx.drawImage(video,(video.videoWidth-sw)/2,(video.videoHeight-sh)/2,sw,sh,0,0,w,h);
   let trackedEyes=null,trackedEyeRadius=w*.2;
   if(cameraMask==='eyes'){
    const cropX=(video.videoWidth-sw)/2,cropY=(video.videoHeight-sh)/2;
    if(faceLandmarks){
     const center=ids=>ids.reduce((a,id)=>({x:a.x+faceLandmarks[id].x/ids.length,y:a.y+faceLandmarks[id].y/ids.length}),{x:0,y:0});
     trackedEyes=[center([33,133,159,145]),center([362,263,386,374])].map(p=>({x:(p.x*video.videoWidth-cropX)/sw*w,y:(p.y*video.videoHeight-cropY)/sh*h}));
     trackedEyeRadius=Math.hypot(trackedEyes[1].x-trackedEyes[0].x,trackedEyes[1].y-trackedEyes[0].y);
    }else trackedEyes=[{x:w*.405,y:h*.405},{x:w*.595,y:h*.405}];
   }
   if(cameraMask!=='none'){
    const image=ctx.getImageData(0,0,w,h),src=new Uint8ClampedArray(image.data),dst=image.data;
    const cx=w*.5,cy=h*.47,rx=w*.235,ry=h*.32;
    const x0=Math.max(0,Math.floor(cx-rx)),x1=Math.min(w,Math.ceil(cx+rx)),y0=Math.max(0,Math.floor(cy-ry)),y1=Math.min(h,Math.ceil(cy+ry));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
     const dx=(x-cx)/rx,dy=(y-cy)/ry,r=Math.sqrt(dx*dx+dy*dy);if(r>1)continue;
     let sx=x,sy=y;
     if(cameraMask==='fat'||cameraMask==='thin'){
      const k=cameraMask==='fat'?.78:1.22,f=1+(k-1)*(1-r*r);
      sx=cx+dx*f*rx;sy=cy+dy*f*ry;
     }else if(cameraMask==='twist'){
      sx=x+Math.sin(dy*9)*18*(1-r);sy=y+Math.sin(dx*7)*13*(1-r);
     }else if(cameraMask==='eyes'){
      for(const eye of trackedEyes||[]){
       const er=Math.max(w*.045,trackedEyeRadius*.31),eyr=er*.78;
       const dxEye=(x-eye.x)/er,dyEye=(y-eye.y)/eyr,ed=Math.sqrt(dxEye*dxEye+dyEye*dyEye);
       if(ed<1){const falloff=(1-ed*ed)*(1-ed*ed),bulge=1-.76*falloff;sx=eye.x+(x-eye.x)*bulge;sy=eye.y+(y-eye.y)*bulge;break}
      }
     }
     const ix=Math.max(0,Math.min(w-1,Math.round(sx))),iy=Math.max(0,Math.min(h-1,Math.round(sy))),a=(y*w+x)*4,b=(iy*w+ix)*4;
     dst[a]=src[b];dst[a+1]=src[b+1];dst[a+2]=src[b+2];dst[a+3]=src[b+3];
    }
    ctx.putImageData(image,0,0);
    
   }
  }
  zoomRenderFrame=requestAnimationFrame(draw);
 };
 zoomRenderFrame=requestAnimationFrame(draw);
}
function makeZoomedVideoTrack(){
 const original=cameraStream?.getVideoTracks?.()[0];if(!original)return null;
 if(!zoomCanvasStream)startCameraFxRender();
 return zoomCanvasStream?.getVideoTracks?.()[0]||original;
}
function stopZoomRender(){
 if(zoomRenderFrame)cancelAnimationFrame(zoomRenderFrame);zoomRenderFrame=0;
 if(zoomCanvasStream){zoomCanvasStream.getTracks().forEach(t=>t.stop());zoomCanvasStream=null}
}

async function startCamera(){
 if(cameraStartPromise)return cameraStartPromise;
 cameraStartPromise=(async()=>{
  stopCamera();
  try{
   cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:cameraFacing}},audio:true});
   const v=$('cameraPreview');v.srcObject=cameraStream;
   await new Promise((resolve,reject)=>{if(v.readyState>=2&&v.videoWidth)return resolve();v.onloadedmetadata=resolve;v.onerror=reject});
   await v.play();setupCameraZoom();loadFaceLandmarker();startCameraFxRender();$('cameraHint').textContent='Камера включена';
  }catch(err){stopCamera();$('cameraHint').textContent='Камера недоступна';toast(err.message||'Разреши доступ к камере и микрофону.')}
 })();
 try{return await cameraStartPromise}finally{cameraStartPromise=null}
}
function setCaptureMode(m){
 captureMode=m;$('postMode').value=m==='video'?'video':'single';$('captureShutter').dataset.mode=m;
 $('capturePhotoMode').classList.toggle('active',m==='photo');$('captureVideoMode').classList.toggle('active',m==='video');
 $('cameraHint').textContent=m==='video'?'Видео · до 20 секунд':'Фото';
}
function openComposer(){
 if(!user)return toast('Сначала войди в PIXY.');
 $('composerModal').classList.remove('hidden');$('composerModal').classList.add('camera-opening');
 $('postFile').value='';selectedFiles=[];selectedFile=null;reviewStoryMode=false;reviewFilter='none';
 $('filePreview').innerHTML='';$('cameraReviewScreen').classList.add('hidden');$('publishDetailsScreen').classList.add('hidden');$('reviewSoundPanel').classList.add('hidden');
 $('cameraPublishPanel').classList.add('hidden');$('postCaption').value='';$('postMusic').value=selectedMusicId||'';
 $('postForm').querySelector('button[type=submit]').disabled=false;$('postForm').querySelector('button[type=submit]').textContent='Опубликовать';
 $('originalVolume').value='100';$('musicVolume').value='70';$('originalVolumeValue').textContent='100%';$('musicVolumeValue').textContent='70%';
 setCaptureMode('photo');loadMusicLibrary();startCamera();
}
$('openComposer').onclick=$('bannerCreate').onclick=()=>openComposer();$('mobileCreateBtn').onclick=()=>openComposer();$('videoCreate').onclick=()=>{openComposer();setCaptureMode('video')};
$('capturePhotoMode').onclick=()=>setCaptureMode('photo');$('captureVideoMode').onclick=()=>setCaptureMode('video');
async function flipCamera(){cameraFacing=cameraFacing==='environment'?'user':'environment';await startCamera()}
$('cameraFlipBtn').onclick=flipCamera;$('cameraFlipBottom').onclick=flipCamera;
$('galleryPickBtn').onclick=()=>{stopCamera();$('postFile').multiple=true;$('postFile').accept='image/*,video/mp4,video/webm,video/quicktime';$('postFile').click()};
let reviewObjectUrls=[];
let reviewStoryMode=false;
let reviewFilter='none';
function syncReviewAudio(){
 const video=$('filePreview').querySelector('video'),music=$('reviewMusicAudio');
 const original=Number($('originalVolume')?.value??100)/100;
 if(video){video.volume=original}
 if(music)music.volume=Number($('musicVolume')?.value??70)/100;
 const track=availableMusic.find(t=>t.id===selectedMusicId);
 $('reviewMusicName').textContent=track?track.title:'Музыка не выбрана';
}
function setComposerFiles(files,m){
 selectedFiles=files;selectedFile=files[0]||null;$('postMode').value=m;
 const p=$('filePreview');p.innerHTML='';reviewObjectUrls.forEach(URL.revokeObjectURL);reviewObjectUrls=[];
 files.forEach((f,i)=>{
  const u=URL.createObjectURL(f);reviewObjectUrls.push(u);
  const el=document.createElement(f.type.startsWith('video/')?'video':'img');el.src=u;el.dataset.reviewIndex=String(i);if(el.tagName==='IMG'&&i===0)el.classList.add('review-active');
  if(el.tagName==='VIDEO'){el.autoplay=true;el.loop=true;el.muted=true;el.playsInline=true;el.preload='auto';el.addEventListener('click',()=>{if(el.paused)el.play().catch(()=>{});else el.pause()})}
  p.append(el);
 });
 const audio=document.createElement('audio');audio.id='reviewMusicAudio';audio.loop=true;audio.preload='auto';p.append(audio);
 const track=availableMusic.find(t=>t.id===selectedMusicId);if(track)audio.src=track.audio_url;
 $('reviewKindLabel').textContent=m==='carousel'?'ФОТО · '+files.length:m==='video'?'ВИДЕО · ПОВТОР':'ФОТО';
 $('cameraReviewScreen').classList.remove('hidden');$('cameraReviewScreen').classList.add('review-enter');
 $('publishDetailsScreen').classList.add('hidden');$('cameraPublishPanel').classList.add('hidden');
 $('cameraHint').textContent=m==='carousel'?'Фото готовы':m==='video'?'Видео готово к просмотру':'Фото готово';
 const vid=p.querySelector('video');if(vid)vid.play().catch(()=>{});
 syncReviewAudio();
}
function readVideoDuration(f){return new Promise(resolve=>{const u=URL.createObjectURL(f),v=document.createElement('video');let done=false;const finish=d=>{if(done)return;done=true;URL.revokeObjectURL(u);v.removeAttribute('src');v.load();resolve(d)};v.preload='metadata';v.onloadedmetadata=()=>finish(Number.isFinite(v.duration)?v.duration:null);v.onerror=()=>finish(null);v.src=u;v.load();setTimeout(()=>finish(null),5000)})}
$('postFile').onchange=async e=>{
 const fs=Array.from(e.target.files||[]);if(!fs.length)return;
 const vid=fs.length===1&&fs[0].type.startsWith('video/'),imgs=fs.every(f=>f.type.startsWith('image/'));
 if(!vid&&!imgs){toast('Выбери одно видео или фотографии.');e.target.value='';return}
 if(imgs&&fs.length>15){toast('Можно выбрать до 15 фото.');e.target.value='';return}
 if(fs.some(f=>f.size>50*1024*1024)){toast('Файл больше 50 МБ.');e.target.value='';return}
 if(vid){const d=await readVideoDuration(fs[0]);if(d!==null&&d>20.05){toast('Видео должно быть не длиннее 20 секунд.');e.target.value='';return}setComposerFiles(fs,'video')}
 else setComposerFiles(fs,fs.length>1?'carousel':'single');
};

$('postForm').addEventListener('submit',async e=>{
 e.preventDefault();
 e.stopPropagation();
 if(!sb||!user)return toast('Сначала войди в PIXY.');
 const form=$('postForm'),button=form.querySelector('button[type="submit"]');
 const files=selectedFiles.slice();
 if(!files.length)return toast('Сначала запиши видео или выбери файл.');
 if(files.some(file=>file.size>50*1024*1024))return toast('Файл больше 50 МБ. Выбери файл поменьше.');
 button.disabled=true;
 const oldText=button.textContent;
 button.textContent='Публикую…';
 const status=$('publishStatus');if(status){status.textContent='Подготавливаю публикацию…';status.classList.remove('hidden')}
 try{
  const uploaded=[];
  for(let i=0;i<files.length;i++){
   const file=files[i];
   if(status)status.textContent='Загружаю файл '+(i+1)+' из '+files.length+'…';
   const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin';
   const path=user.id+'/posts/'+crypto.randomUUID()+'.'+ext;
   const {error:uploadError}=await sb.storage.from('pixy-media').upload(path,file,{contentType:file.type||'application/octet-stream'});
   if(uploadError)throw uploadError;
   const url=sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl;
   uploaded.push({url,type:file.type.startsWith('video/')?'video':'image'});
  }
  const isVideo=files.length===1&&files[0].type.startsWith('video/');
  const isRecordedVideo=isVideo&&files[0].name==='pixy-video.webm';
  const track=availableMusic.find(t=>t.id===selectedMusicId)||null;
  const payload={
   author_id:user.id,
   caption:$('postCaption').value.trim(),
   media_url:uploaded[0].url,
   media_type:isVideo?'video':'image',
   media_items:isVideo?[]:uploaded,
   music_url:track?track.audio_url:null,
   music_title:track?.title||null,
   visibility:document.querySelector('input[name="postAudience"]:checked')?.value||'public'
  };
  if(status)status.textContent=reviewStoryMode?'Сохраняю историю…':'Сохраняю публикацию…';
  if(reviewStoryMode){
   const {error:storyError}=await sb.from('stories').insert({author_id:user.id,media_url:uploaded[0].url,media_type:isVideo?'video':'image'});
   if(storyError)throw storyError;
  }else{
   const {error:insertError}=await sb.from('posts').insert(payload);
   if(insertError)throw insertError;
  }
  if(status)status.textContent='Опубликовано!';
  const publishedAsStory=reviewStoryMode;
  stopCamera();
  const reviewMusic=$('reviewMusicAudio');if(reviewMusic)reviewMusic.pause();
  $('composerModal').classList.add('hidden');
  $('soundPicker').classList.add('hidden');
  $('cameraPublishPanel').classList.add('hidden');$('cameraReviewScreen').classList.add('hidden');$('publishDetailsScreen').classList.add('hidden');
  $('postCaption').value='';$('postFile').value='';
  selectedFiles=[];selectedFile=null;reviewStoryMode=false;
  toast(publishedAsStory?'История опубликована на 24 часа':'Публикация добавлена в PIXY!');
  await Promise.all([loadFeed(),loadProfilePosts(),loadStories()]);
 }catch(err){
  console.error('PIXY publish error:',err);
  if(status)status.textContent='Ошибка публикации: '+(err?.message||'неизвестная ошибка');
  toast('Не удалось опубликовать: '+(err?.message||'ошибка загрузки'));
 }finally{
  button.disabled=false;
  button.textContent=oldText;
 }
});
async function makeRecordingStream(){
 // Исходный микрофон записывается отдельно; музыка накладывается после записи
 // отдельной дорожкой, чтобы громкость двух источников можно было менять раздельно.
 const zoomTrack=makeZoomedVideoTrack();
 return new MediaStream([zoomTrack,...cameraStream.getAudioTracks()]);
}
function stopVideoRecording(auto=false){
 if(mediaRecorder?.state!=='recording')return;
 playPixyBeep('record-stop');
 if(recordTimer){clearTimeout(recordTimer);recordTimer=null}
 if(recordCountdownTimer){clearInterval(recordCountdownTimer);recordCountdownTimer=null}
 $('cameraHint').textContent=auto?'20 секунд прошло · сохраняю видео…':'Сохраняю видео и музыку…';
 try{mediaRecorder.stop()}catch(err){console.error('PIXY recorder stop:',err)}
}
$('captureShutter').onclick=async()=>{
 if(cameraBusy)return;cameraBusy=true;
 try{
  if(captureMode==='photo'){
   const v=$('cameraPreview');if(!cameraStream||!v.videoWidth)await startCamera();if(!v.videoWidth)throw Error('Камера ещё не готова.');
   const c=$('cameraCanvas'),fx=$('cameraFxCanvas');c.width=fx?.width||v.videoWidth;c.height=fx?.height||v.videoHeight;c.getContext('2d').drawImage(fx?.width?fx:v,0,0,c.width,c.height);
   const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.93));if(!b)throw Error('Не удалось сделать фото.');
   setComposerFiles([new File([b],'pixy-photo.jpg',{type:'image/jpeg'})],'single');
   $('captureShutter').classList.add('photo-flash');setTimeout(()=>$('captureShutter').classList.remove('photo-flash'),180);
  }else if(mediaRecorder?.state==='recording'){
   stopVideoRecording(false);
  }else{
   if(!cameraStream)await startCamera();if(!cameraStream)throw Error('Не удалось включить камеру.');
   const recordStream=await makeRecordingStream();
   const mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
   mediaRecorder=new MediaRecorder(recordStream,{...(mt?{mimeType:mt}:{}),videoBitsPerSecond:2500000,audioBitsPerSecond:128000});
   recordedChunks=[];
   mediaRecorder.ondataavailable=e=>{if(e.data?.size)recordedChunks.push(e.data)};
   mediaRecorder.onstop=()=>{
    if(recordTimer){clearTimeout(recordTimer);recordTimer=null}
    if(recordCountdownTimer){clearInterval(recordCountdownTimer);recordCountdownTimer=null}
    stopRecordingAudio();stopZoomRender();
    const rec=mediaRecorder;
    const blob=new Blob(recordedChunks,{type:rec?.mimeType||'video/webm'});
    if(blob.size>50*1024*1024){
     $('cameraHint').textContent='Видео слишком большое';
     toast('Видео получилось больше 50 МБ. Попробуй записать ещё раз.');
    }else if(blob.size){
     setComposerFiles([new File([blob],'pixy-video.webm',{type:blob.type||'video/webm'})],'video');
     $('cameraHint').textContent='Видео готово к публикации';
    }else $('cameraHint').textContent='Не удалось сохранить запись. Попробуй ещё раз.';
    $('captureShutter').classList.remove('recording');
   };
   mediaRecorder.start(250);
   playPixyBeep('record-start');
   recordStartedAt=Date.now();
   $('captureShutter').classList.add('recording');
   $('cameraHint').textContent=selectedMusicId?'Идёт запись · 20 секунд':'Идёт запись · 20 секунд';
   recordCountdownTimer=setInterval(()=>{
    if(mediaRecorder?.state!=='recording')return;
    const left=Math.max(0,20-Math.floor((Date.now()-recordStartedAt)/1000));
    $('cameraHint').textContent='Идёт запись · '+left+' сек.';
   },250);
   recordTimer=setTimeout(()=>stopVideoRecording(true),20000);
  }
 }catch(err){toast(err.message||'Ошибка камеры.')}finally{cameraBusy=false}
};
async function loadMusicLibrary(){
 if(!sb)return;
 const {data,error}=await sb.from('music_tracks').select('id,title,artist,audio_url').eq('active',true).order('created_at',{ascending:false});
 if(error){console.warn(error);$('soundTrackList').innerHTML='<p class="sound-empty">Не удалось загрузить музыку.</p>';return}
 availableMusic=data||[];
 const s=$('postMusic'),old=selectedMusicId;s.innerHTML='<option value="">Без музыки</option>'+availableMusic.map(t=>'<option value="'+t.id+'">'+safe(t.title)+' — '+safe(t.artist)+'</option>').join('');
 if(availableMusic.some(t=>t.id===old))s.value=old;else{selectedMusicId='';s.value=''}
 const chosen=availableMusic.find(t=>t.id===selectedMusicId);$('cameraSoundLabel').textContent=chosen?chosen.title:'Добавить звук';$('cameraSoundPill').classList.toggle('has-track',!!chosen);
 renderSoundTracks();
}
function renderSoundTracks(){
 $('soundUseBtn').disabled=!pickerMusicId;
 const list=$('soundTrackList');
 if(!availableMusic.length){list.innerHTML='<p class="sound-empty">Пока нет доступных треков.</p>';return}
 list.innerHTML=availableMusic.map(t=>'<button type="button" class="sound-track '+(t.id===pickerMusicId?'selected':'')+'" data-pick-track="'+safe(t.id)+'"><span class="sound-track-icon">♫</span><span><b>'+safe(t.title)+'</b><small>'+safe(t.artist||'PIXY Music')+'</small></span><i>'+(t.id===pickerMusicId?'✓':'▶')+'</i></button>').join('');
}
$('cameraSoundPill').onclick=()=>{$('soundPicker').classList.remove('hidden');pickerMusicId=selectedMusicId;renderSoundTracks()};
$('soundTrackList').onclick=e=>{
 const b=e.target.closest('[data-pick-track]');if(!b)return;
 pickerMusicId=b.dataset.pickTrack;renderSoundTracks();
 const track=availableMusic.find(t=>t.id===pickerMusicId);if(!track)return;
 const preview=$('musicPickerPreview');if(preview){preview.pause();preview.src=track.audio_url;preview.currentTime=0;preview.play().catch(()=>{})}
};
$('soundUseBtn').onclick=()=>{
 if(!pickerMusicId)return toast('Выбери трек.');
 selectedMusicId=pickerMusicId;$('postMusic').value=selectedMusicId;
 const t=availableMusic.find(x=>x.id===selectedMusicId);
 $('cameraSoundLabel').textContent=t?t.title:'Добавить звук';
 $('cameraSoundPill').classList.toggle('has-track',!!t);
 const preview=$('musicPickerPreview');if(preview){preview.pause();preview.removeAttribute('src')}
 $('soundPicker').classList.add('hidden');
 syncReviewAudio();
 const reviewMusic=$('reviewMusicAudio');if(reviewMusic&&t){reviewMusic.play().catch(()=>{})}
};
$('reviewBackBtn').onclick=()=>{
 const music=$('reviewMusicAudio');if(music)music.pause();
 $('cameraReviewScreen').classList.add('hidden');selectedFiles=[];selectedFile=null;
 if(!cameraStream)startCamera();
};
$('reviewNextBtn').onclick=()=>{
 $('cameraReviewScreen').classList.add('review-exit');
 setTimeout(()=>{$('cameraReviewScreen').classList.add('hidden');$('cameraReviewScreen').classList.remove('review-exit');$('publishDetailsScreen').classList.remove('hidden');$('publishDetailsScreen').classList.add('review-enter')},150);
};
$('publishBackBtn').onclick=()=>{
 $('publishDetailsScreen').classList.add('hidden');$('cameraReviewScreen').classList.remove('hidden');$('cameraReviewScreen').classList.add('review-enter');
};
$('reviewSoundBtn').onclick=()=>{
 $('reviewSoundPanel').classList.toggle('hidden');
 const video=$('filePreview').querySelector('video'),music=$('reviewMusicAudio');
 if(video){video.muted=Number($('originalVolume').value)===0;video.volume=Number($('originalVolume').value)/100;video.play().catch(()=>{})}
 if(music&&selectedMusicId){music.volume=Number($('musicVolume').value)/100;music.play().catch(()=>{})}
};
$('reviewSoundClose').onclick=()=>$('reviewSoundPanel').classList.add('hidden');
$('originalVolume').oninput=e=>{$('originalVolumeValue').textContent=e.target.value+'%';syncReviewAudio()};
$('musicVolume').oninput=e=>{$('musicVolumeValue').textContent=e.target.value+'%';syncReviewAudio()};
$('reviewChooseMusic').onclick=()=>{$('soundPicker').classList.remove('hidden');pickerMusicId=selectedMusicId;renderSoundTracks()};
$('publishAsStory').onclick=()=>{
 reviewStoryMode=!reviewStoryMode;
 $('publishAsStory').classList.toggle('selected',reviewStoryMode);
 $('publishAsStory').querySelector('span').textContent=reviewStoryMode?'Выбрана история · 24 часа':'24 часа';
 $('postForm').querySelector('button[type="submit"]').textContent=reviewStoryMode?'Опубликовать историю':'Опубликовать';
};
$('filePreview').addEventListener('pointerdown',e=>{if(selectedFiles.length<2)return;window.__pixyReviewStartX=e.clientX});
$('filePreview').addEventListener('pointerup',e=>{
 if(selectedFiles.length<2||!Number.isFinite(window.__pixyReviewStartX))return;
 const dx=e.clientX-window.__pixyReviewStartX;window.__pixyReviewStartX=null;if(Math.abs(dx)<35)return;
 let current=Number($('filePreview').dataset.index||0),next=Math.max(0,Math.min(selectedFiles.length-1,current+(dx<0?1:-1)));
 if(next===current)return;
 $('filePreview').dataset.index=String(next);
 [...$('filePreview').querySelectorAll('img')].forEach((im,i)=>{im.classList.toggle('review-active',i===next);im.classList.toggle('review-before',i<next)});
 $('reviewKindLabel').textContent='ФОТО · '+(next+1)+' / '+selectedFiles.length;
});
$('filePreview').addEventListener('click',e=>{if(e.target.closest('video'))return});
document.querySelectorAll('[data-video-filter]').forEach(b=>b.onclick=()=>{
 reviewFilter=b.dataset.videoFilter;document.querySelectorAll('[data-video-filter]').forEach(x=>x.classList.toggle('active',x===b));
 const filters={none:'none',warm:'saturate(1.25) sepia(.22)',mono:'grayscale(1)',dream:'saturate(.82) brightness(1.12) contrast(.9)'};
 $('filePreview').style.filter=filters[reviewFilter]||'none';
});
$('soundRemoveBtn').onclick=()=>{
 selectedMusicId='';pickerMusicId='';$('postMusic').value='';$('cameraSoundLabel').textContent='Добавить звук';$('cameraSoundPill').classList.remove('has-track');
 const preview=$('musicPickerPreview');if(preview){preview.pause();preview.removeAttribute('src')}
 $('soundPicker').classList.add('hidden');
 syncReviewAudio();const reviewMusic=$('reviewMusicAudio');if(reviewMusic){reviewMusic.pause();reviewMusic.removeAttribute('src')}
};
document.addEventListener('click',e=>{if(e.target.closest('[data-sound-close]')){$('soundPicker').classList.add('hidden');const preview=$('musicPickerPreview');if(preview){preview.pause();preview.removeAttribute('src')}}});
$('feed').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-carousel]');if(b){b.dataset.pointerStart=String(e.clientX);try{b.setPointerCapture(e.pointerId)}catch(_){}}});
$('feed').addEventListener('pointerup',e=>{
 const b=e.target.closest('[data-carousel]');if(!b)return;
 const x=Number(b.dataset.pointerStart);delete b.dataset.pointerStart;
 if(!Number.isFinite(x))return;const dx=e.clientX-x;if(Math.abs(dx)<38)return;
 let items=[];try{items=JSON.parse(b.dataset.items||'[]')}catch(_){}if(!items.length)return;
 const index=Number(b.dataset.index||0),next=(index+(dx<0?1:-1)+items.length)%items.length;
 const im=b.querySelector('[data-carousel-image]');if(!im)return;
 b.classList.add('is-turning');
 setTimeout(()=>{
  b.dataset.index=String(next);im.src=items[next].url;im.alt='Фото '+(next+1)+' из '+items.length;
  b.classList.remove('is-turning');b.classList.remove('carousel-arrive');void im.offsetWidth;b.classList.add('carousel-arrive');
  setTimeout(()=>b.classList.remove('carousel-arrive'),320);
 },150);
 const count=b.querySelector('[data-carousel-count]');if(count)count.textContent=(next+1)+' / '+items.length;
 b.dataset.swiped='1';
});
$('feed').addEventListener('click',async e=>{const b=e.target.closest('[data-carousel]');if(!b)return;if(b.dataset.swiped==='1'){delete b.dataset.swiped;return}const a=b.parentElement.querySelector('[data-carousel-music]');if(!a)return;const overlay=b.querySelector('[data-carousel-toggle]');if(a.paused){try{await a.play();b.classList.add('music-playing');if(overlay)overlay.textContent='Нажмите, чтобы остановить'}catch(_){}}else{a.pause();b.classList.remove('music-playing');if(overlay)overlay.textContent='Нажмите, чтобы включить'}});
$('musicUploadBtn').onclick=async()=>{
 if(profile?.username!=='anpro777')return toast('Нет доступа.');
 const files=Array.from($('musicTrackFile').files||[]),customTitle=$('musicTrackTitle').value.trim();
 if(!files.length)return toast('Выбери один или несколько аудиофайлов.');
 if(files.some(f=>!f.type.startsWith('audio/')||f.size>50*1024*1024))return toast('Каждый файл должен быть аудио до 50 МБ.');
 const b=$('musicUploadBtn');b.disabled=true;b.textContent='Загружаю '+files.length+' трек(ов)…';
 try{
  for(const f of files){
   const title=(files.length===1&&customTitle?customTitle:f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').trim()).slice(0,80);
   const path=user.id+'/music/'+crypto.randomUUID()+'.'+f.name.split('.').pop().toLowerCase();
   const {error:upErr}=await sb.storage.from('pixy-media').upload(path,f,{contentType:f.type});if(upErr)throw upErr;
   const url=sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl,tmp=URL.createObjectURL(f);
   const duration=await new Promise(r=>{const a=new Audio();a.onloadedmetadata=()=>{URL.revokeObjectURL(tmp);r(Math.round(a.duration))};a.onerror=()=>{URL.revokeObjectURL(tmp);r(null)};a.src=tmp});
   const {error}=await sb.from('music_tracks').insert({title,artist:'PIXY Music',audio_url:url,storage_path:path,duration_seconds:duration,created_by:user.id});if(error)throw error;
  }
  $('musicTrackTitle').value='';$('musicTrackFile').value='';toast('Добавлено треков: '+files.length+'.');loadMusicLibrary();
 }catch(err){toast(err.message||'Не удалось загрузить')}
 finally{b.disabled=false;b.textContent='Добавить музыку'}
};

$('editProfile').onclick=()=>{if(!user)return toast('Войди, чтобы редактировать профиль.');$('editName').value=profile?.display_name||'';$('editBio').value=profile?.bio||'';$('profileModal').classList.remove('hidden')};
$('profileForm').onsubmit=async e=>{
 e.preventDefault();if(!sb||!user)return;
 const form=$('profileForm'),button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Сохраняю…';
 try{
  let avatar_url=profile?.avatar_url||null;const file=$('avatarFile').files[0];
  if(file){
   if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Аватар: только JPG, PNG или WebP.');
   if(file.size>5*1024*1024)throw new Error('Аватар должен быть не больше 5 МБ.');
   const path=user.id+'/avatar-'+Date.now()+'.'+file.name.split('.').pop().toLowerCase();
   const {error}=await sb.storage.from('pixy-media').upload(path,file,{upsert:true,contentType:file.type});if(error)throw error;
   avatar_url=sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl;
  }
  const {data,error}=await sb.from('profiles').update({display_name:$('editName').value.trim(),bio:$('editBio').value.trim(),avatar_url}).eq('id',user.id).select('*').single();
  if(error)throw error;
  profile=data;$('profileModal').classList.add('hidden');$('avatarFile').value='';showApp();toast('Профиль сохранён');
 }catch(err){toast('Не удалось сохранить профиль: '+(err.message||'ошибка'))}
 finally{button.disabled=false;button.textContent='Сохранить профиль'}
};
$('editCover').onclick=()=>nav('shop');
$('storyAdd').onclick=$('addStory').onclick=createStoryPicker;
$('userSearch').oninput=async e=>{const q=e.target.value.trim().replace(/^@/,'').toLowerCase(),box=$('searchResults');if(!q){box.innerHTML='<div class="hint">Начни вводить username, чтобы найти людей в PIXY.</div>';return}if(!sb){box.innerHTML='<div class="hint">Поиск включится после подключения Supabase.</div>';return}const {data,error}=await sb.from('profiles').select('id,username,display_name,avatar_url').ilike('username',q+'%').limit(12);if(error){box.textContent=error.message;return}box.innerHTML=data.length?data.map(p=>'<div class="search-person"><div class="avatar avatar-blue">'+safe((p.display_name||'P').slice(0,1))+'</div><div><b>'+safe(p.display_name)+'</b><small>@'+safe(p.username)+'</small></div><button data-follow="'+p.id+'">Подписаться</button><button data-send-gift="'+p.id+'">🎁</button></div>').join(''):'<div class="hint">Никого не нашли.</div>'};
$('searchResults').onclick=async e=>{const b=e.target.closest('[data-follow]');if(!b||!sb||!user)return;const {error}=await sb.from('follows').upsert({follower_id:user.id,following_id:b.dataset.follow},{onConflict:'follower_id,following_id'});toast(error?error.message:'Подписка оформлена');loadSocialStats()};
$('searchClear').onclick=()=>{$('userSearch').value='';$('searchResults').innerHTML='<div class="hint">Начни вводить username, чтобы найти людей в PIXY.</div>'};

$('searchResults').addEventListener('click',async e=>{
 const b=e.target.closest('[data-send-gift]');if(!b||!user)return;
 const {data:gifts,error}=await sb.from('gift_catalog').select('id,title,price_xion,emoji').order('sort_order');
 if(error)return toast(error.message);
 const choices=(gifts||[]).map(g=>g.id+' — '+g.emoji+' '+g.title+' ('+g.price_xion+' pts)').join('\\n');
 const key=prompt('Какой подарок отправить? Введи ID из списка:\\n'+choices);if(!key)return;
 const gift=(gifts||[]).find(g=>g.id===key.trim());if(!gift)return toast('Неизвестный подарок.');
 const {data,error:sendError}=await sb.rpc('send_virtual_gift',{recipient:b.dataset.sendGift,gift_key:gift.id});
 if(sendError)return toast(sendError.message);
 toast('Подарок отправлен! Остаток: '+data+' pts');loadWallet();
});


function storagePathFromPublicUrl(url){try{const marker='/storage/v1/object/public/pixy-media/';const p=new URL(url).pathname;const i=p.indexOf(marker);return i<0?null:decodeURIComponent(p.slice(i+marker.length))}catch(_){return null}}
async function deleteOwnPost(id){
 if(!sb||!user||!confirm('Удалить эту публикацию?'))return;
 try{
  const {data:p,error:r}=await sb.from('posts').select('id,author_id,media_url,media_items').eq('id',id).eq('author_id',user.id).maybeSingle();
  if(r)throw r;if(!p)throw new Error('Публикация не найдена или уже удалена.');
  const urls=[p.media_url,...(Array.isArray(p.media_items)?p.media_items.map(x=>x?.url).filter(Boolean):[])];
  const paths=[...new Set(urls.map(storagePathFromPublicUrl).filter(Boolean))];
  const {data:d,error:e}=await sb.from('posts').delete().eq('id',id).eq('author_id',user.id).select('id').maybeSingle();
  if(e)throw e;if(!d)throw new Error('Удаление не подтверждено базой данных.');
  let warn='';if(paths.length){const {error}=await sb.storage.from('pixy-media').remove(paths);if(error){console.warn(error);warn=' Файл в хранилище не удалось очистить.'}}
  toast('Публикация удалена.'+warn);await Promise.all([loadFeed(),loadProfilePosts(),loadVideos()]);
 }catch(err){console.error('PIXY delete:',err);toast('Не удалось удалить: '+(err?.message||'ошибка'))}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-delete-post]');if(b){e.preventDefault();e.stopPropagation();deleteOwnPost(b.dataset.deletePost)}});

async function loadProfilePosts(){
 if(!sb||!user)return;
 const ownerId=user.id;
 const {data,error}=await sb.from('posts').select('id,media_url,media_type').eq('author_id',ownerId).order('created_at',{ascending:false});
 if(user?.id!==ownerId)return;
 if(error){console.warn('PIXY profile posts:',error);return}
 const posts=data||[];
 $('postCount').textContent=posts.length;
 $('profileGrid').innerHTML=posts.length?posts.map(p=>'<div class="my-post" data-post-card="'+p.id+'">'+(p.media_type==='video'?'<video src="'+safe(p.media_url)+'" controls playsinline></video>':'<img src="'+safe(p.media_url)+'" alt="Моя публикация">')+'<button class="post-delete-btn" type="button" title="Удалить публикацию" aria-label="Удалить публикацию" data-delete-post="'+p.id+'">🗑</button></div>').join(''):'<div class="empty-hint">Твои публикации будут отображаться здесь.</div>';
}

const bgColors={aurora:['#38255d','#bb85f3'],sunset:['#64364f','#f3a17c'],ocean:['#173b55','#71c6dc'],candy:['#683b6c','#ee91ce'],forest:['#1d5146','#84d2ad'],cosmic:['#20214f','#9d9bff'],peach:['#794b3f','#ffc49d'],lavender:['#453d70','#c6b3ff'],neon:['#222044','#ff75b7'],silver:['#424252','#c9c9df']};
const giftEmoji={moon:'🌙',heart:'💜',planet:'🪐',teddy:'🧸',bloom:'🌸',music:'🎧',butterfly:'🦋',crystal:'💎',cat:'🐱',ribbon:'🎀',rocket:'🚀',crown:'👑',unicorn:'🦄',trophy:'🏆',stardust:'✨'};
async function loadWallet(){
 if(!sb||!user)return;
 const {data:bal,error}=await sb.rpc('claim_welcome_points');
 if(error){$('walletBalance').textContent='—';if($('sideWalletBalance'))$('sideWalletBalance').textContent='— pts';$('walletStatus').textContent='Баланс недоступен: '+error.message;return}
 $('walletBalance').textContent=bal;if($('sideWalletBalance'))$('sideWalletBalance').textContent=bal+' pts';if($('profileWalletBalance'))$('profileWalletBalance').textContent=bal+' pts';$('walletStatus').textContent='Внутренние баллы PIXY. Не криптовалюта и не деньги.';
 const {data:rows}=await sb.from('xion_ledger').select('amount,reason,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(12);
 $('walletHistory').innerHTML=(rows||[]).map(x=>'<div><span>'+safe(x.reason.replaceAll('_',' '))+'</span><b>'+(x.amount>0?'+':'')+x.amount+' pts</b></div>').join('');
 const {data:gifts}=await sb.from('gift_transfers').select('id,gift_id,sender_id,created_at').eq('recipient_id',user.id).order('created_at',{ascending:false}).limit(20);
 const senderIds=[...new Set((gifts||[]).map(g=>g.sender_id))];const {data:senders}=senderIds.length?await sb.from('profiles').select('id,username').in('id',senderIds):{data:[]};const senderMap=Object.fromEntries((senders||[]).map(p=>[p.id,p.username]));
 $('receivedGifts').innerHTML=(gifts||[]).map(g=>'<div><span>'+safe(giftEmoji[g.gift_id]||'🎁')+' '+safe(g.gift_id)+' от @'+safe(senderMap[g.sender_id]||'user')+'</span><small>'+new Date(g.created_at).toLocaleDateString()+'</small></div>').join('')||'<p>Подарков пока нет.</p>';
}
async function loadShop(){
 if(!sb)return;
 const [{data:bg,error:be},{data:gs,error:ge}]=await Promise.all([sb.from('profile_backgrounds').select('id,title,price_xion,sort_order').order('sort_order'),sb.from('gift_catalog').select('id,title,emoji,price_xion,sort_order').order('sort_order')]);
 if(be)toast(be.message);if(ge)toast(ge.message);
 $('backgroundShop').innerHTML=(bg||[]).map(x=>{const c=bgColors[x.id]||['#343047','#a78bfa'];return '<button class="shop-tile" data-background="'+safe(x.id)+'"><div class="swatch" style="background:linear-gradient(135deg,'+c[0]+','+c[1]+')"></div><small>'+safe(x.title)+'</small><b>'+(x.price_xion===0?'Бесплатно':x.price_xion+' pts')+'</b></button>'}).join('');
 $('giftShop').innerHTML=(gs||[]).map(g=>'<button type="button" class="gift-tile" data-buy-gift="'+safe(g.id)+'"><span>'+safe(g.emoji)+'</span><b>'+safe(g.title)+'</b><small>'+g.price_xion+' pts · Купить и отправить</small></button>').join('');
}
$('giftShop').addEventListener('click',async e=>{
 const b=e.target.closest('[data-buy-gift]');if(!b||!user)return;
 const username=$('giftRecipient').value.trim().replace(/^@/,'').toLowerCase();
 if(!username)return toast('Сначала введи username получателя.');
 const {data:recipient,error:findError}=await sb.from('profiles').select('id,username').eq('username',username).maybeSingle();
 if(findError)return toast(findError.message);
 if(!recipient)return toast('Пользователь @'+username+' не найден.');
 if(recipient.id===user.id)return toast('Нельзя отправить подарок самому себе.');
 if(!confirm('Отправить подарок пользователю @'+recipient.username+'? Баллы спишутся после подтверждения.'))return;
 b.disabled=true;
 const {data,error}=await sb.rpc('send_virtual_gift',{recipient:recipient.id,gift_key:b.dataset.buyGift});
 b.disabled=false;
 if(error)return toast(error.message);
 toast('Подарок отправлен! Остаток: '+data+' pts');loadWallet();
});
$('backgroundShop').addEventListener('click',async e=>{
 const b=e.target.closest('[data-background]');if(!b||!user)return;
 const {data,error}=await sb.rpc('apply_profile_background',{background_key:b.dataset.background});
 if(error)return toast(error.message);
 profile.profile_background=b.dataset.background;const c=bgColors[b.dataset.background]||['#343047','#a78bfa'];
 document.querySelector('.profile-cover').style.background='linear-gradient(135deg,'+c[0]+','+c[1]+')';
 toast('Оформление профиля обновлено');loadWallet();
});


async function loadModerationStatus(){
 if(!sb||!user||!$('moderationNotice'))return;
 const {data,error}=await sb.rpc('pixy_my_moderation_status');if(error)return;
 const active=(data||[]).filter(x=>x.active),box=$('moderationNotice');
 if(!active.length){box.classList.add('hidden');box.innerHTML='';return}
 box.classList.remove('hidden');
 box.innerHTML='<b>Уведомления модерации</b><br>'+active.slice(0,4).map(x=>'<div>'+safe(x.action_type==='ban'?'Аккаунт заблокирован':x.action_type==='restrict'?'Ограничено действие: '+x.scope:'Сообщение от модерации')+(x.message?' — '+safe(x.message):'')+'</div>').join('');
}
async function searchModerationUsers(){
 if(!sb||profile?.username!=='anpro777')return toast('Нет доступа к модерации.');
 const q=$('moderationSearch').value.trim().replace(/^@/,'');if(!q)return toast('Введи username для поиска.');
 $('moderationResults').innerHTML='<div class="hint">Ищем аккаунт…</div>';
 const {data,error}=await sb.rpc('pixy_admin_search_users',{search_text:q});
 if(error){$('moderationResults').textContent=error.message;return}
 $('moderationResults').innerHTML=(data||[]).map(p=>'<article class="moderation-user"><div class="moderation-user-head"><div class="avatar avatar-blue">'+safe((p.display_name||'P').slice(0,1))+'</div><div><b>'+safe(p.display_name||'Пользователь')+(p.is_verified?' <span class="verified-badge">✓</span>':'')+'</b><small>@'+safe(p.username)+'</small></div></div><div class="moderation-controls"><select data-mod-scope="'+p.id+'"><option value="posts">Публикации</option><option value="comments">Комментарии</option><option value="messages">Сообщения</option><option value="stories">Истории</option><option value="reactions">Реакции</option><option value="follows">Подписки</option></select><textarea data-mod-message="'+p.id+'" maxlength="500" placeholder="Сообщение пользователю / причина"></textarea><button data-mod-action="ban" data-user-id="'+p.id+'">Заблокировать</button><button data-mod-action="restrict" data-user-id="'+p.id+'">Ограничить выбранное</button><button data-mod-action="notice" data-user-id="'+p.id+'">Отправить сообщение</button><button data-mod-action="unban" data-user-id="'+p.id+'">Снять ограничения</button></div></article>').join('')||'<div class="empty-hint">Пользователи не найдены.</div>';
}
$('moderationSearchBtn').onclick=searchModerationUsers;
$('moderationSearch').addEventListener('keydown',e=>{if(e.key==='Enter')searchModerationUsers()});
$('moderationResults').addEventListener('click',async e=>{
 const b=e.target.closest('[data-mod-action]');if(!b||profile?.username!=='anpro777')return;
 const id=b.dataset.userId,action=b.dataset.modAction;
 const scope=$('moderationResults').querySelector('[data-mod-scope="'+id+'"]')?.value||'all';
 const message=$('moderationResults').querySelector('[data-mod-message="'+id+'"]')?.value||'';
 if(action==='ban'&&!confirm('Заблокировать этот аккаунт? Пользователь не сможет выполнять действия в PIXY.'))return;
 if(action==='unban'&&!confirm('Снять все активные ограничения с этого аккаунта?'))return;
 const {error}=await sb.rpc('pixy_admin_moderate',{target_id:id,action_name:action,action_scope:scope,action_message:message});
 if(error)return toast(error.message);
 toast(action==='ban'?'Аккаунт заблокирован':action==='restrict'?'Ограничение применено':action==='unban'?'Ограничения сняты':'Сообщение отправлено');
});

if(sb){sb.auth.getSession().then(async({data})=>{if(data.session){user=data.session.user;await loadProfile();showApp()}else setAuth('login')});sb.auth.onAuthStateChange(async(event,session)=>{if(event==='PASSWORD_RECOVERY'){setAuth('newPassword')}else if(session&&!user){user=session.user;await loadProfile();showApp()}else if(!session){user=null;profile=null;setAuth('login')}})}else{setAuth('login');authStatus('Дизайн готов. Для настоящей регистрации подключи Supabase — ключи не добавляются в публичный код.',true)}
setTimeout(()=>{
 $('splash').style.display='none';
 if($('app').classList.contains('hidden')&&$('auth').classList.contains('hidden')){
  setAuth('login');
  authStatus('Загрузка заняла больше времени обычного. Можно войти ещё раз или обновить страницу.',true);
 }
},6500);
})();