const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../main/resources/META-INF/resources/auth-service.js'),'utf8');
function harness(initial={}) {
 const store=new Map(Object.entries(initial)), navigations=[];let refreshes=0;
 const listeners={};
 const window={location:{origin:'http://localhost:8080',pathname:'/profile/profile.html',search:'',hash:'',replace:u=>navigations.push(u)},addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
 const fetch=async(url,opts)=> {
  if(url==='/api/config/public') return {ok:true,json:async()=>({keycloakIssuer:'http://localhost:8000/realms/partyhub'})};
  if(opts?.body?.get('grant_type')==='refresh_token'){refreshes++;await new Promise(r=>setTimeout(r,10));return {ok:true,json:async()=>({access_token:'fresh',refresh_token:'rotated',expires_in:300})};}
  throw Error('Unexpected fetch '+url);
 };
 vm.runInNewContext(source,{window,fetch,sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},localStorage:{removeItem(){}},crypto:webcrypto,URL,URLSearchParams,TextEncoder,Uint8Array,Date,console,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')});
 return {auth:window.authService,window,store,navigations,fire:(type,event)=>(listeners[type]||[]).forEach(fn=>fn(event)),get refreshes(){return refreshes}};
}
(async()=>{
 const h=harness({'partyhub_keycloak_session':JSON.stringify({accessToken:'expired',refreshToken:'original',expiresAt:1}), 'partyhub_current_user':JSON.stringify({id:1})});
 await h.auth.init();assert.equal(h.refreshes,1);await Promise.all([h.auth.updateToken(1000),h.auth.updateToken(1000),h.auth.updateToken(1000)]);assert.equal(h.refreshes,2);h.store.set('partyhub_keycloak_session',JSON.stringify({accessToken:'expired',refreshToken:'original',expiresAt:1}));await h.auth.init();assert.equal(h.refreshes,3);
 h.auth.logout();assert.equal(h.auth.isLoggedIn(),false);assert.equal(new URL(h.navigations.at(-1)).searchParams.get('post_logout_redirect_uri'),'http://localhost:8080/index.html');
 const r=harness();await r.auth.init();await Promise.all([r.auth.register(),r.auth.register()]);assert.equal(r.navigations.length,1);assert.equal(new URL(r.navigations[0]).searchParams.get('redirect_uri'),'http://localhost:8080/auth/callback.html');
 const t=harness();await t.auth.init();t.window.location.search='?code=untrusted&state=missing';await t.auth.handleCallback();assert.deepEqual(t.navigations,['/register_login/login/login.html']);assert.equal(t.auth.isLoggedIn(),false);
 const expired=harness({'partyhub_oidc_transaction':JSON.stringify({state:'s',nonce:'n',codeVerifier:'v',redirectTo:'/notifications/notifications.html',createdAt:Date.now()})});
 expired.window.location.search='?error=temporarily_unavailable&error_description=authentication_expired&state=s';
 await expired.auth.handleCallback();assert.equal(expired.navigations.length,1);const retryUrl=new URL(expired.navigations[0]);assert.equal(retryUrl.pathname,'/realms/partyhub/protocol/openid-connect/auth');assert.equal(JSON.parse(expired.store.get('partyhub_oidc_transaction')).redirectTo,'/notifications/notifications.html');
 const looping=harness({'partyhub_oidc_transaction':JSON.stringify({state:'s2',nonce:'n',codeVerifier:'v',redirectTo:'/index.html',createdAt:Date.now(),expiredRetry:true})});
 looping.window.location.search='?error=temporarily_unavailable&error_description=authentication_expired&state=s2';
 await assert.rejects(looping.auth.handleCallback());assert.equal(looping.navigations.length,0);
 const restored=harness();await restored.auth.login();restored.fire('pageshow',{persisted:true});await restored.auth.login();assert.equal(restored.navigations.length,2);
 console.log('PASS: refresh rotation, stale init recheck, logout, single registration redirect, correct callback URI, foreign-tab callback recovery, second-tab expired login retry, history-restored login');
})().catch(e=>{console.error(e);process.exitCode=1});
