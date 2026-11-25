const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{},document:{addEventListener(){}}};
vm.runInNewContext(fs.readFileSync('src/main/resources/META-INF/resources/party-social.js','utf8'),context);
const social=context.window.partySocial;
test('names are encoded and unsafe profile IDs never become links or avatar URLs',()=>{
 const html=social.html({discoverySocial:{host:{id:'javascript:alert(1)',name:'<img src=x onerror=alert(1)>'},friendCount:0,friends:[]}});
 assert.ok(html.includes('&lt;img'));
 assert.ok(!html.includes('<img src=x'));
 assert.ok(!html.includes('javascript:'));
 assert.ok(html.includes('/images/default_profile-picture.svg'));
});
test('friend pin shows two avatars with full count and zero friends stays quiet',()=>{
 const party={discoverySocial:{friendCount:4,friends:[{id:1,name:'A'},{id:2,name:'B'},{id:3,name:'C'}]}};
 assert.equal((social.pinHtml(party).match(/<img /g)||[]).length,2);
 assert.ok(social.pinHtml(party).includes('<span>4</span>'));
 assert.ok(social.html(party).includes('A, B and 2 others are attending'));
 assert.ok(social.html(party).includes('+1 more'));
 assert.equal(social.pinHtml({discoverySocial:{friendCount:0,friends:[]}}),'');
});
test('host-only responses still render and old payloads have a host fallback',()=>{
 assert.ok(social.html({host_user:{id:12,displayName:'Alex'}}).includes('Hosted by'));
 assert.ok(social.html({host_user:{id:12,displayName:'Alex'}}).includes('Alex'));
 assert.equal(social.html({}), '');
});
test('friends caption is natural English and names are encoded',()=>{
 const f=(...names)=>names.map((name,i)=>({id:i+1,name}));
 assert.equal(social.attendingCaption(f('Anna'),1),'Anna is attending');
 assert.equal(social.attendingCaption(f('Anna','Ben'),2),'Anna and Ben are attending');
 assert.equal(social.attendingCaption(f('Anna','Ben','Cleo'),3),'Anna, Ben and 1 other are attending');
 assert.equal(social.attendingCaption(f('Anna','Ben'),5),'Anna, Ben and 3 others are attending');
 assert.equal(social.attendingCaption(f('Anna'),3),'Anna and 2 others are attending');
 assert.equal(social.attendingCaption([],1),'A friend is attending');
 assert.equal(social.attendingCaption([],4),'4 friends are attending');
 assert.equal(social.attendingCaption(f('<b>x</b>'),1),'&lt;b&gt;x&lt;/b&gt; is attending');
});
