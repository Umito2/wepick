/* WePick's browser-only demo. No accounts, backend connections, or analytics are created here. */
(function (global) {
  "use strict";

  const BUDGETS = Object.freeze({ LOW: 0, MEDIUM: 1, HIGH: 2 });
  const CATEGORY_LABELS = Object.freeze({ FOOD: "Food delivery", OUTINGS: "Café outing", MOVIES: "Movie night", ACTIVITIES: "Something together" });
  const PRICE_LABELS = Object.freeze({ LOW: "$", MEDIUM: "$$", HIGH: "$$$" });
  const DEFAULT_FILTER = Object.freeze({ category: "FOOD", budget: "HIGH", mood: "CHILL" });

  function randomIndex(length) {
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      const limit = 0x100000000 - (0x100000000 % length);
      const values = new Uint32Array(1);
      do { global.crypto.getRandomValues(values); } while (values[0] >= limit);
      return values[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  /** A deliberately local two-person session, kept independent of the page for testing. */
  class DemoSession {
    constructor(catalog, filter = DEFAULT_FILTER) {
      if (!Array.isArray(catalog) || !catalog.length) throw new Error("The idea catalogue is empty.");
      if (new Set(catalog.map(item => item.id)).size !== catalog.length) throw new Error("Idea IDs must be unique.");
      this.catalog = catalog.slice();
      this.reset(filter);
    }

    reset(filter = this.filter) {
      if (!Object.hasOwn(CATEGORY_LABELS, filter.category) || !Object.hasOwn(BUDGETS, filter.budget) || !["CHILL", "ENERGETIC", "COZY"].includes(filter.mood)) {
        throw new Error("Choose a category, budget, and mood.");
      }
      this.filter = { ...filter };
      this.items = this.catalog.filter(item => item.category === filter.category &&
        BUDGETS[item.priceTier] <= BUDGETS[filter.budget] && item.vibeTags.includes(filter.mood));
      this.votes = new Map(this.items.map(item => [item.id, [null, null]]));
      this.vetoed = new Set();
      this.tokens = [2, 2];
      this.partner = 0;
      this.match = null;
      this.revision = 0;
    }

    switchPartner() { this.partner = 1 - this.partner; }

    queue(partner = this.partner) {
      return this.items.filter(item => !this.vetoed.has(item.id) && this.votes.get(item.id)[partner] === null);
    }

    get candidates() {
      return this.items.filter(item => !this.vetoed.has(item.id) && this.votes.get(item.id).includes("LIKE"));
    }

    get bothFinished() {
      return this.items.every(item => this.vetoed.has(item.id) || this.votes.get(item.id).every(vote => vote !== null));
    }

    get canSpin() { return !this.match && this.bothFinished && this.candidates.length > 0; }

    get progress() {
      const eligible = this.items.filter(item => !this.vetoed.has(item.id));
      return {
        total: eligible.length,
        you: eligible.filter(item => this.votes.get(item.id)[0] !== null).length,
        partner: eligible.filter(item => this.votes.get(item.id)[1] !== null).length,
      };
    }

    vote(itemId, vote) {
      if (vote !== "LIKE" && vote !== "PASS") throw new Error("A choice must be LIKE or PASS.");
      if (!this.votes.has(itemId)) throw new Error("That idea is not in this round.");
      if (this.match || this.vetoed.has(itemId) || this.votes.get(itemId)[this.partner] !== null) return false;
      const votes = this.votes.get(itemId);
      votes[this.partner] = vote;
      if (votes[0] === "LIKE" && votes[1] === "LIKE") {
        this.match = { itemId, source: "MUTUAL", revision: ++this.revision };
      }
      return true;
    }

    veto(expectedRevision = this.match && this.match.revision) {
      if (!this.match || expectedRevision !== this.match.revision) return false;
      if (this.tokens[this.partner] < 1) throw new Error("This local partner has used both demo vetoes.");
      this.tokens[this.partner] -= 1;
      this.vetoed.add(this.match.itemId);
      this.match = null;
      this.revision += 1;
      return true;
    }

    spin(pickIndex = randomIndex) {
      if (this.match) return this.match;
      if (!this.bothFinished) throw new Error("Both local partners need to finish before spinning.");
      const candidates = this.candidates;
      if (!candidates.length) return null;
      const index = pickIndex(candidates.length);
      if (!Number.isInteger(index) || index < 0 || index >= candidates.length) throw new Error("Invalid random selection.");
      this.match = { itemId: candidates[index].id, source: "TIE_BREAKER", revision: ++this.revision };
      return this.match;
    }

    get matchedItem() { return this.match ? this.items.find(item => item.id === this.match.itemId) : null; }
  }

  if (typeof module === "object" && module.exports) module.exports = { DemoSession, DEFAULT_FILTER };
  if (typeof document === "undefined") return;
  // Resolve beside this script so demos also work when hosted beneath a nested site URL.
  const assetBase = document.currentScript?.src || document.baseURI;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function initializeMenu() {
    const toggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("site-navigation");
    if (!toggle || !navigation) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      navigation.classList.toggle("is-open", expanded);
    });
    navigation.addEventListener("click", event => {
      if (event.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        navigation.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        navigation.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  async function initializeDemo() {
    const demo = document.getElementById("demo");
    if (!demo) return;
    const byId = id => document.getElementById(id);
    const nodes = {
      cards: byId("demo-cards"), status: byId("demo-status"), progress: byId("demo-progress"),
      pass: byId("pass-button"), like: byId("like-button"), restart: byId("restart-demo"),
      partner: byId("partner-toggle"), partnerLabel: byId("demo-partner-label"),
      budget: byId("demo-budget"), mood: byId("demo-mood"),
      dialog: byId("match-dialog"), eyebrow: byId("match-eyebrow"), title: byId("match-title"),
      item: byId("match-item"), description: byId("match-description"), source: byId("match-source"),
      veto: byId("veto-button"), next: byId("next-round-button"), close: byId("close-match-button"),
      tokens: byId("token-count"), spin: byId("spin-button"), empty: byId("empty-demo"),
    };
    if (Object.values(nodes).some(node => !node)) {
      if (nodes.status) nodes.status.textContent = "The browser demo is unavailable. Please refresh the page.";
      return;
    }
    const categoryButtons = Array.from(demo.querySelectorAll("[data-category]"));
    const reducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)");
    let session;
    let busy = false;
    let generation = 0;
    let revealGeneration = 0;
    const revealedMatches = new Set();
    if (!demo.hasAttribute("tabindex")) demo.tabIndex = 0;
    nodes.cards.style.touchAction = "pan-y";

    function setStatus(message) { nodes.status.textContent = message; }
    function isReducedMotion() { return reducedMotion.matches; }
    function wait(milliseconds) { return new Promise(resolve => global.setTimeout(resolve, milliseconds)); }

    function updateControls() {
      const canVote = !!session && !busy && !session.match && session.queue().length > 0;
      nodes.pass.disabled = !canVote;
      nodes.like.disabled = !canVote;
      nodes.partner.disabled = !session || busy;
      nodes.spin.disabled = !session || busy || !session.canSpin;
      nodes.spin.hidden = !session || !session.canSpin;
      nodes.veto.disabled = !session || busy || !session.match || session.tokens[session.partner] === 0;
      nodes.next.disabled = busy;
      categoryButtons.forEach(button => { button.disabled = busy; });
      nodes.budget.disabled = busy;
      nodes.mood.disabled = busy;
      if (!session) return;
      nodes.partner.textContent = session.partner === 0 ? "Switch to Partner turn" : "Switch to Your turn";
      nodes.partner.setAttribute("aria-label", session.partner === 0 ? "Switch to the second local partner" : "Switch back to your local choices");
      nodes.partnerLabel.textContent = session.partner === 0 ? "Your turn" : "Partner turn";
      nodes.tokens.textContent = `You ${session.tokens[0]}/2 · Partner ${session.tokens[1]}/2`;
      nodes.tokens.setAttribute("aria-label", `Demo vetoes: you have ${session.tokens[0]} of 2; the local partner has ${session.tokens[1]} of 2.`);
      const nextItem = session.queue()[0];
      nodes.pass.setAttribute("aria-label", nextItem ? `Pass on ${nextItem.title}` : "Pass on this idea");
      nodes.like.setAttribute("aria-label", nextItem ? `Like ${nextItem.title}` : "Like this idea");
      nodes.veto.textContent = session.tokens[session.partner] > 0 ? `Use a veto · ${session.tokens[session.partner]}/2 left` : "No demo vetoes left";
    }

    function renderCard(item, depth) {
      const card = element("article", "demo-card");
      card.dataset.itemId = item.id;
      card.dataset.depth = String(depth);
      card.style.setProperty("--card-depth", depth);
      card.style.zIndex = String(3 - depth);
      card.style.transform = `translateY(${depth * 11}px) scale(${1 - depth * 0.045})`;
      const visual = element("div", `card-visual visual-${item.category.toLowerCase()}`);
      visual.append(element("span", "card-emoji", item.emoji));
      visual.setAttribute("aria-hidden", "true");
      const category = element("span", "card-category", CATEGORY_LABELS[item.category]);
      visual.append(category);
      const like = element("span", "vote-badge like", "LIKE");
      const pass = element("span", "vote-badge pass", "NOPE");
      like.style.opacity = "0";
      pass.style.opacity = "0";
      visual.append(like, pass);
      const body = element("div", "card-body");
      body.append(element("h3", "", item.title));
      const tags = element("div", "card-tags");
      tags.append(element("span", "price-tag", PRICE_LABELS[item.priceTier]));
      tags.append(element("span", "vibe-tag", item.vibeTags.map(mood => mood[0] + mood.slice(1).toLowerCase()).join(" · ")));
      body.append(tags, element("p", "description", item.description));
      card.append(visual, body);
      if (depth === 0) {
        card.tabIndex = 0;
        card.setAttribute("aria-label", `${item.title}. ${PRICE_LABELS[item.priceTier]}. Use left arrow to pass or right arrow to like.`);
        attachDrag(card, like, pass, item.id);
      } else {
        card.setAttribute("aria-hidden", "true");
        card.inert = true;
      }
      return card;
    }

    function render(message) {
      generation += 1;
      const focusedCard = nodes.cards.contains(document.activeElement);
      nodes.cards.replaceChildren();
      const queue = session.queue();
      nodes.empty.hidden = true;
      if (session.match) {
        const winner = renderCard(session.matchedItem, 0);
        winner.removeAttribute("tabindex");
        winner.setAttribute("aria-label", `${session.matchedItem.title}, your shared demo match.`);
        const reopen = element("button", "demo-open-match", "See our match");
        reopen.type = "button";
        reopen.addEventListener("click", () => showMatch());
        winner.querySelector(".card-body").append(reopen);
        nodes.cards.append(winner);
        setStatus("A shared yes. This local round is paused until you veto or start again.");
      } else if (queue.length) {
        queue.slice(0, 3).reverse().forEach((item, reversedIndex, visible) => {
          nodes.cards.append(renderCard(item, visible.length - 1 - reversedIndex));
        });
        setStatus(session.partner === 0
          ? "Try a few choices, then switch to Partner turn. This demo stays in this browser."
          : "Try the second partner's choices. Like the same idea to make a match.");
      } else {
        nodes.empty.hidden = false;
        if (!session.items.length) {
          nodes.empty.textContent = "No ideas fit these filters. Try a different mood or budget.";
          setStatus("Try another combination to start the local demo.");
        } else if (!session.bothFinished) {
          nodes.empty.textContent = "Your side is done. Now try the other partner's picks.";
          setStatus("Switch turns to finish the other local partner's deck.");
        } else if (session.candidates.length) {
          nodes.empty.textContent = "No shared yes yet. Let a little luck choose from your likes.";
          setStatus(`Both local partners finished. ${session.candidates.length} liked ${session.candidates.length === 1 ? "idea is" : "ideas are"} in the tie-breaker.`);
        } else {
          nodes.empty.textContent = "No likes left this time. A fresh round is a good idea.";
          setStatus("You both passed on every remaining idea. Restart or try different filters.");
        }
      }
      const progress = session.progress;
      nodes.progress.textContent = `You ${progress.you}/${progress.total} · Partner ${progress.partner}/${progress.total}`;
      categoryButtons.forEach(button => {
        const selected = button.dataset.category === session.filter.category;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      updateControls();
      if (message) setStatus(message);
      if (focusedCard) nodes.cards.querySelector("[tabindex='0'], .demo-open-match")?.focus({ preventScroll: true });
    }

    async function commitVote(vote, card = nodes.cards.querySelector(".demo-card[data-depth='0']")) {
      if (!session || busy || session.match || !session.queue().length || !card) return;
      const item = session.queue()[0];
      const startedGeneration = generation;
      const startedPartner = session.partner;
      busy = true;
      updateControls();
      card.classList.remove("is-dragging");
      const direction = vote === "LIKE" ? 1 : -1;
      card.style.transition = isReducedMotion() ? "none" : "transform 240ms cubic-bezier(.25,.8,.25,1), opacity 200ms ease";
      card.style.transform = `translateX(${direction * (card.offsetWidth + 100)}px) rotate(${direction * 20}deg)`;
      card.style.opacity = "0";
      await wait(isReducedMotion() ? 0 : 245);
      // A restart can be followed immediately by another gesture. An obsolete animation
      // must not unlock controls owned by that newer gesture.
      if (startedGeneration !== generation || startedPartner !== session.partner) return;
      session.vote(item.id, vote);
      busy = false;
      render();
      if (session.match) showMatch();
    }

    function attachDrag(card, likeBadge, passBadge, itemId) {
      let drag = null;
      const current = () => !busy && !session.match && session.queue()[0]?.id === itemId && card.isConnected;
      const settle = () => {
        card.classList.remove("is-dragging");
        card.style.transition = isReducedMotion() ? "none" : "transform 420ms cubic-bezier(.2,1.45,.5,1), opacity 200ms ease";
        card.style.transform = "translateX(0) rotate(0deg)";
        card.style.opacity = "1";
        likeBadge.style.opacity = "0";
        passBadge.style.opacity = "0";
      };
      card.addEventListener("pointerdown", event => {
        if (!current() || (event.pointerType === "mouse" && event.button !== 0) || event.target.closest("button, a")) return;
        drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: 0, lastX: event.clientX, lastTime: performance.now(), velocity: 0, active: false };
        card.setPointerCapture(event.pointerId);
      });
      card.addEventListener("pointermove", event => {
        if (!drag || event.pointerId !== drag.id || !current()) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.active && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.15) {
          const pointerId = drag.id;
          drag = null;
          if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
          settle();
          return;
        }
        if (!drag.active && Math.abs(dx) < 6) return;
        drag.active = true;
        const now = performance.now();
        drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastTime);
        drag.lastX = event.clientX;
        drag.lastTime = now;
        drag.x = dx;
        if (event.cancelable) event.preventDefault();
        card.classList.add("is-dragging");
        card.style.transition = "none";
        const width = Math.max(1, card.offsetWidth);
        card.style.transform = `translateX(${dx}px) rotate(${Math.max(-18, Math.min(18, dx / width * 17))}deg)`;
        card.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / (width * 2)));
        likeBadge.style.opacity = String(dx > 0 ? Math.min(1, dx / (width * 0.26)) : 0);
        passBadge.style.opacity = String(dx < 0 ? Math.min(1, -dx / (width * 0.26)) : 0);
      });
      card.addEventListener("pointerup", event => {
        if (!drag || event.pointerId !== drag.id) return;
        const released = drag;
        drag = null;
        if (card.hasPointerCapture(released.id)) card.releasePointerCapture(released.id);
        const threshold = card.offsetWidth * 0.26;
        const recentFlick = performance.now() - released.lastTime < 100 && Math.abs(released.velocity) > 0.7 && Math.abs(released.x) > 28;
        if (current() && released.active && (Math.abs(released.x) >= threshold || recentFlick)) {
          commitVote(released.x > 0 ? "LIKE" : "PASS", card);
        } else settle();
      });
      const cancelDrag = () => { if (drag) { drag = null; settle(); } };
      card.addEventListener("pointercancel", cancelDrag);
      card.addEventListener("lostpointercapture", cancelDrag);
    }

    function fillMatch(item, revealing) {
      nodes.item.textContent = `${item.emoji}  ${item.title}`;
      nodes.description.textContent = revealing ? "A little suspense. The result is already chosen for this local round." : item.description;
    }

    async function showMatch(animate = false) {
      if (!session.match) return;
      const match = session.match;
      const thisReveal = ++revealGeneration;
      const isSpin = match.source === "TIE_BREAKER";
      const shouldAnimate = animate && isSpin && !revealedMatches.has(match.revision) && !isReducedMotion();
      nodes.eyebrow.textContent = "BROWSER DEMO · JUST THE TWO OF YOU";
      nodes.title.textContent = shouldAnimate ? "A little luck…" : isSpin ? "Your lucky pick!" : "It's a match!";
      nodes.source.textContent = isSpin ? "Random pick from both local like lists. No AI or live partner is involved." : "Both local partners swiped right on this idea.";
      fillMatch(session.matchedItem, false);
      if (!nodes.dialog.open) nodes.dialog.showModal();
      if (shouldAnimate) {
        busy = true;
        updateControls();
        const candidates = session.candidates;
        nodes.dialog.classList.add("is-spinning");
        for (let step = 0; step < 15; step += 1) {
          if (thisReveal !== revealGeneration || !nodes.dialog.open || session.match?.revision !== match.revision) break;
          fillMatch(candidates[step % candidates.length], true);
          if (typeof nodes.item.animate === "function") {
            nodes.item.animate([
              { opacity: 0.3, transform: "translateY(10px)" },
              { opacity: 1, transform: "translateY(0)" },
            ], { duration: 45 + step * 7, easing: "ease-out" });
          }
          await wait(45 + step * 7);
        }
      }
      if (thisReveal !== revealGeneration) return;
      busy = false;
      nodes.dialog.classList.remove("is-spinning");
      if (session.match?.revision === match.revision) {
        fillMatch(session.matchedItem, false);
        nodes.title.textContent = isSpin ? "Your lucky pick!" : "It's a match!";
        revealedMatches.add(match.revision);
        nodes.dialog.classList.toggle("celebrate", !isReducedMotion());
      }
      updateControls();
    }

    function closeMatch() {
      revealGeneration += 1;
      busy = false;
      nodes.dialog.classList.remove("celebrate", "is-spinning");
      if (nodes.dialog.open) nodes.dialog.close();
      updateControls();
    }

    function restart(filter = session.filter) {
      closeMatch();
      revealedMatches.clear();
      session.reset(filter);
      render("A fresh local round. Both demo partners have two vetoes again.");
    }

    function readFilters() {
      return { category: session.filter.category, budget: nodes.budget.value, mood: nodes.mood.value };
    }

    async function loadCatalog() {
      nodes.restart.disabled = true;
      setStatus("Loading the browser demo…");
      updateControls();
      try {
        const response = await fetch(new URL("catalog.json", assetBase), { credentials: "omit" });
        if (!response.ok) throw new Error("Catalogue unavailable");
        const catalog = await response.json();
        const initialCategory = categoryButtons.find(button => button.getAttribute("aria-pressed") === "true" || button.classList.contains("is-active"))?.dataset.category || "FOOD";
        session = new DemoSession(catalog, { category: initialCategory, budget: nodes.budget.value || "HIGH", mood: nodes.mood.value || "CHILL" });
        nodes.restart.textContent = "Restart demo";
        nodes.restart.disabled = false;
        render();
      } catch (_) {
        setStatus("The browser demo couldn't load. Check your connection and retry.");
        nodes.restart.textContent = "Retry demo";
        nodes.restart.disabled = false;
      }
    }

    nodes.pass.addEventListener("click", () => commitVote("PASS"));
    nodes.like.addEventListener("click", () => commitVote("LIKE"));
    nodes.partner.addEventListener("click", () => {
      if (!session || busy) return;
      session.switchPartner();
      render(`${session.partner === 0 ? "Your turn" : "Partner turn"}. These are separate choices on the same browser.`);
    });
    nodes.restart.addEventListener("click", () => { if (session) restart(); else loadCatalog(); });
    nodes.budget.addEventListener("change", () => { if (session) restart(readFilters()); });
    nodes.mood.addEventListener("change", () => { if (session) restart(readFilters()); });
    categoryButtons.forEach(button => button.addEventListener("click", () => {
      if (!session || busy || button.dataset.category === session.filter.category) return;
      restart({ ...readFilters(), category: button.dataset.category });
    }));
    nodes.spin.addEventListener("click", () => {
      if (!session || busy || !session.canSpin) return;
      session.spin();
      render();
      showMatch(true);
    });
    nodes.veto.addEventListener("click", () => {
      if (!session || busy || !session.match) return;
      try {
        if (session.veto(session.match.revision)) {
          closeMatch();
          render("Veto used. That idea is out for both local partners. Keep looking for your yes.");
        }
      } catch (error) { nodes.description.textContent = error.message; updateControls(); }
    });
    nodes.next.addEventListener("click", () => { if (session && !busy) restart(); });
    nodes.close.addEventListener("click", closeMatch);
    nodes.dialog.addEventListener("close", () => {
      if (nodes.dialog.open) return;
      revealGeneration += 1;
      busy = false;
      nodes.dialog.classList.remove("is-spinning");
      updateControls();
    });
    demo.addEventListener("keydown", event => {
      if (!session || busy || nodes.dialog.open || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target.closest("input, select, textarea, button, a, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        commitVote(event.key === "ArrowRight" ? "LIKE" : "PASS");
      }
    });
    await loadCatalog();
  }

  function initialize() { initializeMenu(); initializeDemo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})(typeof window === "undefined" ? globalThis : window);
