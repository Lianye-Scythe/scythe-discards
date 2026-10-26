import type { AllowRule } from './model.ts';
import { matchingRules, rootDomainOf } from './policy.ts';

export type AllowScope = 'host' | 'domain';
export function allowTarget(hostname: string, scope: AllowScope): Omit<AllowRule, 'id'> | null {
  const target = scope === 'host' ? hostname : rootDomainOf(hostname);
  return target ? { hostname: target, includeSubdomains: scope === 'domain' } : null;
}

export function protectionFor(hostname: string, scope: AllowScope, rules: AllowRule[]) {
  const target = allowTarget(hostname, scope);
  const ownRule = target ? rules.find(rule =>
    rule.hostname === target.hostname && rule.includeSubdomains === target.includeSubdomains) : undefined;
  const coveringRules = matchingRules(hostname, rules);
  const inherited = scope === 'host' && !ownRule ? coveringRules[0] : undefined;
  return { target, ownRule, inherited, checked: !!ownRule || !!inherited };
}
