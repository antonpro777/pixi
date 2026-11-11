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
function showApp(){ $('auth').classList.add('hidden');$('app').classList.remove('hidden');$('sideName').textContent=profile?.display_name||user?.email?.split('@')[0]||'Гость PIXY';$('sideHandle').textContent=profile?.username?'@'+profile.username:'@welcome';$('sideAvatar').textContent=(profile?.display_name||'P').slice(0,1).toUpperCase();$('profileAvatar').textContent=(profile?.display_name||'P').slice(0,1).toUpperCase();$('profileName').textContent=profile?.display_name||'Твой профиль';$('profileHandleText').textContent=profile?.username?'@'+profile.username:'@username';$('profileVerified').classList.toggle('hidden',!profile?.is_verified);$('moderationNav').classList.toggle('hidden',profile?.username!=='anpro777');$('profileModerationBtn').classList.toggle('hidden',profile?.username!=='anpro777');loadModerationStatus();$('profileBio').textContent=profile?.bio||'Расскажи немного о себе — пусть тебя узнают.';if(profile?.avatar_url){$('profileAvatar').style.backgroundImage='url('+profile.avatar_url+')';$('profileAvatar').style.backgroundSize='cover';$('sideAvatar').style.backgroundImage='url('+profile.avatar_url+')';$('sideAvatar').style.backgroundSize='cover';$('sideAvatar').textContent=''}if(profile?.profile_background&&bgColors[profile.profile_background]){const c=bgColors[profile.profile_background];document.querySelector('.profile-cover').style.background='linear-gradient(135deg,'+c[0]+','+c[1]+')'}loadFeed();loadStories();loadSocialStats();loadWallet()}
function nav(view){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));const target=$('view-'+view);if(target)target.classList.remove('hidden');document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));const titles={home:['ТВОЯ ЛЕНТА','Главная'],videos:['КОРОТКИЙ ФОРМАТ','PIX Video'],search:['ЛЮДИ PIXY','Поиск'],profile:['ТВОЁ ПРОСТРАНСТВО','Мой профиль'],messages:['ЛИЧНОЕ','Сообщения'],wallet:['ТВОЙ БАЛАНС','Мои XION'],shop:['КАСТОМИЗАЦИЯ','Магазин'],moderation:['УПРАВЛЕНИЕ PIXY','Модерация']};$('pageEyebrow').textContent=titles[view]?.[0]||'PIXY';$('pageTitle').textContent=titles[view]?.[1]||'PIXY';if(view==='profile'&&user)loadProfilePosts();if(view==='videos'&&user)loadVideos();if(view==='messages'&&user)loadChatList();if(view==='shop'&&user)loadShop();if(view==='wallet'&&user)loadWallet()}
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
$('signOut').onclick=async()=>{if(sb)await sb.auth.signOut();user=null;profile=null;setAuth('login')};
function withTimeout(promise,ms,message){
 let timer;
 return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms)})]).finally(()=>clearTimeout(timer));
}
async function loadProfile(){
 if(!sb||!user)return;
 const meta=user.user_metadata||{};
 profile={id:user.id,display_name:meta.display_name||'Новый пользователь',username:meta.username||('pixy_'+user.id.slice(0,8)),bio:'',avatar_url:null,profile_background:'Aurora',is_verified:false};
 try{
  const result=await withTimeout(sb.from('profiles').select('*').eq('id',user.id).maybeSingle(),5000,'Профиль загружается дольше обычного');
  if(result.error)throw result.error;
  if(result.data)profile=result.data;
 }catch(error){console.warn('PIXY profile fallback:',error)}
}
function renderPostMedia(p){const items=Array.isArray(p.media_items)&&p.media_items.length?p.media_items:[{url:p.media_url,type:p.media_type}];if(p.media_type==='video')return '<div class="post-video-wrap"><video controls playsinline preload="metadata" '+(p.music_url?'muted data-video-music="1"':'')+' src="'+safe(p.media_url)+'"></video>'+(p.music_url?'<audio data-video-audio="1" preload="auto" loop src="'+safe(p.music_url)+'"></audio>':'')+'</div>';const first=items[0]||{url:p.media_url};if(items.length>1)return '<div class="post-carousel" data-carousel data-items="'+safe(JSON.stringify(items))+'" data-index="0"><img data-carousel-image draggable="false" src="'+safe(first.url)+'" alt="Фото 1 из '+items.length+'">+(p.music_url?'<button type="button" class="carousel-play-overlay" data-carousel-toggle>Нажмите, чтобы включить</button>':'')+'<span class="carousel-count" data-carousel-count>1 / '+items.length+'</span></div>'+(p.music_url?'<audio class="post-music" data-carousel-music preload="auto" loop src="'+safe(p.music_url)+'"></audio>':'');return '<img src="'+safe(first.url||p.media_url)+'" alt="Публикация">'}
async function loadFeed(){
 if(!sb)return;
 const {data,error}=await sb.from('posts').select('id,caption,media_url,media_type,media_items,music_url,music_title,created_at,profiles!posts_author_id_fkey(username,display_name,avatar_url,is_verified)').eq('visibility','public').order('created_at',{ascending:false}).limit(30);
 if(error){console.warn(error);return}const feed=$('feed');
 if(!data?.length){feed.innerHTML='<div class="empty-state"><div class="empty-icon">✧</div><h2>Лента только начинается</h2><p>Опубликуй первый момент и позови друзей в PIXY.</p></div>';return}
 feed.innerHTML=data.map(p=>'<article class="post-card"><div class="post-head"><div class="avatar avatar-gradient">'+safe((p.profiles?.display_name||'P').slice(0,1))+'</div><div class="post-user"><strong>'+safe(p.profiles?.username||'pixy_user')+(p.profiles?.is_verified?' <span class="verified-badge">✓</span>':'')+'</strong><small>'+new Date(p.created_at).toLocaleString()+'</small></div></div><div class="post-image">'+renderPostMedia(p)+'</div>'+(p.music_title?'<small class="post-music-title">♫ '+safe(p.music_title)+'</small>':'')+'<p class="post-caption">'+safe(p.caption||'')+'</p><div class="post-actions"><button data-like="'+p.id+'">♡ <span>Нравится</span></button><button data-comment="'+p.id+'">▢ <span>Комментировать</span></button></div><div class="reaction-row"><button data-react-post="'+p.id+'" data-reaction="❤️">❤️</button><button data-react-post="'+p.id+'" data-reaction="🤩">🤩</button><button data-react-post="'+p.id+'" data-reaction="😎">😎</button><button data-react-post="'+p.id+'" data-reaction="😂">😂</button><button data-react-post="'+p.id+'" data-reaction="🔥">🔥</button></div></article>').join('');
}
async function loadVideos(){
 if(!sb)return;const {data,error}=await sb.from('posts').select('id,caption,media_url,music_url,music_title,created_at,profiles!posts_author_id_fkey(username,display_name)').eq('media_type','video').eq('visibility','public').order('created_at',{ascending:false}).limit(30);
 if(error){$('view-videos').innerHTML='<p class="hint">'+safe(error.message)+'</p>';return}
 $('view-videos').innerHTML=(data||[]).map(p=>'<article class="post-card"><div class="post-head"><b>@'+safe(p.profiles?.username||'user')+'</b><small>'+new Date(p.created_at).toLocaleString()+'</small></div><div class="post-video-wrap"><video controls playsinline muted preload="metadata" '+(p.music_url?'data-video-music="1"':'')+' src="'+safe(p.media_url)+'" style="width:100%;max-height:70vh;border-radius:16px;background:#000"></video>'+(p.music_url?'<audio controls data-video-audio="1" src="'+safe(p.music_url)+'"></audio>':'')+'</div>'+(p.music_title?'<small class="post-music-title">♫ '+safe(p.music_title)+'</small>':'')+'<p>'+safe(p.caption||'')+'</p></article>').join('')||'<div class="empty-state"><h2>Пока нет видео</h2><button class="primary-btn" id="videoCreate">＋ Загрузить видео</button></div>';
 const b=$('view-videos').querySelector('#videoCreate');if(b)b.onclick=()=>openComposer('video');
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


let activeConversation=null,activeChatUser=null,activeChatChannel=null,voiceRecorder=null,voiceChunks=[];
async function loadChatList(){
 if(!sb||!user)return;
 const {data,error}=await sb.rpc('list_my_direct_chats');
 if(error){$('chatList').textContent=error.message;return}
 const rows=data||[];
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
 activeConversation=cid;activeChatUser=uid;$('chatTitle').textContent='@'+name;$('chatPeoplePanel').classList.add('hidden');$('chatConversationPanel').classList.remove('hidden');
 if(activeChatChannel){await sb.removeChannel(activeChatChannel);activeChatChannel=null}
 await refreshChatMessages(cid);
 activeChatChannel=sb.channel('pixy-chat-'+cid).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+cid},payload=>{if(activeConversation===cid)refreshChatMessages(cid)}).subscribe();
}
$('chatList').addEventListener('click',e=>{const b=e.target.closest('[data-chat]');if(b)openChat(b.dataset.chat,b.dataset.chatUser,b.dataset.chatName)});
$('chatBackBtn').onclick=async()=>{if(activeChatChannel){await sb.removeChannel(activeChatChannel);activeChatChannel=null}activeConversation=null;activeChatUser=null;$('chatConversationPanel').classList.add('hidden');$('chatPeoplePanel').classList.remove('hidden');};
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
 const [{count:followers},{count:following}] = await Promise.all([
 sb.from('follows').select('*',{count:'exact',head:true}).eq('following_id',user.id),
 sb.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',user.id)
 ]);
 const nodes=document.querySelectorAll('[data-stat="followers"],[data-stat="following"]');
 nodes.forEach(n=>n.textContent=n.dataset.stat==='followers'?(followers||0):(following||0));
}
async function showPostComments(postId){
 const {data,error}=await sb.from('comments').select('body,created_at,profiles(username)').eq('post_id',postId).order('created_at',{ascending:true}).limit(50);
 if(error)return toast(error.message);
 const lines=(data||[]).map(x=>'@'+(x.profiles?.username||'user')+': '+x.body);
 alert(lines.length?lines.join('\\n'):'Пока нет комментариев.');
}

function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

$('feed').addEventListener('click',async e=>{
 const rb=e.target.closest('[data-react-post]');
 if(rb){if(!sb||!user)return toast('Войди в PIXY, чтобы реагировать.');const {error}=await sb.from('reactions').upsert({post_id:rb.dataset.reactPost,user_id:user.id,reaction:rb.dataset.reaction},{onConflict:'post_id,user_id'});if(error)return toast(error.message);toast('Реакция '+rb.dataset.reaction+' добавлена');return}

 const b=e.target.closest('[data-like]');
 if(b){if(!sb||!user)return toast('Войди в PIXY, чтобы ставить реакции.');const {error}=await sb.from('reactions').upsert({post_id:b.dataset.like,user_id:user.id,reaction:'like'},{onConflict:'post_id,user_id'});if(error)toast(error.message);else{b.innerHTML='♥ <span>Тебе нравится</span>';b.style.color='#f58ac7'}return}
 const c=e.target.closest('[data-comment]');
 if(c){if(!sb||!user)return toast('Войди в PIXY, чтобы комментировать.');const body=prompt('Твой комментарий:');if(!body?.trim())return;const {error}=await sb.from('comments').insert({post_id:c.dataset.comment,author_id:user.id,body:body.trim().slice(0,1000)});if(error)return toast(error.message);toast('Комментарий опубликован');showPostComments(c.dataset.comment)}
});
let cameraStream=null,mediaRecorder=null,recordedChunks=[],recordTimer=null,cameraFacing='environment',captureMode='photo',cameraBusy=false;
function stopCamera(){if(recordTimer){clearTimeout(recordTimer);recordTimer=null}if(mediaRecorder?.state==='recording'){try{mediaRecorder.stop()}catch(_){}}if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}const p=$('cameraPreview');if(p)p.srcObject=null}
async function startCamera(){stopCamera();try{cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:cameraFacing}},audio:true});const v=$('cameraPreview');v.srcObject=cameraStream;await new Promise((resolve,reject)=>{if(v.readyState>=2&&v.videoWidth)return resolve();v.onloadedmetadata=resolve;v.onerror=reject});await v.play();$('cameraHint').textContent='Камера включена'}catch(err){stopCamera();$('cameraHint').textContent='Камера недоступна';toast(err.message||'Разреши доступ к камере и микрофону.')}}
function setCaptureMode(m){captureMode=m;$('postMode').value=m==='video'?'video':'single';$('capturePhotoMode').classList.toggle('active',m==='photo');$('captureVideoMode').classList.toggle('active',m==='video');$('cameraHint').textContent=m==='video'?'Видео · до 20 секунд':'Фото'}
function openComposer(){if(!user)return toast('Сначала войди в PIXY.');$('composerModal').classList.remove('hidden');$('postFile').value='';selectedFiles=[];selectedFile=null;$('filePreview').innerHTML='';$('postCaption').value='';$('postMusic').value='';$('postForm').querySelector('button[type=submit]').disabled=false;setCaptureMode('photo');loadMusicLibrary();startCamera()}
$('openComposer').onclick=$('bannerCreate').onclick=()=>openComposer();$('mobileCreateBtn').onclick=()=>openComposer();$('videoCreate').onclick=()=>openComposer();
$('capturePhotoMode').onclick=()=>setCaptureMode('photo');$('captureVideoMode').onclick=()=>setCaptureMode('video');
$('cameraFlipBtn').onclick=async()=>{cameraFacing=cameraFacing==='environment'?'user':'environment';await startCamera()};
$('galleryPickBtn').onclick=()=>{stopCamera();$('postFile').multiple=true;$('postFile').accept='image/*,video/mp4,video/webm,video/quicktime';$('postFile').click()};
function setComposerFiles(files,m){selectedFiles=files;selectedFile=files[0]||null;$('postMode').value=m;const p=$('filePreview');p.innerHTML='';files.forEach(f=>{const u=URL.createObjectURL(f),el=document.createElement(f.type.startsWith('video/')?'video':'img');el.src=u;if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true}p.append(el)});$('cameraHint').textContent=m==='carousel'?'Выбрано '+files.length+' фото':m==='video'?'Видео готово':'Фото готово'}
function readVideoDuration(f){return new Promise(resolve=>{const u=URL.createObjectURL(f),v=document.createElement('video');let done=false;const finish=d=>{if(done)return;done=true;URL.revokeObjectURL(u);v.removeAttribute('src');v.load();resolve(d)};v.preload='metadata';v.onloadedmetadata=()=>finish(Number.isFinite(v.duration)?v.duration:null);v.onerror=()=>finish(null);v.src=u;v.load();setTimeout(()=>finish(null),5000)})}
$('postFile').onchange=async e=>{const fs=Array.from(e.target.files||[]);if(!fs.length)return;const vid=fs.length===1&&fs[0].type.startsWith('video/'),imgs=fs.every(f=>f.type.startsWith('image/'));if(!vid&&!imgs){toast('Выбери одно видео или фотографии.');e.target.value='';return}if(imgs&&fs.length>15){toast('Можно выбрать до 15 фото.');e.target.value='';return}if(fs.some(f=>f.size>50*1024*1024)){toast('Файл больше 50 МБ.');e.target.value='';return}if(vid){const d=await readVideoDuration(fs[0]);if(d!==null&&d>20.05){toast('Видео должно быть не длиннее 20 секунд.');e.target.value='';return}setComposerFiles(fs,'video')}else setComposerFiles(fs,fs.length>1?'carousel':'single')};
$('captureShutter').onclick=async()=>{if(cameraBusy)return;cameraBusy=true;try{if(captureMode==='photo'){const v=$('cameraPreview');if(!cameraStream||!v.videoWidth)await startCamera();if(!v.videoWidth)throw Error('Камера ещё не готова.');const c=$('cameraCanvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.93));if(!b)throw Error('Не удалось сделать фото.');setComposerFiles([new File([b],'pixy-photo.jpg',{type:'image/jpeg'})],'single');$('captureShutter').classList.add('photo-flash');setTimeout(()=>$('captureShutter').classList.remove('photo-flash'),180)}else if(mediaRecorder?.state==='recording'){mediaRecorder.stop();$('cameraHint').textContent='Сохраняю видео…'}else{if(!cameraStream)await startCamera();if(!cameraStream)throw Error('Не удалось включить камеру.');const mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));mediaRecorder=new MediaRecorder(cameraStream,mt?{mimeType:mt}:undefined);recordedChunks=[];mediaRecorder.ondataavailable=e=>{if(e.data?.size)recordedChunks.push(e.data)};mediaRecorder.onstop=()=>{clearTimeout(recordTimer);const b=new Blob(recordedChunks,{type:mediaRecorder.mimeType||'video/webm'});if(b.size){setComposerFiles([new File([b],'pixy-video.webm',{type:'video/webm'})],'video');$('cameraHint').textContent='Видео записано · можно опубликовать'}$('captureShutter').classList.remove('recording')};mediaRecorder.start(200);$('captureShutter').classList.add('recording');$('cameraHint').textContent='Идёт запись · максимум 20 секунд';recordTimer=setTimeout(()=>{if(mediaRecorder?.state==='recording')mediaRecorder.stop()},20000)}}catch(err){toast(err.message||'Ошибка камеры.')}finally{cameraBusy=false}};
async function loadMusicLibrary(){if(!sb)return;const {data,error}=await sb.from('music_tracks').select('id,title,artist,audio_url').eq('active',true).order('created_at',{ascending:false});if(error){console.warn(error);return}availableMusic=data||[];const s=$('postMusic'),old=s.value;s.innerHTML='<option value="">Без музыки</option>'+availableMusic.map(t=>'<option value="'+t.id+'">'+safe(t.title)+' — '+safe(t.artist)+'</option>').join('');if(availableMusic.some(t=>t.id===old))s.value=old}
$('postForm').onsubmit=async e=>{e.preventDefault();if(!sb||!user)return toast('Войди в PIXY.');const m=$('postMode').value,fs=selectedFiles.length?selectedFiles:(selectedFile?[selectedFile]:[]);if(!fs.length)return toast('Сними фото или видео либо выбери файлы в галерее.');if(m==='carousel'&&(fs.length<2||fs.length>15))return toast('Слайд-шоу: от 2 до 15 фото.');if(fs.some(f=>f.size>50*1024*1024))return toast('Максимум 50 МБ на файл.');if(m==='video'){const d=await readVideoDuration(fs[0]);if(d!==null&&d>20.05)return toast('Видео должно быть не длиннее 20 секунд.')}const btn=$('postForm').querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Загружаю…';try{const uploaded=[];for(const f of fs){const ext=(f.name.split('.').pop()||'jpg').toLowerCase(),path=user.id+'/'+crypto.randomUUID()+'.'+ext;const {error:ue}=await sb.storage.from('pixy-media').upload(path,f,{contentType:f.type,cacheControl:'3600',upsert:false});if(ue)throw ue;uploaded.push({url:sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl,type:m==='video'?'video':'image'})}const t=availableMusic.find(x=>x.id===$('postMusic').value)||null;const {error}=await sb.from('posts').insert({author_id:user.id,caption:$('postCaption').value.trim(),media_url:uploaded[0].url,media_type:m==='video'?'video':'image',media_items:m==='video'?[]:uploaded,music_url:t?.audio_url||null,music_title:t?.title||null,visibility:'public'});if(error)throw error;stopCamera();$('composerModal').classList.add('hidden');$('postCaption').value='';$('postFile').value='';$('filePreview').innerHTML='';$('postMusic').value='';selectedFile=null;selectedFiles=[];toast('Публикация добавлена!');nav('home');loadFeed()}catch(err){console.error('PIXY publish error:',err);toast(err.message||'Ошибка публикации')}finally{btn.disabled=false;btn.textContent='Опубликовать'}};
$('feed').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-carousel]');if(b){b.dataset.pointerStart=String(e.clientX);try{b.setPointerCapture(e.pointerId)}catch(_){}}});
$('feed').addEventListener('pointerup',e=>{const b=e.target.closest('[data-carousel]');if(!b)return;const x=Number(b.dataset.pointerStart);delete b.dataset.pointerStart;if(!Number.isFinite(x))return;const dx=e.clientX-x;if(Math.abs(dx)<38)return;let a=[];try{a=JSON.parse(b.dataset.items||'[]')}catch(_){}if(!a.length)return;const i=(Number(b.dataset.index||0)+(dx<0?1:-1)+a.length)%a.length;b.dataset.index=String(i);const im=b.querySelector('[data-carousel-image]');im.style.transform='translateX('+(dx<0?'24px':'-24px')+')';im.style.opacity='.35';requestAnimationFrame(()=>{im.src=a[i].url;im.alt='Фото '+(i+1)+' из '+a.length;im.style.transform='translateX(0)';im.style.opacity='1'});const count=b.querySelector('[data-carousel-count]');if(count)count.textContent=(i+1)+' / '+a.length;b.dataset.swiped='1'});
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
$('profileForm').onsubmit=async e=>{e.preventDefault();if(!sb||!user)return;let avatar_url=profile?.avatar_url||null;const file=$('avatarFile').files[0];if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))return toast('Аватар: только JPG, PNG или WebP.');if(file.size>5*1024*1024)return toast('Аватар должен быть не больше 5 МБ.');const path=user.id+'/avatar-'+Date.now()+'.'+file.name.split('.').pop();const {error}=await sb.storage.from('pixy-media').upload(path,file,{upsert:true,contentType:file.type});if(error)return toast(error.message);avatar_url=sb.storage.from('pixy-media').getPublicUrl(path).data.publicUrl}const {data,error}=await sb.from('profiles').upsert({id:user.id,display_name:$('editName').value.trim(),bio:$('editBio').value.trim(),avatar_url}).select().single();if(error)return toast(error.message);profile=data;showApp();$('profileModal').classList.add('hidden');toast('Профиль сохранён')};
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

async function loadProfilePosts(){if(!sb||!user)return;const {data,error}=await sb.from('posts').select('id,media_url,media_type').eq('author_id',user.id).order('created_at',{ascending:false});if(error)return; $('postCount').textContent=data.length;$('profileGrid').innerHTML=data.length?data.map(p=>p.media_type==='video'?'<video src="'+safe(p.media_url)+'" controls></video>':'<img src="'+safe(p.media_url)+'" alt="Моя публикация">').join(''):'<div class="empty-hint">Твои публикации будут отображаться здесь.</div>'}

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
 $('giftShop').innerHTML=(gs||[]).map(g=>'<div class="gift-tile"><span>'+safe(g.emoji)+'</span><b>'+safe(g.title)+'</b><small>'+g.price_xion+' pts</small></div>').join('');
}
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