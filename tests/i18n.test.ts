import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/en.json' with { type: 'json' };
import tw from '../src/i18n/zh_TW.json' with { type: 'json' };
import cn from '../src/i18n/zh_CN.json' with { type: 'json' };
import { compileCatalog } from '../src/i18n/catalog.ts';
import { activityText, formatError, t } from '../src/i18n/index.ts';

test('三語 keys 與參數一致，所有 Chrome 訊息名稱合法', () => {
  for (const catalog of [tw, cn]) {
    assert.deepEqual(Object.keys(catalog).sort(), Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      assert.ok(catalog[key].trim());
      assert.match(key, /^[A-Za-z0-9_]+$/);
      assert.deepEqual(catalog[key].match(/\$\d/g)?.sort(), en[key].match(/\$\d/g)?.sort(), key);
    }
  }
});

test('Chrome 訊息編譯使用命名 placeholder，插入的使用者文字不重複展開', () => {
  const compiled = compileCatalog({ sample: 'Hello $1; $2; $1' });
  assert.deepEqual(compiled.sample, { message: 'Hello $arg1$; $arg2$; $arg1$',
    placeholders: { arg1: { content: '$1' }, arg2: { content: '$2' } } });
  assert.equal(t('scopeHost', ['$2.example.com']), 'Only $2.example.com');
});

test('紀錄與錯誤以代碼本地化，未儲存中文顯示文字', () => {
  const text = activityText({ id: 'a', at: 1, tabId: 2, hostname: 'example.com', kind: 'discarded', code: 'discard-strict' });
  assert.equal(text, 'Strict timeout discard');
  assert.equal(formatError({ code: 'invalid-timeout' }), en.errorInvalidTimeout);
  assert.equal(formatError({ code: 'unexpected', detail: 'API detail' }), 'Chrome reported: API detail');
});
