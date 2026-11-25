const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
for(const file of ['realm-dev.json','realm-staging.json']) {
  test(`${file} fixtures can be imported under the configured password policy`,()=>{
    const realm=JSON.parse(fs.readFileSync(path.join(__dirname,'../../keycloak',file),'utf8'));
    const minimum=Number(realm.passwordPolicy?.match(/length\((\d+)\)/)?.[1]||0);
    for(const user of realm.users||[]) for(const credential of user.credentials||[]) {
      if(credential.type!=='password'||typeof credential.value!=='string')continue;
      assert.ok(credential.value.length>=minimum,`${user.username}: below configured password length`);
      if(realm.passwordPolicy?.includes('notUsername'))assert.notEqual(credential.value,user.username,`${user.username}: password violates notUsername`);
    }
  });
}
