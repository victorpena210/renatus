import test from 'node:test';
import assert from 'node:assert/strict';
import {annualize, evaluateCost} from '../js/website-cost-model.mjs';

const clear = {
  amount:'250', period:'monthly', extrasStatus:'known', extras:'120', extrasPeriod:'yearly',
  setupPaid:'2000', services:['build','hosting','maintenance','edits','support'],
  siteType:'business', pages:'1-5', editAccess:'no', domain:'yes', files:'yes', satisfaction:'good'
};

test('mixed billing periods and past setup payment produce the advertised example', () => {
  const r = evaluateCost(clear);
  assert.equal(r.annual, 3120);
  assert.equal(r.monthly, 260);
  assert.equal(r.outcome, 'defined');
  assert.equal(r.simpleScope, true);
  assert.equal(evaluateCost({...clear, setupPaid:'50000'}).annual, 3120);
});

test('zero is valid; missing charges never become a complete zero-cost total', () => {
  assert.equal(evaluateCost({...clear, amount:'0', extrasStatus:'none'}).annual, 0);
  const missingExtras = evaluateCost({...clear, extrasStatus:'unknown'});
  assert.equal(missingExtras.annual, null);
  assert.equal(missingExtras.knownAnnual, 3000);
  const missingMain = evaluateCost({...clear, costUnknown:true});
  assert.equal(missingMain.annual, null);
  assert.equal(missingMain.knownAnnual, 120);
  assert.equal(evaluateCost({...clear, costUnknown:true, extrasStatus:'unknown'}).annual, null);
});

test('annual billing is not multiplied again and invalid values are rejected', () => {
  assert.equal(annualize('2400', 'yearly'), 2400);
  assert.equal(annualize('19.99', 'monthly'), 239.88);
  for (const amount of ['-1', 'NaN', 'Infinity', '1000001']) assert.throws(() => annualize(amount, 'monthly'));
  assert.throws(() => annualize('20', 'weekly'));
  assert.equal(annualize('', 'monthly'), null);
});

test('high price by itself never triggers an overpricing conclusion', () => {
  const r = evaluateCost({...clear, amount:'25000'});
  assert.equal(r.outcome, 'defined');
  assert.equal(r.issues.length, 0);
});

test('advanced scope is excluded from a simple subscription comparison', () => {
  for (const update of [
    {siteType:'store'}, {siteType:'booking'}, {siteType:'app'}, {pages:'16+'}, {pages:'unknown'},
    ...['seo','content','ads','integrations','unknown'].map(s => ({services:[...clear.services, s]}))
  ]) assert.equal(evaluateCost({...clear, ...update}).simpleScope, false);
});

test('provider edits satisfy update access while unsupported updates need review', () => {
  assert.equal(evaluateCost(clear).issues.length, 0);
  assert.match(evaluateCost({...clear, services:['hosting']}).issues.join(' '), /cannot edit/);
});

test('ownership problems and SEO uncertainty produce actionable questions', () => {
  const r = evaluateCost({...clear, domain:'provider', files:'no', satisfaction:'issues', services:['hosting','seo'], seoEvidence:'no'});
  assert.equal(r.outcome, 'review');
  assert.match(r.suggestions.map(s => s.title).join(' '), /domain control/);
  assert.match(r.unknowns.join(' '), /SEO/);
  assert.equal(evaluateCost({...clear, services:['seo'], seoEvidence:'yes', editAccess:'yes'}).unknowns.length, 0);
});

test('unknown services return clarification instead of an invented price judgment', () => {
  const r = evaluateCost({...clear, services:['unknown'], editAccess:'yes'});
  assert.equal(r.outcome, 'clarify');
  assert.match(r.suggestions.map(s => s.title).join(' '), /itemized/);
});
