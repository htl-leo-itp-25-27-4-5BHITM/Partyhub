// Real browser + real bearer-authenticated API checks. Uses only the configured local test DB.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PARTYHUB_TEST_URL || 'http://localhost:8080';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Use a disposable local test server');
const evidence = path.join(__dirname, 'test-results'); fs.mkdirSync(evidence, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {})});
  const context = await browser.newContext(); const page = await context.newPage();
  const results = [], createdParties = [];
  async function check(name, fn) {
    try { await fn(); results.push({name,pass:true}); }
    catch (error) { results.push({name,pass:false,error:error.message}); }
    console.log(JSON.stringify(results.at(-1)));
  }
  try {
    await page.goto(base + '/profile/profile.html');
    await page.locator('#username').fill(process.env.PARTYHUB_TEST_USER || 'viki_vej');
    await page.locator('#password').fill(process.env.PARTYHUB_TEST_PASSWORD || 'Demo-viki_vej-2026!');
    await page.locator('#kc-login').click();
    await page.waitForURL(base + '/profile/**');
    await page.waitForFunction(() => window.authService?.getAccessToken());
    const headers = {Authorization:`Bearer ${await page.evaluate(() => window.authService.getAccessToken())}`};
    const api = context.request;
    const me = await (await api.get(base + '/api/users/me', {headers})).json();
    await check('Real bearer authentication and configured header-bypass boundary', async () => {
      assert.ok(me.id);
      if (process.env.EXPECT_AUTH_BYPASS_DISABLED !== 'false')
        assert.equal((await api.get(base + '/api/users/me', {headers:{'X-User-Id':'1'}})).status(),401);
    });
    const stamp = Date.now(); const handle = `validation_audit_${stamp}`;
    const displayName = '<img src="/validation-missing-image" onerror="window.__validationXss=true">';
    await check('Stored profile names render as text in search and username dropdown', async () => {
      const res = await api.put(base + `/api/users/${me.id}`,{headers,data:{displayName,distinctName:handle,email:me.email}});
      assert.equal(res.status(),200);
      await page.evaluate(() => { window.__validationXss=false; });
      await page.locator('#searchInput').fill(handle);
      await page.locator('.search-result-name').filter({hasText:displayName}).waitFor();
      assert.equal(await page.locator('.search-result-name img').count(),0);
      assert.equal(await page.evaluate(() => window.__validationXss),false);
      await page.locator('#searchInput').fill('');
      // Older deployments expose a username menu; current main removed it from the page.
      if(await page.locator('#usernameBtn').count()) {
        const hostileHandle='<img/src=x/onerror=window.__menuXss=true>';
        await page.route('**/api/users',async route=>{
          const response=await route.fetch();const data=await response.json();
          await route.fulfill({response,json:data.map(user=>user.id===me.id?{...user,distinctName:hostileHandle}:user)});
        });
        await page.locator('#usernameBtn').click();
        await page.locator('.username-item').filter({hasText:hostileHandle}).waitFor();
        assert.equal(await page.locator('.username-item img').count(),0);
        assert.equal(await page.evaluate(()=>window.__menuXss===true),false);
        await page.keyboard.press('Escape');
        await page.unroute('**/api/users');
      }
      await page.screenshot({path:path.join(evidence,'safe-profile.png'),fullPage:true});
    });
    const party = {title:"Reunion & O'Brien",time_start:'2027-01-20T18:00:00',time_end:'2027-01-20T22:00:00',latitude:48.3,longitude:14.3,location_address:'Local validation test',visibility:'PUBLIC',max_people:20};
    let partyId;
    await check('Valid Unicode profile and party request succeed', async () => {
      const res=await api.post(base + '/api/parties',{headers,data:party});
      assert.equal(res.status(),201); partyId=Number(res.headers().location.split('/').at(-1)); createdParties.push(partyId);
      const profile=await api.put(base+`/api/users/${me.id}`,{headers,data:{displayName:"Özlem 李 O'Brien 🎉",distinctName:me.distinctName,email:me.email,biography:'Line one\nLine two'}});
      assert.equal(profile.status(),200);
    });
    await check('Malformed and unsafe party requests do not create records', async () => {
      const cases=[{...party,time_start:undefined},{...party,latitude:91},{...party,longitude:undefined},{...party,title:'<script>alert(1)</script>'},{...party,selectedUsers:[null]},{...party,max_people:1.5},{...party,max_people:'20'},{...party,fee:'10'}];
      const before=await (await api.get(base+'/api/parties?include_past=true&limit=100',{headers})).json();
      for(const data of cases){const res=await api.post(base+'/api/parties',{headers,data});assert.equal(res.status(),400,JSON.stringify(data));assert.equal((await res.json()).error,'invalid_input');}
      const after=await (await api.get(base+'/api/parties?include_past=true&limit=100',{headers})).json();
      assert.deepEqual(after.map(x=>x.id),before.map(x=>x.id));
    });
    await check('Unsafe website schemes and credentials are rejected', async () => {
      for(const website of ['javascript:alert(1)','data:text/html,<script>x</script>','//evil.example','https://user:pass@example.com','https://example.com/\nx']){
        const res=await api.post(base+'/api/parties',{headers,data:{...party,website}});assert.equal(res.status(),400,website);
      }
    });
    await check('Historical unsafe links are suppressed by the browser', async () => {
      await page.route(`**/api/parties/${partyId}`, async route=>{
        const response=await route.fetch(); const data=await response.json();data.website='javascript:window.__websiteXss=true';
        await route.fulfill({response,json:data});
      });
      await page.goto(base+`/advancedPartyInfos/advancedPartyInfos.html?id=${partyId}`);
      await page.locator('.party-title').waitFor();
      await page.waitForFunction(() => document.querySelector('.party-title')?.textContent?.includes('Reunion'));
      assert.equal(await page.locator('#party-website').getAttribute('href'),null);
      assert.equal(await page.locator('#party-website').isVisible(),false);
      await page.unroute(`**/api/parties/${partyId}`);
    });
    await check('Legitimate bring-along punctuation and SQL words survive safely', async () => {
      for(const name of ['Family reunion snacks',"Jack's crisps & dip"]){
        const res=await api.post(base+`/api/parties/${partyId}/bring-along/items`,{headers,data:{name,quantity:2,unit:'bags'}});
        assert.equal(res.status(),201);
      }
      for(const quantity of [1.5,'2',2147483648]){
        const res=await api.post(base+`/api/parties/${partyId}/bring-along/items`,{headers,data:{name:'Crisps',quantity}});assert.equal(res.status(),400);
      }
      const items=await (await api.get(base+`/api/parties/${partyId}/bring-along`,{headers})).json();
      assert.ok(items.some(x=>x.name.includes('&#39;')),'Published HTML-encoded wire format stays compatible');
      await page.reload();
      await page.locator(".ba-name").filter({hasText:"Jack's crisps & dip"}).first().waitFor({state:"attached"});
    });
    await check('Malformed email, types and null objects fail before persistence', async () => {
      for(const data of [{email:'not-an-email'},{displayName:123},{biography:'x'.repeat(2001)}]){
        const res=await api.put(base+`/api/users/${me.id}`,{headers,data});assert.equal(res.status(),400);
      }
      for(const endpoint of [`/api/users/${me.id}`,`/api/users/${me.id}/notification-settings`]){
        const res=await api.put(base+endpoint,{headers:{...headers,'Content-Type':'application/json'},data:'null'});assert.equal(res.status(),400);
      }
      const settings=await api.put(base+`/api/users/${me.id}/notification-settings`,{headers,data:{emailEnabled:'true'}});assert.equal(settings.status(),400);
    });
    await check('Query, body, nesting and multipart limits are enforced', async () => {
      for(const query of ['limit=501','offset=-1','user_latitude=NaN&user_longitude=14','sort=evil'])
        assert.equal((await api.get(base+'/api/parties?'+query,{headers})).status(),400);
      assert.equal((await api.get(base+'/api/parties?'+new URLSearchParams({q:"' OR 1=1 --"}),{headers})).status(),200);
      assert.equal((await api.get(base+'/api/parties?'+new URLSearchParams({user_latitude:'48.3',user_longitude:'14.3',distance:'10'}),{headers})).status(),200);
      const large=await api.put(base+`/api/users/${me.id}`,{headers,data:{biography:'x'.repeat(262144)}});assert.equal(large.status(),413);
      const nested=await api.put(base+`/api/users/${me.id}`,{headers:{...headers,'Content-Type':'application/json'},data:'{"unknown":'+'['.repeat(40)+'0'+']'.repeat(40)+'}'});assert.equal(nested.status(),400);
      const oversized=await api.post(base+`/api/users/${me.id}/upload-profile-picture`,{headers,multipart:{file:{name:'huge.png',mimeType:'image/png',buffer:Buffer.alloc(8*1024*1024+1)}}});assert.equal(oversized.status(),413);
    });
    await check('Uploads reject spoofed images and oversized files', async () => {
      const endpoint=base+`/api/users/${me.id}/upload-profile-picture`;
      for(const buffer of [Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('<svg onload=alert(1)>'),Buffer.alloc(5*1024*1024+1)]){
        const res=await api.post(endpoint,{headers,multipart:{file:{name:'fake.png',mimeType:'image/png',buffer}}});assert.equal(res.status(),400);
      }
      const png=fs.readFileSync(path.join(__dirname,'../../src/test/resources/validation/valid.png'));
      const valid=await api.post(endpoint,{headers,multipart:{file:{name:'../../misleading.svg',mimeType:'image/svg+xml',buffer:png}}});assert.equal(valid.status(),200);
      assert.match((await valid.json()).filename,/^profile_\d+_[a-f0-9-]+\.png$/);
    });
    await check('Keycloak registration safely redisplays hostile field text', async () => {
      const registration=await context.newPage(); await registration.goto(base+'/register_login/start.html');
      // Start a fresh registration in an independent context so an existing SSO session cannot skip the form.
      const fresh=await browser.newContext(); const form=await fresh.newPage();
      await form.goto(base+'/register_login/start.html');await form.locator('#registerBtn').click();await form.locator('#firstName').waitFor();
      const hostile='"><img src=x onerror="window.__keycloakXss=true">';
      await form.locator('#firstName').fill(hostile);await form.locator('#lastName').fill('Audit');
      await form.locator('#username').fill('validation_'+stamp);await form.locator('#email').fill('invalid-email');
      await form.locator('#password').fill('PartyHub-Audit-2026!');await form.locator('#password-confirm').fill('PartyHub-Audit-2026!');
      await form.locator('form').evaluate(el=>el.noValidate=true);await form.locator('input[type=submit]').click();
      await form.locator('#firstName').waitFor();
      assert.equal(await form.locator('#firstName').inputValue(),hostile);
      assert.equal(await form.locator('img[src="x"]').count(),0);
      assert.equal(await form.evaluate(()=>window.__keycloakXss===true),false);
      await form.screenshot({path:path.join(evidence,'safe-keycloak-registration.png'),fullPage:true});
      await fresh.close();await registration.close();
    });
    await check('A second real user cannot edit, invite into or read the host private party',async()=>{
      const outsiderContext=await browser.newContext();const outsiderPage=await outsiderContext.newPage();
      try {
        await outsiderPage.goto(base+'/profile/profile.html');
        await outsiderPage.locator('#username').fill(process.env.PARTYHUB_TEST_OTHER_USER||'carla_dimmler');
        await outsiderPage.locator('#password').fill(process.env.PARTYHUB_TEST_OTHER_PASSWORD||'Demo-carla_dimmler-2026!');
        await outsiderPage.locator('#kc-login').click();await outsiderPage.waitForURL(base+'/profile/**');
        await outsiderPage.waitForFunction(()=>window.authService?.getAccessToken());
        const other={Authorization:`Bearer ${await outsiderPage.evaluate(()=>window.authService.getAccessToken())}`};
        const outsider=await(await api.get(base+'/api/users/me',{headers:other})).json();
        assert.notEqual(outsider.id,me.id);
        const created=await api.post(base+'/api/parties',{headers,data:{...party,visibility:'PRIVATE'}});assert.equal(created.status(),201);
        const privateId=Number(created.headers().location.split('/').at(-1));createdParties.push(privateId);
        for(const suffix of ['', '/can-edit','/media','/favorite']) assert.equal((await api.get(base+`/api/parties/${privateId}`+suffix,{headers:other})).status(),404);
        assert.equal((await api.put(base+`/api/parties/${privateId}`,{headers:other,data:{...party,title:'Stolen party'}})).status(),403);
        assert.equal((await api.delete(base+`/api/parties/${privateId}`,{headers:other})).status(),403);
        assert.equal((await api.post(base+'/api/invitations',{headers:other,data:{recipient:outsider.id,partyId:privateId}})).status(),403);
        assert.equal((await api.put(base+`/api/users/${me.id}`,{headers:other,data:{displayName:'Stolen profile'}})).status(),403);
        assert.equal((await api.get(base+`/api/users/${me.id}/notification-settings`,{headers:other})).status(),403);
        const injection=await api.get(base+'/api/parties?'+new URLSearchParams({q:"' OR 1=1 --"}),{headers:other});
        assert.equal(injection.status(),200);assert.ok(!(await injection.json()).some(p=>p.id===privateId));
        const intact=await(await api.get(base+`/api/parties/${privateId}`,{headers})).json();assert.equal(intact.title,party.title);
        assert.equal((await api.post(base+'/api/users',{data:{displayName:'Unauthenticated exploit'}})).status(),401);
        assert.equal((await api.post(base+'/api/users',{headers:other,data:{displayName:'Forged identity'}})).status(),403);
        assert.equal((await api.post(base+'/api/qr/mobile/me',{data:{mobile_token:'forged-token'}})).status(),404);
      } finally {await outsiderContext.close();}
    });
    for(const id of createdParties) await api.delete(base+`/api/parties/${id}`,{headers});
  } finally {
    fs.writeFileSync(path.join(evidence,'input-validation.json'),JSON.stringify({results},null,2));
    await browser.close();
  }
  if(results.some(x=>!x.pass)) process.exitCode=1;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
