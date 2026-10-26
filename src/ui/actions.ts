import type { AllowRule } from '../core/model.ts';
import { t } from '../i18n/index.ts';
import type { ExtensionState } from './use-extension.ts';

export function removeRule(state: ExtensionState, rule: AllowRule) {
  return state.act({ type: 'allow-remove', id: rule.id }, t('noticeRemoved', [rule.hostname]), false, {
    message: { type: 'allow-add', hostname: rule.hostname, includeSubdomains: rule.includeSubdomains },
    success: t('noticeRestoredRule', [rule.hostname]),
  });
}
