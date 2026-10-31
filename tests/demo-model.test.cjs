"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DemoSession } = require("../docs/app.js");
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "../docs/catalog.json"), "utf8"));

function session() { return new DemoSession(catalog, { category: "FOOD", budget: "HIGH", mood: "CHILL" }); }

test("budget is a maximum and mood filtering matches the Android catalogue", () => {
  const round = new DemoSession(catalog, { category: "OUTINGS", budget: "LOW", mood: "COZY" });
  assert.ok(round.items.length > 0);
  assert.ok(round.items.every(item => item.priceTier === "LOW" && item.vibeTags.includes("COZY") && item.category === "OUTINGS"));
});

test("local partners have independent queues and only a mutual like pauses the round", () => {
  const round = session();
  const first = round.queue()[0].id;
  round.vote(first, "LIKE");
  assert.equal(round.match, null);
  assert.notEqual(round.queue()[0].id, first);
  round.switchPartner();
  assert.equal(round.queue()[0].id, first);
  round.vote(first, "LIKE");
  assert.equal(round.match.itemId, first);
  assert.equal(round.match.source, "MUTUAL");
  assert.equal(round.vote(round.items[1].id, "PASS"), false);
});

test("a first vote cannot be changed by repeated clicks", () => {
  const round = session();
  const id = round.items[0].id;
  assert.equal(round.vote(id, "PASS"), true);
  assert.equal(round.vote(id, "LIKE"), false);
  assert.equal(round.votes.get(id)[0], "PASS");
});

test("a veto charges the active local partner once and removes the item from both queues", () => {
  const round = session();
  const id = round.items[0].id;
  round.vote(id, "LIKE");
  round.switchPartner();
  round.vote(id, "LIKE");
  const revision = round.match.revision;
  assert.equal(round.veto(revision), true);
  assert.equal(round.veto(revision), false);
  assert.deepEqual(round.tokens, [2, 1]);
  assert.equal(round.match, null);
  assert.ok(round.queue(0).every(item => item.id !== id));
  assert.ok(round.queue(1).every(item => item.id !== id));
  assert.ok(round.candidates.every(item => item.id !== id));
});

test("a delayed veto cannot apply to a later match", () => {
  const round = session();
  const [a, b] = round.items;
  round.vote(a.id, "LIKE");
  round.switchPartner();
  round.vote(a.id, "LIKE");
  const oldRevision = round.match.revision;
  round.veto(oldRevision);
  round.vote(b.id, "LIKE");
  round.switchPartner();
  round.vote(b.id, "LIKE");
  assert.equal(round.veto(oldRevision), false);
  assert.equal(round.match.itemId, b.id);
  assert.deepEqual(round.tokens, [2, 1]);
});

test("a local partner cannot spend a third veto", () => {
  const round = session();
  for (const item of round.items) round.vote(item.id, "LIKE");
  round.switchPartner();
  for (const item of round.items.slice(0, 2)) {
    round.vote(item.id, "LIKE");
    round.veto();
  }
  round.vote(round.items[2].id, "LIKE");
  assert.throws(() => round.veto(), /used both demo vetoes/);
  assert.equal(round.tokens[1], 0);
  assert.equal(round.match.itemId, round.items[2].id);
});

test("tie-breaker waits for both partners and chooses only from the union of likes", () => {
  const round = session();
  const [a, b] = round.items;
  for (const item of round.items) round.vote(item.id, item.id === a.id ? "LIKE" : "PASS");
  assert.equal(round.canSpin, false);
  assert.throws(() => round.spin(), /Both local partners/);
  round.switchPartner();
  for (const item of round.items) round.vote(item.id, item.id === b.id ? "LIKE" : "PASS");
  assert.equal(round.canSpin, true);
  assert.deepEqual(round.candidates.map(item => item.id), [a.id, b.id]);
  const winner = round.spin(length => length - 1);
  assert.equal(winner.itemId, b.id);
  assert.equal(winner.source, "TIE_BREAKER");
  assert.equal(round.spin(() => 0), winner);
});

test("an empty like union produces no fabricated match", () => {
  const round = session();
  for (let partner = 0; partner < 2; partner += 1) {
    for (const item of round.items) round.vote(item.id, "PASS");
    round.switchPartner();
  }
  assert.equal(round.bothFinished, true);
  assert.equal(round.canSpin, false);
  assert.equal(round.spin(), null);
});

test("vetoing a tie-breaker never allows that idea to be selected again", () => {
  const round = session();
  const [a, b] = round.items;
  for (const item of round.items) round.vote(item.id, [a.id, b.id].includes(item.id) ? "LIKE" : "PASS");
  round.switchPartner();
  for (const item of round.items) round.vote(item.id, "PASS");
  assert.equal(round.spin(() => 0).itemId, a.id);
  round.veto();
  assert.equal(round.spin(() => 0).itemId, b.id);
});

test("reset starts an independent round and restores both local token balances", () => {
  const round = session();
  const id = round.items[0].id;
  round.vote(id, "LIKE");
  round.switchPartner();
  round.vote(id, "LIKE");
  round.veto();
  round.reset({ category: "MOVIES", budget: "HIGH", mood: "COZY" });
  assert.deepEqual(round.tokens, [2, 2]);
  assert.equal(round.match, null);
  assert.equal(round.partner, 0);
  assert.equal(round.vetoed.size, 0);
  assert.ok(round.items.every(item => item.category === "MOVIES"));
  assert.equal(round.queue().length, round.items.length);
});
