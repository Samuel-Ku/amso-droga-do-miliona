//#region src/analytics/events.ts
var e = [
	"game_started",
	"story_completed",
	"game_load_failed"
];
//#endregion
//#region \0@oxc-project+runtime@0.139.0/helpers/esm/typeof.js
function t(e) {
	"@babel/helpers - typeof";
	return t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, t(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.139.0/helpers/esm/toPrimitive.js
function n(e, n) {
	if (t(e) != "object" || !e) return e;
	var r = e[Symbol.toPrimitive];
	if (r !== void 0) {
		var i = r.call(e, n || "default");
		if (t(i) != "object") return i;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (n === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.139.0/helpers/esm/toPropertyKey.js
function r(e) {
	var r = n(e, "string");
	return t(r) == "symbol" ? r : r + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.139.0/helpers/esm/defineProperty.js
function i(e, t, n) {
	return (t = r(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region src/analytics/data-layer.ts
var a = new Set(e), o = /^[a-z0-9][a-z0-9_.-]{0,63}$/, s = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,31}$/;
function c() {
	return typeof window > "u" ? void 0 : window;
}
function l(e) {
	return typeof e == "string" && s.test(e) ? e : "unknown";
}
function u(e) {
	return typeof e == "string" && o.test(e) ? e : void 0;
}
function d(e) {
	try {
		return typeof e == "function" ? e() === !0 : e === !0;
	} catch {
		return !1;
	}
}
function f(e) {
	return e === "story" || e === "challenge" ? e : void 0;
}
var p = class {
	constructor(e) {
		i(this, "gameVersion", void 0), i(this, "directDataLayer", void 0), i(this, "target", void 0), i(this, "consentGranted", void 0), this.gameVersion = l(e.gameVersion), this.directDataLayer = e.dataLayer, this.target = e.target ?? c(), this.consentGranted = e.consentGranted;
	}
	setSourceLocation(e) {
		return this;
	}
	track(e, t, n = {}) {
		if (!d(this.consentGranted) || !a.has(e)) return null;
		let r = e, i = {
			event: r,
			game_name: "droga_do_miliona",
			game_version: this.gameVersion
		};
		if (r === "game_started") {
			let e = f(t.mode);
			if (e === void 0) return null;
			i.mode = e;
		} else if (r === "game_load_failed") {
			let e = u(t.error_code);
			e !== void 0 && (i.error_code = e);
		}
		return this.push(i), i;
	}
	triggerViewed(e) {
		return null;
	}
	openRequested(e) {
		return null;
	}
	loadFailed(e, t) {
		return this.track("game_load_failed", { error_code: e });
	}
	push(e) {
		try {
			if (this.directDataLayer !== void 0) {
				this.directDataLayer.push(e);
				return;
			}
			if (this.target === void 0) return;
			let t = this.target.dataLayer, n = Array.isArray(t) ? t : [];
			n !== t && (this.target.dataLayer = n), n.push(e);
		} catch {}
	}
}, m = "A critical campaign asset is unavailable.", h = class extends Error {
	constructor(e) {
		super(m), i(this, "bundleId", void 0), i(this, "code", "critical_asset_failed"), this.bundleId = e, this.name = "AssetBundleLoadError";
	}
};
function g(e) {
	return `${e.type}:${e.source}`;
}
async function _(e) {
	if (typeof fetch != "function") throw Error("Asset fetch is unavailable.");
	let t = await fetch(e, {
		cache: "force-cache",
		credentials: "same-origin"
	});
	if (!t.ok) throw Error("Asset request failed.");
	await t.blob();
}
async function v(e) {
	e.type !== "procedural" && await _(e.source);
}
var y = class {
	constructor(e, t = {}) {
		i(this, "bundles", /* @__PURE__ */ new Map()), i(this, "loadResource", void 0), i(this, "bundlePromises", /* @__PURE__ */ new Map()), i(this, "bundleResults", /* @__PURE__ */ new Map()), i(this, "resourcePromises", /* @__PURE__ */ new Map()), i(this, "readyResources", /* @__PURE__ */ new Set()), i(this, "optionalLoadsStarted", /* @__PURE__ */ new Set()), i(this, "optionalFailures", /* @__PURE__ */ new Map());
		for (let t of e) this.bundles.set(t.id, t);
		this.loadResource = t.loadResource ?? v;
	}
	isBundleReady(e) {
		return this.bundleResults.has(e);
	}
	async ensureBundles(e, t) {
		let n = [...new Set(e)].map((e) => {
			let t = this.bundles.get(e);
			if (t === void 0) throw new h(e);
			return t;
		}), r = new Set(n.flatMap(({ resources: e }) => e.filter(({ critical: e }) => e).map(g))), i = new Set([...r].filter((e) => this.readyResources.has(e))), a = () => {
			t?.({
				readyCritical: i.size,
				totalCritical: r.size
			});
		};
		a();
		let o = await Promise.all(n.map((e) => this.ensureBundle(e, (e) => {
			let t = g(e);
			r.has(t) && !i.has(t) && (i.add(t), a());
		})));
		for (let e of r) i.add(e);
		return a(), {
			readyBundles: n.map(({ id: e }) => e),
			failedOptional: o.flatMap(({ failedOptional: e }) => e)
		};
	}
	warmBundles(e) {
		return this.ensureBundles(e);
	}
	ensureBundle(e, t) {
		this.startOptionalLoads(e);
		let n = this.bundleResults.get(e.id);
		if (n !== void 0) {
			for (let n of e.resources) n.critical && t(n);
			return Promise.resolve(n);
		}
		let r = this.bundlePromises.get(e.id);
		if (r !== void 0) return r.then((n) => {
			for (let n of e.resources) n.critical && t(n);
			return n;
		});
		let i = e.resources.filter(({ critical: e }) => e), a = Promise.all(i.map(async (n) => {
			try {
				await this.loadOnce(n), t(n);
			} catch {
				throw new h(e.id);
			}
		})).then(() => {
			let t = { failedOptional: this.optionalFailuresFor(e) };
			return this.bundleResults.set(e.id, t), t;
		}).catch((t) => {
			throw this.bundlePromises.delete(e.id), t;
		});
		return this.bundlePromises.set(e.id, a), a;
	}
	startOptionalLoads(e) {
		for (let t of e.resources) {
			if (t.critical) continue;
			let n = `${e.id}:${t.id}:${g(t)}`;
			this.optionalLoadsStarted.has(n) || (this.optionalLoadsStarted.add(n), this.loadOnce(t).catch(() => {
				this.recordOptionalFailure(e, t);
			}));
		}
	}
	recordOptionalFailure(e, t) {
		let n = this.optionalFailures.get(e.id) ?? /* @__PURE__ */ new Map();
		n.set(t.id, {
			bundleId: e.id,
			resourceId: t.id
		}), this.optionalFailures.set(e.id, n), this.bundleResults.has(e.id) && this.bundleResults.set(e.id, { failedOptional: this.optionalFailuresFor(e) });
	}
	optionalFailuresFor(e) {
		let t = this.optionalFailures.get(e.id);
		return t === void 0 ? [] : e.resources.flatMap((e) => {
			let n = t.get(e.id);
			return n === void 0 ? [] : [n];
		});
	}
	loadOnce(e) {
		let t = g(e);
		if (this.readyResources.has(t)) return Promise.resolve();
		let n = this.resourcePromises.get(t);
		if (n !== void 0) return n;
		let r = Promise.resolve().then(() => this.loadResource(e)).then(() => {
			this.readyResources.add(t);
		}).catch((e) => {
			throw this.resourcePromises.delete(t), e;
		});
		return this.resourcePromises.set(t, r), r;
	}
};
//#endregion
//#region src/assets/asset-bundle-plan.ts
function ee(e) {
	return e === "challenge" ? [
		"common",
		"prologue",
		"challenge"
	] : [
		"common",
		"prologue",
		"epoch_1"
	];
}
var te = [
	"prologue",
	"epoch_1",
	"epoch_2",
	"epoch_3",
	"epoch_4",
	"epoch_5",
	"finale"
];
function ne(e) {
	let t = te.indexOf(e);
	return t < 0 ? null : te[t + 1] ?? null;
}
//#endregion
//#region src/game/milestone-celebration.ts
var re = ["order-confetti"], ie = { "order-confetti": {
	durationSeconds: 1.2,
	audioNotes: [
		523.25,
		659.25,
		783.99
	]
} };
function ae(e) {
	return Math.floor(e).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, " ");
}
function oe(e, t) {
	return e * (t % 2 == 0 ? 5 : 2);
}
function se(e, t) {
	let n = re[0];
	return {
		threshold: e,
		kind: n,
		intensity: Math.min(6, t + 1),
		durationSeconds: Math.min(1.8, ie[n].durationSeconds + t * .12),
		text: `${ae(e)} PACZEK!`
	};
}
var ce = class {
	constructor() {
		i(this, "threshold", 10), i(this, "sequenceIndex", 0), i(this, "active", null), i(this, "queue", []);
	}
	get nextThreshold() {
		return this.threshold;
	}
	get snapshot() {
		return this.active === null ? null : { ...this.active };
	}
	recordOrders(e, t = !0, n) {
		let r = [];
		for (; e >= this.threshold;) {
			let e = se(this.threshold, this.sequenceIndex), i = n === void 0 ? e : this.finaleEvent(e.threshold, `${n} · ${e.text}`, e.intensity, "record");
			r.push(i), this.enqueue(i, t), this.threshold = oe(this.threshold, this.sequenceIndex), this.sequenceIndex += 1;
		}
		return r;
	}
	recordAchievement(e, t, n = !0) {
		let r = this.finaleEvent(Math.max(0, Math.floor(e)), t, 2, "record");
		return this.enqueue(r, n), r;
	}
	finaleEvent(e, t, n, r) {
		return {
			threshold: e,
			kind: "order-confetti",
			intensity: Math.max(2, n),
			durationSeconds: 1.5,
			text: t,
			...r === void 0 ? {} : { achievement: r }
		};
	}
	enqueue(e, t) {
		this.active === null && t ? this.activate(e) : this.queue.push(e);
	}
	advance(e, t = !0) {
		if (this.active === null) {
			if (t) {
				let e = this.queue.shift();
				e !== void 0 && this.activate(e);
			}
			return;
		}
		if (e <= 0) return;
		let n = Math.max(0, this.active.remainingSeconds - e);
		if (n > 0) {
			this.active = {
				...this.active,
				remainingSeconds: n,
				progress: 1 - n / this.active.durationSeconds
			};
			return;
		}
		if (this.active = null, t) {
			let e = this.queue.shift();
			e !== void 0 && this.activate(e);
		}
	}
	reset() {
		this.threshold = 10, this.sequenceIndex = 0, this.active = null, this.queue.length = 0;
	}
	activate(e) {
		this.active = {
			...e,
			remainingSeconds: e.durationSeconds,
			progress: 0
		};
	}
}, le = 2.4, ue = 1e-4;
function de(e) {
	return 622.25 * 2 ** (Math.max(0, Math.min(4, Math.floor(e) - 1)) / 12);
}
function fe(e, t) {
	return typeof e != "number" || !Number.isFinite(e) ? t : Math.max(0, Math.min(1, e));
}
function pe() {
	let e = globalThis;
	return e.AudioContext ?? e.webkitAudioContext ?? null;
}
var me = class {
	constructor(e = {}) {
		i(this, "contextFactory", void 0), i(this, "musicVolume", void 0), i(this, "cueVolume", void 0), i(this, "context", null), i(this, "masterGain", null), i(this, "musicGain", null), i(this, "cueGain", null), i(this, "phraseTimer", null), i(this, "activeOscillators", /* @__PURE__ */ new Set()), i(this, "_muted", void 0), i(this, "_unlocked", !1), i(this, "_started", !1), i(this, "destroyed", !1), i(this, "musicState", {
			chapter: 0,
			phase: "breath",
			finaleLayer: 0
		}), this._muted = e.muted ?? !1, this.musicVolume = fe(e.musicVolume, .18), this.cueVolume = fe(e.cueVolume, .42), this.contextFactory = e.contextFactory;
	}
	get supported() {
		return !this.destroyed && (this.contextFactory !== void 0 || pe() !== null);
	}
	get unlocked() {
		return this._unlocked;
	}
	get started() {
		return this._started;
	}
	get muted() {
		return this._muted;
	}
	async unlock() {
		if (this.destroyed) return !1;
		let e = this.ensureContext();
		if (e === null) return !1;
		try {
			return e.state === "suspended" && await e.resume(), e.state === "closed" ? !1 : (this._unlocked = !0, !0);
		} catch {
			return !1;
		}
	}
	async start() {
		return this.destroyed || !await this.unlock() ? !1 : this._started ? !0 : (this._started = !0, this.scheduleMusicPhrase(), this.phraseTimer = globalThis.setInterval(() => this.scheduleMusicPhrase(), le * 1e3), !0);
	}
	stop() {
		this.phraseTimer !== null && (globalThis.clearInterval(this.phraseTimer), this.phraseTimer = null), this._started = !1, this.stopActiveOscillators();
	}
	setMuted(e) {
		this._muted = e;
		let t = this.context, n = this.masterGain?.gain;
		if (!(t === null || n === void 0 || t.state === "closed")) try {
			n.cancelScheduledValues(t.currentTime), n.setTargetAtTime(+!e, t.currentTime, .012);
		} catch {}
	}
	toggleMuted() {
		return this.setMuted(!this._muted), this._muted;
	}
	setMusicState(e) {
		this.musicState = {
			chapter: Math.max(0, Math.min(6, Math.floor(e.chapter))),
			phase: e.phase,
			finaleLayer: Math.max(0, Math.min(4, Math.floor(e.finaleLayer)))
		};
	}
	playCue(e) {
		if (!(!this._started || this.destroyed || this.context === null || this.cueGain === null)) try {
			switch (e) {
				case "jump":
					this.playTone({
						frequency: 420,
						frequencyEnd: 700,
						duration: .14,
						volume: .7,
						type: "sine",
						destination: this.cueGain
					});
					break;
				case "slide":
					this.playTone({
						frequency: 250,
						frequencyEnd: 120,
						duration: .16,
						volume: .54,
						type: "triangle",
						destination: this.cueGain
					});
					break;
				case "package":
					this.playTone({
						frequency: 660,
						frequencyEnd: 990,
						duration: .12,
						volume: .62,
						type: "sine",
						destination: this.cueGain
					});
					break;
				case "power-up":
					this.playSequence([
						523.25,
						659.25,
						783.99
					], .075, .13, .64, "triangle");
					break;
				case "collision":
					this.playTone({
						frequency: 150,
						frequencyEnd: 54,
						duration: .23,
						volume: .74,
						type: "sawtooth",
						destination: this.cueGain
					});
					break;
				case "corridor-enter":
					this.playSequence([
						392,
						523.25,
						659.25
					], .11, .24, .44, "sine");
					break;
				case "corridor-exit":
					this.playSequence([
						659.25,
						523.25,
						392
					], .1, .2, .42, "sine");
					break;
				case "tape":
					this.playSequence([1680, 1280], .055, .07, .28, "square");
					break;
				case "laptop-start":
					this.playSequence([
						220,
						440,
						659.25
					], .07, .12, .34, "sine");
					break;
				case "test-signal":
					this.playSequence([880, 1046.5], .09, .08, .3, "square");
					break;
				case "scanner":
					this.playTone({
						frequency: 520,
						frequencyEnd: 1240,
						duration: .2,
						volume: .32,
						type: "sine",
						destination: this.cueGain
					});
					break;
				case "conveyor":
					this.playTone({
						frequency: 105,
						frequencyEnd: 155,
						duration: .24,
						volume: .25,
						type: "triangle",
						destination: this.cueGain
					});
					break;
				case "counter":
					this.playSequence([
						523.25,
						659.25,
						783.99
					], .065, .085, .31, "triangle");
					break;
				case "wave-success":
					this.playSequence([523.25, 659.25], .07, .1, .42, "triangle");
					break;
				case "wave-perfect":
					this.playSequence([
						523.25,
						659.25,
						783.99
					], .055, .12, .5, "triangle");
					break;
				case "wave-retry":
					this.playTone({
						frequency: 196,
						frequencyEnd: 174.61,
						duration: .16,
						volume: .28,
						type: "sine",
						destination: this.cueGain
					});
					break;
				case "chapter-complete":
					this.playSequence([
						392,
						523.25,
						659.25,
						783.99
					], .07, .16, .52, "triangle");
					break;
				case "million":
					this.playSequence([
						261.63,
						329.63,
						392,
						523.25,
						659.25
					], .08, .24, .58, "triangle");
					break;
			}
		} catch {}
	}
	playOrderPickup(e) {
		let t = de(e);
		this.withCueOutput((e) => {
			this.playTone({
				frequency: t,
				frequencyEnd: t * 1.18,
				duration: .1,
				volume: .54,
				type: "sine",
				destination: e
			});
		});
	}
	playParcelPickup(e) {
		this.playOrderPickup(e);
	}
	playEquipmentPickup() {
		this.withCueOutput(() => {
			this.playSequence([
				659.25,
				880,
				1174.66
			], .045, .11, .56, "triangle");
		});
	}
	playPowerUpCue(e) {
		this.withCueOutput(() => {
			e === "gwarancja_48" ? this.playSequence([
				329.63,
				392,
				523.25,
				659.25
			], .06, .14, .55, "sine") : this.playSequence([
				523.25,
				783.99,
				1046.5
			], .055, .12, .59, "triangle");
		});
	}
	playMilestoneCue(e, t) {
		this.withCueOutput(() => {
			let n = [...ie[e].audioNotes];
			t >= 2 && n.push(n.at(-1) * 1.25), t >= 3 && n.push(n.at(-2) * 1.5), this.playSequence(n, .055, .12, .55, "triangle");
		});
	}
	playRecordCue() {
		this.withCueOutput(() => {
			this.playSequence([
				659.25,
				783.99,
				1046.5,
				1318.51
			], .045, .1, .48, "triangle");
		});
	}
	withCueOutput(e) {
		if (!(this._muted || !this._started || this.destroyed || this.context === null || this.cueGain === null)) try {
			e(this.cueGain);
		} catch {}
	}
	async destroy() {
		if (this.destroyed) return;
		this.destroyed = !0, this.stop(), this._unlocked = !1;
		let e = this.context;
		if (this.context = null, this.masterGain = null, this.musicGain = null, this.cueGain = null, !(e === null || e.state === "closed")) try {
			await e.close();
		} catch {}
	}
	ensureContext() {
		if (this.context !== null && this.context.state !== "closed") return this.context;
		try {
			let e = pe(), t = this.contextFactory === void 0 ? e === null ? null : new e() : this.contextFactory();
			if (t === null) return null;
			let n = t.createGain(), r = t.createGain(), i = t.createGain();
			return n.gain.value = +!this._muted, r.gain.value = this.musicVolume, i.gain.value = this.cueVolume, r.connect(n), i.connect(n), n.connect(t.destination), this.context = t, this.masterGain = n, this.musicGain = r, this.cueGain = i, t;
		} catch {
			return this.context = null, this.masterGain = null, this.musicGain = null, this.cueGain = null, null;
		}
	}
	scheduleMusicPhrase() {
		if (!this._started || this.context === null || this.musicGain === null) return;
		let e = [
			261.63,
			329.63,
			392,
			329.63,
			293.66,
			349.23
		];
		for (let t = 0; t < e.length; t += 1) {
			let n = e[t];
			n !== void 0 && this.playTone({
				frequency: n,
				duration: .32,
				volume: t % 3 == 0 ? .46 : .34,
				type: t % 2 == 0 ? "sine" : "triangle",
				delay: t * .4,
				destination: this.musicGain
			});
		}
		let t = 98 * 2 ** (this.musicState.chapter % 4 / 12);
		this.playMusicSequence([t, t * 1.5], 1.2, .28, .18, "triangle"), this.musicState.phase === "burst" && this.playMusicSequence([
			82,
			118,
			82
		], .8, .08, .16, "square");
		for (let e = 0; e < this.musicState.finaleLayer; e += 1) this.playMusicSequence([392 * 2 ** (e / 12)], .4 + e * .08, .2, .12, "sine");
	}
	playMusicSequence(e, t, n, r, i) {
		let a = this.musicGain;
		a !== null && e.forEach((e, o) => this.playTone({
			frequency: e,
			duration: n,
			volume: r,
			type: i,
			delay: o * t,
			destination: a
		}));
	}
	playSequence(e, t, n, r, i) {
		if (this.cueGain !== null) for (let a = 0; a < e.length; a += 1) {
			let o = e[a];
			o !== void 0 && this.playTone({
				frequency: o,
				duration: n,
				volume: r,
				type: i,
				delay: a * t,
				destination: this.cueGain
			});
		}
	}
	playTone(e) {
		let t = this.context;
		if (t === null || t.state === "closed") return;
		let n = t.currentTime + Math.max(0, e.delay ?? 0), r = n + Math.max(.03, e.duration), i = t.createOscillator(), a = t.createGain();
		i.type = e.type ?? "sine", i.frequency.setValueAtTime(Math.max(1, e.frequency), n), e.frequencyEnd !== void 0 && i.frequency.exponentialRampToValueAtTime(Math.max(1, e.frequencyEnd), r);
		let o = Math.max(ue, Math.min(1, e.volume));
		a.gain.setValueAtTime(ue, n), a.gain.exponentialRampToValueAtTime(o, n + .018), a.gain.exponentialRampToValueAtTime(ue, r), i.connect(a), a.connect(e.destination), this.activeOscillators.add(i), i.addEventListener("ended", () => {
			this.activeOscillators.delete(i), i.disconnect(), a.disconnect();
		}, { once: !0 }), i.start(n), i.stop(r + .02);
	}
	stopActiveOscillators() {
		for (let e of this.activeOscillators) try {
			e.stop(), e.disconnect();
		} catch {}
		this.activeOscillators.clear();
	}
}, b = {
	gravity: 2200,
	jumpVelocity: -760,
	maxFallVelocity: 1250,
	coyoteSeconds: .1,
	jumpBufferSeconds: .12
}, he = { hitboxDrop: 36 }, x = {
	topY: 200,
	clearance: 54,
	visualLift: 34
}, ge = 432 - x.clearance - x.topY, _e = { zonePixels: 8e3 }, S = {
	pixelsPerMeter: 35,
	packageScore: 100,
	equipmentScore: 250,
	fixedStepSeconds: 1 / 120,
	maxFrameSeconds: .1,
	maxFixedStepsPerFrame: 12,
	snapshotIntervalSeconds: .1,
	obstaclePoolSize: 12,
	packagePoolSize: 48,
	spawnPadding: 72
}, C = {
	firstAtSeconds: 42,
	intervalSeconds: 85,
	warningSeconds: 1.8,
	firstAttackDelaySeconds: .8,
	betweenAttacksSeconds: 2.6,
	rewardSeconds: 2.2,
	attackCount: 8,
	phaseCount: 3,
	scoreBonus: 800
}, ve = {
	maxDpr: 2,
	maxPixels: 21e5,
	maxDimension: 2048
};
//#endregion
//#region src/game/collision.ts
function w(e, t) {
	return e.x < t.x + t.width && e.x + e.width > t.x && e.y < t.y + t.height && e.y + e.height > t.y;
}
function T(e) {
	return e.crouching ? {
		x: e.x + 12,
		y: e.y + 9 + he.hitboxDrop,
		width: e.width - 23,
		height: e.height - 12 - he.hitboxDrop
	} : {
		x: e.x + 12,
		y: e.y + 9,
		width: e.width - 23,
		height: e.height - 12
	};
}
function ye(e) {
	if (e.kind === "overhead") return {
		x: e.x + 4,
		y: e.y + 6,
		width: e.width - 8,
		height: e.height - 6
	};
	let t = e.kind === "pallet" ? 8 : 5, n = e.kind === "trolley" ? 6 : 3;
	return {
		x: e.x + t,
		y: e.y + n,
		width: e.width - t * 2,
		height: e.height - n
	};
}
function be(e, t) {
	return t.active && w(T(e), ye(t));
}
function xe(e, t) {
	return e * (t === "equipment" ? .132 : .18);
}
function Se(e, t) {
	if (!t.active) return !1;
	let n = xe(t.size, t.collectibleClass);
	return w(T(e), {
		x: t.x + n,
		y: t.y + n,
		width: t.size - n * 2,
		height: t.size - n * 2
	});
}
//#endregion
//#region src/game/boss.ts
var Ce = [
	"pallet",
	"overhead",
	"trolley",
	"pallet",
	"overhead",
	"trolley",
	"pallet",
	"overhead"
], we = [
	3,
	6,
	C.attackCount
];
function Te() {
	return {
		phase: "inactive",
		encounterPhase: 1,
		cycle: 0,
		attacksLaunched: 0,
		attacksSurvived: 0,
		attackCount: C.attackCount,
		phaseSecondsRemaining: 0,
		x: 1040,
		y: 256,
		width: 164,
		height: 176
	};
}
var Ee = class {
	constructor() {
		i(this, "model", Te()), i(this, "nextEncounterAt", C.firstAtSeconds), i(this, "attackCooldown", 0), i(this, "awaitingResolution", !1), i(this, "hazardSeen", !1);
	}
	get blocksRegularSpawns() {
		return this.model.phase !== "inactive";
	}
	reset() {
		Object.assign(this.model, Te()), this.nextEncounterAt = C.firstAtSeconds, this.attackCooldown = 0, this.awaitingResolution = !1, this.hazardSeen = !1;
	}
	forceEncounter() {
		this.model.phase === "inactive" && (this.model.phase = "pending", this.model.cycle += 1, this.model.attacksLaunched = 0, this.model.attacksSurvived = 0, this.model.encounterPhase = 1, this.model.x = 1022);
	}
	resolveCollision() {
		this.awaitingResolution && (this.awaitingResolution = !1, this.hazardSeen = !1, this.attackCooldown = C.betweenAttacksSeconds);
	}
	advance(e, t, n, r) {
		let i = Math.max(0, e);
		if (this.model.phase === "inactive") {
			if (t < this.nextEncounterAt) return { type: "none" };
			this.model.phase = "pending", this.model.cycle += 1, this.model.attacksLaunched = 0, this.model.attacksSurvived = 0, this.model.encounterPhase = 1, this.model.x = 1022;
		}
		if (this.model.phase === "pending") return n ? (this.model.phase = "warning", this.model.phaseSecondsRemaining = C.warningSeconds, { type: "none" }) : { type: "none" };
		if (this.model.phase === "warning") {
			this.model.phaseSecondsRemaining = Math.max(0, this.model.phaseSecondsRemaining - i);
			let e = 1 - this.model.phaseSecondsRemaining / C.warningSeconds;
			return this.model.x = 1022 - e * 222, this.model.phaseSecondsRemaining > 0 ? { type: "none" } : (this.model.phase = "attacking", this.model.x = 800, this.attackCooldown = C.firstAttackDelaySeconds, { type: "none" });
		}
		if (this.model.phase === "attacking") {
			if (this.awaitingResolution) {
				if (r && (this.hazardSeen = !0), !r && this.hazardSeen) {
					if (this.awaitingResolution = !1, this.hazardSeen = !1, this.model.attacksSurvived += 1, this.model.attacksSurvived >= this.model.attackCount) return this.model.phase = "reward", this.model.phaseSecondsRemaining = C.rewardSeconds, this.nextEncounterAt = t + C.intervalSeconds, { type: "complete" };
					let e = we[this.model.encounterPhase - 1];
					if (e !== void 0 && this.model.attacksSurvived >= e) return this.model.encounterPhase = Math.min(C.phaseCount, this.model.encounterPhase + 1), this.model.phase = "warning", this.model.phaseSecondsRemaining = C.warningSeconds, { type: "none" };
					this.attackCooldown = C.betweenAttacksSeconds;
				}
				return { type: "none" };
			}
			if (this.attackCooldown = Math.max(0, this.attackCooldown - i), this.attackCooldown > 0 || !n) return { type: "none" };
			let e = Ce[this.model.attacksSurvived % Ce.length] ?? "pallet";
			return this.model.attacksLaunched += 1, this.awaitingResolution = !0, this.hazardSeen = !1, {
				type: "attack",
				kind: e
			};
		}
		return this.model.phase === "reward" && (this.model.phaseSecondsRemaining = Math.max(0, this.model.phaseSecondsRemaining - i), this.model.x += i * 245, this.model.phaseSecondsRemaining <= 0 && (this.model.phase = "inactive", this.model.x = 1040)), { type: "none" };
	}
}, De = 280;
function Oe(e) {
	return Math.max(0, Math.min(1, e));
}
function E(e, t, n) {
	return e + (t - e) * Oe(n);
}
function ke(e) {
	let t = Math.max(0, e), n;
	return n = t <= 15 ? 1 : t <= 40 ? E(1, 1.2, (t - 15) / 25) : t <= 75 ? E(1.2, 1.4, (t - 40) / 35) : E(1.4, 1.55, (t - 75) / 55), {
		level: Math.min(6, 1 + Math.floor(t / 15)),
		speed: De * n,
		speedMultiplier: n,
		minimumGapSeconds: E(2.25, 1.45, (n - 1) / .55)
	};
}
function Ae(e, t, n) {
	let r = Math.max(1, t), i = Math.max(.5, Math.min(2, n.speedStartMultiplier)), a = Math.max(i, Math.min(2, n.speedMaxMultiplier)), o = E(i, a, Math.max(0, e) / r);
	return {
		level: Math.min(6, 1 + Math.floor(Math.max(0, e) / 60)),
		speed: De * o,
		speedMultiplier: o,
		minimumGapSeconds: E(2.45, 1.9, (o - i) / Math.max(.01, a - i))
	};
}
function je(e, t) {
	let n = Math.max(0, e), r = Math.max(.8, Math.min(2, t.speedStartMultiplier)), i = Math.max(r, Math.min(3.5, t.speedMaxMultiplier)), a = Math.min(i, 2.4), o = Math.min(i, 3), s = n <= 60 ? E(r, a, n / 60) : n <= 120 ? E(a, o, (n - 60) / 60) : E(o, i, (n - 120) / 60);
	return {
		level: Math.min(16, 1 + Math.floor(n / 20)),
		speed: De * s,
		speedMultiplier: s,
		minimumGapSeconds: E(2.05, 1.2, (s - r) / Math.max(.01, i - r))
	};
}
function Me(e, t, n, r) {
	let i = Math.max(.5, Math.min(2, n)), a = E(i, Math.max(i, Math.min(2, r)), Math.max(0, e) / Math.max(1, t));
	return {
		level: 1 + Math.floor(Math.max(0, e) / 12),
		speed: De * a,
		speedMultiplier: a,
		minimumGapSeconds: E(2.25, 1.55, (a - .95) / .9)
	};
}
//#endregion
//#region src/game/physics.ts
var Ne = {
	...b,
	groundY: 432
};
function Pe() {
	return {
		x: 142,
		y: 350,
		width: 58,
		height: 82,
		velocityY: 0,
		grounded: !0,
		crouching: !1,
		crouchElapsedSeconds: 0,
		coyoteRemaining: b.coyoteSeconds,
		jumpBufferRemaining: 0
	};
}
function Fe(e, t = Ne.jumpBufferSeconds) {
	e.jumpBufferRemaining = Math.max(e.jumpBufferRemaining, t);
}
function Ie(e, t, n = Ne) {
	let r = Math.max(0, t);
	e.jumpBufferRemaining = Math.max(0, e.jumpBufferRemaining - r), e.grounded ? e.coyoteRemaining = n.coyoteSeconds : e.coyoteRemaining = Math.max(0, e.coyoteRemaining - r), e.jumpBufferRemaining > 0 && (e.grounded || e.coyoteRemaining > 0) && (e.velocityY = n.jumpVelocity, e.grounded = !1, e.coyoteRemaining = 0, e.jumpBufferRemaining = 0), e.grounded || (e.velocityY = Math.min(n.maxFallVelocity, e.velocityY + n.gravity * r), e.y += e.velocityY * r, e.crouching = !1);
	let i = n.groundY - e.height;
	e.y >= i && (e.y = i, e.velocityY = 0, e.grounded = !0);
}
//#endregion
//#region src/game/random.ts
var Le = 4294967296;
function Re(e) {
	return Number.isFinite(e) ? Math.trunc(e) >>> 0 : 1831565813;
}
var ze = class {
	constructor(e) {
		i(this, "value", void 0), this.value = Re(e);
	}
	next() {
		this.value = this.value + 1831565813 >>> 0;
		let e = this.value;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / Le;
	}
	range(e, t) {
		return e + (t - e) * this.next();
	}
	integer(e, t) {
		return Math.floor(this.range(e, t + 1));
	}
};
function Be(e, t) {
	let n = Re(e) ^ Math.imul(t + 1, 2654435761);
	return n ^= n >>> 16, n = Math.imul(n, 2146121005), n ^= n >>> 15, n = Math.imul(n, 2221713035), (n ^ n >>> 16) >>> 0;
}
//#endregion
//#region src/game/courier-brand.ts
var D = {
	capAndShirt: "#ff7a15",
	belt: "#f47100",
	trousers: "#171717",
	shoesAndMark: "#ffffff",
	scanner: "#44413d",
	scannerScreen: "#27b936"
}, Ve = new class {
	drawMark(e, t) {
		let { x: n, y: r, width: i, height: a } = t;
		e.save(), e.translate(n, r), e.scale(i, a), e.fillStyle = D.shoesAndMark, e.lineJoin = "round", e.beginPath(), e.moveTo(.02, .96), e.lineTo(.39, .05), e.quadraticCurveTo(.44, -.02, .5, .05), e.lineTo(.94, .96), e.lineTo(.69, .96), e.lineTo(.47, .42), e.lineTo(.26, .96), e.closePath(), e.fill(), e.beginPath(), e.moveTo(.3, .67), e.lineTo(.68, .67), e.lineTo(.75, .82), e.lineTo(.24, .82), e.closePath(), e.fill(), e.restore();
	}
}(), He = 12, Ue = 22, We = 280, Ge = 980, Ke = .22, qe = .12, Je = 1.8, Ye = Math.PI / 15;
function Xe(e) {
	return Math.max(0, Math.min(1, Number.isFinite(e) ? e : 0));
}
function Ze(e) {
	let t = Math.max(0, Number.isFinite(e.elapsedSeconds) ? e.elapsedSeconds : 0), n = Math.max(0, e.activationSecondsRemaining), r = Math.max(0, e.breakSecondsRemaining), i = r > 0 ? Xe(1 - r / qe) : 0;
	if (e.reducedMotion) {
		let e = n > 0 ? Xe(1 - n / Ke) : 1;
		return {
			scale: 1,
			alpha: i > 0 ? 1 - i : e,
			meshRotationRadians: 0,
			breakingProgress: i
		};
	}
	if (i > 0) return {
		scale: 1 + i * .08,
		alpha: 1 - i,
		meshRotationRadians: t * Ye,
		breakingProgress: i
	};
	if (n > 0) {
		let e = Xe(1 - n / Ke);
		return {
			scale: e <= .7 ? .72 + .3600000000000001 * e / .7 : 1.08 + -.08000000000000007 * (e - .7) / .3,
			alpha: e * e * (3 - 2 * e),
			meshRotationRadians: t * Ye,
			breakingProgress: 0
		};
	}
	let a = Math.sin(t * Math.PI * 2 / Je);
	return {
		scale: 1.025 + a * .025,
		alpha: .9 + a * .1,
		meshRotationRadians: t * Ye,
		breakingProgress: 0
	};
}
function Qe(e) {
	return He + Math.max(0, Math.min(1, ((Number.isFinite(e) ? e : We) - We) / (Ge - We))) * (Ue - He);
}
function $e(e, t) {
	return t === null ? null : {
		centerX: e.x + 58 / 2,
		centerY: e.y + e.height / 2,
		radiusX: 79,
		radiusY: 87,
		breaking: t === "breaking"
	};
}
var O = {
	width: 960,
	height: 540,
	y: 432,
	baseOffsetY: 5,
	baseWidth: 18,
	accentWidth: 7,
	baseColor: "#171717",
	gradientStops: [
		{
			offset: 0,
			color: "#f47100"
		},
		{
			offset: .52,
			color: "#f04f45"
		},
		{
			offset: 1,
			color: "#eb32a4"
		}
	]
}, k = O.y, et = O.baseOffsetY, tt = O.baseWidth, nt = O.accentWidth, rt = O.baseColor, it = O.gradientStops, at = `
  <svg class="amso-world-visual__route" viewBox="0 0 ${O.width} ${O.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="amso-world-route-gradient" x1="0" x2="1">
        ${it.map(({ offset: e, color: t }) => `<stop offset="${e}" stop-color="${t}" />`).join("\n        ")}
      </linearGradient>
    </defs>
    <path d="M-12 ${k + et}H${O.width + 12}" stroke="${rt}" stroke-width="${tt}" stroke-linecap="round" />
    <path d="M-12 ${k}H${O.width + 12}" stroke="url(#amso-world-route-gradient)" stroke-width="${nt}" stroke-linecap="round" />
  </svg>
`, ot = [
	"notebook",
	"telefon",
	"pc",
	"lcd",
	"parcel"
], st = [
	"/assets/milion-runner/orders/parcel-01.webp",
	"/assets/milion-runner/orders/parcel-02.webp",
	"/assets/milion-runner/orders/parcel-03.webp",
	"/assets/milion-runner/orders/parcel-04.webp"
], ct = "/assets/milion-runner/orders/order-atlas.webp", lt = "/assets/milion-runner/powerups/powerup-atlas.webp", ut = "/assets/milion-runner/courier/courier-run-sheet.webp", dt = "/assets/milion-runner/courier/courier-crouch-sheet.webp", ft = "/assets/milion-runner/courier/courier-jump-sheet.webp", pt = {
	"box-stack": "/assets/milion-runner/obstacles/box-stack.webp",
	pallet: "/assets/milion-runner/obstacles/pallet.webp",
	trolley: "/assets/milion-runner/obstacles/trolley.webp",
	overhead: "/assets/milion-runner/obstacles/overhead.webp"
}, mt = [
	pt.overhead,
	"/assets/milion-runner/obstacles/overhead-door.webp",
	"/assets/milion-runner/obstacles/overhead-conveyor.webp"
], ht = 512, gt = 470, _t = 170, vt = .9, yt = 16, bt = 250, xt = [
	250,
	310,
	310,
	310,
	310,
	310,
	310,
	310
], A = 256;
function St(e, t, n) {
	return n ? 0 : Math.floor(Math.max(0, e) * 5 + Math.max(0, t)) % st.length;
}
function Ct(e, t) {
	if (!e.grounded) return e.velocityY < -40 ? 3 : e.velocityY > 40 ? 7 : 4;
	let n = Qe(t.speed);
	return Math.floor(t.elapsedSeconds * n) % 8;
}
function wt(e) {
	return e.crouching ? Math.min(7, Math.floor(e.crouchElapsedSeconds * yt)) : 0;
}
function Tt(e) {
	let t = Number.isFinite(e.velocityY) ? e.velocityY : 0, n = Math.abs(b.jumpVelocity), r = Math.max(0, Math.min(1, (t + n) / (n * 2)));
	return Math.min(7, Math.floor(r * 8));
}
function Et(e) {
	return (bt - (xt[Math.max(0, Math.min(7, e))] ?? bt)) / ht * _t;
}
function Dt() {
	let e = globalThis.Image;
	return typeof e == "function" ? new e() : null;
}
function j(e, t) {
	let n = t?.() ?? Dt();
	return n === null ? null : (n.decoding = "async", n.src = e, n);
}
function M(e) {
	return e !== null && e.complete && e.naturalWidth > 0;
}
var Ot = class {
	constructor(e) {
		i(this, "orders", void 0), i(this, "powerUps", void 0), i(this, "courier", void 0), i(this, "courierCrouch", void 0), i(this, "courierJump", void 0), i(this, "obstacles", void 0), i(this, "overheadVariants", void 0), i(this, "parcelFrames", void 0), this.orders = j(ct, e), this.powerUps = j(lt, e), this.courier = j(ut, e), this.courierCrouch = j(dt, e), this.courierJump = j(ft, e), this.obstacles = {
			"box-stack": j(pt["box-stack"], e),
			pallet: j(pt.pallet, e),
			trolley: j(pt.trolley, e),
			overhead: j(pt.overhead, e)
		}, this.overheadVariants = [this.obstacles.overhead, ...mt.slice(1).map((t) => j(t, e))], this.parcelFrames = st.map((t) => j(t, e));
	}
	drawObstacle(e, t) {
		if (!t.active) return !0;
		let n = t.kind === "overhead" ? this.overheadVariants[Math.abs(Math.floor(t.visualVariant ?? 0)) % this.overheadVariants.length] ?? this.obstacles.overhead : this.obstacles[t.kind];
		if (!M(n)) return !1;
		if (e.save(), e.imageSmoothingEnabled = !0, e.imageSmoothingQuality = "high", t.kind === "overhead") {
			let r = t.width + 18, i = r * n.naturalHeight / n.naturalWidth, a = t.x - (r - t.width) / 2, o = t.y + t.height - i - x.visualLift, s = r * .095;
			return e.strokeStyle = "#2d343b", e.lineWidth = 5, e.beginPath(), e.moveTo(a + s, 0), e.lineTo(a + s, o + i * .28), e.moveTo(a + r - s, 0), e.lineTo(a + r - s, o + i * .28), e.stroke(), e.drawImage(n, a, o, r, i), e.restore(), !0;
		}
		let r = Math.min(t.width / n.naturalWidth, t.height / n.naturalHeight), i = n.naturalWidth * r, a = n.naturalHeight * r, o = t.x + (t.width - i) / 2, s = t.y + t.height - a;
		return e.drawImage(n, o, s, i, a), e.restore(), !0;
	}
	drawOrder(e, t, n, r, i) {
		if (!M(this.orders)) return !1;
		let a = ot.indexOf(t);
		return a < 0 ? !1 : (e.drawImage(this.orders, a * A, 0, A, A, n, r, i, i), !0);
	}
	drawPowerUp(e, t, n, r, i) {
		if (!M(this.powerUps)) return !1;
		let a = t === "gwarancja_48" ? 0 : 1;
		return e.drawImage(this.powerUps, a * A, 0, A, A, n, r, i, i), !0;
	}
	drawParcelOrder(e, t, n, r, i, a, o) {
		let s = this.parcelFrames[St(i, a, o)] ?? null;
		return M(s) ? (e.drawImage(s, t, n, r, r), !0) : this.drawOrder(e, "parcel", t, n, r);
	}
	drawCourier(e, t, n) {
		let r = t.crouching && M(this.courierCrouch), i = !t.grounded && M(this.courierJump), a = r ? this.courierCrouch : i ? this.courierJump : this.courier;
		if (!M(a)) return !1;
		let o = r ? n.reducedMotion ? 7 : wt(t) : i ? Tt(t) : n.reducedMotion ? 0 : Ct(t, n), s = r ? _t * vt : _t, c = t.y + t.height + 4, l = t.x + t.width / 2 - s / 2 + (r ? Et(o) : 0), u = c - gt / ht * s;
		return e.drawImage(a, o * ht, 0, ht, ht, l, u, s, s), !0;
	}
}, N = {
	ink: "#171717",
	inkSoft: "#44413d",
	red: "#f04f45",
	redDark: "#eb32a4",
	orange: "#f47100",
	wall: "#faf7f0",
	wallShade: "#e4ded5",
	floor: "#d8d2c8",
	floorDark: "#aaa39a",
	white: "#ffffff",
	cardboard: "#c8a27b",
	cardboardLight: "#dfbd98",
	blue: "#eb32a4"
}, P;
function kt() {
	if (P !== void 0) return P;
	if (typeof Path2D > "u") return P = null, P;
	let e = new Path2D(), t = Math.sqrt(3) * 11;
	for (let n = -9; n <= 9; n += 1) for (let r = -8; r <= 8; r += 1) {
		let i = r * t + (n % 2 == 0 ? 0 : t / 2), a = n * 16.5;
		for (let t = 0; t < 6; t += 1) {
			let n = Math.PI / 6 + t * Math.PI / 3, r = i + Math.cos(n) * 11, o = a + Math.sin(n) * 11;
			t === 0 ? e.moveTo(r, o) : e.lineTo(r, o);
		}
		e.closePath();
	}
	return P = e, P;
}
var At = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }), F = [
	{
		wall: "#eaf1f3",
		band: "#dbe7ea",
		beam: "#8ca0a6",
		beamShade: "#b7c6ca",
		window: "#c3dfe8",
		windowFrame: "#91b9c7",
		floor: "#cbd5d8",
		floorDark: "#aab8bc",
		shelfFrame: "#81959b",
		shelfBoard: "#70868d",
		shelfPost: "#9aabb0",
		accentA: "#536a73",
		accentB: "#b9c7ca",
		accentC: "#a7b8bd",
		accentWarm: "#df6b3b",
		accentCool: "#7da1b0"
	},
	{
		wall: "#e3eef4",
		band: "#cfe4ee",
		beam: "#7fa6b8",
		beamShade: "#aacbdb",
		window: "#bfe6f2",
		windowFrame: "#79b3c6",
		floor: "#c2d4da",
		floorDark: "#9db9c1",
		shelfFrame: "#7d97a0",
		shelfBoard: "#6c8a93",
		shelfPost: "#93b3bd",
		accentA: "#3f6273",
		accentB: "#a9d3e0",
		accentC: "#8fc1cf",
		accentWarm: "#3aa6c2",
		accentCool: "#5fb6cf"
	},
	{
		wall: "#2b3a47",
		band: "#22303b",
		beam: "#3c5160",
		beamShade: "#56707f",
		window: "#284a5c",
		windowFrame: "#5fa8c4",
		floor: "#243440",
		floorDark: "#16212b",
		shelfFrame: "#3a4f5b",
		shelfBoard: "#2f424d",
		shelfPost: "#48636f",
		accentA: "#7fd3e8",
		accentB: "#3a5867",
		accentC: "#ffd23f",
		accentWarm: "#ffb454",
		accentCool: "#6fd0e6"
	},
	{
		wall: "#f4ece1",
		band: "#ecdcc6",
		beam: "#c79a5e",
		beamShade: "#e3bd87",
		window: "#f6e2bf",
		windowFrame: "#c8923f",
		floor: "#e3d3bf",
		floorDark: "#c4ad8e",
		shelfFrame: "#b08a55",
		shelfBoard: "#9a7743",
		shelfPost: "#c6a06a",
		accentA: "#8a5a23",
		accentB: "#e9c98e",
		accentC: "#d8b273",
		accentWarm: "#e30613",
		accentCool: "#5a8aa0"
	},
	{
		wall: "#e8f1e3",
		band: "#d7e8cd",
		beam: "#8aa877",
		beamShade: "#b3cba2",
		window: "#cfe8c4",
		windowFrame: "#6f9c57",
		floor: "#cdd9c4",
		floorDark: "#a9b99c",
		shelfFrame: "#83a06d",
		shelfBoard: "#6f8c59",
		shelfPost: "#9bb585",
		accentA: "#3f5e2c",
		accentB: "#b6d4a4",
		accentC: "#a3c48c",
		accentWarm: "#e08a2b",
		accentCool: "#4e9b6e"
	}
];
function jt(e, t) {
	return F[Math.floor(Math.max(0, e) / t) % F.length] ?? F[0];
}
function I(e, t) {
	return (e % t + t) % t;
}
function Mt(e, t, n, r, i, a) {
	let o = Math.min(a, r / 2, i / 2);
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function L(e, t, n, r, i, a, o) {
	Mt(e, t, n, r, i, a), e.fillStyle = o, e.fill();
}
function Nt(e, t, n, r) {
	e.fillStyle = r.shelfFrame, e.fillRect(t, 190, 8, 181), e.fillRect(t + 178, 190, 8, 181);
	for (let n of [
		196,
		273,
		350
	]) e.fillStyle = r.shelfBoard, e.fillRect(t - 4, n, 194, 7), e.fillStyle = r.shelfPost, e.fillRect(t, n + 7, 186, 3);
	let i = n % 3;
	e.fillStyle = i === 0 ? r.accentB : r.accentC, e.fillRect(t + 17, 218, 49, 39), e.fillStyle = r.accentA, e.fillRect(t + 23, 223, 37, 25), e.fillStyle = "#c5d1d4", e.fillRect(t + 79, 226, 32, 31), e.fillStyle = i === 2 ? r.accentWarm : r.accentCool, e.fillRect(t + 121, 218, 42, 39), e.fillStyle = N.cardboard, e.fillRect(t + 14, 294, 54, 47), e.fillStyle = N.cardboardLight, e.fillRect(t + 18, 297, 46, 7), e.fillStyle = "#c7d2d4", e.fillRect(t + 78, 303, 38, 38), e.fillStyle = N.red, e.fillRect(t + 129, 314, 37, 27);
}
function Pt(e, t, n, r, i) {
	e.fillStyle = i.wall, e.fillRect(0, 0, 960, 432), e.fillStyle = i.band, e.fillRect(0, 0, 960, 72), e.fillStyle = N.ink, e.fillRect(0, 65, 960, 9);
	let a = -I(t * .05, 240);
	for (let t = a - 40; t < 1040; t += 240) e.fillStyle = i.beam, e.fillRect(t, 73, 9, 117), e.fillStyle = i.beamShade, e.fillRect(t + 9, 73, 4, 117);
	let o = -I(t * .09, 310);
	for (let t = o; t < 1140; t += 310) e.fillStyle = i.window, e.fillRect(t + 32, 96, 170, 66), e.fillStyle = i.windowFrame, e.fillRect(t + 36, 100, 162, 6), e.fillRect(t + 112, 100, 5, 58), e.fillStyle = "rgba(255,255,255,0.62)", e.fillRect(t + 47, 111, 38, 5);
	let s = -I(t * .18, 224), c = Math.floor(t * .18 / 224);
	for (let t = s - 224; t < 1184; t += 224) Nt(e, t, c, i), c += 1;
	e.fillStyle = "rgba(23,49,59,0.08)", e.fillRect(0, 376, 960, 56), e.fillStyle = i.floor, e.fillRect(0, 432, 960, 108), e.fillStyle = i.floorDark, e.fillRect(0, 432, 960, 7), e.fillStyle = "rgba(23,49,59,0.22)", e.fillRect(0, 502, 960, 3);
	let l = -I(t, 124);
	for (let t = l; t < 1084; t += 124) e.fillStyle = "rgba(54,81,91,0.16)", e.fillRect(t, 440, 3, 100);
	let u = -I(t * 1.05, 72);
	for (let t = u - 72; t < 1032; t += 72) e.save(), e.beginPath(), e.rect(t, 444, 40, 7), e.clip(), e.translate(t, 444), e.rotate(-.42), e.fillStyle = "rgba(244,161,36,0.5)", e.fillRect(-12, -15, 16, 45), e.restore();
	e.fillStyle = "#ffffff";
	for (let t = 120; t < 960; t += 320) e.globalAlpha = r ? .86 : .82 + Math.sin(n * 1.7 + t) * .04, e.fillRect(t, 31, 112, 10), e.fillStyle = "rgba(255,255,255,0.22)", e.beginPath(), e.moveTo(t + 12, 41), e.lineTo(t + 100, 41), e.lineTo(t + 126, 111), e.lineTo(t - 14, 111), e.closePath(), e.fill(), e.fillStyle = "#ffffff";
	e.globalAlpha = 1, L(e, 28, 92, 92, 42, 5, N.white), e.fillStyle = N.red, e.font = "800 22px system-ui, sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("AMSO", 74, 113), e.textAlign = "start", e.textBaseline = "alphabetic";
}
function Ft(e) {
	return Math.max(0, Math.min(1, e));
}
function R(e, t, n, r, i = "#eb32a4") {
	e.strokeStyle = i, e.lineWidth = Math.max(2, r * .16), e.lineCap = "round", e.lineJoin = "round", e.beginPath(), e.moveTo(t, n + r * .48), e.lineTo(t + r * .34, n + r * .82), e.lineTo(t + r, n), e.stroke(), e.lineCap = "butt", e.lineJoin = "miter";
}
function It(e, t) {
	return e.reducedMotion ? 0 : Math.sin(e.elapsedSeconds * .34 + e.distancePixels * 8e-4) * t;
}
function Lt(e, t, n) {
	let r = 666 + It(t, 11);
	e.save(), e.globalAlpha = .88, e.fillStyle = "rgba(255,255,255,0.72)", e.fillRect(r - 18, 196, 246, 151), e.strokeStyle = n.shelfFrame, e.lineWidth = 6, e.strokeRect(r, 213, 92, 112);
	for (let t of [248, 285]) e.beginPath(), e.moveTo(r, t), e.lineTo(r + 92, t), e.stroke();
	e.fillStyle = N.cardboard, e.fillRect(r + 9, 223, 31, 20), e.fillRect(r + 49, 257, 32, 22), e.fillStyle = N.red, e.fillRect(r + 48, 294, 35, 22), e.strokeStyle = N.inkSoft, e.lineWidth = 4, e.strokeRect(r + 112, 223, 48, 104), e.strokeStyle = N.orange, e.lineWidth = 3;
	for (let t = 0; t < 3; t += 1) e.beginPath(), e.moveTo(r + 167, 236 + t * 21), e.lineTo(r + 219, 236 + t * 21), e.stroke();
	e.fillStyle = N.orange, e.fillRect(r + 184, 302, 19, 20), e.beginPath(), e.arc(r + 204, 310, 7, -Math.PI / 2, Math.PI / 2), e.strokeStyle = N.orange, e.lineWidth = 3, e.stroke(), e.restore();
}
function Rt(e, t, n) {
	let r = 650 + It(t, 12);
	e.save(), e.globalAlpha = .9, e.fillStyle = "rgba(255,255,255,0.74)", e.fillRect(r - 18, 182, 270, 168), e.fillStyle = n.shelfFrame, e.fillRect(r, 295, 226, 12), e.fillRect(r + 15, 307, 9, 44), e.fillRect(r + 202, 307, 9, 44), e.fillStyle = N.inkSoft, e.fillRect(r + 43, 223, 105, 68), e.fillStyle = n.window, e.fillRect(r + 50, 230, 91, 54), e.fillStyle = "rgba(255,255,255,0.62)", e.fillRect(r + 60, 239, 38, 5), e.fillStyle = N.ink, e.beginPath(), e.moveTo(r + 31, 293), e.lineTo(r + 161, 293), e.lineTo(r + 178, 302), e.lineTo(r + 18, 302), e.closePath(), e.fill(), e.strokeStyle = n.accentCool, e.lineWidth = 5, e.beginPath(), e.arc(r + 195, 240, 28, 0, Math.PI * 2), e.stroke(), R(e, r + 177, 234, 32, "#eb32a4"), e.fillStyle = N.orange, e.fillRect(r + 188, 290, 15, 7), e.fillRect(r + 208, 282, 7, 15), e.restore();
}
function zt(e, t, n) {
	let r = 565 + It(t, 10);
	e.save(), e.globalAlpha = .88;
	let i = Ft(t.storyProgress ?? .5);
	for (let t = 0; t < 3; t += 1) {
		let i = r + t * 119, a = 256 - t * 18;
		e.fillStyle = "rgba(255,255,255,0.76)", e.fillRect(i, a, 101, 91 + t * 18), e.fillStyle = n.accentB, e.fillRect(i + 10, a + 11, 80, 44), e.fillStyle = N.inkSoft, e.fillRect(i + 26, a + 34, 45, 28), e.fillStyle = n.window, e.fillRect(i + 31, a + 38, 35, 19), e.fillStyle = n.shelfBoard, e.fillRect(i + 14, a + 65, 72, 5), e.fillRect(i + 22, a + 70, 5, 13 + t * 6), e.fillRect(i + 73, a + 70, 5, 13 + t * 6);
	}
	let a = Math.max(1, Math.ceil(i * 7));
	e.fillStyle = N.orange;
	for (let t = 0; t < a; t += 1) e.globalAlpha = .42 + t * .05, e.beginPath(), e.arc(r + 18 + t * 48, 215 - t % 3 * 13, 5, 0, Math.PI * 2), e.fill();
	e.globalAlpha = .9, e.fillStyle = "#f47100", e.beginPath(), e.ellipse(r + 316, 339, 27, 20, 0, 0, Math.PI * 2), e.fill(), e.fillRect(r + 296, 353, 6, 12), e.fillRect(r + 327, 353, 6, 12), e.fillStyle = N.ink, e.beginPath(), e.arc(r + 325, 335, 3, 0, Math.PI * 2), e.fill(), e.strokeStyle = N.ink, e.lineWidth = 4, e.beginPath(), e.moveTo(r + 306, 319), e.lineTo(r + 321, 319), e.stroke(), e.restore();
}
function Bt(e, t, n) {
	let r = 582 + It(t, 9);
	e.save(), e.globalAlpha = .88;
	for (let t = 0; t < 3; t += 1) {
		let i = r + t * 82;
		e.fillStyle = n.shelfFrame, e.fillRect(i, 170, 7, 191), e.fillRect(i + 64, 170, 7, 191);
		for (let t = 0; t < 4; t += 1) {
			let r = 187 + t * 45;
			e.fillRect(i, r, 71, 5), e.fillStyle = t % 2 == 0 ? N.cardboard : n.accentC, e.fillRect(i + 10, r - 25, 21, 21), e.fillRect(i + 38, r - 25, 21, 21), e.fillStyle = n.shelfFrame;
		}
	}
	e.fillStyle = N.inkSoft, e.fillRect(r - 25, 371, 307, 12), e.fillStyle = n.accentCool;
	for (let t = 0; t < 7; t += 1) e.beginPath(), e.arc(r - 8 + t * 45, 377, 4, 0, Math.PI * 2), e.fill();
	e.strokeStyle = N.red, e.lineWidth = 5, e.beginPath(), e.moveTo(r + 253, 319), e.lineTo(r + 253, 374), e.lineTo(r + 280, 374), e.stroke(), R(e, r + 258, 332, 21), e.strokeStyle = n.accentCool, e.lineWidth = 4, e.strokeRect(r + 280, 194, 47, 146), e.fillStyle = N.cardboard, e.fillRect(r + 287, 274, 33, 27), e.fillStyle = N.orange, e.fillRect(r + 287, 308, 33, 24), e.restore();
}
function Vt(e, t) {
	let n = t.storyObjectives?.epoch5.millionThreshold, r = n?.completed === !0 || t.storyPhase === "finale" || t.storyPhase === "completed", i = n?.counterValue ?? (r ? 1e6 : 999950);
	e.save();
	let a = r ? e.createLinearGradient(560, 0, 914, 0) : N.inkSoft;
	r && typeof a != "string" && (a.addColorStop(0, "#f47100"), a.addColorStop(.52, "#f04f45"), a.addColorStop(1, "#eb32a4")), L(e, 565, 74, 348, 112, 18, N.white), e.strokeStyle = a, e.lineWidth = 8, Mt(e, 565, 74, 348, 112, 18), e.stroke(), e.fillStyle = a, e.font = "950 44px ui-monospace, monospace", e.textAlign = "center", e.fillText(At.format(i), 739, 133), e.fillStyle = N.inkSoft, e.font = "850 16px system-ui, sans-serif", e.fillText("ZAMÓWIEŃ", 739, 163);
	for (let t = 0; t < (r ? 8 : 4); t += 1) {
		let n = 579 + t * 43, r = 223 + t % 2 * 39;
		e.fillStyle = t % 3 == 0 ? N.red : N.cardboard, e.fillRect(n, r, 34, 29), e.fillStyle = N.white, e.fillRect(n + 6, r + 9, 22, 7);
	}
	r && (e.strokeStyle = a, e.lineWidth = 9, e.beginPath(), e.moveTo(530, 318), e.lineTo(913, 318), e.stroke(), R(e, 838, 250, 45, "#eb32a4")), e.restore();
}
function Ht(e, t, n) {
	let r = t.reducedMotion ? 0 : -I(t.distancePixels * .12, 220);
	e.save(), e.globalAlpha = .78, e.fillStyle = "rgba(23,23,23,0.08)", e.fillRect(0, 300, 960, 92), e.fillStyle = N.ink, e.fillRect(0, 352, 960, 10), e.fillStyle = n.accentCool, e.fillRect(0, 362, 960, 5);
	for (let t = r - 70; t < 1080; t += 220) e.fillStyle = N.cardboard, e.fillRect(t + 82, 316, 42, 35), e.fillStyle = N.white, e.fillRect(t + 90, 326, 26, 8), e.fillStyle = N.orange, e.beginPath(), e.arc(t + 48, 357, 9, 0, Math.PI * 2), e.fill(), R(e, t + 150, 320, 28);
	e.restore();
}
function Ut(e, t, n) {
	if (t.mode === "challenge") {
		Ht(e, t, n);
		return;
	}
	switch (t.storyPhase === "finale" || t.storyPhase === "completed" ? 4 : t.themeIndex) {
		case 0:
			Lt(e, t, n);
			break;
		case 1:
			Rt(e, t, n);
			break;
		case 2:
			zt(e, t, n);
			break;
		case 3:
			Bt(e, t, n);
			break;
		case 4:
			Vt(e, t);
			break;
	}
}
function Wt(e, t, n) {
	if (!t.active) return;
	let r = t, i = n ? 0 : t.progress * 14;
	if (e.save(), e.globalAlpha = .9 - t.progress * .24, e.translate(0, -i), t.motif === "process-zones") {
		let t = Math.max(18, r.width / 3);
		for (let n = 0; n < 3; n += 1) L(e, r.x + n * t, r.y + 8, t - 4, Math.max(18, r.height - 12), 4, n % 2 == 0 ? N.white : "#fff0f8");
	} else t.motif === "quality-mark" ? (e.fillStyle = "rgba(255,240,248,0.94)", e.beginPath(), e.arc(r.x + r.width / 2, r.y + r.height / 2, 26, 0, Math.PI * 2), e.fill(), R(e, r.x + r.width / 2 - 14, r.y + r.height / 2 - 12, 28)) : t.motif === "matched-order" ? (L(e, r.x + r.width / 2 - 26, 374, 52, 42, 5, N.cardboard), e.fillStyle = N.white, e.fillRect(r.x + r.width / 2 - 18, 388, 36, 13), R(e, r.x + r.width / 2 - 8, 389, 16)) : r.obstacleKind === "overhead" ? (e.strokeStyle = "#eb32a4", e.lineWidth = 5, e.beginPath(), e.moveTo(r.x, r.y + r.height), e.quadraticCurveTo(r.x + r.width / 2, r.y - 24, r.x + r.width, r.y + r.height), e.stroke(), R(e, r.x + r.width / 2 - 10, r.y + 8, 20)) : (e.fillStyle = N.inkSoft, e.fillRect(r.x - 12, 418, r.width + 24, 8), e.fillStyle = N.cardboard, e.fillRect(r.x + r.width / 2 - 17, 389, 34, 28), e.fillStyle = N.white, e.fillRect(r.x + r.width / 2 - 10, 396, 20, 7), R(e, r.x + r.width / 2 - 8, 363, 17));
	e.restore();
}
var Gt = {
	gwarancja_48: "#eb32a4",
	podwojny_wynik: "#f47100"
}, Kt = {
	gwarancja_48: ["GWARANCJA", "48 M"],
	podwojny_wynik: ["2×", "PUNKTY"]
}, qt = {
	notebook: "#f04f45",
	telefon: "#f47100",
	pc: "#44413d",
	lcd: "#eb32a4"
};
function Jt(e, t, n, r) {
	if (!t.active) return;
	let i = n.reducedMotion ? 0 : Math.sin(n.elapsedSeconds * 4.4 + t.phase) * 3, a = t.x, o = t.y + i, s = t.size;
	if (t.kind === "standard") {
		let i = Math.max(42, s + 12), c = a - (i - s) / 2, l = o - (i - s) / 2;
		e.save();
		let u = t.orderVisualType === "parcel" ? r.drawParcelOrder(e, c, l, i, n.elapsedSeconds, t.phase, n.reducedMotion) : r.drawOrder(e, t.orderVisualType, c, l, i);
		if (u && t.orderVisualType !== "parcel" && !n.reducedMotion) {
			let r = (n.elapsedSeconds * .75 + t.phase / (Math.PI * 2)) % 1;
			r < .16 && (e.globalAlpha = 1 - r / .16, e.strokeStyle = N.white, e.lineWidth = 2, e.beginPath(), e.moveTo(c + 8 + r * 70, l + 8), e.lineTo(c + 1 + r * 70, l + i - 8), e.stroke());
		}
		if (e.restore(), u) return;
	}
	if (t.storyOrder === !0) {
		e.save(), e.shadowColor = "rgba(78,145,173,0.62)", e.shadowBlur = n.reducedMotion ? 6 : 10, L(e, a - 3, o - 3, s + 6, s + 6, 7, N.white), e.shadowBlur = 0, e.fillStyle = qt[t.packageType], e.font = "900 10px system-ui, sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText({
			pc: "PC",
			notebook: "NB",
			lcd: "LCD",
			telefon: "TEL"
		}[t.packageType], a + s / 2, o + s / 2 + 1), e.textAlign = "start", e.textBaseline = "alphabetic", e.restore();
		return;
	}
	if (t.kind !== "standard") {
		let i = Gt[t.kind] ?? N.red, c = t.kind, l = n.powerUpCopy?.[c] ?? Kt[c];
		if (!l) return;
		e.save(), e.shadowColor = i, e.shadowBlur = n.reducedMotion ? 7 : 12 + Math.sin(n.elapsedSeconds * 5) * 3;
		let u = Math.max(46, s + 16);
		if (r.drawPowerUp(e, c, a - (u - s) / 2, o - (u - s) / 2, u)) {
			e.restore();
			return;
		}
		L(e, a - 2, o - 2, s + 4, s + 4, 5, N.white), e.shadowBlur = 0, e.strokeStyle = N.ink, e.lineWidth = 2, e.strokeRect(a, o, s, s), e.fillStyle = i, e.fillRect(a + 3, o + 3, s - 6, 6), e.fillStyle = N.ink, e.font = "950 5.8px system-ui, sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText(l[0], a + s / 2, o + 15), e.font = "850 6px system-ui, sans-serif", e.fillText(l[1], a + s / 2, o + 23), e.textAlign = "start", e.textBaseline = "alphabetic", e.restore();
		return;
	}
	let c = qt[t.packageType] ?? N.red;
	e.fillStyle = "rgba(23,49,59,0.14)", e.beginPath(), e.ellipse(a + s / 2, o + s + 7, s * .48, 4, 0, 0, Math.PI * 2), e.fill(), e.fillStyle = N.cardboard, e.fillRect(a, o, s, s), e.fillStyle = N.cardboardLight, e.fillRect(a + 3, o + 3, s - 6, 6), e.fillStyle = "#9e6938", e.fillRect(a + s / 2 - 2, o, 5, s), e.fillStyle = N.white, e.fillRect(a + 5, o + 13, s - 10, 10), e.fillStyle = c, e.fillRect(a + 8, o + 16, s - 16, 4);
}
function Yt(e, t) {
	let n = t.phase === "reward" ? "#eb32a4" : N.red, r = t.attackCount * 70 + (t.attackCount - 1) * 6, i = (960 - r) / 2 - 14, a = r + 28;
	L(e, i, 108, a, 28, 14, "rgba(13, 35, 44, 0.92)"), e.strokeStyle = n, e.lineWidth = 2, Mt(e, i, 108, a, 28, 14), e.stroke();
	let o = (960 - r) / 2;
	for (let n = 0; n < t.attackCount; n += 1) {
		let r = n < t.attacksSurvived ? "#ffd23f" : "rgba(255,255,255,0.2)";
		L(e, o, 119, 70, 6, 3, r), o += 76;
	}
}
function Xt(e, t, n, r) {
	if (t.phase === "inactive" || t.phase === "pending") return;
	Yt(e, t);
	let i = r ? 0 : Math.sin(n * 5.2) * 2, a = r ? 800 : t.x, o = t.y + i;
	e.save(), t.phase === "warning" ? e.globalAlpha = .72 : t.phase === "reward" && (e.globalAlpha = Math.max(.35, t.phaseSecondsRemaining / C.rewardSeconds)), e.fillStyle = "rgba(23,49,59,0.22)", e.beginPath(), e.ellipse(a + 82, 437, 94, 12, 0, 0, Math.PI * 2), e.fill(), e.strokeStyle = N.ink, e.lineWidth = 9, e.beginPath(), e.moveTo(a + 16, o + 18), e.lineTo(a + 16, o + 145), e.moveTo(a - 6, o + 145), e.lineTo(a + 57, o + 145), e.stroke(), e.fillStyle = N.orange, e.fillRect(a - 7, o + 148, 78, 9), L(e, a + 38, o + 62, 118, 92, 17, N.red), L(e, a + 69, o + 26, 70, 64, 14, N.inkSoft), e.fillStyle = "#b9dbe6", e.fillRect(a + 78, o + 35, 51, 34), e.fillStyle = "rgba(255,255,255,0.65)", e.fillRect(a + 84, o + 41, 35, 5), e.fillStyle = N.orange, e.beginPath(), e.arc(a + 55, o + 53, 8, 0, Math.PI * 2), e.fill(), e.fillStyle = t.phase === "reward" ? "#f04f45" : "#ffec8a", e.beginPath(), e.arc(a + 55, o + 53, 4, 0, Math.PI * 2), e.fill(), e.fillStyle = N.ink;
	for (let t of [a + 64, a + 132]) e.beginPath(), e.arc(t, o + 154, 19, 0, Math.PI * 2), e.fill(), e.fillStyle = "#81959b", e.beginPath(), e.arc(t, o + 154, 8, 0, Math.PI * 2), e.fill(), e.fillStyle = N.ink;
	e.restore();
}
function Zt(e, t) {
	let { x: n, y: r, width: i, height: a } = t;
	e.fillStyle = "rgba(23,49,59,0.16)", e.fillRect(n - 7, r + a + 4, i + 14, 6), e.fillStyle = "#987042", e.fillRect(n - 4, r + a - 7, i + 8, 7), e.fillStyle = N.cardboard, e.fillRect(n, r + 25, i, a - 25), e.fillStyle = N.cardboardLight, e.fillRect(n + 4, r + 29, i - 8, 7), e.fillStyle = "#a86f3e", e.fillRect(n + i / 2 - 2, r + 25, 5, a - 25), e.fillStyle = "#d59b5a", e.fillRect(n + 7, r, i - 13, 28), e.fillStyle = "#9f6838", e.fillRect(n + 10, r + 4, i - 19, 4), e.fillStyle = N.white, e.fillRect(n + 7, r + 41, 19, 9), e.fillStyle = N.red, e.fillRect(n + 10, r + 44, 13, 3);
}
function Qt(e, t) {
	let { x: n, y: r, width: i, height: a } = t;
	e.fillStyle = "rgba(23,49,59,0.16)", e.fillRect(n - 7, r + a + 4, i + 14, 6), e.fillStyle = "#79593b", e.fillRect(n, r + a - 12, i, 8), e.fillRect(n + 7, r + a - 4, 12, 4), e.fillRect(n + i - 20, r + a - 4, 12, 4), e.fillStyle = "#a9b7bb", e.fillRect(n + 6, r, i - 12, a - 14), e.fillStyle = "#dbe3e5", e.fillRect(n + 11, r + 4, i - 22, 5), e.fillStyle = N.blue, e.fillRect(n + 17, r + 11, 17, 8), e.fillRect(n + 43, r + 11, 17, 8), e.strokeStyle = "rgba(255,255,255,0.72)", e.lineWidth = 3, e.strokeRect(n + 4, r + 1, i - 8, a - 14);
}
function $t(e, t) {
	let { x: n, y: r, width: i, height: a } = t;
	e.fillStyle = "rgba(23,49,59,0.16)", e.fillRect(n - 8, r + a + 4, i + 16, 6), e.strokeStyle = N.inkSoft, e.lineWidth = 6, e.beginPath(), e.moveTo(n + 12, r + 5), e.lineTo(n + 4, r + 5), e.lineTo(n + 4, r + a - 8), e.stroke(), L(e, n + 10, r + 14, i - 9, a - 20, 5, N.orange), e.fillStyle = "#ffc45e", e.fillRect(n + 16, r + 19, i - 21, 6), e.fillStyle = N.ink, e.beginPath(), e.arc(n + 19, r + a - 1, 7, 0, Math.PI * 2), e.arc(n + i - 13, r + a - 1, 7, 0, Math.PI * 2), e.fill(), e.fillStyle = "#71858c", e.beginPath(), e.arc(n + 19, r + a - 1, 3, 0, Math.PI * 2), e.arc(n + i - 13, r + a - 1, 3, 0, Math.PI * 2), e.fill();
}
function en(e, t) {
	let { x: n, y: r, width: i, height: a } = t;
	e.fillStyle = "rgba(23,49,59,0.16)", e.fillRect(n - 7, r - 6, i + 14, 6), e.fillStyle = N.ink, e.fillRect(n - 8, 0, 10, r + 8), e.fillRect(n + i - 2, 0, 10, r + 8), L(e, n, r, i, a, 8, N.inkSoft), e.fillStyle = N.orange, e.fillRect(n + 6, r + 12, i - 12, 7), e.fillStyle = "rgba(255,255,255,0.16)", e.fillRect(n + 6, r + a - 26, i - 12, 18), e.strokeStyle = "rgba(23,49,59,0.5)", e.lineWidth = 3, e.beginPath();
	for (let t = n + 7; t < n + i - 7; t += 16) e.moveTo(t, r + 24), e.lineTo(t + 9, r + 24);
	e.stroke();
}
function tn(e, t) {
	if (t.active) switch (t.kind) {
		case "box-stack":
			Zt(e, t);
			break;
		case "pallet":
			Qt(e, t);
			break;
		case "trolley":
			$t(e, t);
			break;
		case "overhead":
			en(e, t);
			break;
	}
}
function nn(e, t, n, r = 1) {
	let i = 25 * r, a = 31 * r;
	e.save(), e.fillStyle = "rgba(23,49,59,0.18)", e.fillRect(t - 3 * r, n + 4 * r, i + 6 * r, a), L(e, t, n, i, a, 3 * r, N.cardboard), e.fillStyle = N.cardboardLight, e.fillRect(t + 3 * r, n + 3 * r, i - 6 * r, 5 * r), e.fillStyle = "#9e6938", e.fillRect(t + i / 2 - 1.5 * r, n, 3 * r, a), e.fillStyle = N.white, e.fillRect(t + 4 * r, n + 12 * r, i - 8 * r, 10 * r), e.fillStyle = N.red, e.fillRect(t + 7 * r, n + 15 * r, i - 14 * r, 2.5 * r), e.fillRect(t + 7 * r, n + 19 * r, i - 17 * r, 2 * r), e.strokeStyle = N.inkSoft, e.lineWidth = 2 * r, e.beginPath(), e.moveTo(t + i - 1 * r, n + 7 * r), e.lineTo(t + i + 7 * r, n + 13 * r), e.stroke(), e.restore();
}
function rn(e, t, n) {
	let r = $e(t, n.activePowerUps.includes("gwarancja_48") ? "warranty" : (n.warrantyBreakSeconds ?? 0) > 0 ? "breaking" : (n.startProtectionSeconds ?? 0) > 0 ? "start" : null);
	if (r === null) return;
	let i = Ze({
		elapsedSeconds: n.elapsedSeconds,
		activationSecondsRemaining: n.shieldActivationSeconds ?? 0,
		breakSecondsRemaining: n.warrantyBreakSeconds ?? 0,
		reducedMotion: n.reducedMotion
	}), { radiusX: a, radiusY: o } = r;
	e.save(), e.translate(r.centerX, r.centerY), e.scale(i.scale, i.scale), e.globalAlpha = i.alpha, e.setLineDash([]);
	let s = e.createRadialGradient(-a * .28, -o * .34, a * .08, 0, 0, o);
	s !== void 0 && (s.addColorStop(0, "rgba(244,113,0,0.14)"), s.addColorStop(.5, "rgba(244,113,0,0.06)"), s.addColorStop(.82, "rgba(244,113,0,0.04)"), s.addColorStop(1, "rgba(244,113,0,0.02)")), e.fillStyle = s ?? "rgba(244,113,0,0.07)", e.beginPath(), e.ellipse(0, 0, a, o, 0, 0, Math.PI * 2), e.fill(), e.save(), e.beginPath(), e.ellipse(0, 0, a - 2, o - 2, 0, 0, Math.PI * 2), e.clip(), e.rotate(i.meshRotationRadians), e.strokeStyle = "rgba(244,113,0,0.16)", e.lineWidth = .85;
	let c = kt();
	if (c !== null && e.stroke(c), e.restore(), e.strokeStyle = "rgba(244,113,0,0.6)", e.lineWidth = 3, e.shadowColor = "rgba(244,113,0,0.45)", e.shadowBlur = n.reducedMotion ? 3 : 7, e.beginPath(), e.ellipse(0, 0, a, o, 0, 0, Math.PI * 2), e.stroke(), e.shadowBlur = 5, e.strokeStyle = "rgba(244,113,0,0.5)", e.lineWidth = 2.2, e.beginPath(), e.ellipse(0, 0, a - 3, o - 3, 0, Math.PI * 1.08, Math.PI * 1.58), e.stroke(), r.breaking && !n.reducedMotion) {
		let t = 1 - i.breakingProgress;
		e.globalAlpha = i.alpha * t;
		let n = e.createLinearGradient(-a, 0, a, 0);
		n.addColorStop(0, "rgba(244,113,0,0.28)"), n.addColorStop(.52, "rgba(255,255,255,0.16)"), n.addColorStop(1, "rgba(235,50,164,0.3)"), e.fillStyle = n, e.beginPath(), e.ellipse(0, 0, a, o, 0, 0, Math.PI * 2), e.fill(), e.shadowColor = "rgba(235,50,164,0.9)", e.shadowBlur = 12, e.strokeStyle = "rgba(255,255,255,0.95)", e.lineWidth = 3;
		for (let t of [
			-1.03,
			-.32,
			.46,
			2.65
		]) {
			let n = Math.cos(t) * a * .72, r = Math.sin(t) * o * .72;
			e.beginPath(), e.moveTo(n, r), e.lineTo(Math.cos(t + .12) * a * (1.08 + i.breakingProgress * .18), Math.sin(t + .12) * o * (1.08 + i.breakingProgress * .18)), e.stroke();
			let s = 1.1 + i.breakingProgress * .24, c = Math.cos(t) * a * s, l = Math.sin(t) * o * s, u = -Math.sin(t) * 7, d = Math.cos(t) * 7;
			e.strokeStyle = t < 0 ? "rgba(244,113,0,0.95)" : "rgba(235,50,164,0.95)", e.beginPath(), e.moveTo(c - u, l - d), e.lineTo(c + u, l + d), e.stroke(), e.strokeStyle = "rgba(255,255,255,0.95)";
		}
	}
	e.restore();
}
function an(e, t) {
	let n = t.x, r = t.y + 14;
	e.fillStyle = "rgba(23,49,59,0.2)", e.beginPath(), e.ellipse(n + t.width / 2, 435, 30, 6, 0, 0, Math.PI * 2), e.fill(), nn(e, n - 4, r + 31, .92), e.strokeStyle = N.ink, e.lineWidth = 9, e.lineCap = "square", e.beginPath(), e.moveTo(n + 22, r + 60), e.lineTo(n + 14, r + 78), e.moveTo(n + 40, r + 60), e.lineTo(n + 49, r + 78), e.stroke(), e.strokeStyle = N.white, e.lineWidth = 4, e.beginPath(), e.moveTo(n + 11, r + 83), e.lineTo(n + 22, r + 83), e.moveTo(n + 40, r + 83), e.lineTo(n + 52, r + 83), e.stroke(), e.strokeStyle = D.capAndShirt, e.lineWidth = 9, e.beginPath(), e.moveTo(n + 15, r + 36), e.lineTo(n + 7, r + 54), e.moveTo(n + 45, r + 36), e.lineTo(n + 53, r + 52), e.stroke(), L(e, n + 13, r + 32, 36, 30, 7, D.capAndShirt), e.fillStyle = D.belt, e.fillRect(n + 13, r + 50, 36, 7), L(e, n + 4, r + 34, 12, 24, 3, D.scanner), e.fillStyle = D.scannerScreen, e.fillRect(n + 7, r + 38, 6, 11), e.fillStyle = "#f0bf94", e.beginPath(), e.arc(n + 33, r + 23, 13, 0, Math.PI * 2), e.fill(), e.fillStyle = "#7b492d", e.fillRect(n + 42, r + 22, 5, 4), e.fillStyle = N.ink, e.fillRect(n + 37, r + 19, 3, 3), e.fillStyle = D.capAndShirt, e.fillRect(n + 17, r + 8, 30, 9), e.fillRect(n + 13, r + 14, 34, 5), e.fillStyle = N.white, e.fillRect(n + 25, r + 11, 13, 3), e.lineCap = "butt";
}
function on(e, t, n) {
	if (t.crouching) {
		an(e, t);
		return;
	}
	let r = t.grounded && !n.reducedMotion ? Math.sin(n.elapsedSeconds * Qe(n.speed) * Math.PI * 2) : 0, i = t.grounded && !n.reducedMotion ? Math.abs(r) * -1.8 : 0, a = t.x, o = t.y + i;
	if (e.fillStyle = "rgba(23,49,59,0.2)", e.beginPath(), e.ellipse(a + t.width / 2, 435, t.grounded ? 29 : 19, t.grounded ? 6 : 4, 0, 0, Math.PI * 2), e.fill(), nn(e, a - 5, o + 26), e.strokeStyle = N.ink, e.lineWidth = 9, e.lineCap = "square", e.beginPath(), t.grounded ? (e.moveTo(a + 25, o + 58), e.lineTo(a + 22 - r * 8, o + 78), e.moveTo(a + 37, o + 58), e.lineTo(a + 42 + r * 8, o + 78)) : (e.moveTo(a + 25, o + 58), e.lineTo(a + 17, o + 71), e.lineTo(a + 29, o + 76), e.moveTo(a + 37, o + 58), e.lineTo(a + 47, o + 67), e.lineTo(a + 43, o + 78)), e.stroke(), e.strokeStyle = N.white, e.lineWidth = 4, e.beginPath(), e.moveTo(a + 13 - r * 8, o + 83), e.lineTo(a + 25 - r * 8, o + 83), e.moveTo(a + 37 + r * 8, o + 83), e.lineTo(a + 52 + r * 8, o + 83), e.stroke(), e.strokeStyle = D.capAndShirt, e.lineWidth = 9, e.beginPath(), e.moveTo(a + 17, o + 35), e.lineTo(a + 8 - r * 7, o + 52), e.moveTo(a + 44, o + 35), e.lineTo(a + 52 + r * 7, o + 50), e.stroke(), L(e, a + 14, o + 27, 35, 36, 7, D.capAndShirt), e.fillStyle = D.belt, e.fillRect(a + 14, o + 49, 35, 8), L(e, a + 5, o + 30, 12, 27, 3, D.scanner), e.fillStyle = D.scannerScreen, e.fillRect(a + 8, o + 35, 6, 12), e.fillStyle = "#f0bf94", e.beginPath(), e.arc(a + 32, o + 17, 14, 0, Math.PI * 2), e.fill(), e.fillStyle = "#7b492d", e.fillRect(a + 42, o + 16, 5, 4), e.fillStyle = N.ink, e.fillRect(a + 37, o + 13, 3, 3), e.fillStyle = D.capAndShirt, e.fillRect(a + 17, o + 2, 30, 9), e.fillRect(a + 13, o + 9, 34, 5), e.fillStyle = N.white, e.fillRect(a + 25, o + 5, 13, 3), n.impact) {
		e.strokeStyle = N.orange, e.lineWidth = 4;
		for (let n = 0; n < 6; n += 1) {
			let r = Math.PI * 2 * n / 6, i = a + t.width + 5, s = o + 38;
			e.beginPath(), e.moveTo(i + Math.cos(r) * 10, s + Math.sin(r) * 10), e.lineTo(i + Math.cos(r) * 20, s + Math.sin(r) * 20), e.stroke();
		}
	}
	e.lineCap = "butt";
}
function sn(e) {
	e.save(), e.lineCap = "round", e.strokeStyle = rt, e.lineWidth = tt, e.beginPath(), e.moveTo(-12, k + et), e.lineTo(972, k + et), e.stroke();
	let t = e.createLinearGradient(0, 0, 960, 0);
	for (let { offset: e, color: n } of it) t.addColorStop(e, n);
	e.strokeStyle = t, e.lineWidth = nt, e.beginPath(), e.moveTo(-12, k), e.lineTo(972, k), e.stroke(), e.restore();
}
function cn(e, t, n) {
	let r = t.milestoneCelebration;
	if (r == null) return;
	let i = Math.max(0, Math.min(1, r.progress)), a = t.reducedMotion ? 0 : i, o = t.reducedMotion ? .66 : Math.sin(i * Math.PI) * .86, s = Math.min(62, 16 + r.intensity * 7), c = t.decorationQuality === "reduced" ? Math.ceil(s * .52) : s;
	if (e.save(), e.globalAlpha = o, r.intensity >= 2) {
		let n = t.reducedMotion ? .12 : Math.sin(Math.min(1, i * 2.2) * Math.PI) * .2;
		e.save(), e.globalAlpha = n;
		let r = e.createLinearGradient(200, 0, 760, 0);
		r.addColorStop(0, N.orange), r.addColorStop(.5, N.red), r.addColorStop(1, N.redDark), e.fillStyle = r, e.fillRect(210, 56, 540, 138), e.restore();
	}
	for (let n = 0; n < c; n += 1) {
		let i = I(n * 137 + r.threshold, 900) + 30 + Math.sin(n * 1.7) * a * 34, o = 18 + I(n * 53 + a * (150 + n % 5 * 24), 188);
		e.fillStyle = n % 3 == 0 ? N.orange : n % 3 == 1 ? N.red : N.redDark, e.save(), e.translate(i, o), t.reducedMotion || e.rotate(a * 5 + n), e.fillRect(-5, -2, 10 + r.intensity * .5, 4), e.restore();
	}
	let l = Math.min(5, Math.max(1, r.intensity));
	for (let a = 0; a < l; a += 1) {
		let o = a % 2 == 0 ? 1 : -1, s = Math.floor(a / 2), c = o > 0 ? 68 + s * 70 : 838 - s * 70, l = 46 + s * 34 + (t.reducedMotion ? 0 : Math.sin(i * Math.PI) * -18), u = 54 + Math.min(10, r.intensity * 2);
		n.drawParcelOrder(e, c, l, u, i * .8, a, t.reducedMotion) || (e.save(), e.translate(c + u / 2, l + u / 2), t.reducedMotion || e.rotate(o * (.08 + i * .12)), e.fillStyle = N.orange, e.fillRect(-u / 2, -u / 2, u, u), e.fillStyle = "#fff", e.fillRect(-u * .09, -u / 2, u * .18, u), e.fillRect(-u / 2, -u * .09, u, u * .18), e.restore());
	}
	e.restore();
}
var ln = class {
	constructor(e = Ve, t = new Ot()) {
		i(this, "artwork", void 0), this.artwork = t;
	}
	render(e, t, n, r) {
		e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1;
		let i = r.worldVisual !== void 0;
		i ? e.clearRect(0, 0, t, n) : (e.fillStyle = N.ink, e.fillRect(0, 0, t, n));
		let a = Math.min(t / 960, n / 540), o = 960 * a, s = 540 * a, c = (t - o) / 2, l = (n - s) / 2;
		e.save(), e.translate(c, l), e.scale(a, a), e.beginPath(), e.rect(0, 0, 960, 540), e.clip(), e.imageSmoothingEnabled = !1;
		let u = r.mode === "challenge" ? F[1] : r.themeIndex >= 0 && r.themeIndex < F.length ? F[r.themeIndex] : jt(r.distancePixels, _e.zonePixels);
		i ? sn(e) : (Pt(e, r.distancePixels, r.elapsedSeconds, r.reducedMotion, u), Ut(e, r, u)), cn(e, r, this.artwork), Xt(e, r.boss, r.elapsedSeconds, r.reducedMotion);
		for (let t of r.packages) Jt(e, t, r, this.artwork);
		for (let t of r.obstacles) this.artwork.drawObstacle(e, t) || tn(e, t);
		for (let t of r.obstacleTransformations ?? []) Wt(e, t, r.reducedMotion);
		rn(e, r.runner, r), this.artwork.drawCourier(e, r.runner, r) || on(e, r.runner, r), r.cutscene ? (e.fillStyle = "rgba(17,39,48,0.86)", e.fillRect(0, 0, 960, 540), e.fillStyle = "rgba(255,255,255,0.65)", e.font = "700 22px system-ui, sans-serif", e.textAlign = "center", e.fillText(r.cutscene.subtitle, 960 / 2, 540 / 2 - 12), e.fillStyle = "#ffffff", e.font = "800 46px system-ui, sans-serif", e.fillText(r.cutscene.title, 960 / 2, 298), e.textAlign = "start") : r.state === "paused" ? (e.fillStyle = "rgba(17,39,48,0.22)", e.fillRect(0, 0, 960, 540), L(e, 960 / 2 - 31, 540 / 2 - 31, 62, 62, 12, "rgba(255,255,255,0.9)"), e.fillStyle = N.ink, e.fillRect(960 / 2 - 13, 540 / 2 - 14, 9, 28), e.fillRect(485, 540 / 2 - 14, 9, 28)) : r.state === "game_over" && (e.fillStyle = "rgba(227,6,19,0.08)", e.fillRect(0, 0, 960, 540)), e.restore();
	}
};
//#endregion
//#region src/game/collectibles.ts
function un(e) {
	return e === "parcel" ? "parcel" : "equipment";
}
function dn(e) {
	return e === "equipment" ? S.equipmentScore : S.packageScore;
}
function fn(e, t, n) {
	let r = pn(e);
	return t ? {
		nextCombo: Math.min(8, r + 1),
		perfectBonus: n ? S.packageScore * r : 0
	} : {
		nextCombo: 1,
		perfectBonus: 0
	};
}
function pn(e) {
	return Math.max(1, Math.min(8, Math.floor(e)));
}
function mn(e, t, n, r) {
	let i = pn(n);
	if (e !== "standard") return {
		countsAsPackage: !1,
		pointsAwarded: 0,
		bonusScoreAwarded: 0,
		nextCombo: i
	};
	let a = dn(t) * i * (r ? 2 : 1);
	return {
		countsAsPackage: t === "parcel",
		pointsAwarded: a,
		bonusScoreAwarded: Math.max(0, a - S.packageScore),
		nextCombo: Math.min(8, i + 1)
	};
}
function hn(e) {
	return Math.max(0, Math.floor(e / S.pixelsPerMeter));
}
function gn(e, t, n = 0) {
	return hn(e) + Math.max(0, Math.floor(t)) * S.packageScore + Math.max(0, Math.floor(n));
}
var _n = [
	"box-stack",
	"pallet",
	"trolley",
	"overhead"
];
function vn(e) {
	return _n.includes(e) ? e : null;
}
var yn = [
	"notebook",
	"telefon",
	"pc",
	"lcd"
], bn = {
	gwarancja_48: Infinity,
	podwojny_wynik: 7
};
function xn(e) {
	return Math.max(0, Math.min(1, e));
}
function Sn(e, t, n) {
	return e + (t - e) * xn(n);
}
function Cn(e, t) {
	let n = e.durationSeconds > 0 ? t / e.durationSeconds : 1;
	return 280 * Sn(e.difficultyStart, e.difficultyEnd, n);
}
var wn = class {
	constructor(e) {
		i(this, "facts", void 0), i(this, "fired", /* @__PURE__ */ new Set()), i(this, "typeCounts", {
			notebook: 0,
			telefon: 0,
			pc: 0,
			lcd: 0
		}), i(this, "totalWeight", 0), i(this, "completedEpochs", /* @__PURE__ */ new Set()), i(this, "cleanEpochs", /* @__PURE__ */ new Set()), this.facts = e.filter((e) => e.enabled);
	}
	get unlockedCount() {
		return this.fired.size;
	}
	recordPackage(e, t) {
		this.typeCounts[e] += 1, this.totalWeight += t;
	}
	recordEpochCompleted(e, t) {
		this.completedEpochs.add(e), t && this.cleanEpochs.add(e);
	}
	evaluate() {
		let e = [];
		if (this.fired.size >= 6) return e;
		for (let t of this.facts) if (!this.fired.has(t.id) && this.triggerMet(t.trigger) && (this.fired.add(t.id), e.push(t.id), this.fired.size >= 6)) break;
		return e;
	}
	triggerMet(e) {
		switch (e.type) {
			case "epoch_completed": return this.completedEpochs.has(e.epochIndex);
			case "epoch_completed_clean": return this.cleanEpochs.has(e.epochIndex);
			case "collect_type": return this.typeCounts[e.packageType] >= e.threshold;
			case "collect_weight": return this.totalWeight >= e.threshold;
		}
	}
}, Tn = 1.6, z = 30, En = class {
	constructor(e) {
		i(this, "equipmentBag", void 0), i(this, "waveIndex", 0), this.equipmentBag = new Wn(yn, e);
	}
	createWave(e) {
		let t = Dn[this.waveIndex % Dn.length] ?? "arc", n = this.waveIndex % 2 == 0 ? 2 : 1, r = Array.from({ length: n }, () => ({
			kind: "standard",
			packageType: this.equipmentBag.next()
		}));
		this.waveIndex += 1;
		let i = V({
			...e,
			packageCount: Math.max(5, Math.min(8, Math.floor(e.packageCount))),
			rewards: r
		});
		if (!i) return null;
		let a = [...i.packages].sort((e, t) => e.x - t.x), o = t === "premium-finale" ? (() => {
			let e = [...a].reverse().find(({ collectibleClass: e }) => e === "equipment");
			return e ? [...a.filter((t) => t !== e), e] : a;
		})() : a, s = o[0]?.x ?? i.x, c = o.map(({ y: e }) => e);
		t === "low-line" && c.fill(e.action === "slide" ? 404 : 387), t === "rising-steps" && c.sort((e, t) => t - e), t === "falling-steps" && c.sort((e, t) => e - t);
		let l = Math.max(150, e.speed * .36), u = o.map((n, r) => {
			let a = t === "split-groups" && r >= Math.ceil(o.length / 2) ? 120 : 0, u = n.collectibleClass === "equipment" ? t === "alternate-route" ? e.action === "jump" ? 38 : 18 : t === "premium-finale" ? e.action === "jump" ? 26 : 14 : e.action === "jump" ? 18 : 10 : 0, d = s + r * l + a, f = -b.jumpVelocity / b.gravity, p = (i.x + i.width / 2 - 171) / Math.max(1, e.speed), m = (d + z / 2 - 171) / Math.max(1, e.speed) - (p - f), h = m >= 0 && m <= On ? 350 + b.jumpVelocity * m + b.gravity * m * m / 2 : 350, g = {
				...n,
				x: d,
				y: e.action === "jump" ? n.collectibleClass === "equipment" ? Math.max(0, t === "alternate-route" ? Math.min(h + 28 - u, (c[r] ?? n.y) - u) : h + 28 - u) : Math.max(432 - z - b.jumpVelocity * b.jumpVelocity / (2 * b.gravity) - 24, (c[r] ?? n.y) - u) : (c[r] ?? n.y) - u
			};
			if (e.action !== "jump") return g;
			let _ = ye({
				active: !0,
				kind: i.kind,
				source: i.source,
				x: i.x,
				y: i.y,
				width: i.width,
				height: i.height
			});
			return w({
				x: g.x,
				y: g.y,
				width: z,
				height: z
			}, _) ? {
				...g,
				y: Math.max(0, _.y - z - 6)
			} : g;
		}), d = {
			...i,
			packages: u,
			rewardRouteFamily: t
		};
		return Pn(d, e.speed, e.minimumReactionSeconds ?? 1.2) ? null : d;
	}
}, Dn = Object.freeze([
	"arc",
	"low-line",
	"rising-steps",
	"falling-steps",
	"split-groups",
	"premium-finale",
	"alternate-route"
]), On = -b.jumpVelocity * 2 / b.gravity;
function kn(e, t) {
	e.y = 432 - e.height, e.grounded = !0, e.crouching = !1, !(t < 0 || t > On) && (e.y += b.jumpVelocity * t + b.gravity * t * t / 2, e.grounded = !1);
}
function An(e, t, n) {
	let r = xe(z, e.collectibleClass);
	return w(T(t), {
		x: n + r,
		y: e.y + r,
		width: z - r * 2,
		height: z - r * 2
	});
}
function jn(e, t, n) {
	let r = e.get(t) ?? [];
	r.some((e) => (e | n) === e) || e.set(t, [...r.filter((e) => (e | n) !== n), n]);
}
function Mn(e) {
	let t = e >>> 0, n = 0;
	for (; t !== 0;) t &= t - 1, n += 1;
	return n;
}
function Nn(e, t) {
	let n = Math.max(1, t), r = ye({
		active: !0,
		kind: e.kind,
		source: e.source,
		x: e.x,
		y: e.y,
		width: e.width,
		height: e.height
	}), i = Pe(), a = Math.max(0, (r.x - (i.x + i.width)) / n), o = Math.max(a, (r.x + r.width - i.x) / n), s = e.packages.filter(({ collectibleClass: e }) => e === "parcel"), c = e.packages.filter(({ collectibleClass: e }) => e === "equipment"), l = Math.ceil(s.length * .6), u = Math.max(o, ...e.packages.map((e) => (e.x + z - i.x) / n)), d = 1 / 60;
	if (e.kind === "overhead") {
		i.crouching = !0;
		let t = /* @__PURE__ */ new Set();
		for (let a = 0; a <= u + d; a += d) {
			if (w(T(i), {
				...r,
				x: r.x - n * a
			})) return "crouch timing still collides with obstacle";
			for (let r of e.packages) An(r, i, r.x - n * a) && t.add(r);
		}
		return s.filter((e) => t.has(e)).length < l ? "base crouch route cannot collect its parcel target" : c.some((e) => !t.has(e)) ? "premium crouch route is unreachable" : null;
	}
	let f = Math.ceil(On / d), p = e.packages.reduce((e, t, n) => t.collectibleClass === "parcel" ? e | 1 << n : e, 0), m = e.packages.reduce((e, t, n) => t.collectibleClass === "equipment" ? e | 1 << n : e, 0), h = /* @__PURE__ */ new Map([[0, [0]]]), g = Math.ceil(u / d) + 1;
	for (let t = 0; t <= g; t += 1) {
		let a = t * d, o = /* @__PURE__ */ new Map();
		for (let [t, s] of h) {
			let c = t === 0 ? [0, 1] : [t >= f ? 0 : t + 1];
			for (let t of c) if (kn(i, t === 0 ? -1 : (t - 1) * d), !w(T(i), {
				...r,
				x: r.x - n * a
			})) for (let r of s) {
				let s = r;
				e.packages.forEach((e, t) => {
					s & 1 << t || An(e, i, e.x - n * a) && (s |= 1 << t);
				}), jn(o, t, s);
			}
		}
		if (h = o, h.size === 0) return "no collision-free jump sequence exists";
	}
	let _ = [...h.values()].flat();
	return _.some((e) => Mn(e & p) >= l) ? _.some((e) => Mn(e & p) >= l && (e & m) === m) ? null : "premium jump route is unreachable" : "base jump route cannot collect its parcel target";
}
function Pn(e, t, n) {
	let r = Math.max(1, t);
	if ((e.x - 200) / r < n) return "obstacle telegraph is too short";
	let i = ye({
		active: !0,
		kind: e.kind,
		source: e.source,
		x: e.x,
		y: e.y,
		width: e.width,
		height: e.height
	}), a = Pe(), o = {
		...i,
		x: a.x
	};
	if (e.kind === "overhead") {
		let e = w(T(a), o);
		a.crouching = !0;
		let t = w(T(a), o);
		if (!e || t) return "overhead route is not crouch-readable";
	}
	let s = b.jumpVelocity * b.jumpVelocity / (2 * b.gravity);
	for (let t = 0; t < e.packages.length; t += 1) {
		let n = e.packages[t], r = {
			x: n.x,
			y: n.y,
			width: z,
			height: z
		};
		if (r.y < 0 || r.y + r.height > 434) return "collectible is outside player bounds";
		if (e.kind !== "overhead" && 432 - (r.y + r.height) > s + 24) return "collectible exceeds jump reach";
		if (w(r, i)) return "collectible intersects obstacle";
		for (let n = t + 1; n < e.packages.length; n += 1) {
			let t = e.packages[n];
			if (w(r, {
				x: t.x,
				y: t.y,
				width: z,
				height: z
			})) return "collectibles overlap";
		}
	}
	let c = Math.floor(Math.min(...e.packages.map(({ x: e }) => e), e.x)) - 960, l = Math.ceil(Math.max(...e.packages.map(({ x: e }) => e), e.x + e.width));
	for (let t = c; t <= l; t += 24) if (e.packages.filter(({ x: e }) => e + z > t && e < t + 960).length > 7) return "more than seven collectibles are visible";
	return Nn(e, r);
}
function B(e, t, n = Tn) {
	let r = 200 + Math.max(1, e) * Math.max(0, n);
	return Math.max(t, Math.ceil(r));
}
function Fn(e) {
	let t = B(e.speed, 960 + S.spawnPadding, e.minimumReactionSeconds), n = V({
		...e,
		spawnX: t,
		rewards: [{ kind: "standard" }]
	});
	return n ? Pn(n, e.speed, e.minimumReactionSeconds) : "wave cannot be spawned with the requested reaction time";
}
var In = {
	"box-stack": {
		width: 52,
		height: 62
	},
	pallet: {
		width: 78,
		height: 36
	},
	trolley: {
		width: 68,
		height: 50
	},
	overhead: {
		width: 72,
		height: ge
	}
}, Ln = [
	"box-stack",
	"pallet",
	"trolley",
	"overhead"
], Rn = [
	28,
	37,
	44,
	37,
	28
];
function zn(e, t, n) {
	let r = Math.max(1, e), i = Math.max(0, Math.min(1, n)) * .42;
	return r * (t.minimumGapSeconds + i);
}
function Bn(e = S.obstaclePoolSize) {
	return Array.from({ length: Math.max(1, Math.floor(e)) }, () => ({
		active: !1,
		kind: "box-stack",
		source: "normal",
		x: 0,
		y: 0,
		width: 0,
		height: 0
	}));
}
function Vn(e = S.packagePoolSize) {
	return Array.from({ length: Math.max(1, Math.floor(e)) }, () => ({
		active: !1,
		kind: "standard",
		collectibleClass: "equipment",
		x: 0,
		y: 0,
		size: z,
		phase: 0,
		packageType: "notebook",
		orderVisualType: "notebook",
		weightKg: 0
	}));
}
var Hn = {
	"single-low": [82],
	"pair-low": [78, 78],
	"pair-high": [142, 142],
	"triple-arc": [
		70,
		166,
		70
	],
	"triple-step": [
		62,
		112,
		162
	],
	"quad-arc": [
		62,
		142,
		142,
		62
	],
	"quad-rise": [
		55,
		92,
		130,
		166
	],
	"five-arc": [
		55,
		145,
		168,
		145,
		55
	],
	"five-wave": [
		72,
		132,
		92,
		158,
		72
	],
	"five-step": [
		50,
		95,
		130,
		165,
		80
	],
	"six-arc": [
		52,
		105,
		158,
		158,
		105,
		52
	],
	"six-wave": [
		58,
		132,
		86,
		156,
		108,
		58
	],
	"seven-arc": [
		48,
		88,
		132,
		168,
		132,
		88,
		48
	],
	"seven-wave": [
		55,
		115,
		155,
		92,
		165,
		112,
		55
	]
};
Object.freeze(Object.keys(Hn));
var Un = Object.freeze([
	{
		id: "boxes-single",
		kind: "box-stack",
		action: "jump",
		packagePattern: "single-low"
	},
	{
		id: "boxes-pair",
		kind: "box-stack",
		action: "jump",
		packagePattern: "pair-high"
	},
	{
		id: "boxes-triple",
		kind: "box-stack",
		action: "jump",
		packagePattern: "triple-arc"
	},
	{
		id: "boxes-quad",
		kind: "box-stack",
		action: "jump",
		packagePattern: "quad-arc"
	},
	{
		id: "boxes-seven",
		kind: "box-stack",
		action: "jump",
		packagePattern: "seven-arc"
	},
	{
		id: "pallet-pair",
		kind: "pallet",
		action: "jump",
		packagePattern: "pair-low"
	},
	{
		id: "pallet-step",
		kind: "pallet",
		action: "jump",
		packagePattern: "triple-step"
	},
	{
		id: "pallet-rise",
		kind: "pallet",
		action: "jump",
		packagePattern: "quad-rise"
	},
	{
		id: "pallet-wave",
		kind: "pallet",
		action: "jump",
		packagePattern: "six-wave"
	},
	{
		id: "trolley-arc",
		kind: "trolley",
		action: "jump",
		packagePattern: "five-arc"
	},
	{
		id: "trolley-step",
		kind: "trolley",
		action: "jump",
		packagePattern: "five-step"
	},
	{
		id: "trolley-six",
		kind: "trolley",
		action: "jump",
		packagePattern: "six-arc"
	},
	{
		id: "trolley-seven",
		kind: "trolley",
		action: "jump",
		packagePattern: "seven-wave"
	},
	{
		id: "beam-single",
		kind: "overhead",
		action: "slide",
		packagePattern: "single-low"
	},
	{
		id: "beam-pair",
		kind: "overhead",
		action: "slide",
		packagePattern: "pair-low"
	},
	{
		id: "beam-triple",
		kind: "overhead",
		action: "slide",
		packagePattern: "triple-arc"
	},
	{
		id: "beam-five",
		kind: "overhead",
		action: "slide",
		packagePattern: "five-wave"
	},
	{
		id: "beam-seven",
		kind: "overhead",
		action: "slide",
		packagePattern: "seven-wave"
	}
]), Wn = class {
	constructor(e, t) {
		i(this, "values", void 0), i(this, "random", void 0), i(this, "remaining", []), i(this, "last", null), this.values = e, this.random = t;
	}
	next() {
		if (this.remaining.length === 0) {
			this.remaining = [...this.values];
			for (let e = this.remaining.length - 1; e > 0; --e) {
				let t = this.random.integer(0, e);
				[this.remaining[e], this.remaining[t]] = [this.remaining[t], this.remaining[e]];
			}
			this.remaining.length > 1 && this.remaining.at(-1) === this.last && ([this.remaining[0], this.remaining[this.remaining.length - 1]] = [this.remaining.at(-1), this.remaining[0]]);
		}
		let e = this.remaining.pop();
		if (e === void 0) throw Error("Shuffle bag requires at least one value");
		return this.last = e, e;
	}
}, Gn = -b.jumpVelocity * 2 / b.gravity, Kn = .96;
function qn(e, t, n, r) {
	let i = e.length, a = r * Gn * Kn, o = yn[n.integer(0, yn.length - 1)] ?? "notebook";
	return e.map((e, r) => {
		let s = i > 1 ? r / (i - 1) - .5 : 0;
		return {
			x: t + a * s,
			y: 432 - e - 15,
			phase: n.range(0, Math.PI * 2),
			kind: "standard",
			collectibleClass: "parcel",
			packageType: o,
			orderVisualType: "parcel",
			weightKg: 0
		};
	});
}
var Jn = class {
	constructor(e, t, n = Ln) {
		i(this, "random", void 0), i(this, "allowedKinds", void 0), i(this, "distanceUntilNext", void 0), i(this, "obstaclePatterns", void 0), i(this, "patternBag", void 0), this.random = e, this.allowedKinds = n, this.distanceUntilNext = Math.max(1, t) * 3.7;
		let r = Un.filter(({ kind: e }) => this.allowedKinds.includes(e));
		this.obstaclePatterns = r.length > 0 ? r : Un, this.patternBag = new Wn(this.obstaclePatterns, this.random);
	}
	advance(e, t, n, r) {
		if (this.distanceUntilNext -= Math.max(0, e), this.distanceUntilNext > 0) return null;
		let i = this.patternBag.next(), a = i.kind, o = In[a], s = a === "overhead", c = i.packagePattern, l = zn(t, n, this.random.next());
		this.distanceUntilNext += l;
		let u = Hn[c], d = s ? u.map((e, t) => Rn[t % Rn.length]) : u, f = Math.max(3, Math.min(6, d.length)), p = Array.from({ length: f }, (e, t) => {
			let n = Math.round(t * (d.length - 1) / Math.max(1, f - 1));
			return d[n] ?? d[0];
		}), m = s ? x.topY : 432 - o.height, h = qn(p, r, this.random, t), g = Math.min(r, ...h.map(({ x: e }) => e)), _ = Math.max(0, r - g);
		return {
			kind: a,
			source: "normal",
			pattern: c,
			obstaclePattern: i.id,
			x: r + _,
			y: m,
			width: o.width,
			height: o.height,
			packages: h.map((e) => ({
				...e,
				x: e.x + _
			})),
			gapPixels: l
		};
	}
};
function V(e) {
	let t = Math.max(1, e.speed), n = e.minimumReactionSeconds ?? 1.6, r = (e.spawnX - 200) / t, i = Math.max(3, Math.min(8, Math.floor(e.packageCount ?? 5)));
	if (r < n || e.rewards.length > 2 || e.rewards.some(({ kind: e, packageType: t, storyOrder: n }) => n === !0 && (t === void 0 || e !== "standard"))) return null;
	let a = Math.max(0, Math.floor(e.patternIndex ?? 0)), o = [
		"pallet",
		"box-stack",
		"trolley"
	], s = e.obstacleKind;
	if (s && (e.action === "slide" ? s !== "overhead" : s === "overhead")) return null;
	let c = s ?? (e.action === "slide" ? "overhead" : o[a % o.length] ?? "pallet"), l = In[c], u = i + e.rewards.length, d = c === "overhead" ? Rn : Hn["seven-arc"], f = Array.from({ length: u }, (e, t) => {
		let n = Math.round(t * (d.length - 1) / Math.max(1, u - 1));
		return d[n] ?? d[0];
	}), p = Math.max(t * Gn * Kn, Math.max(0, u - 1) * 38), m = e.rewards.length === 1 ? [Math.min(u - 2, Math.ceil(u * .62))] : [Math.max(1, Math.floor(u / 3)), Math.min(u - 2, Math.ceil(u * .7))], h = yn, g = 0, _ = f.map((t, n) => {
		let r = u > 1 ? n / (u - 1) - .5 : 0, i = m.indexOf(n), o = i >= 0 ? e.rewards[i] : void 0, s = o?.kind ?? "standard", l = o?.kind === "standard" && o.packageType ? o.packageType : "parcel", d = l === "parcel" ? "parcel" : "equipment", f = o?.packageType ?? h[(a + g) % h.length] ?? "notebook";
		return o === void 0 && (g += 1), {
			x: e.spawnX + p * r,
			y: c === "overhead" ? 432 - t : 432 - t - 15,
			phase: (a + n) * .73,
			kind: s,
			collectibleClass: d,
			packageType: l === "parcel" ? f : l,
			orderVisualType: l,
			weightKg: 0,
			storyRewardPattern: !0,
			...e.authoredWaveId ? { authoredWaveId: e.authoredWaveId } : {},
			...o?.storyOrder === !0 ? { storyOrder: !0 } : {}
		};
	}), v = Math.min(e.spawnX, ..._.map(({ x: e }) => e)), y = Math.max(0, 960 + S.spawnPadding - v);
	return {
		kind: c,
		source: e.source ?? "story-reward",
		pattern: e.action === "slide" ? "five-wave" : "five-arc",
		obstaclePattern: `authored-${e.action}-${a % 6}`,
		x: e.spawnX + y,
		y: c === "overhead" ? x.topY : 432 - l.height,
		width: l.width,
		height: l.height,
		packages: _.map((e) => ({
			...e,
			x: e.x + y
		})),
		gapPixels: t * n,
		...e.authoredWaveId ? { authoredWaveId: e.authoredWaveId } : {},
		...e.authoredActionIndex === void 0 ? {} : { authoredActionIndex: e.authoredActionIndex },
		...e.semanticVariant ? { semanticVariant: e.semanticVariant } : {}
	};
}
function Yn(e) {
	let t = 960 + S.spawnPadding, n = [
		t,
		t + 64,
		t + 128,
		t + 192,
		t + 256,
		t + 320
	];
	for (let t = 0; t < n.length; t += 1) {
		let r = e[t], i = n[t];
		!r || i === void 0 || (r.active = !0, r.kind = "standard", r.orderVisualType = t === 3 ? "notebook" : "parcel", r.collectibleClass = un(r.orderVisualType), r.x = i, r.y = 432 - r.size - 17, r.phase = t * .9, r.packageType = r.orderVisualType === "parcel" ? "notebook" : r.orderVisualType, r.weightKg = 0, r.storyRewardPattern = !1, r.authoredWaveId = "challenge-onboarding", delete r.storyOrder);
	}
}
function H(e, t, n) {
	let r = t.find((e) => !e.active), i = n.filter((e) => !e.active);
	if (!r || i.length < e.packages.length) return !1;
	if (r.active = !0, r.kind = e.kind, r.source = e.source, r.x = e.x, r.y = e.y, r.width = e.width, r.height = e.height, e.kind === "overhead") {
		let t = 0, n = `${e.obstaclePattern}:${Math.round(e.x)}:${e.authoredActionIndex ?? 0}`;
		for (let e = 0; e < n.length; e += 1) t = t * 31 + n.charCodeAt(e) >>> 0;
		r.visualVariant = t % 3;
	} else delete r.visualVariant;
	r.objectiveCredited = !1, e.authoredWaveId ? r.authoredWaveId = e.authoredWaveId : delete r.authoredWaveId, e.authoredActionIndex === void 0 ? delete r.authoredActionIndex : r.authoredActionIndex = e.authoredActionIndex, e.semanticVariant ? r.semanticVariant = e.semanticVariant : delete r.semanticVariant;
	for (let t = 0; t < e.packages.length; t += 1) {
		let n = e.packages[t], r = i[t];
		if (!n || !r) return !1;
		r.active = !0, r.kind = n.kind, r.collectibleClass = n.collectibleClass, r.x = n.x, r.y = n.y, r.phase = n.phase, r.packageType = n.packageType, r.orderVisualType = n.orderVisualType, r.weightKg = n.weightKg, r.storyRewardPattern = n.storyRewardPattern === !0, e.authoredWaveId ? r.authoredWaveId = e.authoredWaveId : delete r.authoredWaveId, n.storyOrder === !0 ? r.storyOrder = !0 : delete r.storyOrder;
	}
	return !0;
}
function Xn(e, t) {
	let n = In[e];
	return {
		kind: e,
		source: "boss",
		pattern: "single-low",
		obstaclePattern: `boss-${e}`,
		x: t,
		y: e === "overhead" ? x.topY : 432 - n.height,
		width: n.width,
		height: n.height,
		packages: [],
		gapPixels: 0
	};
}
//#endregion
//#region src/game/viewport.ts
function Zn(e, t, n, r = ve.maxPixels, i = ve.maxDimension) {
	let a = Math.max(1, Number.isFinite(e) ? e : 1), o = Math.max(1, Number.isFinite(t) ? t : 1), s = Math.max(1, Math.min(ve.maxDpr, Number.isFinite(n) ? n : 1)), c = Math.min(s, Math.sqrt(Math.max(1, r) / (a * o)), Math.max(1, i) / a, Math.max(1, i) / o), l = Math.max(1, Math.floor(a * c)), u = Math.max(1, Math.floor(o * c));
	return {
		width: l,
		height: u,
		dpr: Math.min(l / a, u / o)
	};
}
var Qn = 1.5;
function $n(e, t) {
	return t ? {
		finishRun: !1,
		consumeWarranty: !0,
		resetCombo: !1,
		recoverySeconds: 2
	} : {
		finishRun: e === "challenge",
		consumeWarranty: !1,
		resetCombo: !0,
		recoverySeconds: e === "story" ? 2 : 0
	};
}
var er = [
	40,
	37,
	46,
	42,
	49,
	35
], tr = class {
	constructor() {
		i(this, "doubleIndex", 0), i(this, "nextDoubleAt", er[0]), i(this, "nextWarrantyAt", 70);
	}
	dueAt(e, t) {
		let n = Math.max(0, Math.floor(e));
		return n >= this.nextWarrantyAt && (this.nextWarrantyAt += 90, !t) ? "gwarancja_48" : n < this.nextDoubleAt ? null : (this.doubleIndex = (this.doubleIndex + 1) % er.length, this.nextDoubleAt += er[this.doubleIndex], "podwojny_wynik");
	}
	recordWarrantyConsumption(e) {
		let t = Math.max(0, Math.floor(e));
		this.nextWarrantyAt = Math.max(this.nextWarrantyAt, t + 90);
	}
	reset() {
		this.doubleIndex = 0, this.nextDoubleAt = er[0], this.nextWarrantyAt = 70;
	}
}, nr = class {
	constructor() {
		i(this, "remainingSeconds", /* @__PURE__ */ new Map());
	}
	has(e) {
		return this.remainingSeconds.has(e);
	}
	activate(e) {
		if (e === "gwarancja_48") {
			if (!this.remainingSeconds.has(e)) {
				if (this.remainingSeconds.size >= 2) return !1;
				this.remainingSeconds.set(e, Infinity);
			}
			return !0;
		}
		return !this.remainingSeconds.has(e) && this.remainingSeconds.size >= 2 ? !1 : (this.remainingSeconds.set(e, bn[e]), !0);
	}
	consumeWarranty() {
		return this.remainingSeconds.has("gwarancja_48") ? (this.remainingSeconds.delete("gwarancja_48"), !0) : !1;
	}
	tick(e) {
		let t = Math.max(0, e);
		for (let [e, n] of this.remainingSeconds) {
			if (e === "gwarancja_48") continue;
			let r = n - t;
			r <= 0 ? this.remainingSeconds.delete(e) : this.remainingSeconds.set(e, r);
		}
	}
	keys() {
		return [...this.remainingSeconds.keys()];
	}
	statuses() {
		return [...this.remainingSeconds].map(([e, t]) => ({
			kind: e,
			remainingSeconds: Number.isFinite(t) ? Math.max(0, t) : null
		}));
	}
	clear() {
		this.remainingSeconds.clear();
	}
}, rr = .72;
function ir(e) {
	return e?.chapter === "prologue" || e?.id.startsWith("intro.") ? "prologue" : e?.chapter === "finale" || e?.id.startsWith("final.") ? "finale" : "epoch";
}
function ar(e) {
	let t = e?.chapter;
	if (t?.startsWith("epoch_")) {
		let e = Number(t.slice(6));
		if (Number.isInteger(e)) return Math.max(0, Math.min(4, e - 1));
	}
	return t === "finale" || e?.id.startsWith("final.") ? 4 : 0;
}
var or = class {
	constructor(e) {
		i(this, "story", void 0), i(this, "scenes", void 0), i(this, "sequence", void 0), i(this, "totalActiveDurationSeconds", void 0), i(this, "stepIndex", 0), i(this, "state", void 0), i(this, "segmentElapsedSeconds", 0), i(this, "totalActiveElapsedSeconds", 0), i(this, "countdownSecondsRemaining", 0), i(this, "reframeSecondsRemaining", 0), i(this, "pendingStepIndex", null), i(this, "scenePageIndex", 0), this.story = e, this.scenes = new Map(e.scenes.map((e) => [e.id, e])), this.sequence = e.sequence, this.totalActiveDurationSeconds = e.sequence.reduce((e, t) => e + (t.type === "play" ? t.durationSeconds : 0), 0), this.state = this.stateForStep(this.currentStep);
	}
	continueScene(e) {
		if (this.state !== "scene" || this.currentStep?.type !== "scene" || this.currentStep.sceneId !== e) return !1;
		let t = this.scenes.get(e)?.steps?.length ?? 0;
		if (t > 0 && this.scenePageIndex + 1 < t) return this.scenePageIndex += 1, !0;
		let n = this.stepIndex + 1;
		return this.sequence[n]?.type === "scene" ? (this.enterStep(n), !0) : (this.state = "reframe", this.pendingStepIndex = n, this.reframeSecondsRemaining = rr, !0);
	}
	advance(e, { allowPlayCompletion: t = !0 } = {}) {
		let n = Math.max(0, e);
		for (; n > 0 && !(this.state === "scene" || this.state === "completed");) {
			if (this.state === "reframe") {
				let e = Math.min(n, this.reframeSecondsRemaining);
				this.reframeSecondsRemaining = Math.max(0, this.reframeSecondsRemaining - e), n -= e, this.reframeSecondsRemaining <= 2 ** -52 && (this.state = "countdown", this.countdownSecondsRemaining = this.story.resumeCountdownSeconds);
				continue;
			}
			if (this.state === "countdown") {
				let e = Math.min(n, this.countdownSecondsRemaining);
				this.countdownSecondsRemaining = Math.max(0, this.countdownSecondsRemaining - e), n -= e, this.countdownSecondsRemaining <= 2 ** -52 && (this.enterStep(this.pendingStepIndex ?? this.sequence.length), this.pendingStepIndex = null);
				continue;
			}
			let e = this.currentStep;
			if (e?.type !== "play") {
				this.state = "completed";
				break;
			}
			let r = Math.max(0, e.durationSeconds - this.segmentElapsedSeconds), i = Math.min(n, r);
			if (this.segmentElapsedSeconds += i, this.totalActiveElapsedSeconds += i, n -= i, this.segmentElapsedSeconds + 2 ** -52 >= e.durationSeconds) {
				if (!t) break;
				this.enterStep(this.stepIndex + 1);
			}
		}
		return this.snapshot;
	}
	get snapshot() {
		let e = this.currentStep, t = e?.type === "scene" ? this.scenes.get(e.sceneId) ?? null : null, n = t?.steps?.[this.scenePageIndex] ?? null, r = t === null ? null : n === null ? t : {
			...t,
			title: n.title ?? t.title,
			body: n.body,
			continueLabel: n.continueLabel
		}, i = e?.type === "play" ? e : null, a = this.state === "completed", o = a ? "completed" : i ? "epoch" : ir(r), s = i?.epochIndex ?? ar(r), c = r === null ? -1 : this.story.scenes.findIndex(({ id: e }) => e === r.id), l = this.state === "scene" || this.state === "reframe" || this.state === "countdown", u = this.state === "play", d = a ? {
			kind: "completed_safe",
			hazardsEnabled: !1,
			pickupsEnabled: !1,
			controlsEnabled: !1
		} : u ? {
			kind: "active_play",
			hazardsEnabled: !0,
			pickupsEnabled: !0,
			controlsEnabled: !0
		} : {
			kind: "narrative_safe",
			hazardsEnabled: !1,
			pickupsEnabled: !1,
			controlsEnabled: !1
		};
		return {
			state: this.state,
			phase: o,
			sectionId: r?.chapter ?? i?.id ?? (a ? "completed" : "prologue"),
			epochIndex: s,
			sectionElapsedSeconds: i ? this.segmentElapsedSeconds : 0,
			sectionDurationSeconds: i?.durationSeconds ?? 0,
			totalElapsedSeconds: this.totalActiveElapsedSeconds,
			totalActiveElapsedSeconds: this.totalActiveElapsedSeconds,
			totalActiveDurationSeconds: this.totalActiveDurationSeconds,
			countdownSecondsRemaining: this.countdownSecondsRemaining,
			countdownValue: this.state === "countdown" ? Math.max(1, Math.ceil(this.countdownSecondsRemaining)) : null,
			progress: this.totalActiveDurationSeconds <= 0 ? Number(a) : Math.min(1, this.totalActiveElapsedSeconds / this.totalActiveDurationSeconds),
			sceneIndex: c,
			sceneCount: this.story.scenes.length,
			scene: r,
			scenePageId: n?.id ?? null,
			scenePageIndex: n === null ? 0 : this.scenePageIndex,
			scenePageCount: t?.steps?.length ?? 1,
			sceneAction: n?.action ?? null,
			sceneFinalFrame: n?.finalFrame ?? null,
			playSegment: i,
			activeBeats: [],
			trustCorridor: l,
			controlsEnabled: this.state === "play",
			worldSpeedScale: l ? this.story.readingSpeedMultiplier : 1,
			completed: a,
			safety: d
		};
	}
	get currentStep() {
		return this.sequence[this.stepIndex];
	}
	enterStep(e) {
		this.stepIndex = Math.max(0, e), this.segmentElapsedSeconds = 0, this.countdownSecondsRemaining = 0, this.reframeSecondsRemaining = 0, this.scenePageIndex = 0, this.state = this.stateForStep(this.currentStep);
	}
	stateForStep(e) {
		return e === void 0 ? "completed" : e.type === "scene" ? "scene" : "play";
	}
}, sr = [
	"pallet",
	"overhead",
	"trolley"
], cr = 1.5, lr = .35, ur = .5, dr = 2.2, fr = class {
	constructor(e = 45, t = 60) {
		i(this, "minimumIntervalSeconds", void 0), i(this, "maximumIntervalSeconds", void 0), i(this, "phase", "inactive"), i(this, "patternsLaunched", 0), i(this, "patternsCompleted", 0), i(this, "nextWaveAtSeconds", void 0), i(this, "phaseSecondsRemaining", 0), i(this, "attackCooldown", 0), i(this, "awaitingResolution", !1), i(this, "hazardSeen", !1), i(this, "cycle", 0), this.minimumIntervalSeconds = e, this.maximumIntervalSeconds = t, this.nextWaveAtSeconds = Math.max(1, e);
	}
	get snapshot() {
		return {
			phase: this.phase,
			patternsCompleted: this.patternsCompleted,
			patternCount: sr.length,
			nextWaveAtSeconds: this.nextWaveAtSeconds
		};
	}
	get blocksRegularSpawns() {
		return this.phase !== "inactive";
	}
	reset() {
		this.phase = "inactive", this.patternsLaunched = 0, this.patternsCompleted = 0, this.nextWaveAtSeconds = Math.max(1, this.minimumIntervalSeconds), this.phaseSecondsRemaining = 0, this.attackCooldown = 0, this.awaitingResolution = !1, this.hazardSeen = !1, this.cycle = 0;
	}
	advance(e, t, n, r) {
		let i = Math.max(0, e);
		if (this.phase === "inactive") return t < this.nextWaveAtSeconds ? { type: "none" } : (this.phase = "warning", this.phaseSecondsRemaining = cr, this.patternsLaunched = 0, this.patternsCompleted = 0, this.cycle += 1, { type: "none" });
		if (this.phase === "warning") return this.phaseSecondsRemaining = Math.max(0, this.phaseSecondsRemaining - i), this.phaseSecondsRemaining > 0 ? { type: "none" } : (this.phase = "running", this.attackCooldown = lr, { type: "none" });
		if (this.phase === "running") {
			if (this.awaitingResolution) {
				if (r && (this.hazardSeen = !0), !r && this.hazardSeen) {
					if (this.awaitingResolution = !1, this.hazardSeen = !1, this.patternsCompleted += 1, this.patternsCompleted >= sr.length) {
						this.phase = "reward", this.phaseSecondsRemaining = dr;
						let e = Math.max(0, this.maximumIntervalSeconds - this.minimumIntervalSeconds) * (this.cycle * .61803398875 % 1);
						return this.nextWaveAtSeconds = t + this.minimumIntervalSeconds + e, { type: "complete" };
					}
					this.attackCooldown = ur;
				}
				return { type: "none" };
			}
			if (this.attackCooldown = Math.max(0, this.attackCooldown - i), this.attackCooldown > 0 || !n) return { type: "none" };
			let e = sr[this.patternsLaunched] ?? "pallet";
			return this.patternsLaunched += 1, this.awaitingResolution = !0, this.hazardSeen = !1, {
				type: "attack",
				kind: e
			};
		}
		return this.phaseSecondsRemaining = Math.max(0, this.phaseSecondsRemaining - i), this.phaseSecondsRemaining <= 0 && (this.phase = "inactive"), { type: "none" };
	}
}, pr = [
	{
		identity: "order-backlog",
		positiveMotif: "process-zones",
		attacks: [
			"pallet",
			"overhead",
			"box-stack",
			"overhead"
		]
	},
	{
		identity: "quality-trial",
		positiveMotif: "quality-mark",
		attacks: ["overhead"]
	},
	{
		identity: "matching-challenge",
		positiveMotif: "matched-order",
		attacks: ["trolley"]
	},
	{
		identity: "order-peak",
		positiveMotif: "dispatch-flow",
		attacks: [
			"box-stack",
			"overhead",
			"trolley"
		]
	}
], mr = .7, hr = 1.2;
function gr() {
	return {
		epochIndex: -1,
		challengeName: "",
		identity: null,
		positiveMotif: null,
		phase: "inactive",
		attacksLaunched: 0,
		attacksResolved: 0,
		attackCount: 0,
		completed: !1
	};
}
var _r = class {
	constructor() {
		i(this, "model", gr()), i(this, "definition", null), i(this, "durationSeconds", 0), i(this, "warningRemaining", 0), i(this, "awaitingResolution", !1), i(this, "retryPending", !1), i(this, "hazardSeen", !1), i(this, "completionEmitted", !1);
	}
	get blocksRegularSpawns() {
		return this.model.phase === "warning" || this.model.phase === "challenge";
	}
	reset() {
		Object.assign(this.model, gr()), this.definition = null, this.durationSeconds = 0, this.warningRemaining = 0, this.awaitingResolution = !1, this.retryPending = !1, this.hazardSeen = !1, this.completionEmitted = !1;
	}
	retryCurrentAttack() {
		!this.awaitingResolution || this.model.phase !== "challenge" || (this.awaitingResolution = !1, this.retryPending = !0, this.hazardSeen = !1, this.model.attacksLaunched = Math.max(this.model.attacksResolved, this.model.attacksLaunched - 1));
	}
	enterEpoch(e, t, n) {
		this.reset();
		let r = pr[e];
		r && (this.definition = r, this.durationSeconds = Math.max(1, n), Object.assign(this.model, {
			epochIndex: e,
			challengeName: t,
			identity: r.identity,
			positiveMotif: r.positiveMotif,
			attackCount: r.attacks.length
		}));
	}
	advance(e, t, n, r, i) {
		if (!this.definition) return { type: "none" };
		let a = Math.max(0, t), o = Math.max(this.durationSeconds * .72, this.durationSeconds - hr);
		if (a + 2 ** -52 >= this.durationSeconds && !this.awaitingResolution && !this.retryPending) return this.model.completed = !0, this.model.phase = "completed", this.completionEmitted ? { type: "none" } : (this.completionEmitted = !0, { type: "complete" });
		if (a >= o && !this.awaitingResolution && !this.retryPending) return this.completeIntoTransformation();
		if (this.model.phase === "inactive" && a >= this.durationSeconds * .08 && (this.model.phase = "warning", this.warningRemaining = mr), this.model.phase === "warning") return this.warningRemaining = Math.max(0, this.warningRemaining - Math.max(0, e)), this.warningRemaining <= 0 && (this.model.phase = "challenge"), { type: "none" };
		if (this.model.phase !== "challenge") return { type: "none" };
		if (this.awaitingResolution) return i && (this.hazardSeen = !0), !i && this.hazardSeen && (this.awaitingResolution = !1, this.hazardSeen = !1, this.model.attacksResolved += 1, this.model.attacksResolved >= this.model.attackCount) ? this.completeIntoTransformation() : { type: "none" };
		if (n || !r) return { type: "none" };
		let s = this.definition.attacks[this.model.attacksLaunched];
		return s ? (this.model.attacksLaunched += 1, this.awaitingResolution = !0, this.retryPending = !1, this.hazardSeen = !1, {
			type: "attack",
			kind: s
		}) : this.completeIntoTransformation();
	}
	completeIntoTransformation() {
		return this.model.completed = !0, this.model.phase = "transforming", this.completionEmitted ? { type: "none" } : (this.completionEmitted = !0, { type: "complete" });
	}
}, vr = .85, yr = class {
	constructor() {
		i(this, "activeModels", []), i(this, "elapsedSeconds", 0);
	}
	get models() {
		return this.activeModels;
	}
	reset() {
		this.activeModels = [], this.elapsedSeconds = 0;
	}
	begin(e, t) {
		this.elapsedSeconds = 0, this.activeModels = e.filter(({ active: e }) => e).map((e) => ({
			active: !0,
			motif: t,
			obstacleKind: e.kind,
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height,
			progress: 0
		}));
	}
	advance(e) {
		if (this.activeModels.length === 0) return;
		this.elapsedSeconds += Math.max(0, e);
		let t = Math.min(1, this.elapsedSeconds / vr);
		if (t >= 1) {
			this.activeModels = [];
			return;
		}
		for (let e of this.activeModels) e.progress = t;
	}
}, br = [
	"epoch_1.training",
	"epoch_1.order_backlog",
	"epoch_2.quality_series",
	"epoch_2.quality_trial",
	"epoch_3.matching_creative",
	"epoch_3.matching_growth",
	"epoch_3.matching_trust",
	"epoch_4.order_peak",
	"epoch_4.order_peak_final",
	"epoch_5.million_threshold"
], xr = [
	"notebook",
	"lcd",
	"pc"
], U = {
	mixedActionsEach: 4,
	backlogAlternation: 4,
	qualitySeries: 4,
	qualityCombo: 3,
	creativePickups: xr.length,
	growthCombo: 8,
	trustClean: 12,
	requiredOrders: 6,
	orderPeakSeconds: 60,
	millionOrders: 50,
	millionCombinations: 12
}, Sr = new Set(br), Cr = new Set(xr);
function wr(e) {
	return Cr.has(e);
}
function Tr(e) {
	return Number.isFinite(e) && e > 0;
}
function Er(e, t, n) {
	let r = e + t;
	return r + 1e-6 >= n ? n : Math.min(n, r);
}
var Dr = class {
	constructor() {
		i(this, "activeSegmentId", null), i(this, "trainingJumps", 0), i(this, "trainingSlides", 0), i(this, "backlogCurrent", 0), i(this, "backlogBest", 0), i(this, "backlogLastAction", null), i(this, "qualityCompletedSeries", 0), i(this, "qualityCurrentSeries", 0), i(this, "creativePickups", /* @__PURE__ */ new Set()), i(this, "growthCurrent", 0), i(this, "growthBest", 0), i(this, "trustCurrent", 0), i(this, "trustBest", 0), i(this, "requiredOrders", 0), i(this, "bonusOrders", 0), i(this, "lastCompletedOrderType", null), i(this, "orderPeakElapsedSeconds", 0), i(this, "orderPeakDurationSeconds", U.orderPeakSeconds), i(this, "thresholdOrders", 0), i(this, "thresholdCombinations", 0);
	}
	enterSegment(e, t) {
		if (e === null) {
			let e = this.activeSegmentId !== null;
			return this.activeSegmentId = null, e;
		}
		if (!Sr.has(e)) return !1;
		let n = e, r = n !== this.activeSegmentId;
		return this.activeSegmentId = n, r;
	}
	recordSuccessfulPattern(e) {
		return this.update(() => {
			switch (this.activeSegmentId) {
				case "epoch_1.training": return e === "jump" ? this.trainingJumps += 1 : this.trainingSlides += 1, !0;
				case "epoch_1.order_backlog": return this.backlogCurrent = this.backlogLastAction === null || this.backlogLastAction !== e ? this.backlogCurrent + 1 : 1, this.backlogLastAction = e, this.backlogBest = Math.max(this.backlogBest, this.backlogCurrent), !0;
				case "epoch_2.quality_series": return this.qualityCompletedSeries >= U.qualitySeries ? !1 : (this.qualityCurrentSeries += 1, this.qualityCurrentSeries >= U.qualityCombo && (this.qualityCompletedSeries += 1, this.qualityCurrentSeries = 0), !0);
				default: return !1;
			}
		});
	}
	recordCurrentCombo(e) {
		return this.update(() => {
			if (this.activeSegmentId !== "epoch_3.matching_growth" || !Number.isFinite(e)) return !1;
			let t = Math.max(0, Math.floor(e)), n = Math.max(this.growthBest, t), r = t !== this.growthCurrent || n !== this.growthBest;
			return this.growthCurrent = t, this.growthBest = n, r;
		});
	}
	recordError() {
		return this.update(() => {
			switch (this.activeSegmentId) {
				case "epoch_1.order_backlog": {
					let e = this.backlogCurrent !== 0 || this.backlogLastAction !== null;
					return this.backlogCurrent = 0, this.backlogLastAction = null, e;
				}
				case "epoch_2.quality_series": {
					let e = this.qualityCurrentSeries !== 0;
					return this.qualityCurrentSeries = 0, e;
				}
				case "epoch_3.matching_growth": {
					let e = this.growthCurrent !== 0;
					return this.growthCurrent = 0, e;
				}
				case "epoch_3.matching_trust": {
					let e = this.trustCurrent !== 0;
					return this.trustCurrent = 0, e;
				}
				default: return !1;
			}
		});
	}
	recordCollision() {
		return this.recordError();
	}
	recordTrustCollection() {
		return this.update(() => this.activeSegmentId === "epoch_3.matching_trust" ? (this.trustCurrent += 1, this.trustBest = Math.max(this.trustBest, this.trustCurrent), !0) : !1);
	}
	recordCreativePickup(e) {
		return this.update(() => this.activeSegmentId !== "epoch_3.matching_creative" || !wr(e) || this.creativePickups.has(e) ? !1 : (this.creativePickups.add(e), !0));
	}
	recordOrder(e) {
		return this.update(() => this.activeSegmentId !== "epoch_4.order_peak" || ![
			"pc",
			"notebook",
			"lcd",
			"telefon"
		].includes(e) ? !1 : (this.requiredOrders < U.requiredOrders ? this.requiredOrders += 1 : this.bonusOrders += 1, this.lastCompletedOrderType = e, !0));
	}
	recordElapsed(e) {
		return this.update(() => {
			if (!Tr(e)) return !1;
			switch (this.activeSegmentId) {
				case "epoch_4.order_peak":
				case "epoch_4.order_peak_final": return this.orderPeakElapsedSeconds >= this.orderPeakDurationSeconds ? !1 : (this.orderPeakElapsedSeconds = Er(this.orderPeakElapsedSeconds, e, this.orderPeakDurationSeconds), !0);
				default: return !1;
			}
		});
	}
	recordMillionOrder() {
		return this.update(() => this.activeSegmentId !== "epoch_5.million_threshold" || this.thresholdOrders >= U.millionOrders ? !1 : (this.thresholdOrders += 1, !0));
	}
	recordMillionCombination() {
		return this.update(() => this.activeSegmentId !== "epoch_5.million_threshold" || this.thresholdCombinations >= U.millionCombinations ? !1 : (this.thresholdCombinations += 1, !0));
	}
	get snapshot() {
		let e = this.trainingJumps >= U.mixedActionsEach && this.trainingSlides >= U.mixedActionsEach, t = this.backlogBest >= U.backlogAlternation, n = this.creativePickups.size >= U.creativePickups, r = this.growthBest >= U.growthCombo, i = this.trustBest >= U.trustClean, a = this.requiredOrders >= U.requiredOrders, o = this.orderPeakElapsedSeconds >= this.orderPeakDurationSeconds, s = this.completedObjectiveIds(), c = this.orderPeakDurationSeconds / 3, l = o ? 3 : Math.floor(this.orderPeakElapsedSeconds / c);
		return {
			activeSegmentId: this.activeSegmentId,
			completedObjectiveIds: s,
			epoch1: {
				training: {
					jumps: this.trainingJumps,
					slides: this.trainingSlides,
					targetEach: U.mixedActionsEach,
					completed: e
				},
				orderBacklog: {
					currentAlternation: this.backlogCurrent,
					bestAlternation: this.backlogBest,
					target: U.backlogAlternation,
					completed: t
				},
				completed: e && t
			},
			epoch2: {
				completedSeries: this.qualityCompletedSeries,
				currentSeries: this.qualityCurrentSeries,
				seriesTarget: U.qualitySeries,
				comboTarget: U.qualityCombo,
				completed: this.qualityCompletedSeries >= U.qualitySeries
			},
			epoch3: {
				creative: {
					collected: this.creativePickups.size,
					collectedIds: [...this.creativePickups].sort(),
					target: U.creativePickups,
					completed: n
				},
				growth: {
					currentCombo: this.growthCurrent,
					bestCombo: this.growthBest,
					target: U.growthCombo,
					completed: r
				},
				trust: {
					currentClean: this.trustCurrent,
					longestClean: this.trustBest,
					target: U.trustClean,
					completed: i
				},
				completed: n && r && i
			},
			epoch4: {
				orders: {
					requiredCompleted: this.requiredOrders,
					requiredTarget: U.requiredOrders,
					bonusCompleted: this.bonusOrders,
					lastCompletedType: this.lastCompletedOrderType,
					completed: a
				},
				flow: {
					elapsedSeconds: this.orderPeakElapsedSeconds,
					phase: o ? "completed" : this.orderPeakElapsedSeconds < c ? "intake" : this.orderPeakElapsedSeconds < c * 2 ? "routing" : "dispatch",
					phasesCompleted: l,
					completed: o
				},
				completed: a && o
			},
			epoch5: {
				millionThreshold: {
					ordersCollected: this.thresholdOrders,
					orderTarget: U.millionOrders,
					combinationsCompleted: this.thresholdCombinations,
					combinationTarget: U.millionCombinations,
					counterStart: 1e6 - U.millionOrders,
					counterTarget: 1e6,
					counterValue: 1e6 - U.millionOrders + this.thresholdOrders,
					completed: this.thresholdOrders >= U.millionOrders
				},
				completed: this.thresholdOrders >= U.millionOrders
			}
		};
	}
	completedObjectiveIds() {
		let e = [];
		return this.trainingJumps >= U.mixedActionsEach && this.trainingSlides >= U.mixedActionsEach && e.push("epoch_1.training"), this.backlogBest >= U.backlogAlternation && e.push("epoch_1.order_backlog"), this.qualityCompletedSeries >= U.qualitySeries && e.push("epoch_2.quality_series"), this.creativePickups.size >= U.creativePickups && e.push("epoch_3.matching_creative"), this.growthBest >= U.growthCombo && e.push("epoch_3.matching_growth"), this.trustBest >= U.trustClean && e.push("epoch_3.matching_trust"), this.requiredOrders >= U.requiredOrders && e.push("epoch_4.order_peak"), this.orderPeakElapsedSeconds >= this.orderPeakDurationSeconds && e.push("epoch_4.order_peak_final"), this.thresholdOrders >= U.millionOrders && e.push("epoch_5.million_threshold"), e;
	}
	update(e) {
		let t = new Set(this.completedObjectiveIds());
		return {
			changed: e(),
			newlyCompletedObjectiveIds: this.completedObjectiveIds().filter((e) => !t.has(e))
		};
	}
}, Or = [
	"first-mile",
	"order-process",
	"quality-service",
	"client-paths",
	"scale-logistics",
	"million-approach",
	"million-finale"
], W = (e, t, n = 1) => ({
	x: e,
	y: t,
	zoom: n
}), G = (e, t, n) => ({
	portrait: e,
	landscape: t,
	desktop: n
}), kr = Object.freeze([
	{
		worldId: "first-mile",
		bundleId: "prologue",
		assetPath: "/assets/milion-runner/worlds/world-01-first-mile-v2.webp",
		fallbackId: "fallback-first-mile",
		palette: "campaign-light"
	},
	{
		worldId: "order-process",
		bundleId: "epoch_1",
		assetPath: "/assets/milion-runner/worlds/world-02-order-process-v2.webp",
		fallbackId: "fallback-order-process",
		palette: "campaign-light"
	},
	{
		worldId: "quality-service",
		bundleId: "epoch_2",
		assetPath: "/assets/milion-runner/worlds/world-03-quality-service-v2.webp",
		fallbackId: "fallback-quality-service",
		palette: "campaign-light"
	},
	{
		worldId: "client-paths",
		bundleId: "epoch_3",
		assetPath: "/assets/milion-runner/worlds/world-04-client-paths-v2.webp",
		fallbackId: "fallback-client-paths",
		palette: "campaign-light"
	},
	{
		worldId: "scale-logistics",
		bundleId: "epoch_4",
		assetPath: "/assets/milion-runner/worlds/world-05-scale-logistics-v2.webp",
		fallbackId: "fallback-scale-logistics",
		palette: "campaign-light"
	},
	{
		worldId: "million-approach",
		bundleId: "epoch_5",
		assetPath: "/assets/milion-runner/worlds/world-06-million-approach-v2.webp",
		fallbackId: "fallback-million-approach",
		palette: "campaign-light"
	},
	{
		worldId: "million-finale",
		bundleId: "finale",
		assetPath: "/assets/milion-runner/worlds/world-07-million-finale-v2.webp",
		fallbackId: "fallback-million-finale",
		palette: "campaign-light"
	}
]), Ar = Object.freeze([
	{
		stateId: "intro.ready",
		chapter: "prologue",
		worldId: "first-mile",
		worldProgress: .18,
		copyPlacement: "right",
		focalPoint: {
			x: .25,
			y: .53
		},
		readingCamera: W(.34, .5, 1.04),
		gameCamera: W(.48, .58, 1.08),
		crops: G("30% 50%", "42% 54%", "44% 50%"),
		motifs: [
			"first-package",
			"first-label",
			"hands"
		],
		visualEvent: "hands-seal-first-package",
		reveal: "tape-crosses-the-first-blank-label",
		revealMotion: "seal",
		soundCue: "tape",
		fallbackId: "fallback-intro-ready",
		runnerPresence: "absent"
	},
	{
		stateId: "intro.beginning",
		chapter: "prologue",
		worldId: "first-mile",
		worldProgress: .55,
		copyPlacement: "right",
		focalPoint: {
			x: .29,
			y: .43
		},
		readingCamera: W(.37, .48, 1.02),
		gameCamera: W(.48, .58, 1.08),
		crops: G("33% 48%", "43% 52%", "45% 50%"),
		motifs: [
			"small-warehouse",
			"few-shelves",
			"first-package"
		],
		visualEvent: "camera-reveals-the-small-warehouse",
		reveal: "shelves-draw-out-from-the-packing-table",
		revealMotion: "expand",
		soundCue: "conveyor",
		fallbackId: "fallback-intro-beginning",
		runnerPresence: "absent"
	},
	{
		stateId: "intro.promise",
		chapter: "prologue",
		worldId: "first-mile",
		worldProgress: 1,
		copyPlacement: "right",
		focalPoint: {
			x: .43,
			y: .55
		},
		readingCamera: W(.42, .5, 1),
		gameCamera: W(.5, .6, 1.08),
		crops: G("43% 52%", "48% 55%", "48% 52%"),
		motifs: [
			"tested-device",
			"route-line",
			"first-label"
		],
		visualEvent: "tested-laptop-powers-the-first-route",
		reveal: "laptop-light-sends-the-route-offscreen",
		revealMotion: "route",
		soundCue: "laptop-start",
		fallbackId: "fallback-intro-promise",
		runnerPresence: "absent"
	},
	{
		stateId: "epoch_1.challenge",
		chapter: "epoch_1",
		worldId: "order-process",
		worldProgress: .28,
		copyPlacement: "left",
		focalPoint: {
			x: .67,
			y: .56
		},
		readingCamera: W(.6, .52, 1.02),
		gameCamera: W(.5, .6, 1.06),
		crops: G("66% 53%", "57% 54%", "55% 50%"),
		motifs: [
			"package-backlog",
			"manual-labels",
			"small-warehouse"
		],
		visualEvent: "packages-and-manual-labels-fill-the-small-warehouse",
		reveal: "the-order-backlog-grows-across-one-ground-line",
		revealMotion: "backlog",
		soundCue: "test-signal",
		fallbackId: "fallback-epoch1-challenge",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_1.resolve",
		chapter: "epoch_1",
		worldId: "order-process",
		worldProgress: 1,
		copyPlacement: "left",
		focalPoint: {
			x: .7,
			y: .44
		},
		readingCamera: W(.62, .5, 1.02),
		gameCamera: W(.5, .6, 1.06),
		crops: G("70% 48%", "59% 52%", "57% 50%"),
		motifs: [
			"process-zones",
			"labelled-stations",
			"clear-flow"
		],
		visualEvent: "orders-enter-four-labelled-process-zones",
		reveal: "packages-align-from-intake-to-dispatch",
		revealMotion: "align",
		soundCue: "scanner",
		fallbackId: "fallback-epoch1-resolve",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_2.setup",
		chapter: "epoch_2",
		worldId: "quality-service",
		worldProgress: .2,
		copyPlacement: "right",
		focalPoint: {
			x: .3,
			y: .58
		},
		readingCamera: W(.38, .54, 1.03),
		gameCamera: W(.5, .6, 1.06),
		crops: G("32% 55%", "44% 54%", "44% 50%"),
		motifs: [
			"quality-lab",
			"open-checks",
			"tested-device"
		],
		visualEvent: "diagnostic-lead-connects-to-the-device",
		reveal: "warning-shapes-open-on-the-physical-checklist",
		revealMotion: "diagnose",
		soundCue: "test-signal",
		fallbackId: "fallback-epoch2-setup",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_2.resolve",
		chapter: "epoch_2",
		worldId: "quality-service",
		worldProgress: 1,
		copyPlacement: "right",
		focalPoint: {
			x: .45,
			y: .52
		},
		readingCamera: W(.43, .52, 1.02),
		gameCamera: W(.5, .6, 1.06),
		crops: G("43% 52%", "47% 52%", "47% 50%"),
		motifs: [
			"quality-stamp",
			"completed-checklist",
			"tested-device"
		],
		visualEvent: "black-check-seal-closes-the-quality-process",
		reveal: "checklist-rows-fill-from-top-to-bottom",
		revealMotion: "check",
		soundCue: "scanner",
		fallbackId: "fallback-epoch2-resolve",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_3.start",
		chapter: "epoch_3",
		worldId: "client-paths",
		worldProgress: .12,
		copyPlacement: "left",
		focalPoint: {
			x: .34,
			y: .55
		},
		readingCamera: W(.4, .52, 1.02),
		gameCamera: W(.5, .6, 1.05),
		crops: G("35% 54%", "45% 52%", "46% 50%"),
		motifs: [
			"same-client",
			"empty-desk",
			"starting-budget"
		],
		visualEvent: "the-client-arrives-at-an-empty-first-desk",
		reveal: "the-empty-workplace-opens-beside-the-client",
		revealMotion: "open",
		soundCue: "laptop-start",
		fallbackId: "fallback-epoch3-start",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_3.laptop",
		chapter: "epoch_3",
		worldId: "client-paths",
		worldProgress: .34,
		copyPlacement: "left",
		focalPoint: {
			x: .42,
			y: .54
		},
		readingCamera: W(.44, .52, 1.02),
		gameCamera: W(.5, .6, 1.05),
		crops: G("42% 54%", "47% 52%", "48% 50%"),
		motifs: [
			"same-client",
			"first-laptop",
			"first-workplace"
		],
		visualEvent: "the-first-laptop-opens-on-the-empty-desk",
		reveal: "the-laptop-settles-into-the-first-workplace",
		revealMotion: "open",
		soundCue: "laptop-start",
		fallbackId: "fallback-epoch3-laptop",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_3.business",
		chapter: "epoch_3",
		worldId: "client-paths",
		worldProgress: .64,
		copyPlacement: "left",
		focalPoint: {
			x: .54,
			y: .51
		},
		readingCamera: W(.54, .5, 1.02),
		gameCamera: W(.5, .6, 1.05),
		crops: G("53% 51%", "52% 52%", "52% 50%"),
		motifs: [
			"growing-business",
			"budget-scale",
			"old-laptop"
		],
		visualEvent: "one-desk-expands-into-a-full-office-order",
		reveal: "workstations-and-parcels-build-outward",
		revealMotion: "build",
		soundCue: "conveyor",
		fallbackId: "fallback-epoch3-business",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_3.b2b",
		chapter: "epoch_3",
		worldId: "client-paths",
		worldProgress: 1,
		copyPlacement: "left",
		focalPoint: {
			x: .82,
			y: .55
		},
		readingCamera: W(.7, .52, 1.03),
		gameCamera: W(.5, .6, 1.05),
		crops: G("77% 54%", "62% 53%", "58% 50%"),
		motifs: [
			"separate-clients",
			"equipment-sets",
			"dispatch-bench"
		],
		visualEvent: "three-separate-orders-reach-one-dispatch-bench",
		reveal: "three-equipment-sets-arrive-one-after-another",
		revealMotion: "sequence",
		soundCue: "scanner",
		fallbackId: "fallback-epoch3-b2b",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_4.scale",
		chapter: "epoch_4",
		worldId: "scale-logistics",
		worldProgress: .24,
		copyPlacement: "left",
		focalPoint: {
			x: .69,
			y: .45
		},
		readingCamera: W(.61, .48, 1.02),
		gameCamera: W(.5, .6, 1.05),
		crops: G("68% 48%", "58% 50%", "56% 50%"),
		motifs: [
			"phone-tower",
			"pkin-silhouette",
			"warehouse-team"
		],
		visualEvent: "phones-build-a-tower-beside-the-pkin-silhouette",
		reveal: "phones-and-the-warehouse-team-appear-in-depth",
		revealMotion: "rise",
		soundCue: "conveyor",
		fallbackId: "fallback-epoch4-scale",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_4.numbers",
		chapter: "epoch_4",
		worldId: "scale-logistics",
		worldProgress: .62,
		copyPlacement: "right",
		focalPoint: {
			x: .3,
			y: .52
		},
		readingCamera: W(.39, .5, 1.02),
		gameCamera: W(.5, .6, 1.05),
		crops: G("34% 52%", "46% 52%", "46% 50%"),
		motifs: [
			"packing-zones",
			"package-stream",
			"warehouse-team"
		],
		visualEvent: "packages-fill-separate-packing-and-dispatch-zones",
		reveal: "packages-align-and-stack-inside-each-working-zone",
		revealMotion: "balance",
		soundCue: "scanner",
		fallbackId: "fallback-epoch4-numbers",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_4.resolve",
		chapter: "epoch_4",
		worldId: "scale-logistics",
		worldProgress: 1,
		copyPlacement: "left",
		focalPoint: {
			x: .79,
			y: .62
		},
		readingCamera: W(.68, .55, 1.03),
		gameCamera: W(.5, .6, 1.05),
		crops: G("76% 58%", "62% 55%", "59% 52%"),
		motifs: [
			"delivery-map",
			"scanned-package",
			"ordered-branches"
		],
		visualEvent: "three-sorting-branches-deliver-one-correctly-scanned-parcel",
		reveal: "the-scanned-label-reaches-the-dispatch-station",
		revealMotion: "travel",
		soundCue: "scanner",
		fallbackId: "fallback-epoch4-resolve",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_5.approach",
		chapter: "epoch_5",
		worldId: "million-approach",
		worldProgress: .28,
		copyPlacement: "left",
		focalPoint: {
			x: .72,
			y: .48
		},
		readingCamera: W(.63, .5, 1.02),
		gameCamera: W(.5, .6, 1.04),
		crops: G("70% 51%", "59% 52%", "57% 50%"),
		motifs: [
			"converging-routes",
			"million-counter",
			"first-label"
		],
		visualEvent: "all-prior-routes-converge-at-the-counter",
		reveal: "routes-plug-into-the-blank-counter-housing",
		revealMotion: "converge",
		soundCue: "counter",
		fallbackId: "fallback-epoch5-approach",
		runnerPresence: "quiet"
	},
	{
		stateId: "epoch_5.wave",
		chapter: "epoch_5",
		worldId: "million-approach",
		worldProgress: 1,
		copyPlacement: "left",
		focalPoint: {
			x: .72,
			y: .5
		},
		readingCamera: W(.64, .5, 1.02),
		gameCamera: W(.5, .6, 1.04),
		crops: G("72% 52%", "60% 52%", "58% 50%"),
		motifs: [
			"million-threshold",
			"counter-999950",
			"returning-packages"
		],
		visualEvent: "counter-closes-at-nine-nine-nine-nine-five-zero",
		reveal: "six-code-rendered-digits-prepare-for-the-final-wave",
		revealMotion: "count",
		soundCue: "counter",
		fallbackId: "fallback-epoch5-wave",
		runnerPresence: "quiet"
	},
	{
		stateId: "final.moments",
		chapter: "finale",
		worldId: "million-finale",
		worldProgress: .55,
		copyPlacement: "right",
		focalPoint: {
			x: .28,
			y: .55
		},
		readingCamera: W(.36, .52, 1.03),
		gameCamera: W(.5, .6, 1.04),
		crops: G("31% 54%", "43% 53%", "45% 50%"),
		motifs: [
			"million-package",
			"first-label",
			"same-desk"
		],
		visualEvent: "millionth-package-returns-to-the-first-desk-angle",
		reveal: "prior-route-lines-converge-under-the-package",
		revealMotion: "return",
		soundCue: "tape",
		fallbackId: "fallback-final-moments",
		runnerPresence: "quiet"
	},
	{
		stateId: "final.thanks",
		chapter: "finale",
		worldId: "million-finale",
		worldProgress: 1,
		copyPlacement: "right",
		focalPoint: {
			x: .35,
			y: .52
		},
		readingCamera: W(.4, .5, 1),
		gameCamera: W(.5, .6, 1.04),
		crops: G("36% 52%", "46% 52%", "47% 50%"),
		motifs: [
			"million-package",
			"route-continues",
			"warm-light"
		],
		visualEvent: "the-route-leaves-the-millionth-package-and-continues-offscreen",
		reveal: "the-continuation-line-brightens-beyond-the-frame",
		revealMotion: "continue",
		soundCue: "laptop-start",
		fallbackId: "fallback-final-thanks",
		runnerPresence: "quiet"
	}
]), jr = new Map(Ar.map((e) => [e.stateId, e]));
function K(e, t, n, r = {}) {
	let i = jr.get(e);
	if (!i) throw Error(`Unknown editorial scene source: ${e}`);
	return {
		...i,
		stateId: t,
		chapter: n,
		overlayStateId: e,
		fallbackId: `fallback-${t.replaceAll(".", "-")}`,
		...r
	};
}
var Mr = Object.freeze([
	K("intro.ready", "story.first_package", "prologue"),
	K("epoch_1.challenge", "story.order_backlog", "epoch_1"),
	K("epoch_2.setup", "story.quality_promise", "epoch_2"),
	K("epoch_3.start", "client.business_start", "epoch_3"),
	K("epoch_3.business", "client.business_growth", "epoch_3"),
	K("epoch_3.b2b", "story.matching_result", "epoch_3", {
		motifs: [
			"separate-clients",
			"equipment-sets",
			"dispatch-bench"
		],
		visualEvent: "three-client-orders-align-on-one-dispatch-bench",
		reveal: "each-order-keeps-its-own-equipment-set",
		revealMotion: "match"
	}),
	K("epoch_4.scale", "story.scale", "epoch_4", {
		motifs: [
			"phone-tower",
			"pkin-silhouette",
			"warehouse-team"
		],
		visualEvent: "phones-build-a-tower-beside-the-pkin-silhouette",
		reveal: "phones-rise-on-the-same-baseline-as-pkin",
		revealMotion: "balance"
	}),
	K("epoch_5.approach", "story.million_approach", "epoch_5"),
	K("epoch_5.wave", "challenge.million_wave", "epoch_5"),
	K("final.thanks", "story.million_finale", "finale"),
	K("final.thanks", "story.challenge_handoff", "finale", {
		visualEvent: "challenge-gate-opens-after-millionth-package",
		reveal: "score-and-protection-lock-into-the-challenge-lane",
		revealMotion: "dispatch"
	})
]), Nr = new Map(kr.map((e) => [e.worldId, e])), Pr = new Map([...Ar, ...Mr].map((e) => [e.stateId, e]));
function Fr(e) {
	let t = Nr.get(e);
	if (t === void 0) throw Error(`Unknown campaign world: ${e}`);
	return t;
}
function q(e) {
	let t = Pr.get(e);
	if (t === void 0) throw Error(`Unknown campaign scene visual: ${e}`);
	return t;
}
var Ir = Object.freeze({
	"story.first_package:game-purpose": "intro.ready",
	"story.first_package:first-hand-packed": "intro.promise",
	"story.order_backlog:backlog-challenge": "epoch_1.challenge",
	"story.quality_promise:quality-process": "epoch_2.resolve",
	"client.business_start:new-business": "epoch_3.start",
	"client.business_growth:three-hundred": "epoch_3.laptop",
	"client.business_growth:one-year": "epoch_3.business",
	"client.business_growth:hundred-thousand": "client.business_growth",
	"story.matching_result:many-plans": "story.matching_result",
	"story.scale:phone-tower": "epoch_4.numbers",
	"story.million_approach:counter-source": "epoch_5.approach",
	"challenge.million_wave:two-goals": "epoch_5.wave",
	"story.million_finale:million-celebration": "final.moments",
	"story.challenge_handoff:rules-change": "final.thanks"
});
function Lr(e, t) {
	return t === null ? e : Ir[`${e}:${t}`] ?? e;
}
var Rr = {
	"epoch_1.first_package": {
		fromStateId: "intro.promise",
		toStateId: "intro.promise",
		progressStart: 0,
		progressEnd: 1
	},
	"epoch_1.training": {
		fromStateId: "intro.promise",
		toStateId: "intro.promise",
		progressStart: 0,
		progressEnd: 1
	},
	"epoch_1.order_backlog": {
		fromStateId: "epoch_1.challenge",
		toStateId: "epoch_1.resolve",
		progressStart: 0,
		progressEnd: 1
	},
	"epoch_2.quality_series": {
		fromStateId: "epoch_2.setup",
		toStateId: "epoch_2.resolve",
		progressStart: 0,
		progressEnd: .72
	},
	"epoch_2.quality_process": {
		fromStateId: "epoch_2.setup",
		toStateId: "epoch_2.resolve",
		progressStart: 0,
		progressEnd: 1
	},
	"epoch_2.quality_trial": {
		fromStateId: "epoch_2.setup",
		toStateId: "epoch_2.resolve",
		progressStart: .72,
		progressEnd: 1
	},
	"epoch_3.matching_growth": {
		fromStateId: "epoch_3.business",
		toStateId: "epoch_3.b2b",
		progressStart: .5,
		progressEnd: .72
	},
	"epoch_3.client_growth": {
		fromStateId: "epoch_3.start",
		toStateId: "epoch_3.b2b",
		progressStart: 0,
		progressEnd: 1
	},
	"epoch_4.order_peak": {
		fromStateId: "epoch_4.numbers",
		toStateId: "epoch_4.resolve",
		progressStart: .62,
		progressEnd: .82
	},
	"epoch_4.order_scale": {
		fromStateId: "epoch_4.numbers",
		toStateId: "epoch_4.resolve",
		progressStart: .62,
		progressEnd: 1
	},
	"epoch_4.order_peak_final": {
		fromStateId: "epoch_4.numbers",
		toStateId: "epoch_4.resolve",
		progressStart: .82,
		progressEnd: 1
	},
	"epoch_5.million_threshold": {
		fromStateId: "epoch_5.wave",
		toStateId: "epoch_5.wave",
		progressStart: .62,
		progressEnd: 1
	}
};
function zr(e) {
	return Number.isFinite(e) ? Math.max(0, Math.min(1, e)) : 0;
}
function Br(e, t) {
	let n = Rr[e] ?? Rr["epoch_1.training"], r = q(n.fromStateId), i = q(n.toStateId);
	if (r.worldId !== i.worldId) throw Error(`Play segment crosses campaign worlds: ${e}`);
	let a = n.progressStart + (n.progressEnd - n.progressStart) * zr(t);
	return {
		worldId: r.worldId,
		fromStateId: r.stateId,
		toStateId: i.stateId,
		progress: a
	};
}
var Vr = Object.freeze([
	"story.first_package",
	"epoch_1.resolve",
	"epoch_2.resolve",
	"client.business_growth",
	"story.scale",
	"challenge.million_wave",
	"story.million_finale"
]), Hr = class {
	constructor(e = "direct") {
		i(this, "worldIndex", 0), i(this, "worldElapsedSeconds", 0), i(this, "transitionPending", !1), this.reset(e);
	}
	reset(e = "direct") {
		this.worldIndex = e === "story-continuation" ? Vr.length - 1 : 0, this.worldElapsedSeconds = 0, this.transitionPending = !1;
	}
	advance(e, t) {
		let n = Number.isFinite(e) ? Math.max(0, e) : 0;
		return this.worldElapsedSeconds += n, this.worldElapsedSeconds + 2 ** -52 >= 45 && (this.transitionPending = !0), this.transitionPending && t && (this.worldIndex = (this.worldIndex + 1) % Vr.length, this.worldElapsedSeconds = 0, this.transitionPending = !1), this.snapshot;
	}
	get snapshot() {
		let e = Vr[this.worldIndex] ?? Vr[0];
		return {
			stateId: e,
			worldId: q(e).worldId,
			worldIndex: this.worldIndex,
			worldElapsedSeconds: this.worldElapsedSeconds,
			transitionPending: this.transitionPending
		};
	}
};
new Set(Mr.flatMap(({ motifs: e }) => e));
//#endregion
//#region src/visuals/background-parallax.ts
var Ur = .1, Wr = .35;
function Gr(e) {
	return Number.isFinite(e) ? Math.max(0, e) * Ur : 0;
}
function Kr(e) {
	return Number.isFinite(e) ? Math.max(0, e) * Wr : 0;
}
//#endregion
//#region src/game/semantic-obstacle.ts
var qr = {
	"parcel-arc": {
		label: "PACZKA",
		icon: "package"
	},
	"box-stack": {
		label: "ZATOR",
		icon: "package"
	},
	"scanner-gate": {
		label: "SKAN",
		icon: "scanner"
	},
	"dispatch-pair": {
		label: "WYSYŁKA",
		icon: "truck"
	},
	"shelf-beam": {
		label: "REGAŁ",
		icon: "shelf"
	},
	"loaded-pallet": {
		label: "PALETA",
		icon: "package"
	},
	"warehouse-curtain": {
		label: "STREFA",
		icon: "process"
	},
	"parcel-trolley": {
		label: "WÓZEK",
		icon: "truck"
	},
	"equipment-crate": {
		label: "SPRZĘT",
		icon: "device"
	},
	"low-conveyor": {
		label: "TAŚMA",
		icon: "process"
	},
	"device-pallet": {
		label: "LAPTOP",
		icon: "device"
	},
	"checked-device": {
		label: "SPRAWDZONY",
		icon: "device"
	},
	"first-laptop": {
		label: "LAPTOP",
		icon: "device"
	},
	"growing-team": {
		label: "ZESPÓŁ",
		icon: "team"
	},
	"established-office": {
		label: "BIURO",
		icon: "office"
	},
	intake: {
		label: "PRZYJĘCIE",
		icon: "intake"
	},
	routing: {
		label: "REALIZACJA",
		icon: "process"
	},
	dispatch: {
		label: "WYSYŁKA",
		icon: "truck"
	},
	single: {
		label: "1 RUCH",
		icon: "movement"
	},
	doublet: {
		label: "2 RUCHY",
		icon: "movement"
	},
	"three-action": {
		label: "3 RUCHY",
		icon: "movement"
	},
	"long-arc": {
		label: "DŁUGI ŁUK",
		icon: "movement"
	},
	"low-line": {
		label: "NISKO",
		icon: "movement"
	},
	"tempo-change": {
		label: "ZMIANA TEMPA",
		icon: "movement"
	},
	mastery: {
		label: "FINAŁ",
		icon: "movement"
	},
	"recovery-route": {
		label: "ODZYSKAJ",
		icon: "package"
	}
};
function Jr(e) {
	return Object.hasOwn(qr, e);
}
//#endregion
//#region src/game/authored-wave.ts
var Yr = .6, Xr = 1.6, Zr = .8, Qr = 1.2, $r = /* @__PURE__ */ new Set([
	"box-stack",
	"pallet",
	"trolley"
]), ei = Object.freeze({
	id: "million-safe-recovery",
	actions: ["jump"],
	obstacleKinds: ["pallet"],
	obstacleVariant: "recovery-route",
	packageCount: 3,
	telegraphSeconds: Xr,
	breathSeconds: 1,
	speedMultiplier: 1.55
});
function ti(e, t) {
	return e === "slide" ? t === "overhead" : $r.has(t);
}
function ni(e) {
	return Math.ceil(Math.max(0, e) * Yr);
}
function ri(e) {
	return e.packageCount * e.actions.length;
}
function ii(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	e.waves.length === 0 && t.push({
		code: "empty_program",
		microlevelId: e.id,
		message: `${e.id}: program must contain at least one authored wave.`
	}), e.finaleOrderTarget !== void 0 && (e.finaleOrderTarget < 30 || e.finaleOrderTarget > 60) && t.push({
		code: "finale_target_out_of_range",
		microlevelId: e.id,
		message: `${e.id}: finale order target must stay between 30 and 60.`
	});
	for (let r of e.waves) {
		n.has(r.id) && t.push({
			code: "duplicate_wave_id",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: wave id must be unique.`
		}), n.add(r.id), Jr(r.obstacleVariant) || t.push({
			code: "unknown_obstacle_variant",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: unknown obstacle variant '${r.obstacleVariant}'.`
		}), (r.actions.length < 1 || r.actions.length > 3 || r.actions.length !== r.obstacleKinds.length) && t.push({
			code: "invalid_action_count",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: actions and obstacles must contain 1–3 matching entries.`
		});
		for (let n = 0; n < Math.min(r.actions.length, r.obstacleKinds.length); n += 1) {
			let i = r.actions[n], a = r.obstacleKinds[n];
			if (i && a && !ti(i, a) && t.push({
				code: "action_obstacle_mismatch",
				microlevelId: e.id,
				waveId: r.id,
				message: `${e.id}/${r.id}: ${a} cannot teach ${i}.`
			}), i && a && ti(i, a)) {
				let o = Fn({
					action: i,
					obstacleKind: a,
					packageCount: r.packageCount,
					speed: 280 * r.speedMultiplier,
					minimumReactionSeconds: r.telegraphSeconds
				});
				o && t.push({
					code: "unsafe_reward_geometry",
					microlevelId: e.id,
					waveId: r.id,
					message: `${e.id}/${r.id}: action ${n + 1} ${o}.`
				});
			}
		}
		(r.packageCount < 3 || r.packageCount > 6) && t.push({
			code: "invalid_package_count",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: story waves require 3–6 packages.`
		}), r.telegraphSeconds < 1.6 && t.push({
			code: "telegraph_too_short",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: telegraph must be at least ${Xr}s.`
		}), (r.breathSeconds < .8 || r.breathSeconds > 1.2) && t.push({
			code: "breath_too_short",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: breath must stay between ${Zr}s and ${Qr}s.`
		}), (r.speedMultiplier < .9 || r.speedMultiplier > 1.9) && t.push({
			code: "speed_out_of_range",
			microlevelId: e.id,
			waveId: r.id,
			message: `${e.id}/${r.id}: story speed must stay between 0.9× and 1.9×.`
		});
	}
	return t;
}
var ai = class {
	constructor(e) {
		i(this, "definition", void 0), i(this, "waveIndex", 0), i(this, "wavesCompleted", 0), i(this, "attempts", 1), i(this, "ordersCollected", 0), i(this, "totalOrdersCollected", 0), i(this, "elapsedSeconds", 0), i(this, "lastResult", null), this.definition = e;
		let t = ii(e);
		if (t.length > 0) throw Error(t.map(({ message: e }) => e).join("\n"));
	}
	advance(e) {
		this.elapsedSeconds += Math.max(0, e);
	}
	recordPackage() {
		let e = this.currentWave;
		if (!e) return;
		let t = ri(e);
		this.ordersCollected >= t || (this.ordersCollected += 1, this.totalOrdersCollected += 1);
	}
	resolve(e) {
		let t = this.currentWave;
		if (!t) throw Error(`${this.definition.id}: no active authored wave to resolve.`);
		let n = ri(t), r = n <= 0 ? 0 : this.ordersCollected / n, i = e && this.ordersCollected >= ni(n), a = {
			waveId: t.id,
			attempts: this.attempts,
			ordersCollected: this.ordersCollected,
			orderTarget: n,
			collectionRatio: r,
			actionSucceeded: e,
			passed: i,
			perfect: i && this.ordersCollected === n
		};
		return this.lastResult = a, i ? (this.wavesCompleted += 1, this.waveIndex = (this.waveIndex + 1) % this.definition.waves.length, this.attempts = 1) : (this.definition.id === "quality-process" && (this.wavesCompleted = Math.floor(this.wavesCompleted / 3) * 3, this.waveIndex = this.wavesCompleted % this.definition.waves.length), this.attempts += 1), this.ordersCollected = 0, a;
	}
	get currentWave() {
		if (this.targetsCompleted) return null;
		let e = this.definition.repeatWavesUntil ?? this.definition.waves.length;
		return this.definition.id === "million-threshold" && this.wavesCompleted >= e ? ei : this.definition.waves[this.waveIndex] ?? null;
	}
	get targetsCompleted() {
		let e = this.definition.repeatWavesUntil ?? this.definition.waves.length, t = this.definition.finaleOrderTarget ?? 0;
		return this.wavesCompleted >= e && this.totalOrdersCollected >= t && this.ordersCollected === 0;
	}
	get completed() {
		return this.targetsCompleted && this.elapsedSeconds >= this.definition.minimumDurationSeconds;
	}
	get snapshot() {
		let e = this.currentWave;
		return {
			microlevelId: this.definition.id,
			waveIndex: this.waveIndex,
			wavesCompleted: this.wavesCompleted,
			waveTarget: this.definition.repeatWavesUntil ?? this.definition.waves.length,
			currentWaveId: e?.id ?? "",
			currentActions: e?.actions ?? [],
			...e ? { currentObstacleVariant: e.obstacleVariant } : {},
			attemptsOnCurrentWave: this.attempts,
			ordersCollectedOnCurrentWave: this.ordersCollected,
			packagesAvailableOnCurrentWave: e ? ri(e) : 0,
			totalOrdersCollected: this.totalOrdersCollected,
			totalOrderTarget: this.definition.finaleOrderTarget ?? null,
			elapsedSeconds: this.elapsedSeconds,
			minimumDurationSeconds: this.definition.minimumDurationSeconds,
			completed: this.completed,
			lastResult: this.lastResult
		};
	}
};
function J(e, t, n, r, i, a, o) {
	return {
		id: e,
		actions: [t],
		obstacleKinds: [n],
		packageCount: r,
		speedMultiplier: i,
		obstacleVariant: a,
		telegraphSeconds: Xr,
		breathSeconds: 1,
		...o ? { reward: o } : {}
	};
}
function Y(e, t, n, r, i, a, o) {
	return {
		id: e,
		actions: t,
		obstacleKinds: n,
		packageCount: r,
		speedMultiplier: i,
		obstacleVariant: a,
		telegraphSeconds: Xr,
		breathSeconds: 1.1,
		...o ? { reward: o } : {}
	};
}
var oi = Object.freeze([
	{
		id: "first-package",
		segmentId: "epoch_1.first_package",
		label: "Pierwsza paczka",
		minimumDurationSeconds: 25,
		speedStartMultiplier: .95,
		speedEndMultiplier: 1.15,
		waves: [
			J("guided-parcel-arc", "jump", "pallet", 3, .95, "parcel-arc"),
			J("guided-low-stack", "jump", "box-stack", 3, 1.02, "box-stack"),
			J("guided-scanner-gate", "slide", "overhead", 3, 1.08, "scanner-gate"),
			Y("guided-jump-slide", ["jump", "slide"], ["pallet", "overhead"], 4, 1.15, "dispatch-pair")
		]
	},
	{
		id: "order-backlog",
		segmentId: "epoch_1.order_backlog",
		label: "Zator Zamówień",
		minimumDurationSeconds: 45,
		speedStartMultiplier: 1.1,
		speedEndMultiplier: 1.35,
		repeatWavesUntil: 8,
		waves: [
			J("backlog-stack", "jump", "box-stack", 3, 1.1, "box-stack"),
			J("backlog-beam", "slide", "overhead", 4, 1.14, "shelf-beam"),
			J("backlog-pallet", "jump", "pallet", 3, 1.18, "loaded-pallet"),
			J("backlog-curtain", "slide", "overhead", 4, 1.22, "warehouse-curtain"),
			J("backlog-trolley", "jump", "trolley", 3, 1.25, "parcel-trolley"),
			J("backlog-scanner", "slide", "overhead", 4, 1.28, "scanner-gate"),
			J("backlog-crate", "jump", "box-stack", 3, 1.32, "equipment-crate"),
			J("backlog-conveyor", "slide", "overhead", 4, 1.35, "low-conveyor")
		]
	},
	{
		id: "quality-process",
		segmentId: "epoch_2.quality_process",
		label: "Proces i Jakość",
		minimumDurationSeconds: 40,
		speedStartMultiplier: 1.22,
		speedEndMultiplier: 1.48,
		repeatWavesUntil: 12,
		waves: [
			J("quality-start", "jump", "pallet", 3, 1.22, "device-pallet"),
			J("quality-scan", "slide", "overhead", 4, 1.3, "scanner-gate"),
			Y("quality-seal", [
				"jump",
				"slide",
				"jump"
			], [
				"box-stack",
				"overhead",
				"trolley"
			], 5, 1.48, "checked-device", "double-score")
		]
	},
	{
		id: "client-growth",
		segmentId: "epoch_3.client_growth",
		label: "Rozwój Firmy Klienta",
		minimumDurationSeconds: 35,
		speedStartMultiplier: 1.34,
		speedEndMultiplier: 1.58,
		repeatWavesUntil: 6,
		waves: [
			J("client-first-laptop", "jump", "pallet", 3, 1.34, "first-laptop"),
			J("client-first-workspace", "slide", "overhead", 3, 1.38, "first-laptop"),
			J("client-growing-team", "jump", "pallet", 4, 1.43, "growing-team", "double-score"),
			J("client-growing-routine", "slide", "overhead", 4, 1.48, "growing-team"),
			J("client-established-office", "jump", "trolley", 5, 1.53, "established-office"),
			Y("client-established-continuity", ["jump", "slide"], ["box-stack", "overhead"], 5, 1.58, "established-office")
		]
	},
	{
		id: "order-scale",
		segmentId: "epoch_4.order_scale",
		label: "Skala Zamówień",
		minimumDurationSeconds: 45,
		speedStartMultiplier: 1.45,
		speedEndMultiplier: 1.7,
		repeatWavesUntil: 9,
		waves: [
			J("scale-intake", "jump", "trolley", 3, 1.45, "intake", "warranty"),
			J("scale-intake-scan", "slide", "overhead", 4, 1.48, "intake"),
			J("scale-intake-stack", "jump", "pallet", 3, 1.5, "intake"),
			J("scale-routing-sort", "slide", "overhead", 4, 1.55, "routing"),
			J("scale-routing-lift", "jump", "box-stack", 3, 1.58, "routing"),
			J("scale-routing-check", "slide", "overhead", 4, 1.61, "routing"),
			J("scale-dispatch-load", "jump", "trolley", 3, 1.64, "dispatch"),
			J("scale-dispatch-gate", "slide", "overhead", 4, 1.67, "dispatch"),
			Y("scale-dispatch-flow", ["jump", "slide"], ["box-stack", "overhead"], 5, 1.7, "dispatch")
		]
	},
	{
		id: "million-threshold",
		segmentId: "epoch_5.million_threshold",
		label: "Próg Miliona",
		minimumDurationSeconds: 65,
		speedStartMultiplier: 1.55,
		speedEndMultiplier: 1.85,
		repeatWavesUntil: 12,
		finaleOrderTarget: 30,
		waves: [
			J("million-single-jump", "jump", "pallet", 3, 1.55, "single"),
			J("million-single-slide", "slide", "overhead", 3, 1.58, "single"),
			Y("million-double-jump", ["jump", "jump"], ["box-stack", "trolley"], 3, 1.61, "doublet"),
			Y("million-jump-slide", ["jump", "slide"], ["pallet", "overhead"], 3, 1.64, "doublet"),
			Y("million-slide-jump", ["slide", "jump"], ["overhead", "box-stack"], 3, 1.67, "doublet"),
			Y("million-three-a", [
				"jump",
				"slide",
				"jump"
			], [
				"trolley",
				"overhead",
				"pallet"
			], 3, 1.7, "three-action"),
			Y("million-three-b", [
				"slide",
				"jump",
				"slide"
			], [
				"overhead",
				"box-stack",
				"overhead"
			], 3, 1.72, "three-action"),
			J("million-long-arc", "jump", "trolley", 3, 1.74, "long-arc"),
			J("million-low-line", "slide", "overhead", 3, 1.76, "low-line"),
			Y("million-tempo-a", [
				"jump",
				"jump",
				"slide"
			], [
				"pallet",
				"box-stack",
				"overhead"
			], 3, 1.79, "tempo-change"),
			Y("million-tempo-b", [
				"slide",
				"jump",
				"jump"
			], [
				"overhead",
				"trolley",
				"pallet"
			], 3, 1.82, "tempo-change"),
			Y("million-mastery", [
				"jump",
				"slide",
				"jump"
			], [
				"box-stack",
				"overhead",
				"trolley"
			], 3, 1.85, "mastery", "million")
		]
	}
]);
function si(e) {
	return oi.find((t) => t.segmentId === e) ?? null;
}
//#endregion
//#region src/game/challenge-pressure.ts
var ci = [
	"speed",
	"density",
	"complexity",
	"precision",
	"pressure"
], li = [
	20,
	24,
	27,
	22,
	30
], ui = Object.freeze([
	{
		id: "pallet-arc",
		action: "jump",
		obstacleKind: "pallet",
		packageCount: 5
	},
	{
		id: "scanner-line",
		action: "slide",
		obstacleKind: "overhead",
		packageCount: 6
	},
	{
		id: "box-rise",
		action: "jump",
		obstacleKind: "box-stack",
		packageCount: 6
	},
	{
		id: "beam-wave",
		action: "slide",
		obstacleKind: "overhead",
		packageCount: 7
	},
	{
		id: "trolley-arc",
		action: "jump",
		obstacleKind: "trolley",
		packageCount: 8
	},
	{
		id: "low-conveyor",
		action: "slide",
		obstacleKind: "overhead",
		packageCount: 5
	}
]);
function di(e) {
	let t = Math.max(0, e), n = 0;
	for (;;) {
		let e = li[n % li.length];
		if (t < e) return {
			axis: ci[n % ci.length],
			cycleIndex: n,
			cycleDurationSeconds: e,
			cycleProgress: t / e
		};
		t -= e, n += 1;
	}
}
function fi(e) {
	return ui[Math.max(0, Math.floor(e)) % ui.length];
}
function pi(e, t) {
	return (Math.max(0, Math.floor(e)) + 1) % 4 == 0 ? 1.1 : .72 - Math.min(1, Math.max(0, t) / 180) * .32;
}
function mi(e, t, n) {
	let r = di(e), i = Math.max(5, Math.min(8, Math.floor(n))), a = pi(t, e), o = a >= 1, s = [
		.62,
		.74,
		.57,
		.68
	][Math.max(0, Math.floor(t)) % 4];
	switch (r.axis) {
		case "density": return {
			axis: r.axis,
			packageCount: Math.min(8, i + 1),
			reactionSeconds: 1.2,
			breathSeconds: o ? a : a * .72,
			sequenceLength: 1,
			sequenceGapSeconds: s
		};
		case "complexity": return {
			axis: r.axis,
			packageCount: i,
			reactionSeconds: 1.2,
			breathSeconds: o ? a : .38,
			sequenceLength: 2,
			sequenceGapSeconds: s
		};
		case "precision": return {
			axis: r.axis,
			packageCount: i,
			reactionSeconds: 1.2,
			breathSeconds: a,
			sequenceLength: 1,
			sequenceGapSeconds: s
		};
		case "pressure": return {
			axis: r.axis,
			packageCount: i,
			reactionSeconds: 1.2,
			breathSeconds: o ? a : .24,
			sequenceLength: 3,
			sequenceGapSeconds: s
		};
		case "speed": return {
			axis: r.axis,
			packageCount: i,
			reactionSeconds: 1.2,
			breathSeconds: a,
			sequenceLength: 1,
			sequenceGapSeconds: s
		};
	}
}
//#endregion
//#region src/game/adaptive-decoration-quality.ts
var hi = class {
	constructor() {
		i(this, "sampleSeconds", 0), i(this, "sampleFrames", 0), i(this, "goodSeconds", 0), i(this, "current", "full");
	}
	get level() {
		return this.current;
	}
	observe(e) {
		if (!Number.isFinite(e) || e <= 0) return;
		if (this.current === "reduced" && (this.goodSeconds = e <= 1 / 58 ? this.goodSeconds + e : 0, this.goodSeconds >= 4.8)) {
			this.current = "full", this.goodSeconds = 0, this.sampleSeconds = 0, this.sampleFrames = 0;
			return;
		}
		if (this.sampleSeconds += Math.min(e, .25), this.sampleFrames += 1, this.sampleSeconds < 2) return;
		let t = this.sampleFrames / this.sampleSeconds;
		this.current === "full" && t < 52 && (this.current = "reduced", this.goodSeconds = 0), this.sampleSeconds = 0, this.sampleFrames = 0;
	}
	reset() {
		this.sampleSeconds = 0, this.sampleFrames = 0, this.goodSeconds = 0, this.current = "full";
	}
}, gi = 2.6, _i = 3.5, vi = 2.8, yi = 960 + S.spawnPadding, bi = yi, xi = [
	"pc",
	"notebook",
	"lcd",
	"telefon"
], Si = ["podwojny_wynik", "gwarancja_48"], Ci = /* @__PURE__ */ new Map([
	["epoch_1.order_backlog", 0],
	["epoch_2.quality_trial", 1],
	["epoch_4.order_peak_final", 3]
]);
function wi() {
	let e = globalThis.crypto;
	if (e?.getRandomValues) {
		let t = /* @__PURE__ */ new Uint32Array(1);
		return e.getRandomValues(t), t[0] ?? 1831565813;
	}
	return Re(Date.now() ^ Math.floor(Math.random() * 4294967295));
}
function X(e, t) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
var Ti = class {
	constructor(e, t = {}, n = {}) {
		i(this, "canvas", void 0), i(this, "_state", "ready"), i(this, "context", void 0), i(this, "renderer", new ln()), i(this, "callbacks", void 0), i(this, "document", void 0), i(this, "view", void 0), i(this, "baseSeed", void 0), i(this, "obstacles", Bn()), i(this, "packages", Vn()), i(this, "bossDirector", new Ee()), i(this, "storyClimaxDirector", new _r()), i(this, "storyObstacleTransformer", new yr()), i(this, "milestoneCelebrationDirector", new ce()), i(this, "decorationQuality", new hi()), i(this, "storyObjectiveDirector", new Dr()), i(this, "authoredWaveDirector", null), i(this, "authoredActionIndex", 0), i(this, "authoredActionSpawned", !1), i(this, "authoredBreathRemaining", 0), i(this, "finaleRewardRunRemaining", 0), i(this, "authoredFinaleCelebrated", !1), i(this, "challengePatternIndex", 0), i(this, "challengeRewards", void 0), i(this, "challengeSpawnCooldown", 0), i(this, "challengeOnboardingPending", !1), i(this, "challengeWaves", /* @__PURE__ */ new Map()), i(this, "challengeSequenceRemaining", 0), i(this, "challengeSequencePackagesAvailable", 0), i(this, "challengeSequencePackagesCollected", 0), i(this, "challengeSequenceBreathSeconds", 0), i(this, "storyClimaxesCompleted", /* @__PURE__ */ new Set()), i(this, "runner", Pe()), i(this, "spawner", void 0), i(this, "runIndex", 0), i(this, "elapsedSeconds", 0), i(this, "visualElapsedSeconds", 0), i(this, "challengeElapsedSeconds", 0), i(this, "distancePixels", 0), i(this, "visualDistancePixels", 0), i(this, "packagesCollected", 0), i(this, "ordersCollected", 0), i(this, "bonusScore", 0), i(this, "challengeStartScore", 0), i(this, "challengeStartOrders", 0), i(this, "personalRecordCelebrated", !1), i(this, "recordEmphasisRemaining", 0), i(this, "bossesDefeated", 0), i(this, "speed", ke(0).speed), i(this, "difficultyLevel", 1), i(this, "controlMethod", "keyboard"), i(this, "mode", void 0), i(this, "story", void 0), i(this, "challenge", void 0), i(this, "bestChallengeOrdersAtStart", void 0), i(this, "awardStoryCompletionBonus", void 0), i(this, "powerUpCopy", void 0), i(this, "narrative", void 0), i(this, "storyTimeline", null), i(this, "lastStorySignal", ""), i(this, "storyCompleteEmitted", !1), i(this, "finaleCelebrationRemaining", 0), i(this, "finaleHandoffPending", !1), i(this, "lastTrustCorridor", !1), i(this, "creativeEquipmentCursor", 0), i(this, "storyOrderPatternIndex", 0), i(this, "storyObjectivePatternIndex", 0), i(this, "logisticWaveDirector", void 0), i(this, "challengeWorldDirector", new Hr("direct")), i(this, "currentEpoch", 0), i(this, "epochElapsed", 0), i(this, "cutsceneRemaining", 0), i(this, "pendingEpoch", 0), i(this, "cutscene", null), i(this, "epochHit", !1), i(this, "bossStarted", !1), i(this, "furthestEpochReached", 0), i(this, "factsUnlockedCount", 0), i(this, "packageTypeCounts", {
			notebook: 0,
			telefon: 0,
			pc: 0,
			lcd: 0
		}), i(this, "equipmentTypeCounts", {
			notebook: 0,
			telefon: 0,
			pc: 0,
			lcd: 0
		}), i(this, "totalWeightKg", 0), i(this, "activePowerUps", new nr()), i(this, "challengePowerUps", new tr()), i(this, "seenPowerUpDemos", /* @__PURE__ */ new Set()), i(this, "powerUpDemoRemaining", 0), i(this, "pendingPowerUpReward", null), i(this, "collisions", 0), i(this, "epochCollisions", 0), i(this, "recoverySeconds", 0), i(this, "startProtectionSeconds", 0), i(this, "warrantyBreakSeconds", 0), i(this, "shieldActivationSeconds", 0), i(this, "combo", 1), i(this, "bestCombo", 1), i(this, "warrantySaves", 0), i(this, "factEngine", null), i(this, "crouchHeld", !1), i(this, "crouchInputHeld", !1), i(this, "accumulator", 0), i(this, "lastFrameTime", null), i(this, "performanceFrameCount", 0), i(this, "performanceSampleSeconds", 0), i(this, "estimatedFrameRate", 0), i(this, "droppedFrames", 0), i(this, "lastCollisionType", null), i(this, "nextSnapshotAt", 0), i(this, "frameId", null), i(this, "frameUsesTimeout", !1), i(this, "impact", !1), i(this, "impactSeconds", 0), i(this, "reducedMotion", void 0), i(this, "bufferWidth", 1), i(this, "bufferHeight", 1), i(this, "resizeObserver", null), i(this, "motionQuery", null), i(this, "handleFrame", (e) => {
			if (this.frameId = null, this._state === "running") {
				if (this.lastFrameTime === null) this.lastFrameTime = e;
				else {
					let t = Math.max(0, (e - this.lastFrameTime) / 1e3);
					this.observeFramePerformance(t);
					let n = Math.min(S.maxFrameSeconds, t);
					this.lastFrameTime = e, this.accumulator += n;
					let r = 0;
					for (; this.accumulator >= S.fixedStepSeconds && r < S.maxFixedStepsPerFrame && this._state === "running";) this.update(S.fixedStepSeconds), this.accumulator -= S.fixedStepSeconds, r += 1;
					r === S.maxFixedStepsPerFrame && (this.accumulator = 0);
				}
				this.render(), this._state === "running" && this.scheduleFrame();
			}
		}), i(this, "handleResize", () => {
			this._state !== "destroyed" && (this.resizeCanvas(), this.render());
		}), i(this, "handleVisibilityChange", () => {
			this.document.visibilityState === "hidden" && this.shouldAutoPause() && this.pause();
		}), i(this, "handleWindowBlur", () => {
			this.shouldAutoPause() && this.pause();
		}), i(this, "handleMotionPreferenceChange", (e) => {
			this.reducedMotion = e.matches, this.render();
		}), this.canvas = e;
		let r = e.getContext("2d", { alpha: !0 });
		if (!r) throw Error("RunnerGame requires a Canvas 2D context.");
		this.context = r, this.callbacks = t, this.document = e.ownerDocument, this.view = this.document.defaultView, this.baseSeed = Re(n.seed ?? wi()), this.mode = n.mode ?? (n.story || n.narrative ? "story" : "challenge"), this.story = this.mode === "story" ? n.story ?? null : null, this.challenge = n.challenge ?? null, this.bestChallengeOrdersAtStart = Math.max(0, Math.floor(n.bestChallengeOrdersAtStart ?? 0)), this.awardStoryCompletionBonus = n.awardStoryCompletionBonus ?? !0, this.powerUpCopy = n.powerUpCopy ?? {}, this.logisticWaveDirector = new fr(this.challenge?.logisticWaveMinSeconds ?? 45, this.challenge?.logisticWaveMaxSeconds ?? 60), this.narrative = this.mode === "story" ? this.story ? {
			epochs: this.story.epochs,
			facts: n.narrative?.facts ?? []
		} : n.narrative ?? null : null, n.reducedMotion === void 0 ? (this.motionQuery = this.view?.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null, this.reducedMotion = this.motionQuery?.matches ?? !1, this.motionQuery?.addEventListener?.("change", this.handleMotionPreferenceChange)) : this.reducedMotion = n.reducedMotion, this.resetModels(), this.installLifecycleListeners(), this.resizeCanvas(), this.render();
	}
	get state() {
		return this._state;
	}
	start(e = "keyboard") {
		if (!(this._state === "destroyed" || this._state === "running")) {
			if (this._state === "paused") {
				this.controlMethod = e, this.resume();
				return;
			}
			this._state === "game_over" && this.reset(), this.controlMethod = e, this.accumulator = 0, this.lastFrameTime = null, this.performanceFrameCount = 0, this.performanceSampleSeconds = 0, this.estimatedFrameRate = 0, this.droppedFrames = 0, this.decorationQuality.reset(), this.lastCollisionType = null, this.impact = !1, this.impactSeconds = 0, this.crouchHeld = !1, this.crouchInputHeld = !1, this.setState("running"), this.emitStorySignals(!0), this.emitSnapshot(), this.render(), this.scheduleFrame();
		}
	}
	continueStoryScene(e) {
		if (this._state !== "running" || this.mode !== "story" || !this.storyTimeline) return !1;
		let t = this.storyTimeline.snapshot;
		if (!this.storyTimeline.continueScene(e)) return !1;
		let n = this.storyTimeline.snapshot;
		return this.syncStorySection(t, n), this.clearInteractiveWorld(), this.emitStorySignals(!0), this.emitSnapshot(), this.render(), !0;
	}
	jump(e) {
		if (!(this._state === "destroyed" || this._state === "paused" || this._state === "game_over")) {
			if (this._state === "ready") {
				this.start(e);
				return;
			}
			this._state === "running" && (this.storyTimeline?.snapshot.trustCorridor || (this.controlMethod = e, this.crouchHeld = !1, this.crouchInputHeld = !1, this.runner.crouching = !1, Fe(this.runner)));
		}
	}
	crouch(e, t) {
		if (!(this._state === "destroyed" || this._state === "game_over") && (this._state === "ready" && this.start(t), this._state === "running")) {
			if (this.storyTimeline?.snapshot.trustCorridor) {
				this.crouchHeld = !1, this.crouchInputHeld = !1;
				return;
			}
			this.controlMethod = t, this.crouchInputHeld = e, e ? this.runner.grounded && (this.runner.crouching || (this.runner.crouchElapsedSeconds = 0), this.crouchHeld = !0, this.runner.crouching = !0) : (this.crouchHeld = !1, this.runner.crouching = !1, this.runner.crouchElapsedSeconds = 0);
		}
	}
	pause() {
		this._state === "running" && (this.cancelFrame(), this.lastFrameTime = null, this.setState("paused"), this.render());
	}
	resume() {
		this._state === "paused" && (this.accumulator = 0, this.lastFrameTime = null, this.setState("running"), this.render(), this.scheduleFrame());
	}
	reset() {
		this._state !== "destroyed" && (this.cancelFrame(), this.runIndex += 1, this.resetModels(), this.setState("ready"), this.emitSnapshot(), this.render());
	}
	destroy() {
		this._state !== "destroyed" && (this.cancelFrame(), this.resizeObserver?.disconnect(), this.resizeObserver = null, this.view?.removeEventListener("resize", this.handleResize), this.view?.removeEventListener("blur", this.handleWindowBlur), this.document.removeEventListener("visibilitychange", this.handleVisibilityChange), this.motionQuery?.removeEventListener?.("change", this.handleMotionPreferenceChange), this.motionQuery = null, this.setState("destroyed"), this.context.setTransform(1, 0, 0, 1, 0, 0), this.context.clearRect(0, 0, this.canvas.width, this.canvas.height));
	}
	resetModels() {
		this.runner = Pe();
		for (let e of this.obstacles) e.active = !1;
		for (let e of this.packages) e.active = !1;
		this.mode === "challenge" && Yn(this.packages);
		let e = new ze(Be(this.baseSeed, this.runIndex));
		this.elapsedSeconds = 0, this.visualElapsedSeconds = 0, this.resetChallengeRunState(), this.challengeWorldDirector.reset("direct"), this.distancePixels = 0, this.visualDistancePixels = 0, this.packagesCollected = 0, this.ordersCollected = 0, this.bonusScore = 0, this.challengeStartScore = 0, this.challengeStartOrders = 0, this.personalRecordCelebrated = !1, this.recordEmphasisRemaining = 0, this.bossesDefeated = 0, this.bossDirector.reset(), this.storyClimaxDirector.reset(), this.storyObstacleTransformer.reset(), this.milestoneCelebrationDirector.reset(), this.storyObjectiveDirector = new Dr(), this.authoredWaveDirector = null, this.authoredActionIndex = 0, this.authoredActionSpawned = !1, this.authoredBreathRemaining = 0, this.finaleRewardRunRemaining = 0, this.authoredFinaleCelebrated = !1, this.powerUpDemoRemaining = 0, this.pendingPowerUpReward = null, this.storyClimaxesCompleted.clear(), this.logisticWaveDirector.reset(), this.bossStarted = !1, this.crouchHeld = !1, this.crouchInputHeld = !1, this.accumulator = 0, this.lastFrameTime = null, this.performanceFrameCount = 0, this.performanceSampleSeconds = 0, this.estimatedFrameRate = 0, this.droppedFrames = 0, this.lastCollisionType = null, this.nextSnapshotAt = 0, this.impact = !1, this.impactSeconds = 0, this.currentEpoch = 0, this.epochElapsed = 0, this.cutsceneRemaining = 0, this.cutscene = null, this.epochHit = !1, this.furthestEpochReached = 0, this.factsUnlockedCount = 0, this.totalWeightKg = 0, this.collisions = 0, this.epochCollisions = 0, this.recoverySeconds = 0, this.startProtectionSeconds = Qn, this.warrantyBreakSeconds = 0, this.shieldActivationSeconds = Ke, this.combo = 1, this.bestCombo = 1, this.warrantySaves = 0, this.activePowerUps.clear(), this.storyTimeline = this.mode === "story" && this.story ? new or(this.story) : null, this.lastStorySignal = "", this.storyCompleteEmitted = !1, this.finaleCelebrationRemaining = 0, this.finaleHandoffPending = !1, this.lastTrustCorridor = this.storyTimeline?.snapshot.trustCorridor ?? !1, this.creativeEquipmentCursor = 0, this.storyOrderPatternIndex = 0, this.storyObjectivePatternIndex = 0;
		for (let e of Object.keys(this.packageTypeCounts)) this.packageTypeCounts[e] = 0, this.equipmentTypeCounts[e] = 0;
		if (this.factEngine = this.mode === "story" && this.narrative ? new wn(this.narrative.facts) : null, this.mode === "story" && this.narrative && this.narrative.epochs.length > 0) {
			this.currentEpoch = this.storyTimeline?.snapshot.epochIndex ?? 0, this.furthestEpochReached = this.currentEpoch;
			let t = this.narrative.epochs[this.currentEpoch] ?? this.narrative.epochs[0], n = t.obstaclePool.map((e) => vn(e)).filter((e) => e !== null);
			this.spawner = new Jn(e, this.story ? Ae(0, this.story.activeDurationSeconds, this.story).speed : Cn(t, 0), n), this.speed = this.story ? Ae(0, this.story.activeDurationSeconds, this.story).speed : Cn(t, 0), this.story === null && this.storyClimaxDirector.enterEpoch(this.currentEpoch, t.challengeName ?? t.name, t.durationSeconds);
			let r = this.storyTimeline?.snapshot.phase, i = r === "finale" || r === "completed" ? 4 : r === "epoch" ? Math.min(4, this.currentEpoch) : 0;
			for (let e = 0; e < i; e += 1) this.storyClimaxesCompleted.add(e);
			this.difficultyLevel = 1, this.pendingEpoch = this.currentEpoch, this.storyTimeline === null && (this.cutscene = {
				title: t.name,
				subtitle: t.year
			}, this.cutsceneRemaining = gi);
		} else {
			let t = this.mode === "challenge" && this.challenge ? je(0, this.challenge) : ke(0);
			this.spawner = new Jn(e, t.speed), this.speed = t.speed, this.difficultyLevel = t.level;
		}
	}
	observeFramePerformance(e) {
		if (e <= 0) return;
		this.decorationQuality.observe(e), this.performanceFrameCount += 1, this.performanceSampleSeconds += e;
		let t = 1 / 60;
		e > t * 1.5 && (this.droppedFrames += Math.max(1, Math.round(e / t) - 1)), !(this.performanceSampleSeconds < 1) && (this.estimatedFrameRate = this.performanceFrameCount / this.performanceSampleSeconds, this.performanceFrameCount = 0, this.performanceSampleSeconds = 0);
	}
	update(e) {
		let t = !1, n = e;
		if (this.storyTimeline !== null) {
			let r = this.storyTimeline.snapshot, i = this.finaleCelebrationRemaining > 0, a = this.powerUpDemoRemaining > 0, o = i || this.finaleRewardRunRemaining > 0, s = r.playSegment?.id === "epoch_5.million_threshold" && ((this.authoredWaveDirector ? !this.authoredWaveDirector.completed : !this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.completed) || o), c = r.playSegment?.id === "epoch_1.training" && !this.storyObjectiveDirector.snapshot.epoch1.training.completed, l = r.playSegment?.id === "epoch_2.quality_series" && !this.storyObjectiveDirector.snapshot.epoch2.completed, u = r.playSegment?.id, d = u === "epoch_1.order_backlog" && !this.storyObjectiveDirector.snapshot.epoch1.orderBacklog.completed, f = u === "epoch_3.matching_creative" && !this.storyObjectiveDirector.snapshot.epoch3.creative.completed || u === "epoch_3.matching_growth" && !this.storyObjectiveDirector.snapshot.epoch3.growth.completed || u === "epoch_3.matching_trust" && !this.storyObjectiveDirector.snapshot.epoch3.trust.completed, p = a || (this.authoredWaveDirector === null ? s || c || l || d || f : !this.authoredWaveDirector.completed || o), m = this.storyTimeline.advance(e, { allowPlayCompletion: !p }), h = Math.max(0, m.totalActiveElapsedSeconds - r.totalActiveElapsedSeconds);
			n = i ? 0 : p && m.sectionElapsedSeconds >= m.sectionDurationSeconds ? e : h;
			let g = r.playSegment, _ = m.playSegment;
			if (g && n > 0) {
				let e = g.id === _?.id ? m.sectionElapsedSeconds - r.sectionElapsedSeconds : g.durationSeconds - r.sectionElapsedSeconds;
				this.storyObjectiveDirector.enterSegment(g.id, g.durationSeconds), this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordElapsed(Math.max(0, e)));
			}
			_ && _.id !== g?.id && m.sectionElapsedSeconds > 0 && (this.storyObjectiveDirector.enterSegment(_.id, _.durationSeconds), this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordElapsed(m.sectionElapsedSeconds))), this.syncStorySection(r, m), this.authoredWaveDirector?.advance(n), this.beginFinaleRewardRunIfReady(), this.storyObjectiveDirector.enterSegment(m.playSegment?.id ?? null, m.playSegment?.durationSeconds), this.emitStorySignals(), t = m.completed;
		}
		if (this.recordEmphasisRemaining > 0 && (this.recordEmphasisRemaining = Math.max(0, this.recordEmphasisRemaining - e), n *= .72), this.storyTimeline === null && this.cutsceneRemaining > 0) {
			this.cutsceneRemaining -= e, this.cutsceneRemaining <= 0 && (this.cutsceneRemaining = 0, this.enterEpoch(this.pendingEpoch));
			return;
		}
		this.visualElapsedSeconds += e, this.finaleCelebrationRemaining > 0 && (this.visualElapsedSeconds -= e), this.powerUpDemoRemaining > 0 && (this.powerUpDemoRemaining = Math.max(0, this.powerUpDemoRemaining - e)), this.elapsedSeconds += n;
		let r = !this.obstacles.some(({ active: e, x: t }) => e && t >= this.runner.x);
		if (this.milestoneCelebrationDirector.advance(n, r), this.mode === "challenge" && (this.challengeElapsedSeconds += n), this.recoverySeconds = Math.max(0, this.recoverySeconds - n), this.startProtectionSeconds = Math.max(0, this.startProtectionSeconds - n), this.warrantyBreakSeconds = Math.max(0, this.warrantyBreakSeconds - n), this.shieldActivationSeconds = Math.max(0, this.shieldActivationSeconds - n), this.impactSeconds = Math.max(0, this.impactSeconds - n), this.impact = this.impactSeconds > 0, this.storyObstacleTransformer.advance(e), this.finaleRewardRunRemaining > 0 && (this.finaleRewardRunRemaining = Math.max(0, this.finaleRewardRunRemaining - n), this.finaleRewardRunRemaining === 0 && this.authoredFinaleCelebrated && (this.finaleCelebrationRemaining = _i, this.clearInteractiveWorld())), this.finaleCelebrationRemaining > 0) {
			this.finaleCelebrationRemaining = Math.max(0, this.finaleCelebrationRemaining - e), this.crouchHeld = !1, this.runner.crouching = !1, this.clearInteractiveWorld(), this.emitSnapshot();
			return;
		}
		if (this.finaleHandoffPending && this.mode === "story" && this.finaleRewardRunRemaining <= 0) {
			this.finaleHandoffPending = !1, this.completeStoryAndEnterChallenge();
			return;
		}
		if (t) {
			this.completeStoryAndEnterChallenge();
			return;
		}
		let i = this.storyTimeline?.snapshot.trustCorridor ?? !1, a = i && !this.lastTrustCorridor;
		if (a) {
			let e = this.obstacles.filter(({ active: e }) => e);
			e.length > 0 && this.storyObstacleTransformer.begin(e, this.positiveMotifForEpoch(this.currentEpoch));
		}
		this.lastTrustCorridor = i, i && (this.crouchHeld = !1, this.crouchInputHeld = !1, this.runner.crouching = !1, this.clearInteractiveWorld());
		let o = ke(this.elapsedSeconds);
		if (this.mode === "story" && this.storyTimeline && this.story) {
			let e = this.storyTimeline.snapshot;
			this.epochElapsed = this.storyEpochElapsed(e.totalActiveElapsedSeconds, this.currentEpoch);
			let t = this.authoredWaveDirector?.definition;
			o = t ? Me(e.sectionElapsedSeconds, e.sectionDurationSeconds, t.speedStartMultiplier, t.speedEndMultiplier) : Ae(e.totalActiveElapsedSeconds, this.story.activeDurationSeconds, this.story), this.speed = o.speed, this.difficultyLevel = o.level;
		} else if (this.mode === "story" && this.narrative && this.narrative.epochs.length > 0) {
			let e = this.narrative.epochs[this.currentEpoch] ?? this.narrative.epochs[0];
			this.epochElapsed += n, this.speed = Cn(e, this.epochElapsed), this.difficultyLevel = 1 + Math.floor(this.epochElapsed / 12), o = this.difficultyFromSpeed(this.speed);
		} else o = this.mode === "challenge" && this.challenge ? je(this.challengeElapsedSeconds, this.challenge) : ke(this.elapsedSeconds), this.speed = o.speed, this.difficultyLevel = o.level;
		let s = this.storyTimeline?.snapshot.worldSpeedScale ?? 1, c = this.speed * (n > 0 ? n : e * s);
		this.visualDistancePixels += c;
		let l = this.speed * n;
		if (this.distancePixels += l, i || n <= 0) {
			a && this.emitSnapshot();
			return;
		}
		Ie(this.runner, n), this.runner.grounded && this.crouchInputHeld && (this.crouchHeld = !0), this.crouchInputHeld || (this.crouchHeld = !1), this.runner.crouching = this.crouchHeld && this.runner.grounded, this.runner.crouchElapsedSeconds = this.runner.crouching ? this.runner.crouchElapsedSeconds + n : 0, this.tickPowerUps(n), this.authoredBreathRemaining = Math.max(0, this.authoredBreathRemaining - n), this.challengeSpawnCooldown = Math.max(0, this.challengeSpawnCooldown - n);
		for (let e of this.obstacles) e.active && (e.x -= l, !e.objectiveCredited && e.x + e.width < this.runner.x && (e.objectiveCredited = !0, this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordSuccessfulPattern(e.kind === "overhead" ? "slide" : "jump")), e.source === "boss" && this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordMillionCombination())), e.x + e.width < -40 && (e.active = !1));
		for (let e of this.packages) e.active && (e.x -= l, e.x + e.size < -40 && (e.active = !1));
		this.challengeOnboardingPending && !this.packages.some(({ active: e, authoredWaveId: t }) => e && t === "challenge-onboarding") && (this.challengeOnboardingPending = !1, this.challengeSpawnCooldown = Math.max(this.challengeSpawnCooldown, 1.35)), this.advanceAuthoredWaveIfClear(), this.resolveChallengeWaveIfClear();
		let u = this.obstacles.some((e) => e.active && e.source === "boss" && e.x + e.width >= this.runner.x), d = this.obstacles.some((e) => e.active && e.source === "story-climax" && e.x + e.width >= this.runner.x), f = !this.obstacles.some((e) => e.active && e.x + e.width >= this.runner.x), p = this.narrative?.epochs[this.currentEpoch], m = this.storyTimeline?.snapshot.playSegment, h = m?.id === "epoch_5.million_threshold", g = m?.id === "epoch_4.order_peak", _ = m?.id === "epoch_1.training" || m?.id === "epoch_2.quality_series", v = this.authoredWaveDirector !== null, y = m && Ci.has(m.id) && this.currentEpoch < 4 && !v ? this.storyClimaxDirector.advance(n, this.storyTimeline?.snapshot.sectionElapsedSeconds ?? 0, i, f, d) : { type: "none" };
		if (y.type === "attack") H({
			...Xn(y.kind, bi),
			source: "story-climax"
		}, this.obstacles, this.packages);
		else if (y.type === "complete") {
			this.storyClimaxesCompleted.add(this.currentEpoch);
			let e = this.obstacles.filter(({ active: e, source: t }) => e && t === "story-climax");
			e.length > 0 && this.storyObstacleTransformer.begin(e, this.positiveMotifForEpoch(this.currentEpoch));
			for (let t of e) t.active = !1;
		}
		g && this.spawnStoryOrderPattern(f), _ && m && this.spawnScriptedObjectivePattern(f, m.id), this.pendingPowerUpReward && f && this.recoverySeconds <= 0 && this.milestoneCelebrationDirector.snapshot === null && !this.hasPendingPowerUpParcel() ? this.spawnPendingPowerUpReward() : v && !this.pendingPowerUpReward && f && this.recoverySeconds <= 0 && this.authoredBreathRemaining <= 0 && !this.hasAuthoredRuntimeObjects() && this.spawnCurrentAuthoredAction();
		let ee = this.storyTimeline === null && p !== void 0 && this.epochElapsed >= p.durationSeconds * .55;
		this.mode === "story" && p?.bossClimax && !this.bossStarted && ee && (this.bossDirector.forceEncounter(), this.bossStarted = !0);
		let te = this.mode === "story" && (this.storyTimeline === null ? !this.narrative || p?.bossClimax === !0 : !1), ne = this.storyTimeline !== null && (this.bossDirector.model.phase === "pending" || this.bossDirector.model.phase === "warning"), re = te && (!i || ne) && this.recoverySeconds <= 0 ? this.bossDirector.advance(n, this.elapsedSeconds, f, u) : { type: "none" };
		if (this.mode === "challenge") {
			let e = f && this.bossDirector.model.phase === "inactive";
			this.challengeWorldDirector.advance(n, e);
			let t = this.challengeSequenceRemaining === 0 && this.challengeWaves.size === 0 && f && !this.challengeOnboardingPending, r = this.challengeSequenceRemaining > 0 && this.challengeWaves.size === 0 && f;
			this.recoverySeconds <= 0 && this.challengeSpawnCooldown <= 0 && (t || r) && this.spawnChallengePattern();
		}
		if (re.type === "attack") {
			let e = Math.max(0, this.bossDirector.model.attacksSurvived), t = [{ kind: Si[e] ?? "standard" }];
			H((h ? V({
				action: re.kind === "overhead" ? "slide" : "jump",
				spawnX: B(this.speed, 960 + S.spawnPadding),
				speed: this.speed,
				patternIndex: e,
				source: "boss",
				rewards: t
			}) : null) ?? Xn(re.kind, yi), this.obstacles, this.packages);
		} else if (re.type === "complete" && (this.completeBossEncounter(), this.storyTimeline === null && this.narrative && p?.bossClimax)) {
			this.emitUnlockedFacts(), this.finishRun("boss", "victory", this.currentEpoch);
			return;
		}
		if (h && !v && this.bossesDefeated > 0 && this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.ordersCollected < this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.orderTarget && f && !this.bossDirector.blocksRegularSpawns && this.spawnScriptedObjectivePattern(!0, "epoch_5.million_threshold"), !i && this.recoverySeconds <= 0 && !this.bossDirector.blocksRegularSpawns && !this.logisticWaveDirector.blocksRegularSpawns && !this.storyClimaxDirector.blocksRegularSpawns && !this.hasAuthoredRewardPattern() && !g && !_ && !v && !h && this.mode !== "challenge") {
			let e = this.spawner.advance(l, this.speed, o, 960 + S.spawnPadding);
			e && H(this.prepareStoryWave(e, m?.id ?? null), this.obstacles, this.packages);
		}
		for (let e of this.packages) Se(this.runner, e) && this.collectPackage(e);
		for (let e of this.obstacles) {
			if (!be(this.runner, e) || this.startProtectionSeconds > 0) continue;
			let t = $n(this.mode, this.activePowerUps.has("gwarancja_48"));
			if (this.collisions += 1, this.lastCollisionType = e.source === "boss" ? `boss-${e.kind}` : e.kind, this.epochCollisions += 1, this.epochHit = !0, this.impactSeconds = .13, this.impact = !0, this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordCollision()), t.consumeWarranty && this.activePowerUps.consumeWarranty() && (this.challengePowerUps.recordWarrantyConsumption(Math.max(0, this.ordersCollected - this.challengeStartOrders)), this.warrantySaves += 1, this.shieldActivationSeconds = 0, this.warrantyBreakSeconds = qe), t.resetCombo && (this.combo = 1), t.finishRun) {
				this.finishRun(e.source === "boss" ? `boss-${e.kind}` : e.kind, "dropout", this.currentEpoch);
				return;
			}
			this.recoverySeconds = t.recoverySeconds, e.authoredWaveId && this.authoredWaveDirector?.currentWave?.id === e.authoredWaveId && this.resolveCurrentAuthoredWave(!1), e.authoredWaveId && this.challengeWaves.has(e.authoredWaveId) && (this.challengeWaves.clear(), this.resetChallengeSequence(), this.challengeSpawnCooldown = Math.max(this.challengeSpawnCooldown, 1.1));
			for (let e of this.obstacles) e.active = !1;
			if (e.source === "story-reward" || e.source === "boss" && this.storyTimeline !== null) for (let e of this.packages) e.storyRewardPattern && (e.active = !1);
			e.source === "boss" && this.storyTimeline !== null ? this.bossDirector.resolveCollision() : e.source === "story-climax" && this.storyClimaxDirector.retryCurrentAttack(), this.emitSnapshot();
			break;
		}
		if (this.storyTimeline === null && this.narrative && this.narrative.epochs.length > 0) {
			let e = this.narrative.epochs[this.currentEpoch];
			if (this.epochElapsed >= e.durationSeconds && !e.bossClimax) {
				if (this.factEngine?.recordEpochCompleted(this.currentEpoch, !this.epochHit), this.emitUnlockedFacts(), this.callbacks.onEpochCompleted?.(this.currentEpoch, !this.epochHit), this.currentEpoch >= this.narrative.epochs.length - 1) {
					this.finishRun("completion", "victory", this.currentEpoch);
					return;
				}
				this.startCutscene(this.currentEpoch + 1);
			}
		}
		this.elapsedSeconds >= this.nextSnapshotAt && (this.nextSnapshotAt = this.elapsedSeconds + S.snapshotIntervalSeconds, this.emitSnapshot());
	}
	collectPackage(e) {
		e.active = !1;
		let t = mn(e.kind, e.collectibleClass, this.combo, this.activePowerUps.has("podwojny_wynik"));
		if (e.kind === "standard") {
			if (e.authoredWaveId && this.authoredWaveDirector?.currentWave?.id === e.authoredWaveId && e.collectibleClass === "parcel") this.authoredWaveDirector.recordPackage();
			else if (e.authoredWaveId) {
				let t = this.challengeWaves.get(e.authoredWaveId);
				t !== void 0 && e.collectibleClass === "parcel" && (t.collected += 1);
			}
			this.ordersCollected += 1, t.countsAsPackage ? this.packagesCollected += 1 : this.equipmentTypeCounts[e.packageType] += 1;
			let n = Math.max(0, this.ordersCollected - this.challengeStartOrders);
			this.mode === "challenge" && this.pendingPowerUpReward === null && (this.pendingPowerUpReward = this.challengePowerUps.dueAt(n, this.activePowerUps.has("gwarancja_48")));
			let r = this.mode === "challenge" && !this.personalRecordCelebrated && n > this.bestChallengeOrdersAtStart;
			r && (this.personalRecordCelebrated = !0);
			let i = !this.obstacles.some(({ active: e, x: t }) => e && t >= this.runner.x);
			r && i && !this.reducedMotion && (this.recordEmphasisRemaining = .25);
			let a = t.countsAsPackage ? this.milestoneCelebrationDirector.recordOrders(this.packagesCollected, i, r ? "NOWY REKORD" : void 0) : [];
			r && a.length === 0 && a.push(this.milestoneCelebrationDirector.recordAchievement(n, "NOWY REKORD", i));
			for (let e of a) try {
				this.callbacks.onMilestoneCelebration?.(e);
			} catch {}
			this.bonusScore += t.bonusScoreAwarded, e.authoredWaveId || (this.combo = t.nextCombo, this.bestCombo = Math.max(this.bestCombo, this.combo)), this.packageTypeCounts[e.packageType] += 1, this.totalWeightKg += e.weightKg, this.factEngine?.recordPackage(e.packageType, e.weightKg), e.collectibleClass === "equipment" && this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordCreativePickup(e.packageType)), this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordCurrentCombo(this.combo)), this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordTrustCollection()), this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordMillionOrder()), e.storyOrder === !0 && e.collectibleClass === "equipment" && this.handleStoryObjectiveUpdate(this.storyObjectiveDirector.recordOrder(e.packageType));
			try {
				this.callbacks.onCollectiblePickup?.({
					collectibleClass: e.collectibleClass,
					packageType: e.packageType,
					basePoints: dn(e.collectibleClass),
					combo: this.combo
				});
			} catch {}
		} else e.authoredWaveId === "safe-power-up" && (this.pendingPowerUpReward = null), this.activatePowerUp(e.kind) && this.callbacks.onSpecialPickup?.(e.kind);
		this.emitUnlockedFacts();
	}
	spawnStoryOrderPattern(e) {
		if (!e) return;
		let t = xi[this.storyOrderPatternIndex % xi.length] ?? "pc", n = V({
			action: this.storyOrderPatternIndex % 2 == 0 ? "jump" : "slide",
			spawnX: B(this.speed, 960 + S.spawnPadding),
			speed: this.speed,
			patternIndex: this.storyOrderPatternIndex,
			source: "story-reward",
			rewards: [{
				kind: "standard",
				packageType: t,
				storyOrder: !0
			}]
		});
		!n || !H(n, this.obstacles, this.packages) || (this.storyOrderPatternIndex += 1);
	}
	spawnScriptedObjectivePattern(e, t) {
		if (!e) return;
		let n = V({
			action: this.storyObjectivePatternIndex % 2 == 0 ? "jump" : "slide",
			spawnX: B(this.speed, bi),
			speed: this.speed,
			patternIndex: this.storyObjectivePatternIndex,
			source: "story-reward",
			rewards: []
		});
		!n || !H(this.prepareStoryWave(n, t), this.obstacles, this.packages) || (this.storyObjectivePatternIndex += 1);
	}
	hasAuthoredRewardPattern() {
		return this.obstacles.some(({ active: e, source: t }) => e && t === "story-reward") || this.packages.some(({ active: e, storyRewardPattern: t }) => e && t === !0);
	}
	hasAuthoredRuntimeObjects() {
		let e = this.authoredWaveDirector?.currentWave?.id;
		return e ? this.obstacles.some(({ active: t, authoredWaveId: n }) => t && n === e) || this.packages.some(({ active: t, authoredWaveId: n }) => t && n === e) : !1;
	}
	packagesForAuthoredAction(e, t) {
		return e.packageCount;
	}
	spawnCurrentAuthoredAction() {
		let e = this.authoredWaveDirector, t = e?.currentWave;
		if (!e || !t || this.authoredActionSpawned) return;
		let n = t.actions[this.authoredActionIndex], r = t.obstacleKinds[this.authoredActionIndex];
		if (!n || !r) return;
		let i = this.packagesForAuthoredAction(t, this.authoredActionIndex), a = t.telegraphSeconds + (this.controlMethod === "touch" ? .1 : 0), o = this.storyTimeline?.snapshot.playSegment?.id ?? null, s = this.takeThematicEquipment(o);
		if ((t.obstacleVariant === "parcel-arc" || t.obstacleVariant === "recovery-route") && this.authoredActionIndex === 0) {
			let e = this.packages.filter(({ active: e }) => !e).slice(0, i);
			if (e.length < i) return;
			let n = B(this.speed, bi, a), r = [
				28,
				78,
				118,
				78,
				28
			];
			e.forEach((e, i) => {
				e.active = !0, e.kind = "standard", e.collectibleClass = "parcel", e.x = n + i * 66, e.y = 432 - e.size - (r[i] ?? 28), e.phase = i * .72, e.packageType = "notebook", e.orderVisualType = "parcel", e.weightKg = 0, e.storyRewardPattern = !0, e.authoredWaveId = t.id;
			}), this.authoredActionSpawned = !0;
			return;
		}
		let c = V({
			action: n,
			obstacleKind: r,
			spawnX: B(this.speed, bi),
			speed: this.speed,
			packageCount: i,
			patternIndex: e.snapshot.wavesCompleted + this.authoredActionIndex,
			source: "story-reward",
			authoredWaveId: t.id,
			authoredActionIndex: this.authoredActionIndex,
			semanticVariant: t.obstacleVariant,
			minimumReactionSeconds: a,
			rewards: [{
				kind: "standard",
				packageType: s
			}]
		});
		!c || !H(c, this.obstacles, this.packages) || (this.authoredActionSpawned = !0);
	}
	advanceAuthoredWaveIfClear() {
		let e = this.authoredWaveDirector, t = e?.currentWave;
		if (!(!e || !t || !this.authoredActionSpawned || this.hasAuthoredRuntimeObjects())) {
			if (this.authoredActionIndex + 1 < t.actions.length) {
				this.authoredActionIndex += 1, this.authoredActionSpawned = !1, this.authoredBreathRemaining = .25;
				return;
			}
			this.resolveCurrentAuthoredWave(!0);
		}
	}
	resolveCurrentAuthoredWave(e) {
		let t = this.authoredWaveDirector, n = t?.currentWave;
		if (!t || !n) return;
		let r = t.resolve(e);
		if (t.definition.id !== "first-package") {
			let e = fn(this.combo, r.passed, r.perfect);
			this.combo = e.nextCombo, this.bestCombo = Math.max(this.bestCombo, this.combo), this.bonusScore += e.perfectBonus;
		}
		if (r.passed && n.reward) {
			let e = n.reward === "double-score" ? "podwojny_wynik" : n.reward === "warranty" ? "gwarancja_48" : void 0;
			e && (this.pendingPowerUpReward = e);
		}
		this.beginFinaleRewardRunIfReady(), this.authoredActionIndex = 0, this.authoredActionSpawned = !1, this.authoredBreathRemaining = r.passed ? n.breathSeconds : .45;
		for (let e of this.obstacles) e.authoredWaveId === n.id && (e.active = !1);
		for (let e of this.packages) e.authoredWaveId === n.id && (e.active = !1);
		this.emitSnapshot();
	}
	beginFinaleRewardRunIfReady() {
		let e = this.authoredWaveDirector;
		!e?.completed || e.definition.id !== "million-threshold" || this.authoredFinaleCelebrated || (this.authoredFinaleCelebrated = !0, this.finaleRewardRunRemaining = 4);
	}
	hasPendingPowerUpParcel() {
		return this.packages.some(({ active: e, authoredWaveId: t }) => e && t === "safe-power-up");
	}
	spawnPendingPowerUpReward() {
		let e = this.pendingPowerUpReward, t = this.packages.find(({ active: e }) => !e);
		!e || !t || (t.active = !0, t.kind = e, t.collectibleClass = "parcel", t.x = B(this.speed, bi, 1.6), t.y = 432 - t.size - 12, t.phase = 0, t.packageType = "notebook", t.orderVisualType = "parcel", t.weightKg = 0, t.storyRewardPattern = !0, t.authoredWaveId = "safe-power-up");
	}
	resetChallengeRunState() {
		this.challengeElapsedSeconds = 0, this.challengePatternIndex = 0, this.challengeSpawnCooldown = 0, this.challengePowerUps.reset(), this.challengeRewards = new En(new ze(Be(this.baseSeed, this.runIndex + 2e4))), this.challengeOnboardingPending = this.mode === "challenge", this.challengeWaves.clear(), this.resetChallengeSequence();
	}
	resetChallengeSequence() {
		this.challengeSequenceRemaining = 0, this.challengeSequencePackagesAvailable = 0, this.challengeSequencePackagesCollected = 0, this.challengeSequenceBreathSeconds = 0;
	}
	spawnChallengePattern() {
		let e = fi(this.challengePatternIndex), t = mi(this.challengeElapsedSeconds, this.challengePatternIndex, e.packageCount);
		this.challengeSequenceRemaining === 0 && (this.challengeSequenceRemaining = t.sequenceLength, this.challengeSequencePackagesAvailable = 0, this.challengeSequencePackagesCollected = 0, this.challengeSequenceBreathSeconds = t.breathSeconds);
		let n = `challenge-${this.challengePatternIndex}`, r = this.challengeRewards.createWave({
			action: e.action,
			obstacleKind: e.obstacleKind,
			spawnX: B(this.speed, 960 + S.spawnPadding, t.reactionSeconds),
			speed: this.speed,
			packageCount: t.packageCount,
			patternIndex: this.challengePatternIndex,
			source: "normal",
			authoredWaveId: n,
			minimumReactionSeconds: t.reactionSeconds
		});
		!r || !H(r, this.obstacles, this.packages) || (this.challengeWaves.set(n, {
			available: t.packageCount,
			collected: 0
		}), this.challengeSequenceRemaining = Math.max(0, this.challengeSequenceRemaining - 1), this.challengeSequenceRemaining > 0 && (this.challengeSpawnCooldown = t.sequenceGapSeconds), this.challengePatternIndex += 1);
	}
	resolveChallengeWaveIfClear() {
		if (this.mode !== "challenge") return;
		for (let [e, t] of this.challengeWaves) this.obstacles.some(({ active: t, authoredWaveId: n }) => t && n === e) || this.packages.some(({ active: t, authoredWaveId: n }) => t && n === e) || (this.challengeSequencePackagesAvailable += t.available, this.challengeSequencePackagesCollected += t.collected, this.challengeWaves.delete(e));
		if (this.challengeSequenceRemaining > 0 || this.challengeWaves.size > 0 || this.challengeSequencePackagesAvailable === 0) return;
		let e = this.challengeSequencePackagesCollected >= Math.ceil(this.challengeSequencePackagesAvailable * Yr), t = e && this.challengeSequencePackagesCollected === this.challengeSequencePackagesAvailable, n = fn(this.combo, e, t);
		this.combo = n.nextCombo, this.bestCombo = Math.max(this.bestCombo, this.combo), this.bonusScore += n.perfectBonus, this.challengeSpawnCooldown = this.challengeSequenceBreathSeconds, this.resetChallengeSequence();
	}
	prepareStoryWave(e, t) {
		if (t !== "epoch_3.matching_creative" || e.packages.some(({ collectibleClass: e }) => e === "equipment")) return e;
		let n = e.packages.at(-1);
		if (!n) return e;
		let r = this.takeThematicEquipment(t);
		return {
			...e,
			packages: [...e.packages.map((t, n) => n === Math.floor(e.packages.length / 2) ? {
				...t,
				collectibleClass: "equipment",
				packageType: r,
				orderVisualType: r
			} : t), {
				...n,
				x: n.x + 55,
				phase: n.phase + .63
			}]
		};
	}
	takeThematicEquipment(e) {
		if (e === "epoch_3.matching_creative") {
			let e = xr[this.creativeEquipmentCursor % xr.length] ?? "notebook";
			return this.creativeEquipmentCursor += 1, e;
		}
		return xi[this.currentEpoch % xi.length] ?? "notebook";
	}
	positiveMotifForEpoch(e) {
		return [
			"process-zones",
			"quality-mark",
			"matched-order",
			"dispatch-flow"
		][Math.max(0, Math.min(3, e))];
	}
	activatePowerUp(e) {
		let t = e === "gwarancja_48" && this.activePowerUps.has("gwarancja_48"), n = this.activePowerUps.activate(e);
		return n && e === "gwarancja_48" && !t && (this.shieldActivationSeconds = Ke), n && this.mode === "story" && this.storyTimeline !== null && !this.seenPowerUpDemos.has(e) && (this.seenPowerUpDemos.add(e), this.powerUpDemoRemaining = vi), n;
	}
	completeBossEncounter() {
		this.bossesDefeated += 1, this.bonusScore += C.scoreBonus, this.clearInteractiveWorld();
	}
	tickPowerUps(e) {
		this.activePowerUps.tick(e);
	}
	handleStoryObjectiveUpdate(e) {
		if (e.newlyCompletedObjectiveIds.length !== 0) {
			for (let t of e.newlyCompletedObjectiveIds) {
				this.bonusScore += 750, t === "epoch_5.million_threshold" && (this.finaleCelebrationRemaining = _i, this.finaleHandoffPending = !0, this.clearInteractiveWorld());
				try {
					this.callbacks.onStoryObjectiveCompleted?.(t);
				} catch {}
			}
			this.emitSnapshot();
		}
	}
	emitUnlockedFacts() {
		if (this.factEngine === null) return;
		let e = this.factEngine.evaluate();
		for (let t of e) {
			this.factsUnlockedCount += 1;
			try {
				this.callbacks.onFactUnlocked?.(t);
			} catch {}
		}
	}
	syncStorySection(e, t) {
		if (e.sectionId === t.sectionId && e.state === t.state) return;
		if (e.phase === "epoch" && (t.phase !== "epoch" || e.epochIndex !== t.epochIndex)) {
			this.factEngine?.recordEpochCompleted(e.epochIndex, !this.epochHit), this.emitUnlockedFacts();
			try {
				this.callbacks.onEpochCompleted?.(e.epochIndex, !this.epochHit);
			} catch {}
		}
		if (t.phase === "epoch" && (e.phase !== "epoch" || e.epochIndex !== t.epochIndex)) this.enterEpoch(t.epochIndex), this.epochElapsed = this.storyEpochElapsed(t.totalActiveElapsedSeconds, t.epochIndex);
		else if (t.phase === "finale") {
			for (let e of this.obstacles) e.active = !1;
			this.storyClimaxDirector.reset(), this.bossDirector.reset(), this.bossStarted = !1;
		}
		let n = t.state === "play" && t.playSegment !== null && e.playSegment?.id !== t.playSegment.id;
		if (n) {
			this.clearInteractiveWorld();
			let e = si(t.playSegment?.id ?? ""), n = e?.id === "million-threshold" && this.story ? {
				...e,
				finaleOrderTarget: this.story.millionThreshold.orderTarget,
				repeatWavesUntil: this.story.millionThreshold.combinationTarget
			} : e;
			this.authoredWaveDirector = n ? new ai(n) : null, this.authoredActionIndex = 0, this.authoredActionSpawned = !1, this.authoredBreathRemaining = 0;
		} else t.state !== "play" && (this.authoredWaveDirector = null, this.authoredActionIndex = 0, this.authoredActionSpawned = !1);
		if (t.playSegment?.id === "epoch_3.matching_creative" && n && (this.creativeEquipmentCursor = 0), t.playSegment?.id === "epoch_4.order_peak" && n && (this.storyOrderPatternIndex = 0), (t.playSegment?.id === "epoch_1.training" || t.playSegment?.id === "epoch_2.quality_series") && n && (this.storyObjectivePatternIndex = 0), t.state === "play" && t.playSegment) {
			let e = Ci.get(t.playSegment.id);
			if (e === void 0) this.storyClimaxDirector.reset();
			else {
				let n = this.story?.epochs[e];
				this.storyClimaxDirector.enterEpoch(e, n?.challengeName ?? t.playSegment.id, t.playSegment.durationSeconds);
			}
		}
	}
	emitStorySignals(e = !1) {
		let t = this.storyTimeline?.snapshot;
		if (!t) return;
		let n = [
			t.state,
			t.phase,
			t.sectionId,
			t.scene?.id ?? "",
			t.playSegment?.id ?? "",
			t.countdownValue ?? "",
			t.trustCorridor ? "safe" : "play",
			...t.activeBeats.map(({ id: e }) => e)
		].join("|");
		if (e || n !== this.lastStorySignal) {
			this.lastStorySignal = n;
			try {
				this.callbacks.onStoryUpdate?.(t);
			} catch {}
		}
	}
	completeStoryAndEnterChallenge() {
		if (!this.storyCompleteEmitted) {
			this.storyCompleteEmitted = !0, this.awardStoryCompletionBonus && (this.bonusScore += this.story?.firstCompletionBonusScore ?? 0);
			try {
				this.callbacks.onStoryComplete?.();
			} catch {}
		}
		let e = this.mode;
		this.challengeStartScore = gn(this.distancePixels, this.ordersCollected, this.bonusScore), this.challengeStartOrders = this.ordersCollected, this.mode = "challenge", this.storyTimeline = null, this.storyObjectiveDirector.enterSegment(null), this.factEngine = null, this.narrative = null, this.currentEpoch = 0, this.epochElapsed = 0, this.epochHit = !1, this.epochCollisions = 0, this.resetChallengeRunState(), this.challengeWorldDirector.reset("story-continuation"), this.recoverySeconds = 0, this.startProtectionSeconds = Qn, this.warrantyBreakSeconds = 0, this.shieldActivationSeconds = Ke, this.crouchHeld = !1, this.runner.crouching = !1, this.clearInteractiveWorld(), this.storyClimaxDirector.reset(), this.storyObstacleTransformer.reset(), this.bossDirector.reset(), this.logisticWaveDirector.reset(), this.bossStarted = !1;
		let t = this.challenge ? je(0, this.challenge) : ke(0);
		this.speed = t.speed, this.difficultyLevel = t.level, this.spawner = new Jn(new ze(Be(this.baseSeed, this.runIndex + 1e4)), t.speed);
		try {
			this.callbacks.onModeChange?.(this.mode, e);
		} catch {}
		this.emitSnapshot();
	}
	startCutscene(e) {
		let t = this.narrative?.epochs[e];
		t && (this.pendingEpoch = e, this.cutscene = {
			title: t.name,
			subtitle: t.year
		}, this.cutsceneRemaining = gi, this.callbacks.onCutscene?.(e, t.name, t.year));
	}
	enterEpoch(e) {
		if (!this.narrative || this.narrative.epochs.length === 0) return;
		let t = this.narrative.epochs[e] ?? this.narrative.epochs[0];
		this.currentEpoch = e, this.epochElapsed = 0, this.epochHit = !1, this.epochCollisions = 0, this.furthestEpochReached = Math.max(this.furthestEpochReached, e), this.cutscene = null;
		let n = new ze(Be(this.baseSeed, this.runIndex + e * 97)), r = t.obstaclePool.map((e) => vn(e)).filter((e) => e !== null);
		this.spawner = new Jn(n, this.story ? Ae(this.storyTimeline?.snapshot.totalActiveElapsedSeconds ?? 0, this.story.activeDurationSeconds, this.story).speed : Cn(t, 0), r), this.story === null ? this.storyClimaxDirector.enterEpoch(e, t.challengeName ?? t.name, t.durationSeconds) : this.storyClimaxDirector.reset(), this.storyTimeline === null && t.powerUpDebut && this.activatePowerUp(t.powerUpDebut), this.speed = this.story ? Ae(this.storyTimeline?.snapshot.totalActiveElapsedSeconds ?? 0, this.story.activeDurationSeconds, this.story).speed : Cn(t, 0);
	}
	storyEpochElapsed(e, t) {
		if (!this.story) return this.epochElapsed;
		let n = this.story.epochs.slice(0, Math.max(0, t)).reduce((e, t) => e + t.durationSeconds, 0), r = this.story.epochs[t]?.durationSeconds ?? 0;
		return Math.max(0, Math.min(r, e - n));
	}
	clearInteractiveWorld() {
		for (let e of this.obstacles) e.active = !1;
		for (let e of this.packages) e.active = !1;
	}
	difficultyFromSpeed(e) {
		let t = e / 280, n = Math.max(1, 2.25 - (t - 1) * 1.4);
		return {
			level: this.difficultyLevel,
			speed: e,
			speedMultiplier: t,
			minimumGapSeconds: n
		};
	}
	finishRun(e, t = "dropout", n = 0) {
		if (this.cancelFrame(), this.impact = !0, this.emitUnlockedFacts(), this.narrative) try {
			this.callbacks.onNarrativeEnd?.(t);
		} catch {}
		this.setState("game_over");
		let r = this.createSnapshot();
		this.invokeSnapshot(r);
		let i = {
			...r,
			collisionType: e,
			controlMethod: this.controlMethod,
			outcome: t,
			furthestEpochReached: Math.max(this.furthestEpochReached, n)
		};
		try {
			this.callbacks.onGameOver?.(i);
		} catch {}
	}
	createSnapshot() {
		let e = hn(this.distancePixels), t = this.narrative?.epochs[this.currentEpoch], n = this.narrative ? this.narrative.epochs.length - 1 : 0, r = t?.durationSeconds ?? 1, i = this.storyTimeline?.snapshot, a = this.storyObjectiveDirector.snapshot, o = this.packages.filter(({ active: e, storyOrder: t, x: n, size: r }) => e && t === !0 && n + r >= this.runner.x).map(({ packageType: e }) => e), s = this.currentWorldVisual(), c = gn(this.distancePixels, this.ordersCollected, this.bonusScore);
		return {
			mode: this.mode,
			visualWorldId: s.worldId,
			visualStateId: s.stateId,
			visualNextStateId: s.nextStateId,
			visualProgress: s.progress,
			visualWorldIndex: s.worldIndex,
			visualTransitionPending: s.transitionPending,
			score: c,
			packagesCollected: this.packagesCollected,
			ordersCollected: this.ordersCollected,
			challengeScore: this.mode === "challenge" ? Math.max(0, c - this.challengeStartScore) : 0,
			challengeOrdersCollected: this.mode === "challenge" ? Math.max(0, this.ordersCollected - this.challengeStartOrders) : 0,
			collisions: this.collisions,
			recoverySeconds: X(this.recoverySeconds, 2),
			startProtectionSeconds: X(this.startProtectionSeconds, 2),
			combo: this.combo,
			bestCombo: this.bestCombo,
			warrantySaves: this.warrantySaves,
			storyPhase: i?.phase ?? null,
			storyProgress: i?.progress ?? 0,
			activeStoryBeatIds: i?.activeBeats.map(({ id: e }) => e) ?? [],
			trustCorridor: i?.trustCorridor ?? !1,
			storyObjectiveSegmentId: this.authoredWaveDirector?.definition.segmentId ?? a.activeSegmentId ?? "",
			storyObjectivesCompleted: [...a.completedObjectiveIds],
			storyObjectives: a,
			activeStoryOrderTypes: o,
			storyClimaxName: this.storyClimaxDirector.model.challengeName,
			storyClimaxPhase: this.storyClimaxDirector.model.phase,
			storyClimaxesCompleted: [...this.storyClimaxesCompleted].sort((e, t) => e - t),
			storyTransformationMotifs: [...new Set(this.storyObstacleTransformer.models.map(({ motif: e }) => e))],
			logisticWavePhase: this.logisticWaveDirector.snapshot.phase,
			logisticWaveProgress: this.logisticWaveDirector.snapshot.patternsCompleted,
			challengePressureAxis: this.mode === "challenge" ? di(this.challengeElapsedSeconds).axis : null,
			bossesDefeated: this.bossesDefeated,
			bossPhase: this.bossDirector.model.phase,
			bossEncounterPhase: this.bossDirector.model.encounterPhase,
			bossProgress: this.bossDirector.model.attacksSurvived,
			bossAttackCount: this.bossDirector.model.attackCount,
			distanceM: e,
			backgroundTravelPixels: Gr(this.distancePixels),
			reducedMotion: this.reducedMotion,
			decorationQuality: this.decorationQuality.level,
			durationSeconds: X(this.elapsedSeconds, 2),
			frameRate: X(this.estimatedFrameRate, 1),
			droppedFrames: this.droppedFrames,
			lastCollisionType: this.lastCollisionType,
			difficultyLevel: this.difficultyLevel,
			speed: X(this.speed, 1),
			epochIndex: this.currentEpoch,
			epochName: t?.name ?? "",
			epochYear: t?.year ?? "",
			epochIndexMax: n,
			epochProgress: Math.min(1, this.epochElapsed / r),
			packageTypeCounts: { ...this.packageTypeCounts },
			equipmentTypeCounts: { ...this.equipmentTypeCounts },
			totalWeightKg: Math.round(this.totalWeightKg),
			activePowerUps: this.activePowerUps.keys(),
			activePowerUpStatuses: this.activePowerUps.statuses(),
			powerUpDemoRemaining: X(this.powerUpDemoRemaining, 2),
			factsUnlockedCount: this.factsUnlockedCount,
			milestoneCelebration: this.milestoneCelebrationDirector.snapshot,
			authoredWave: this.authoredWaveDirector?.snapshot ?? null,
			authoredWavePhase: this.authoredWaveDirector === null ? "inactive" : this.authoredBreathRemaining > 0 ? "breath" : "burst",
			millionCounterValue: this.millionCounterValue()
		};
	}
	millionCounterValue() {
		if (this.mode === "challenge") return 1e6 + Math.max(0, this.ordersCollected - this.challengeStartOrders);
		let e = this.authoredWaveDirector;
		if (e?.definition.id !== "million-threshold") return this.storyObjectiveDirector.snapshot.epoch5.millionThreshold.counterValue;
		let t = e.snapshot.totalOrderTarget ?? 30;
		return 1e6 - t + Math.min(t, e.snapshot.totalOrdersCollected);
	}
	currentWorldVisual() {
		if (this.mode === "challenge") {
			let e = this.challengeWorldDirector.snapshot;
			return {
				worldId: e.worldId,
				stateId: e.stateId,
				nextStateId: e.stateId,
				progress: Math.min(1, e.worldElapsedSeconds / 45),
				worldIndex: e.worldIndex,
				transitionPending: e.transitionPending
			};
		}
		let e = this.storyTimeline?.snapshot;
		if (e?.scene) {
			let t = q(e.scene.id);
			return {
				worldId: t.worldId,
				stateId: t.stateId,
				nextStateId: t.stateId,
				progress: t.worldProgress,
				worldIndex: Or.indexOf(t.worldId),
				transitionPending: !1
			};
		}
		if (e?.playSegment) {
			let t = e.sectionDurationSeconds <= 0 ? 0 : e.sectionElapsedSeconds / e.sectionDurationSeconds, n = Br(e.playSegment.id, t);
			return {
				worldId: n.worldId,
				stateId: n.fromStateId,
				nextStateId: n.toStateId,
				progress: n.progress,
				worldIndex: Or.indexOf(n.worldId),
				transitionPending: !1
			};
		}
		let t = q(e?.completed ? "story.million_finale" : "story.first_package");
		return {
			worldId: t.worldId,
			stateId: t.stateId,
			nextStateId: t.stateId,
			progress: t.worldProgress,
			worldIndex: Or.indexOf(t.worldId),
			transitionPending: !1
		};
	}
	emitSnapshot() {
		this.invokeSnapshot(this.createSnapshot());
	}
	invokeSnapshot(e) {
		try {
			this.callbacks.onSnapshot?.(e);
		} catch {}
	}
	setState(e) {
		let t = this._state;
		if (t !== e) {
			this._state = e;
			try {
				this.callbacks.onStateChange?.(e, t);
			} catch {}
		}
	}
	render() {
		if (this._state === "destroyed") return;
		this.applyCanvasBuffer();
		let e = this.currentWorldVisual(), t = {
			state: this._state,
			runner: this.runner,
			obstacles: this.obstacles,
			packages: this.packages,
			boss: this.bossDirector.model,
			elapsedSeconds: this.visualElapsedSeconds,
			distancePixels: this.visualDistancePixels,
			speed: this.speed,
			reducedMotion: this.reducedMotion,
			decorationQuality: this.decorationQuality.level,
			impact: this.impact,
			epochIndex: this.currentEpoch,
			epochName: this.narrative?.epochs[this.currentEpoch]?.name ?? "",
			epochYear: this.narrative?.epochs[this.currentEpoch]?.year ?? "",
			themeIndex: this.narrative?.epochs[this.currentEpoch]?.themeIndex ?? -1,
			worldVisual: {
				worldId: e.worldId,
				stateId: e.stateId,
				nextStateId: e.nextStateId,
				progress: e.progress
			},
			cutscene: this.cutscene,
			activePowerUps: this.activePowerUps.keys(),
			powerUpCopy: this.powerUpCopy,
			mode: this.mode,
			trustCorridor: this.storyTimeline?.snapshot.trustCorridor ?? !1,
			combo: this.combo,
			recoverySeconds: this.recoverySeconds,
			startProtectionSeconds: this.startProtectionSeconds,
			warrantyBreakSeconds: this.warrantyBreakSeconds,
			shieldActivationSeconds: this.shieldActivationSeconds,
			storyPhase: this.storyTimeline?.snapshot.phase ?? null,
			storyProgress: this.storyTimeline?.snapshot.progress ?? 0,
			storyObjectives: this.storyObjectiveDirector.snapshot,
			storyClimax: this.storyClimaxDirector.model,
			obstacleTransformations: this.storyObstacleTransformer.models,
			milestoneCelebration: this.milestoneCelebrationDirector.snapshot,
			authoredWave: this.authoredWaveDirector?.snapshot ?? null
		};
		this.renderer.render(this.context, this.canvas.width, this.canvas.height, t);
	}
	installLifecycleListeners() {
		this.document.addEventListener("visibilitychange", this.handleVisibilityChange), this.view?.addEventListener("blur", this.handleWindowBlur);
		let e = globalThis.ResizeObserver;
		if (typeof e == "function") {
			let t = new e(this.handleResize);
			this.resizeObserver = t, t.observe(this.canvas);
		} else this.view?.addEventListener("resize", this.handleResize);
	}
	resizeCanvas() {
		let e = this.canvas.getBoundingClientRect(), t = Zn(e.width || this.canvas.clientWidth || this.canvas.width || 960, e.height || this.canvas.clientHeight || this.canvas.height || 540, this.view?.devicePixelRatio ?? 1, ve.maxPixels, ve.maxDimension);
		this.bufferWidth = t.width, this.bufferHeight = t.height, this.applyCanvasBuffer();
	}
	applyCanvasBuffer() {
		this.canvas.width !== this.bufferWidth && (this.canvas.width = this.bufferWidth), this.canvas.height !== this.bufferHeight && (this.canvas.height = this.bufferHeight);
	}
	shouldAutoPause() {
		return this._state === "running" && (this.storyTimeline?.snapshot.controlsEnabled ?? !0);
	}
	scheduleFrame() {
		if (!(this.frameId !== null || this._state !== "running")) {
			if (this.view?.requestAnimationFrame) {
				this.frameUsesTimeout = !1, this.frameId = this.view.requestAnimationFrame(this.handleFrame);
				return;
			}
			this.frameUsesTimeout = !0, this.frameId = globalThis.setTimeout(() => {
				let e = globalThis.performance?.now?.() ?? Date.now();
				this.handleFrame(e);
			}, 16);
		}
	}
	cancelFrame() {
		this.frameId !== null && (this.frameUsesTimeout ? globalThis.clearTimeout(this.frameId) : this.view?.cancelAnimationFrame(this.frameId), this.frameId = null);
	}
}, Ei = "amso_milion_runner_profile";
function Di() {
	return {
		schemaVersion: 5,
		challengeRecordVersion: 11,
		storyCompleted: !1,
		bestChallengeScore: 0,
		bestChallengeOrders: 0,
		challengeRuns: 0,
		challengeRecordRuns: 0,
		soundMuted: !1,
		fullscreenPreference: null
	};
}
function Oi() {
	try {
		return typeof window > "u" || !window.localStorage ? null : window.localStorage;
	} catch {
		return null;
	}
}
function ki(e) {
	return typeof e == "number" && Number.isFinite(e) && e >= 0 ? e : 0;
}
var Ai = class {
	constructor(e = Oi()) {
		i(this, "storage", void 0), i(this, "profile", void 0), this.storage = e, this.profile = this.read();
	}
	read() {
		if (this.storage === null) return Di();
		try {
			let e = this.storage.getItem(Ei);
			if (!e) return Di();
			let t = JSON.parse(e), n = t.storyCompleted === !0, r = t.challengeRecordVersion === 11, i = t.fullscreenPreference === "fullscreen" || t.fullscreenPreference === "portrait" ? t.fullscreenPreference : null;
			return {
				schemaVersion: 5,
				challengeRecordVersion: 11,
				storyCompleted: n,
				bestChallengeScore: r ? Math.round(ki(t.bestChallengeScore ?? t.bestScore)) : 0,
				bestChallengeOrders: r ? Math.round(ki(t.bestChallengeOrders ?? t.bestChallengePackages ?? t.bestPackages)) : 0,
				challengeRuns: Math.round(ki(t.challengeRuns)),
				challengeRecordRuns: r ? Math.round(ki(t.challengeRecordRuns)) : 0,
				soundMuted: t.soundMuted === !0,
				fullscreenPreference: i
			};
		} catch {
			return Di();
		}
	}
	write() {
		if (this.storage !== null) try {
			this.storage.setItem(Ei, JSON.stringify(this.profile));
		} catch {}
	}
	get snapshot() {
		return this.profile;
	}
	get availableModes() {
		return this.profile.storyCompleted ? ["story", "challenge"] : ["story"];
	}
	completeStory() {
		this.profile.storyCompleted = !0, this.write();
	}
	recordChallengeResult(e, t) {
		this.profile.bestChallengeScore = Math.max(this.profile.bestChallengeScore, Math.round(ki(e))), this.profile.bestChallengeOrders = Math.max(this.profile.bestChallengeOrders, Math.round(ki(t))), this.profile.challengeRuns += 1, this.profile.challengeRecordRuns += 1, this.write();
	}
	setSoundMuted(e) {
		this.profile.soundMuted = e, this.write();
	}
	setFullscreenPreference(e) {
		this.profile.fullscreenPreference = e, this.write();
	}
}, ji = class {
	constructor() {
		i(this, "latest", null), i(this, "waves", /* @__PURE__ */ new Map()), i(this, "segmentTimes", /* @__PURE__ */ new Map()), i(this, "lowestFrameRate", null), i(this, "challengeDeath", null);
	}
	record(e) {
		this.latest = e;
		let t = e.frameRate ?? 0;
		t > 0 && (this.lowestFrameRate = this.lowestFrameRate === null ? t : Math.min(this.lowestFrameRate, t));
		let n = e.storyObjectiveSegmentId;
		if (n) {
			let t = this.segmentTimes.get(n);
			t ? t.end = Math.max(t.end, e.durationSeconds) : this.segmentTimes.set(n, {
				start: e.durationSeconds,
				end: e.durationSeconds
			});
		}
		let r = e.authoredWave?.lastResult;
		if (!r || !e.authoredWave) return;
		let i = `${e.authoredWave.microlevelId}:${e.authoredWave.wavesCompleted}:${r.waveId}:${r.attempts}:${r.passed}`;
		this.waves.set(i, {
			segmentId: n,
			microlevelId: e.authoredWave.microlevelId,
			waveId: r.waveId,
			completionIndex: e.authoredWave.wavesCompleted,
			attempts: r.attempts,
			actionSucceeded: r.actionSucceeded,
			passed: r.passed,
			perfect: r.perfect,
			collectionRatio: r.collectionRatio
		});
	}
	recordResult(e) {
		this.record(e), e.mode === "challenge" && (this.challengeDeath = {
			timeSeconds: e.durationSeconds,
			speed: e.speed,
			reason: e.collisionType,
			challengeScore: e.challengeScore,
			ordersCollected: e.challengeOrdersCollected
		});
	}
	snapshot() {
		let e = this.latest, t = [...this.waves.values()], n = t.filter(({ passed: e }) => e), r = n.reduce((e, { attempts: t }) => e + Math.max(0, t - 1), 0), i = n.filter(({ attempts: e }) => e === 1).length, a = [...this.segmentTimes.entries()].map(([e, t]) => {
			let r = n.filter((t) => t.segmentId === e), i = r.reduce((e, t) => e + t.collectionRatio, 0);
			return {
				segmentId: e,
				durationSeconds: Math.max(0, t.end - t.start),
				resolvedWaves: r.length,
				firstAttemptPasses: r.filter(({ attempts: e }) => e === 1).length,
				retries: r.reduce((e, { attempts: t }) => e + Math.max(0, t - 1), 0),
				averageCollectionRatio: r.length === 0 ? 0 : i / r.length
			};
		});
		return {
			schema: "amso-runner-qa-v1",
			durationSeconds: e?.durationSeconds ?? 0,
			mode: e?.mode ?? "story",
			ordersCollected: e?.ordersCollected ?? 0,
			collisions: e?.collisions ?? 0,
			bestCombo: e?.bestCombo ?? 1,
			speed: e?.speed ?? 0,
			frameRate: e?.frameRate ?? 0,
			lowestFrameRate: this.lowestFrameRate,
			droppedFrames: e?.droppedFrames ?? 0,
			lastCollisionType: e?.lastCollisionType ?? null,
			challengePressureAxis: e?.challengePressureAxis ?? null,
			retries: r,
			actionErrors: t.filter(({ actionSucceeded: e }) => !e).length,
			firstAttemptRate: n.length === 0 ? null : i / n.length,
			segments: a,
			waves: t,
			challengeDeath: this.challengeDeath
		};
	}
	text() {
		return JSON.stringify(this.snapshot(), null, 2);
	}
}, Mi = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAAWCAYAAAASPXQbAAAMs0lEQVR4nL1aCXQUVRa9vxOSoBCCIBDBAUIUBR3F9LAzpEEYJyLiknbDjVFABUQBWSWJCowoI4sOEkBAGJ3TORgRDYJIUBlU6IAIUXYSQUHZCWQjnTvntb9DdVPV6YbgPadOV3VVvff/q/ff+hUuEtycHYf1U0bizIm7wNJoRNXbivZDRqoug/ZcLO0qHmRDAOMBtAdQC8DHAN5SSh29SNKKZEcAIwFcC+AAgPdSUlJcK1asKAuDxvUAugP4C4BoGbK+Z7N6J4RzIyoALFJKrQoin0QArQDcBOBPAGIBXAGgHoDaWm4RemxCr1gfIsP9ALYB+BrAjhqQqzn40TNtObnVMo6rVcoJoPcYr8iXr8zj8uGdaoQHmUByJUkPz6GE5CqS1wQRcii07yO5h2SlgfZpkq8MHDiwVgjvX0fyTZL7SZ7hpUExyTSSogBVaNu2bRTJbiQnk8wneVSP3SincFCuaXxHcirJdsnJyZEXKtvzhfW/2Y049doNHGvzVCmL7xgHMq3+Fn42QVbeBaNTp0619QfxWEwwm+SVFzR+sgPJ3RbC+5VkmxCUZc1FfKBQIIo8Kykp6TIDa5WcnBxDcopW1EvBX2huJzmCpFioiwMXPBbDaW0WcGyAohiPMbZKvtZ2BcnLL5gP2Z3kwWoE+mx6erotTLr1SeYGWJZAgQ0J8v4VJGVulxruwAUh1yRnBxl7TUKs5jySdX38wxK0HrANFYcG4uje+7we0QqRlQpHfuyN2V1HMHdBTLh8tBI8D6BRkMfEHT2elpbWNky6zwDoGsSdyTN3y0q24HkfgFsRHqiPyiCHRx9yvgnAk0qpw1UEfl98kwAMuBhXHAbEsj0GIMPnEsNiSlJh3u19UbjubeBUE/+7tSog91WFvxrZLjuJ+A6T0eCpacrp9ITBqyWAH3UQGQwi3JUAUpVSZ0Kg2w3AEh0YBsNvAPoppb4OeD9W85NgORBl+t46fc4AZTGeGw/fPHz3RYZrlVI7A3gPAzBNlmOQcZcCOA7gEIB9eh5FAMoNCinvi/I1ANACgLhfsSJWC7sEwNiMjIxZ4QU1qzJa4+DmN1F5qomfbZIpNrp+GaLiTuKnLwf4WR5PcT0cdI9AvezNAD4LkZMoclIIyiKw6QzlgdTU1AVZWVmeYDGRTDwEZYHOMHonJSW58/Lyzhr+rwOgmcnzwncBgFFKqdOoYeg4Rtyk1TcThdsCYD6ALyXjU0qdNCiiKbTVStQWc5iFbERuj6alpS0N2SVx26dXYPP8uSg92MxPWURM9VtvQLfhT6FZt4mIit/k/c/46c8WNULBt1OZMzakADU5OVkU5Y4wTecIl8uVEOyh9evX3wXAESJN+TApbrdbUlYjPDodDYRYlB+cTqes5BqH2+226w9rBkmT3xY3mpGRMVsptVUpdbw6ZRGIVVZKbcnIyHhDu9rvLR6VBKZnSC6JS4bG4si6Sfhty9OwVZ5Tl0oFRDXcDceoFNX9hV1kug3/2dUJuz/+FOUn6/grlg2Iu2Exnsgcohp0PBWUHykffg2A5ia35WMZswYjXnM6nWPNrAxJqbOsAJBgQVNWUaA8xLKkKKVWG+jUAzBXXGAgCwC/anf3pXYNykBTmVwb4bu2aQX4BcBBh8PhrYnk5uaOAjDZYt7iBh+qifoJSZnXQgsZu0Ijkvn3kRwbc9ovCxoPcmLcr1zcv995z7/Tdwgn1D51fuYUU8o5jnGsJqshea9FFiA1iXSS2yyi+iMke5nQq0NyocU7J0g+Q7LQ4v701NTUiIBC3T0ki4JkF5WGw3cdDip1TWQzyaEkG5HMCvL8ExeSwFjIviXJLRZ8dlb34Wz8LD0Ze9a8DFuZf3rMqHIk9hqN6FtEu/3R4LpFiG+XCdTyX+m20mjs3zAcid/facUzMTFR3JFouZn1kxX8ro4VZAWfxxnAGEmbA/7/G4A+Fiyz7XZ7JgC/ANOAXi6Xy+iW6HQ6cwAstRhDKNakOigdQ90MYKokdxZxkw+FobifECEB8jGLe3WCa+Xcnh2xYc58RJbFQPmCeRlaJNG84yw87FqM1OfK6HJFeJVLfl2uCJTZi9EkaTrqXrPc67Z88HIrvhJ7v5jB9YuamrHctWtXawDir82wTClVoJXmA4tnJHsZ7KtSkrwKwDitTIGQkvhbOqhdZkGvVeB4srKySnTKP00L1yCcGodkLoN128EKxqD8YhFMuSMssySuntQYm94Zj+KDCX4kRAHqNv8cbQZNwsG8aHw1pw94Kh7vfUAoZQM9Cqy0yZdCYtetyNveD6RhGARKjl6Nb6bNpGvoYOWcVVVn0OgAoKmFUL71jkCpwyRnyOoHEBhIi+99Njc39xO73S5p+SAAN1pM878Oh+M7fS60JVAMtE7ROoP4xPinUupYUlJShtvtzgVwL4B2ABoa+jV+4qzm2ksSQBOL2EHuBat6RaHmIPytqrseU21izsxo7JgzE0d2PQJVHuM3zdottyH+2v4Y8On3yOwxEns3vgBbRd2q+2JFqNWDqERkqXlu74kuR/zNM3DHPyeqlo5SQ3wgDbaeJpq+V9dFtsqFxBUul0sCwRcthDxDW42lJkogyAdwu1Kq0BDMrrawbuKueiilfjabihT4cnNza+tx+BSGeg5mymH8z9iolEzkAQD9dbMwVLzkcDimrF271spFhgySEpMu1uWDQOSfpzD8KP0yHN86APkfTkctT4TfZ4uofwzdn+sNx4ubkPXkrdiyJBsovfyCao5ekdY+jta3jlWPLp+jB3u1LtaZtRMk+3haKVVkmFx97ZqSTZ4/oVPdxhZZ0eNKKWPUL8o6xiITkbrKEKXUIlxiSICu6ylBSwQBELc4xOFwZF+o0niLsr9npbMB3GbyiMRImee7pKNbe2LPqjREefxNICNLEX/TeNVjYh5XnrwO+R++iYowlUXWkC9q8oaEJfVR8FUGv3l7jeo4eLf+8Fa9p9VGZfGSUOq49FV0cBgX8HzgtRE5nTt3Xm6iwlLVLTcx8TKmnklJSVl5eXmBNRg/CaSnp3uv8/Pz1eHDh/3uFRUVea8TEhK8v6dPn/b+lpSUqLKyMrV+/Xqxcj20awoHEiDPzM3NFde7cNCgQfsyMzPPhqEojXWhdJxFBVsgocNSvwkxe1Qr/LB4CYoPdfQTgyfSgyY3zkWXO0egdmoFNk6YiBOFnWEzicwrLVQoIsKDUwficea362EzKKNQqNciZ2+rvsMT7plxv5hXk7elLnGLzx2ZlOpfByCpZSjqK4Hu3UoptwktEZxkQLeYvHfAW7gylOt1vWiiLqsjcDmYZEpm933vyeJtrOM3v60MPnYAvtAu08xd+OR0EIBU1Qv1eZmhV+VzkxGaX6wuBv4ZwFVBFpm8J9Z1SJWF4br5dbHxXwtRfLi9v7KI/rZehYTkV5Q9vZhMs2H3Na+iXedKb7ciHHiONce27DdwfEdvRPCcqE78fFvC3pVT9EamPnqjlBH77Hb7djOSSqlTJF8F0Fm2iVQzAhHadEOg64eUlJQTOTk5K7QAA61vU119nqaVReKNTN3E/CMgG9LuluIkgAd1oTEQMuar9VFToE4Iplb16piTHst/d5vJ0QGFNtm+8FLjAn77bssa4+76R3u+3LDw/KJeZCnn9hpHshPJfQFFLIlfgnagST6sNxAFgxSkgpp7kg6S4urMsEJ6Orq49QX/OBySzV56fHEkJ+gi5qXGWZKfa0vqhc1bdd275mEc2PSY35oSvYqJ+wUtug5VHR6RrmfNIHXeRrTqMQqVMf4+NqIiGgc2jih9/0Exl6MB+NoH5bpNYIn09PRK2VYpFfQgNRGJPV5RSlVnF2Wromk2BKCt2+3uoht8f8WlB3Vv5ymn05ktfyilTtjtdrGoD0lHO0iR7WJQobNSiWn6K6Xk3AvF9/vejh3uSTh7tI32sFrg6ixim0+H4/kMZR9Uk4UhWSWRmG6fi6M77wfOnnOAwjm2hXv3VXcMS+w/tY9WnMM65tgUAl1xZfMA3BAQz0ihbW7Lli1HFxQUVJtFSDtAF8toIsifAARaXCslDed/43YHWSQ7dRD+jtPp3GnRH2ukXXGKDlbjdWpv1hcLhnJ9FOkFI4qY43A4tgdmXYqL+g3Fif1xiIotg00GGylhKxFV5zia3vaB6jVIWuQ1Dn48pj6OF/ZDRYk0KX8XoHA+feRyNLNvGbbGs2bmzJnis2VFrQ7YYmBNl7xRB6JddC3jjK4Mvy7xTog0pLrb22LfitKKY9zfYtzLYrXfxeqe8b6vEy7BamEo+3sMY5YSg+xtkSarLBxxIxLISgblqw/56kIyfpGFNCulySlKIgnFdofDURAsNf8/vYtMFQrzWbcAAAAASUVORK5CYII=";
//#endregion
//#region src/visuals/WorldVisualLayer.ts
function Ni() {
	return new Image();
}
var Pi = class {
	constructor(e = Ni) {
		i(this, "imageFactory", void 0), i(this, "entries", /* @__PURE__ */ new Map()), this.imageFactory = e;
	}
	load(e) {
		let t = this.entries.get(e);
		if (t !== void 0) return t.promise;
		let n = this.imageFactory(), r = 0, i = new Promise((t, i) => {
			let a = () => {
				if (r < 2) {
					queueMicrotask(o);
					return;
				}
				n.onload = null, n.onerror = null, i(/* @__PURE__ */ Error("world_asset_decode_failed"));
			}, o = () => {
				r += 1, n.onload = async () => {
					n.onload = null, n.onerror = null;
					try {
						await n.decode?.(), t({
							path: e,
							image: n
						});
					} catch {
						a();
					}
				}, n.onerror = a, n.src = e, n.complete && n.naturalWidth > 0 && n.onload?.(new Event("load"));
			};
			o();
		});
		for (this.entries.set(e, {
			path: e,
			image: n,
			promise: i
		}); this.entries.size > 2;) {
			let e = this.entries.keys().next().value;
			if (e === void 0) break;
			this.entries.delete(e);
		}
		return i;
	}
};
function Fi(e, t) {
	let n = e.querySelector(t);
	if (n === null) throw Error(`World visual element not found: ${t}`);
	return n;
}
var Ii = class {
	constructor(e, t = new Pi()) {
		i(this, "host", void 0), i(this, "assets", void 0), i(this, "panels", void 0), i(this, "currentWorldId", null), i(this, "currentStateId", ""), i(this, "requestedAssetPath", null), i(this, "currentAsset", null), i(this, "pendingAsset", null), i(this, "queuedAsset", null), i(this, "pendingPanelPrepared", !1), i(this, "transitionMode", "story-linked"), i(this, "transitionStartDistance", 0), i(this, "lastDistance", 0), i(this, "lastParallaxCycle", null), this.host = e, this.assets = t, e.innerHTML = `
      <div class="amso-world-visual__image-stack" aria-hidden="true">
        <canvas class="amso-world-visual__panel" data-world-panel="current" width="1672" height="941"></canvas>
        <canvas class="amso-world-visual__panel" data-world-panel="next" width="1672" height="941"></canvas>
      </div>
      ${at}
      <div class="amso-world-visual__counter" aria-hidden="true">
        <span data-world-counter>999 970</span>
      </div>
    `, this.panels = [Fi(e, "[data-world-panel=\"current\"]"), Fi(e, "[data-world-panel=\"next\"]")], this.host.style.setProperty("--world-overlap", "0px");
	}
	show(e) {
		let t = q(e.stateId);
		if (t.worldId !== e.worldId) throw Error(`World/state mismatch: ${e.worldId}/${e.stateId}`);
		let n = Fr(e.worldId), r = this.currentWorldId !== e.worldId, i = this.currentStateId !== e.stateId;
		return this.transitionMode = e.transitionMode ?? "story-linked", this.currentWorldId = e.worldId, this.currentStateId = e.stateId, this.host.dataset.worldId = e.worldId, this.host.dataset.stateId = e.stateId, this.host.dataset.phase = e.phase, this.host.dataset.copyPlacement = t.copyPlacement, this.host.style.setProperty("--world-position-portrait", t.crops.portrait), this.host.style.setProperty("--world-position-landscape", t.crops.landscape), this.host.style.setProperty("--world-position-desktop", t.crops.desktop), this.host.style.setProperty("--world-reading-zoom", String(t.readingCamera.zoom)), this.host.style.setProperty("--world-game-zoom", String(t.gameCamera.zoom)), this.host.style.setProperty("--world-reading-origin-x", `${t.readingCamera.x * 100}%`), this.host.style.setProperty("--world-reading-origin-y", `${t.readingCamera.y * 100}%`), r && this.loadWorldAsset(n.assetPath), (r || i) && (this.host.dataset.reveal = t.revealMotion, this.host.dataset.visualEvent = t.visualEvent), t;
	}
	setCounterValue(e) {
		let t = Number.isFinite(e) ? Math.max(0, Math.floor(e)) : 0, n = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(t).replace(/[\u00a0\u202f]/gu, " ");
		this.host.querySelectorAll("[data-world-counter]").forEach((e) => {
			e.textContent = n;
		});
	}
	setPhase(e) {
		this.host.dataset.phase = e;
	}
	setParallaxDistance(e, t, n = !1) {
		if (!Number.isFinite(e)) return;
		let r = n ? Kr(e) : Math.max(0, e);
		if (this.lastDistance = r, this.host.style.setProperty("--world-phase-px", `${r}px`), this.host.dataset.motionState = t ? "moving" : "reading", !t) {
			this.setPanelMotion(!1), this.placePanels(r % 960 / 960);
			return;
		}
		if (this.transitionMode === "offscreen") {
			this.setOffscreenParallaxDistance(r);
			return;
		}
		let i = Math.floor(r / 960), a = this.lastParallaxCycle !== null && i !== this.lastParallaxCycle;
		if (this.setPanelMotion(this.lastParallaxCycle !== null && !a), this.lastParallaxCycle = i, this.pendingAsset !== null) {
			this.pendingPanelPrepared || (this.drawPanel(this.panels[1], this.pendingAsset), this.pendingPanelPrepared = !0);
			let e = Math.max(0, (r - this.transitionStartDistance) / 960);
			e >= 1 - 2 ** -52 * 8 ? this.commitPendingAsset(!0) : this.placePanels(Math.min(1, e));
			return;
		}
		let o = r % 960 / 960;
		this.placePanels(o);
	}
	setOffscreenParallaxDistance(e) {
		let t = Math.floor(e / 960), n = e % 960 / 960, r = this.lastParallaxCycle, i = r === null ? 0 : t - r;
		if (r !== null && i !== 0 && i !== 1) {
			this.resynchronizePanels(n), this.lastParallaxCycle = t;
			return;
		}
		i === 1 ? (this.recyclePanels(), this.setPanelMotion(!0, !1), this.placePanels(n), this.pendingAsset !== null && (this.pendingPanelPrepared ? this.commitPendingAsset(!1) : (this.drawPanel(this.panels[1], this.pendingAsset), this.pendingPanelPrepared = !0))) : (this.setPanelMotion(r !== null), this.placePanels(n), r === null && n <= 2 ** -52 * 8 && this.pendingAsset !== null && !this.pendingPanelPrepared && (this.drawPanel(this.panels[1], this.pendingAsset), this.pendingPanelPrepared = !0)), this.lastParallaxCycle = t;
	}
	placePanels(e) {
		let t = e * 100, n = -t, r = 100 - t;
		this.panels[0].style.transform = `translate3d(${n}%, 0, 0)`, this.panels[1].style.transform = `translate3d(${r}%, 0, 0)`;
	}
	setPanelMotion(e, t = e) {
		this.panels[0].style.transition = e ? "transform 140ms linear" : "none", this.panels[1].style.transition = t ? "transform 140ms linear" : "none";
	}
	recyclePanels() {
		this.panels = [this.panels[1], this.panels[0]], this.panels[0].dataset.worldPanel = "current", this.panels[1].dataset.worldPanel = "next";
	}
	resynchronizePanels(e) {
		this.setPanelMotion(!1), this.currentAsset !== null && this.pendingPanelPrepared && (this.drawPanel(this.panels[0], this.currentAsset), this.drawPanel(this.panels[1], this.currentAsset)), this.queuedAsset !== null && (this.pendingAsset = this.queuedAsset, this.queuedAsset = null), this.pendingPanelPrepared = !1, this.placePanels(e);
	}
	loadWorldAsset(e) {
		this.requestedAssetPath !== e && (this.requestedAssetPath = e, this.host.dataset.assetState = "loading", this.assets.load(e).then((t) => {
			this.requestedAssetPath === e && (this.currentAsset === null ? (this.currentAsset = t, this.pendingAsset = null, this.queuedAsset = null, this.pendingPanelPrepared = !1, this.drawPanel(this.panels[0], t), this.drawPanel(this.panels[1], t), this.prepareNextWorld(t.path)) : this.transitionMode === "offscreen" && this.pendingAsset !== null && this.pendingPanelPrepared ? this.queuedAsset = t.path === this.pendingAsset.path ? null : t : (this.pendingAsset = t, this.queuedAsset = null, this.pendingPanelPrepared = !1, this.transitionStartDistance = this.lastDistance - this.lastDistance % 960), this.host.dataset.assetState = "loaded");
		}).catch(() => {
			if (this.requestedAssetPath === e) {
				if (this.transitionMode === "offscreen" && this.pendingAsset !== null && this.pendingPanelPrepared) {
					this.queuedAsset = null, this.requestedAssetPath = this.pendingAsset.path, this.host.dataset.assetState = "loaded";
					return;
				}
				this.pendingAsset = null, this.queuedAsset = null, this.pendingPanelPrepared = !1, this.currentAsset === null ? (this.clearPanels(), this.host.dataset.assetState = "fallback") : (this.requestedAssetPath = this.currentAsset.path, this.host.dataset.assetState = "loaded");
			}
		}));
	}
	commitPendingAsset(e) {
		this.pendingAsset !== null && (this.currentAsset = this.pendingAsset, this.pendingAsset = this.queuedAsset, this.queuedAsset = null, this.pendingPanelPrepared = !1, e && this.drawPanel(this.panels[0], this.currentAsset), this.drawPanel(this.panels[1], this.currentAsset), e && this.placePanels(this.lastDistance % 960 / 960), this.prepareNextWorld(this.currentAsset.path));
	}
	prepareNextWorld(e) {
		let t = kr[kr.findIndex(({ assetPath: t }) => t === e) + 1];
		t !== void 0 && this.assets.load(t.assetPath).catch(() => void 0);
	}
	drawPanel(e, t) {
		let n = t.image.naturalWidth || 1672, r = t.image.naturalHeight || 941;
		e.width = n, e.height = r;
		let i = e.getContext("2d");
		i !== null && (i.clearRect(0, 0, n, r), i.drawImage(t.image, 0, 0, n, r));
	}
	clearPanels() {
		for (let e of this.panels) e.getContext("2d")?.clearRect(0, 0, e.width, e.height);
	}
};
//#endregion
//#region src/ui/milestone-layout.ts
function Li(e, t, n) {
	return Math.max(t, Math.min(n, e));
}
function Ri(e, t) {
	let n = Math.max(390, e), r = Math.max(540, t), i = n < 757, a = i ? 11 : 20, o = Math.min(n - a * 2, i ? 340 : 560), s = i ? 58 : 72, c = i ? 132 : Li(r * .16, 110, 150);
	return {
		message: {
			x: (n - o) / 2,
			y: c,
			width: o,
			height: s
		},
		hud: {
			x: a,
			y: i ? 10 : 20,
			width: n - a * 2,
			height: i ? 96 : 82
		},
		courierZone: {
			x: 0,
			y: r * .48,
			width: n * .48,
			height: r * .52
		},
		obstacleSpawnZone: {
			x: n * .7,
			y: r * .42,
			width: n * .3,
			height: r * .58
		}
	};
}
//#endregion
//#region src/ui/story-presentation.ts
function zi(e, t) {
	return e === t ? "fullscreen" : "portrait";
}
function Bi(e) {
	let t = Object.freeze((typeof e.body == "string" ? [e.body] : [...e.body]).map((e) => e.trim()).filter((e) => e.length > 0));
	return Object.freeze({
		sceneId: e.sceneId,
		presentationId: e.presentationId ?? e.sceneId,
		visualStateId: e.visualStateId ?? e.sceneId,
		...e.eyebrow === void 0 ? {} : { eyebrow: e.eyebrow },
		title: e.title,
		body: t,
		vignette: e.vignette,
		continueLabel: e.continueLabel,
		...e.action === void 0 ? {} : { action: e.action },
		...e.finalFrame === void 0 ? {} : { finalFrame: e.finalFrame }
	});
}
var Vi = class {
	constructor(e = () => Date.now()) {
		i(this, "now", void 0), i(this, "sceneId", null), i(this, "consumed", !1), i(this, "unlockAt", 0), this.now = e;
	}
	arm(e, t = 0) {
		return e === this.sceneId ? !1 : (this.sceneId = e, this.consumed = !1, this.unlockAt = this.now() + Math.max(0, t), !0);
	}
	isLocked(e) {
		return e !== this.sceneId || this.now() < this.unlockAt;
	}
	consume(e) {
		return this.consumed || this.isLocked(e) ? !1 : (this.consumed = !0, !0);
	}
	clear() {
		this.sceneId = null, this.consumed = !1, this.unlockAt = 0;
	}
}, Hi = {
	podwojny_wynik: "×2 WYNIK",
	gwarancja_48: "GWARANCJA 48 M ×1"
};
function Ui(e, t = [], n = {}) {
	let r = new Map(t.map(({ kind: e, remainingSeconds: t }) => [e, t]));
	return e.map((e) => {
		let t = r.get(e), i = t == null ? "" : ` ${Math.ceil(t)} s`;
		return `${n[e] ?? Hi[e]}${i}`;
	}).join(" · ");
}
function Wi(e, t, n = "Skok: W/↑/Spacja/tap · Ślizg: S/↓") {
	return e === "epoch_1.training" || t?.microlevelId === "first-package" && t.wavesCompleted === 0 ? n : null;
}
var Gi = [
	"PRZYJĘCIE",
	"REALIZACJA",
	"WYSYŁKA"
], Ki = [
	"📥",
	"⚙️",
	"🚚"
], qi = [
	"💻",
	"👥",
	"🏢"
];
function Ji(e) {
	if (e === null) return null;
	let t = Math.min(e.wavesCompleted, e.waveTarget), n = e.currentObstacleVariant === "parcel-arc" ? "ZBIERZ ZAMÓWIENIA" : (e.currentActions ?? []).map((e) => e === "jump" ? "↑ SKOK" : "↓ ŚLIZG").join(" + "), r = n ? ` · ${n}` : "";
	switch (e.microlevelId) {
		case "first-package": return `📦 RUCHY ${t}/${e.waveTarget}${r}`;
		case "order-backlog": return `📦 FALE ZATORU ${t}/${e.waveTarget}${r}`;
		case "quality-process": return `💻 SPRAWDZONE ${Math.min(4, Math.floor(t / 3))}/4 · KROK ${e.completed ? 3 : t % 3 + 1}/3`;
		case "client-growth": {
			let n = Math.min(2, Math.floor(t / 2));
			return `${qi[n]} ROZWÓJ ${e.completed ? 3 : n + 1}/3`;
		}
		case "order-scale": {
			let n = Math.min(2, Math.floor(t / 3)), r = e.completed ? 3 : t % 3 + 1;
			return `${Ki[n]} ${Gi[n]} ${r}/3`;
		}
		case "million-threshold": {
			let t = e.totalOrderTarget ?? 30, n = 1e6 - t + Math.min(t, e.totalOrdersCollected);
			return new Intl.NumberFormat("pl-PL").format(n);
		}
	}
}
var Yi = {
	pc: "PC",
	notebook: "notebook",
	lcd: "monitor",
	telefon: "telefon"
}, Xi = {
	intake: "Przyjęcie",
	routing: "Sortowanie",
	dispatch: "Wysyłka",
	completed: "Gotowe"
};
function Zi(e, t = []) {
	let n = new Set(e.completedObjectiveIds), r = (e) => n.has(e) ? "✓ " : "";
	switch (e.activeSegmentId) {
		case "epoch_1.training": return `${r("epoch_1.training")}Cel: skoki ${e.epoch1.training.jumps}/${e.epoch1.training.targetEach} · ślizgi ${e.epoch1.training.slides}/${e.epoch1.training.targetEach}`;
		case "epoch_1.order_backlog": return `${r("epoch_1.order_backlog")}Zator Zamówień · sekwencja ${e.epoch1.orderBacklog.bestAlternation}/${e.epoch1.orderBacklog.target}`;
		case "epoch_2.quality_series": return `${r("epoch_2.quality_series")}SPRAWDZONY · serie ${e.epoch2.completedSeries}/${e.epoch2.seriesTarget} · akcje ${e.epoch2.currentSeries}/${e.epoch2.comboTarget}`;
		case "epoch_2.quality_trial": return "Próba Jakości · urządzenie rusza do kolejnego użytkownika";
		case "epoch_3.matching_creative": return `${r("epoch_3.matching_creative")}Wyzwanie Dopasowania · klientka kreatywna · ${e.epoch3.creative.collected}/${e.epoch3.creative.target}`;
		case "epoch_3.matching_growth": return `${r("epoch_3.matching_growth")}Rozwój Firmy · wyposażenie zespołu · SERIA ×${e.epoch3.growth.bestCombo}/${e.epoch3.growth.target}`;
		case "epoch_3.matching_trust": return `${r("epoch_3.matching_trust")}Wyzwanie Dopasowania · zespół B2B · czysta seria ${e.epoch3.trust.longestClean}/${e.epoch3.trust.target}`;
		case "epoch_4.order_peak": {
			let n = e.epoch4.orders;
			if (n.completed) return `✓ Kolejka gotowa · ${n.requiredCompleted}/${n.requiredTarget} · bonus +${n.bonusCompleted}`;
			let r = t[0];
			return `Kolejka zamówień${r === void 0 ? "" : ` · ${Yi[r]}`} · ${n.requiredCompleted}/${n.requiredTarget}`;
		}
		case "epoch_4.order_peak_final": {
			let t = e.epoch4.flow;
			return t.completed ? "✓ Szczyt Zamówień · 3/3" : `Szczyt Zamówień · ${Xi[t.phase]} · ${t.phasesCompleted}/3`;
		}
		case "epoch_5.million_threshold": {
			let t = e.epoch5.millionThreshold;
			return `${r("epoch_5.million_threshold")}Próg Miliona · ZAMÓWIENIA ${t.ordersCollected}/${t.orderTarget} · KOMBINACJE ${t.combinationsCompleted}/${t.combinationTarget}`;
		}
		default: return null;
	}
}
function Qi(e, t, n) {
	return t <= 0 ? -1 : e < 0 || e >= t ? n ? t - 1 : 0 : (e + (n ? -1 : 1) + t) % t;
}
//#endregion
//#region src/ui/CampaignShell.ts
var $i = "/assets/milion-runner/brand/mz-main-lockup-v1.avif", ea = "/assets/milion-runner/brand/mz-compact-lockup-v1.avif", ta = {
	brandEdition: "Droga do Miliona",
	soundOn: "Wycisz",
	soundOff: "Włącz dźwięk",
	fullscreenEnter: "Pełny ekran",
	fullscreenExit: "Wyjdź z pełnego",
	cssGameModeEnter: "Tryb gry",
	cssGameModeExit: "Wyjdź z trybu gry",
	hudPackages: "Paczki",
	hudScore: "Wynik",
	pauseAction: "Pauza",
	storyMode: "Droga do Miliona",
	challengeMode: "Szybki start — Tryb Wyzwania",
	landingEyebrow: "Jubileuszowa historia AMSO",
	landingTitle: "AMSO —",
	landingTitleAccent: "Droga do Miliona",
	landingLead: "Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.",
	landingMeta: "Około 6 minut · historia w Twoim tempie · skok i ślizg",
	startStory: "Rozpocznij historię",
	choosePath: "Wybierz swoją drogę",
	replayStory: "Pełna historia i instrukcja",
	orientationEyebrow: "Szerszy kadr",
	orientationTitle: "Chcesz zobaczyć więcej historii?",
	orientationBody: "Obróć telefon i włącz pełny ekran. Możesz też grać pionowo.",
	orientationFullscreen: "Włącz pełny ekran",
	orientationFocus: "Włącz tryb gry",
	orientationPortrait: "Zostań w pionie",
	loading: "Przygotowujemy pierwszą paczkę…",
	errorEyebrow: "Trasa chwilowo niedostępna",
	errorTitle: "Nie udało się przygotować gry.",
	errorBody: "Sprawdź połączenie i spróbuj ponownie.",
	retry: "Spróbuj ponownie",
	campaignBack: "Wróć na stronę kampanii",
	pauseEyebrow: "Bezpieczny przystanek",
	pauseTitle: "Gra wstrzymana",
	pauseBody: "Twój postęp jest bezpieczny.",
	resume: "Wznów",
	returnToMenu: "Wróć do menu",
	corridorEyebrow: "Bezpieczny odcinek — historia biegnie dalej",
	corridorResume: "Biegniemy dalej.",
	storyCountdownLabel: "Wracamy do gry",
	storyResultEyebrow: "Dziękujemy za wspólną drogę",
	storyResultTitle: "Twoja Droga do Miliona",
	resultPackages: "Zrealizowane zamówienia",
	resultScore: "Wynik",
	resultCombo: "Najlepsza seria",
	storyResultIntro: "Biegnij do pierwszego niezabezpieczonego zderzenia i ustanów rekord.",
	startChallenge: "Gramy dalej — tryb wyzwania",
	fullStory: "Poznaj pełną historię AMSO",
	challengeResultEyebrow: "Próba Miliona",
	challengeResultTitle: "Koniec próby",
	resultBest: "Rekord",
	resultDistance: "Przebyta droga",
	resultWarranty: "Gwarancja 48 M uratowała bieg",
	powerupWarranty: "GWARANCJA 48 M — uratuje jedną próbę w Trybie Wyzwania.",
	powerupWarrantyHud: "GWARANCJA 48 M ×1",
	warrantyConsumed: "GWARANCJA 48 M zadziałała — próba trwa dalej.",
	controlsHud: "Skok: W/↑/Spacja/tap · Ślizg: S/↓",
	retryChallenge: "Spróbuj jeszcze raz",
	shareResult: "Udostępnij wynik",
	shareLead: "Wybierz, gdzie chcesz udostępnić kartę wyniku.",
	shareScoreLabel: "Mój wynik",
	shareTurn: "Teraz Twoja kolej.",
	sharePublication: "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.",
	sharePreparing: "Przygotowujemy kartę wyniku…",
	shareReady: "Karta wyniku jest gotowa do udostępnienia.",
	shareFacebookReady: "Facebook otwarty. Dołącz pobraną kartę wyniku do posta.",
	shareDownloaded: "Zapisaliśmy kartę. Dodaj ją do relacji lub posta.",
	shareCancelled: "Udostępnianie anulowane.",
	shareFailure: "Nie udało się przygotować karty. Spróbuj ponownie.",
	facebook: "Facebook",
	instagram: "Instagram",
	narrowTitle: "Potrzebujemy trochę więcej miejsca.",
	narrowBody: "Obróć urządzenie, żeby rozpocząć grę.",
	footerTagline: "AMSO. Sprzęt z przeszłością. Na przyszłość.",
	footerCampaign: "Strona kampanii"
}, na = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });
function Z(e) {
	return na.format(Number.isFinite(e) ? Math.max(0, Math.floor(e)) : 0);
}
function ra(e, t, n) {
	if (e === t) return e;
	let r = q(e), i = q(t);
	if (r.worldId !== i.worldId) return e;
	let a = i.worldProgress - r.worldProgress;
	return a <= 0 ? e : (n - r.worldProgress) / a >= .58 ? t : e;
}
function ia(e, t) {
	return e > t ? e < 640 || t < 280 : e < 390;
}
function Q(e, t) {
	let n = e.querySelector(t);
	if (n === null) throw Error(`Campaign shell element not found: ${t}`);
	return n;
}
function aa() {
	if (typeof window > "u") return "/gra/droga-do-miliona";
	let e = document.querySelector("link[rel=\"canonical\"]")?.href;
	if (e?.startsWith("https://") || e?.startsWith("http://")) return e;
	let t = new URL(window.location.href);
	return t.search = "", t.hash = "", t.href;
}
function oa() {
	return typeof window > "u" ? !1 : (window.matchMedia?.("(pointer: coarse)").matches ?? !1) || navigator.maxTouchPoints > 0;
}
function sa() {
	let e = document.createElement("img");
	return e.alt = "", e.decoding = "async", new Promise((t) => {
		let n = !1, r = 0, i = (i) => {
			n || (n = !0, window.clearTimeout(r), e.onload = null, e.onerror = null, t(i));
		};
		r = window.setTimeout(() => i(null), 2500), e.onload = () => i(e.naturalWidth > 0 ? e : null), e.onerror = () => i(null), e.src = ea, e.complete && i(e.naturalWidth > 0 ? e : null);
	});
}
function ca(e, t) {
	if (t !== null) {
		let n = 430 * (t.naturalHeight / t.naturalWidth);
		e.drawImage(t, 596, 43, 430, n);
		return;
	}
	let n = e.createLinearGradient(610, 58, 1e3, 252);
	n.addColorStop(0, "#f47100"), n.addColorStop(.52, "#f04f45"), n.addColorStop(1, "#eb32a4"), e.strokeStyle = n, e.lineWidth = 10, e.beginPath(), e.roundRect(624, 70, 352, 166, 34), e.stroke(), e.fillStyle = "#faf7f0", e.font = "950 49px system-ui, sans-serif", e.textAlign = "center", e.fillText("1 000 000", 800, 172, 300), e.textAlign = "start";
}
function la(e, t, n, r) {
	let { canvas: i } = e;
	e.fillStyle = "#faf7f0", e.fillRect(0, 0, i.width, i.height);
	let a = e.createLinearGradient(0, 0, i.width, 0);
	a.addColorStop(0, "#f47100"), a.addColorStop(.5, "#f04f45"), a.addColorStop(1, "#eb32a4"), e.fillStyle = a, e.fillRect(0, 0, i.width, 22), e.fillStyle = "#171717", e.fillRect(0, 22, i.width, 296), e.fillStyle = "#faf7f0", e.font = "800 26px system-ui, sans-serif", e.fillText("KARTA WYNIKU", 72, 99), e.font = "950 58px system-ui, sans-serif", e.fillText(n.title ?? "Droga do Miliona", 72, 170, 470), e.fillStyle = "#d8d2c8", e.font = "650 24px system-ui, sans-serif", e.fillText("Jubileuszowa gra", 72, 222), ca(e, r), e.fillStyle = "#45413b", e.font = "750 29px system-ui, sans-serif", e.fillText(n.scoreLabel ?? "MÓJ WYNIK", 72, 407), e.fillStyle = "#171717", e.font = "950 142px system-ui, sans-serif", e.fillText(Z(t.score), 66, 548, 940), e.fillStyle = a, e.fillRect(72, 581, 936, 12), e.fillStyle = "#171717", e.beginPath(), e.roundRect(72, 632, 936, 216, 38), e.fill(), e.fillStyle = "#d8d2c8", e.font = "800 28px system-ui, sans-serif", e.fillText(n.ordersLabel ?? "ZREALIZOWANE ZAMÓWIENIA", 120, 705), e.fillStyle = "#faf7f0", e.font = "950 78px system-ui, sans-serif", e.fillText(Z(t.orders), 120, 797, 560), e.fillStyle = a, e.beginPath(), e.roundRect(788, 669, 172, 142, 28), e.fill(), e.fillStyle = "#171717", e.font = "950 50px system-ui, sans-serif", e.textAlign = "center", e.fillText("×", 874, 754), e.textAlign = "start", e.fillStyle = "#171717", e.font = "900 50px system-ui, sans-serif", e.fillText(n.callToAction ?? "Teraz Twoja kolej.", 72, 978, 936), e.fillStyle = "#45413b", e.font = "650 27px system-ui, sans-serif";
	let o = n.publicationText ?? "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.";
	e.fillText(o, 72, 1034, 936), e.fillStyle = "#171717", e.beginPath(), e.roundRect(72, 1128, 936, 138, 30), e.fill(), e.fillStyle = a, e.fillRect(72, 1128, 18, 138), e.fillStyle = "#faf7f0", e.font = "600 20px system-ui, sans-serif", e.fillText(n.canonicalUrl, 124, 1208, 830);
}
function ua(e) {
	let t = e.toDataURL("image/png"), n = t.indexOf(",");
	if (n < 0) throw Error("share_card_generation_failed");
	let r = atob(t.slice(n + 1)), i = new Uint8Array(r.length);
	for (let e = 0; e < r.length; e += 1) i[e] = r.charCodeAt(e);
	return new Blob([i], { type: "image/png" });
}
async function da(e, t) {
	let n = document.createElement("canvas");
	n.width = 1080, n.height = 1350;
	let r = n.getContext("2d");
	if (r === null) throw Error("share_card_canvas_unavailable");
	return la(r, e, t, await sa()), ua(n);
}
function fa(e, t) {
	let n = URL.createObjectURL(e), r = document.createElement("a");
	r.href = n, r.download = t, r.rel = "noopener", document.body.append(r), r.click(), r.remove(), window.setTimeout(() => URL.revokeObjectURL(n), 1e3);
}
async function pa(e) {
	let t = e.publicationText ?? "Sprawdź, jak daleko dojdziesz w Drodze do Miliona.", n = await da(e.result, e), r = `amso-droga-do-miliona-${Math.floor(e.result.score)}.png`, i = typeof File == "function" ? new File([n], r, { type: "image/png" }) : null, a = {
		title: e.title ?? "AMSO — Droga do Miliona",
		text: t,
		url: e.canonicalUrl,
		...i === null ? {} : { files: [i] }
	};
	if (i !== null && typeof navigator.share == "function" && (typeof navigator.canShare != "function" || navigator.canShare(a))) try {
		return await navigator.share(a), "web_share";
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
	}
	if (e.platform === "facebook") {
		let t = new URL("https://www.facebook.com/sharer/sharer.php");
		t.searchParams.set("u", e.canonicalUrl);
		let i = window.open(t.href, "amso-facebook-share", "popup,width=680,height=620");
		if (i !== null) return i.opener = null, fa(n, r), "facebook_url";
	}
	return fa(n, r), "download";
}
var ma = class {
	constructor(e, t, n = {}) {
		i(this, "callbacks", void 0), i(this, "canvas", void 0), i(this, "root", void 0), i(this, "stage", void 0), i(this, "worldVisualLayer", void 0), i(this, "landingScreen", void 0), i(this, "landingActions", void 0), i(this, "orientationScreen", void 0), i(this, "loadingScreen", void 0), i(this, "loadingText", void 0), i(this, "loadingProgress", void 0), i(this, "errorScreen", void 0), i(this, "errorText", void 0), i(this, "pauseScreen", void 0), i(this, "storyResultScreen", void 0), i(this, "challengeResultScreen", void 0), i(this, "storyPresentation", void 0), i(this, "storySceneCard", void 0), i(this, "storySceneEyebrow", void 0), i(this, "storySceneTitle", void 0), i(this, "storySceneBody", void 0), i(this, "storyVisualDescription", void 0), i(this, "storyContinueButton", void 0), i(this, "storyCountdown", void 0), i(this, "storyCountdownLabel", void 0), i(this, "storyCountdownValue", void 0), i(this, "presentationBackground", void 0), i(this, "hud", void 0), i(this, "milestoneMessage", void 0), i(this, "hudMode", void 0), i(this, "hudEpoch", void 0), i(this, "hudObjective", void 0), i(this, "hudControls", void 0), i(this, "hudPowerUps", void 0), i(this, "hudNotice", void 0), i(this, "pickupNoticeVersion", 0), i(this, "hudPackages", void 0), i(this, "hudScore", void 0), i(this, "hudCombo", void 0), i(this, "muteButton", void 0), i(this, "fullscreenButton", void 0), i(this, "liveRegion", void 0), i(this, "sharePanel", void 0), i(this, "shareStatus", void 0), i(this, "tooNarrow", void 0), i(this, "canonicalUrl", void 0), i(this, "campaignUrl", void 0), i(this, "fullStoryUrl", void 0), i(this, "copy", void 0), i(this, "activeMode", null), i(this, "pendingStart", null), i(this, "fullscreenPromptSeen", !1), i(this, "fullscreenPreference", null), i(this, "muted", !1), i(this, "lastWaveFeedbackKey", ""), i(this, "paused", !1), i(this, "trustCorridor", !1), i(this, "tooNarrowActive", !1), i(this, "activeModalScreen", null), i(this, "destroyed", !1), i(this, "pointerStartY", null), i(this, "pointerSwipedDown", !1), i(this, "challengeResult", null), i(this, "lastCountdownValue", null), i(this, "storyContinuationGate", new Vi()), i(this, "orientationQuery", void 0), i(this, "handleClick", (e) => {
			let t = e.target instanceof Element ? e.target.closest("button, a") : null;
			if (t !== null) {
				if (t.matches("[data-campaign-story-continue]")) this.tryContinueStory();
				else if (t.matches("[data-campaign-mute]")) this.setMuted(!this.muted);
				else if (t.matches("[data-campaign-fullscreen]")) this.toggleFullscreen();
				else if (t.matches("[data-campaign-enter-fullscreen]")) this.enterFullscreen().finally(() => this.dispatchPendingStart(zi(document.fullscreenElement, this.root)));
				else if (t.matches("[data-campaign-stay-portrait]")) this.dispatchPendingStart("portrait");
				else if (t.matches("[data-campaign-pause]")) this.callbacks.onPause("user");
				else if (t.matches("[data-campaign-resume]")) this.callbacks.onResume();
				else if (t.matches("[data-campaign-menu]")) this.callbacks.onReturnToMenu();
				else if (t.matches("[data-campaign-retry]")) this.callbacks.onRetryLoad();
				else if (t.matches("[data-campaign-start-challenge]")) this.callbacks.onStart({
					mode: "challenge",
					restartStory: !1
				});
				else if (t.matches("[data-campaign-restart-challenge]")) this.callbacks.onRestart("challenge");
				else if (t.matches("[data-campaign-restart-story]")) this.callbacks.onRestart("story");
				else if (t.matches("[data-campaign-toggle-share]")) this.sharePanel.hidden = !this.sharePanel.hidden, this.sharePanel.hidden || Q(this.sharePanel, "[data-campaign-share]").focus({ preventScroll: !0 });
				else if (t.matches("[data-campaign-share]")) {
					let e = t.dataset.campaignShare;
					(e === "facebook" || e === "instagram") && this.handleShare(e);
				}
			}
		}), i(this, "handlePointerDown", (e) => {
			!this.canControl() || !e.isPrimary || e.button > 0 || (e.preventDefault(), this.canvas.focus({ preventScroll: !0 }), e.pointerType === "touch" ? (this.pointerStartY = e.clientY, this.pointerSwipedDown = !1) : this.callbacks.onJump("pointer"));
		}), i(this, "handlePointerMove", (e) => {
			this.pointerStartY === null || this.pointerSwipedDown || e.clientY - this.pointerStartY > 24 && (this.pointerSwipedDown = !0, this.callbacks.onSlide(!0, "touch"));
		}), i(this, "handlePointerUp", () => {
			this.pointerStartY !== null && (this.pointerSwipedDown ? this.callbacks.onSlide(!1, "touch") : this.canControl() && this.callbacks.onJump("touch"), this.pointerStartY = null, this.pointerSwipedDown = !1);
		}), i(this, "handlePointerCancel", () => {
			this.pointerSwipedDown && this.callbacks.onSlide(!1, "touch"), this.pointerStartY = null, this.pointerSwipedDown = !1;
		}), i(this, "handleKeydown", (e) => {
			let t = this.activeKeyboardDialog();
			if (t !== null && e.key === "Tab") {
				let n = [...t.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex=\"-1\"])")], r = n[Qi(n.indexOf(document.activeElement), n.length, e.shiftKey)];
				r !== void 0 && (e.preventDefault(), r.focus({ preventScroll: !0 }));
				return;
			}
			if (!this.storyPresentation.hidden && this.storySceneCard.hidden && e.key === "Tab") {
				e.preventDefault(), (this.storyCountdown.hidden ? this.storyPresentation : this.storyCountdown).focus({ preventScroll: !0 });
				return;
			}
			if (!this.storyPresentation.hidden && !this.storySceneCard.hidden && e.key === "Tab") {
				let t = [this.storySceneBody, this.storyContinueButton].filter((e) => !(e instanceof HTMLButtonElement && e.disabled)), n = t[Qi(t.indexOf(document.activeElement), t.length, e.shiftKey)];
				n !== void 0 && (e.preventDefault(), n.focus({ preventScroll: !0 }));
				return;
			}
			if (!this.storyPresentation.hidden && !this.storySceneCard.hidden && (e.code === "Space" || e.key === " " || e.code === "Enter" || e.key === "Enter")) {
				e.preventDefault(), e.repeat || this.tryContinueStory();
				return;
			}
			if (!this.canControl() || e.repeat || e.target instanceof Element && e.target.closest("button, a, input") !== null) return;
			let n = e.code === "Space" || e.key === " " || e.code === "ArrowUp" || e.code === "KeyW", r = e.code === "ArrowDown" || e.code === "KeyS";
			n ? (e.preventDefault(), this.callbacks.onJump("keyboard")) : r && (e.preventDefault(), this.callbacks.onSlide(!0, "keyboard"));
		}), i(this, "handleKeyup", (e) => {
			this.activeMode !== null && (e.code === "ArrowDown" || e.code === "KeyS") && this.callbacks.onSlide(!1, "keyboard");
		}), i(this, "handleVisibilityChange", () => {
			document.hidden && this.canControl() && (this.paused = !0, this.callbacks.onPause("visibility"));
		}), i(this, "handleFullscreenChange", () => {
			document.fullscreenElement === this.root && this.setCssGameMode(!1), this.updateFullscreenControl(), this.rememberFullscreenPreference(zi(document.fullscreenElement, this.root)), this.canControl() && (this.paused = !0, this.callbacks.onPause("layout_change"));
		}), i(this, "handleOrientationChange", () => {
			this.canControl() && (this.paused = !0, this.callbacks.onPause("layout_change"));
		}), i(this, "handleResize", () => {
			this.applyMilestoneLayout(), this.updateNarrowState();
		}), this.callbacks = t, this.canonicalUrl = n.canonicalUrl ?? aa(), this.campaignUrl = n.campaignUrl ?? "/milion", this.fullStoryUrl = n.fullStoryUrl ?? this.campaignUrl, this.copy = {
			...ta,
			...n.copy
		}, this.root = document.createElement("div"), this.root.className = "amso-campaign", this.root.dataset.view = "landing", this.root.innerHTML = `
      <div class="amso-campaign__backdrop" aria-hidden="true"></div>
      <header class="amso-campaign__header">
        <a class="amso-campaign__brand" data-campaign-link>
          <img class="amso-campaign__brand-logo" src="${Mi}" alt="AMSO" />
          <span class="amso-campaign__brand-edition" data-campaign-copy="brandEdition">Droga do Miliona</span>
        </a>
        <div class="amso-campaign__tools">
          <button class="amso-campaign__icon-button" type="button" data-campaign-mute aria-pressed="false">
            <span aria-hidden="true" data-campaign-mute-icon>♪</span>
            <span class="amso-campaign__tool-label" data-campaign-mute-label data-campaign-copy="soundOn">Wycisz</span>
          </button>
          <button class="amso-campaign__icon-button" type="button" data-campaign-fullscreen aria-pressed="false">
            <span aria-hidden="true">⛶</span>
            <span class="amso-campaign__tool-label" data-campaign-copy="fullscreenEnter">Pełny ekran</span>
          </button>
        </div>
      </header>

      <main class="amso-campaign__main">
        <section class="amso-campaign__stage" data-campaign-stage>
          <div class="amso-campaign__world-visual" data-campaign-world-visual aria-hidden="true"></div>
          <canvas
            class="amso-campaign__canvas"
            data-campaign-canvas
            width="960"
            height="540"
            tabindex="-1"
            aria-hidden="true"
            aria-label="Pole gry. W lub strzałka w górę oraz Spacja lub tapnięcie wykonują skok. S lub strzałka w dół oraz przesunięcie w dół wykonują ślizg."
          ></canvas>
          <div class="amso-campaign__milestone-message" data-campaign-milestone-message hidden aria-hidden="true"></div>
          <section class="amso-campaign__hud" data-campaign-hud hidden aria-label="Wynik biegu">
            <div class="amso-campaign__hud-context">
              <strong data-campaign-hud-mode></strong>
              <span data-campaign-hud-epoch></span>
              <span data-campaign-hud-objective hidden></span>
              <span data-campaign-hud-controls hidden></span>
              <span data-campaign-hud-powerups hidden></span>
              <span class="amso-campaign__hud-notice" data-campaign-hud-notice hidden role="status"></span>
            </div>
            <div class="amso-campaign__hud-stats">
              <span><small data-campaign-copy="hudPackages">Paczki</small> <strong data-campaign-hud-packages>0</strong></span>
              <span><small data-campaign-copy="hudScore">Wynik</small> <strong data-campaign-hud-score>0</strong></span>
              <span><small>SERIA</small> <strong data-campaign-hud-combo>×1</strong></span>
            </div>
            <button class="amso-campaign__pause-button" type="button" data-campaign-pause data-campaign-copy="pauseAction">Pauza</button>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--landing" data-campaign-landing>
            <div class="amso-campaign__landing-copy">
              <p class="amso-campaign__eyebrow" data-campaign-copy="landingEyebrow">Jubileuszowa historia AMSO</p>
              <h1><span data-campaign-copy="landingTitleAccent">Droga do Miliona</span></h1>
              <p class="amso-campaign__lead" data-campaign-copy="landingLead">Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.</p>
              <p class="amso-campaign__meta" data-campaign-copy="landingMeta">Około 6 minut · historia w Twoim tempie · skok i ślizg</p>
              <details class="amso-campaign__how-to">
                <summary>Jak działa gra?</summary>
                <div>
                  <p><strong>Historia i bieg przeplatają się.</strong> Gdy pojawia się karta historii, trasa jest bezpieczna i niczego nie musisz omijać ani zbierać.</p>
                  <p><strong>Skacz</strong> dotykiem lub Spacją. <strong>Ślizg</strong> wykonaj gestem w dół albo klawiszem ↓.</p>
                  <p><strong>Urządzenia i paczki realizują zamówienia.</strong> Bonus zawsze pokazuje swoje działanie, a kolejne czyste akcje budują <strong>SERIĘ ×N</strong>.</p>
                </div>
              </details>
              <div class="amso-campaign__landing-actions" data-campaign-landing-actions></div>
            </div>
            <div class="amso-campaign__landing-art" aria-hidden="true">
              <img class="amso-campaign__main-lockup" src="${$i}" alt="" width="1600" height="1460" />
            </div>
          </section>

          <section
            class="amso-campaign__screen amso-campaign__screen--dialog"
            data-campaign-orientation
            role="dialog"
            aria-modal="true"
            aria-labelledby="amso-campaign-orientation-title"
            hidden
          >
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="orientationEyebrow">Szerszy kadr</p>
              <h2 id="amso-campaign-orientation-title" data-campaign-copy="orientationTitle">Chcesz zobaczyć więcej historii?</h2>
              <p data-campaign-copy="orientationBody">Obróć telefon i włącz pełny ekran. Możesz też grać pionowo.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-enter-fullscreen data-campaign-copy="orientationFullscreen">Włącz pełny ekran</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-stay-portrait data-campaign-copy="orientationPortrait">Zostań w pionie</button>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-loading hidden>
            <div class="amso-campaign__card amso-campaign__card--loading">
              <img class="amso-campaign__compact-lockup" src="${ea}" alt="" width="1600" height="924" />
              <span class="amso-campaign__loading-package" aria-hidden="true"></span>
              <h2 data-campaign-loading-text data-campaign-copy="loading">Przygotowujemy pierwszą paczkę…</h2>
              <progress data-campaign-loading-progress max="1"></progress>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--dialog" data-campaign-error hidden>
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="errorEyebrow">Trasa chwilowo niedostępna</p>
              <h2 data-campaign-copy="errorTitle">Nie udało się przygotować gry.</h2>
              <p data-campaign-error-text data-campaign-copy="errorBody">Sprawdź połączenie i spróbuj ponownie.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-retry data-campaign-copy="retry">Spróbuj ponownie</button>
                <a class="amso-campaign__button amso-campaign__button--secondary" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
            </div>
          </section>

          <section
            class="amso-campaign__screen amso-campaign__screen--dialog"
            data-campaign-pause-screen
            role="dialog"
            aria-modal="true"
            aria-labelledby="amso-campaign-pause-title"
            hidden
          >
            <div class="amso-campaign__card">
              <p class="amso-campaign__eyebrow" data-campaign-copy="pauseEyebrow">Bezpieczny przystanek</p>
              <h2 id="amso-campaign-pause-title" data-campaign-copy="pauseTitle">Gra wstrzymana</h2>
              <p data-campaign-copy="pauseBody">Twój postęp jest bezpieczny.</p>
              <div class="amso-campaign__pause-bonuses" aria-label="Bonusy">
                <strong>Bonusy</strong>
                <span><b>×2 WYNIK</b> — przez 7 s podwaja punkty za zamówienia.</span>
                <span data-campaign-copy="powerupWarranty">GWARANCJA 48 M — uratuje jedną próbę w Trybie Wyzwania.</span>
              </div>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-resume data-campaign-copy="resume">Wznów</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-menu data-campaign-copy="returnToMenu">Wróć do menu</button>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--result" data-campaign-story-result hidden>
            <div class="amso-campaign__result-card">
              <img class="amso-campaign__result-lockup amso-campaign__result-lockup--main" src="${$i}" alt="" width="1600" height="1460" />
              <p class="amso-campaign__eyebrow" data-campaign-copy="storyResultEyebrow">Dziękujemy za wspólną drogę</p>
              <h2 data-campaign-copy="storyResultTitle">Twoja Droga do Miliona</h2>
              <div class="amso-campaign__result-grid">
                <span><small data-campaign-copy="resultPackages">Zrealizowane zamówienia</small> <strong data-campaign-story-packages>0</strong></span>
                <span><small data-campaign-copy="resultScore">Wynik</small> <strong data-campaign-story-score>0</strong></span>
                <span><small data-campaign-copy="resultCombo">Najlepsza seria</small> <strong data-campaign-story-combo>×1</strong></span>
              </div>
              <p class="amso-campaign__result-intro" data-campaign-copy="storyResultIntro">Biegnij do pierwszego niezabezpieczonego zderzenia i ustanów rekord.</p>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-start-challenge data-campaign-copy="startChallenge">Gramy dalej — tryb wyzwania</button>
                <a class="amso-campaign__button amso-campaign__button--secondary" data-campaign-full-story data-campaign-copy="fullStory">Poznaj pełną historię AMSO</a>
                <a class="amso-campaign__text-link" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
            </div>
          </section>

          <section class="amso-campaign__screen amso-campaign__screen--result" data-campaign-challenge-result hidden>
            <div class="amso-campaign__result-card">
              <img class="amso-campaign__result-lockup" src="${ea}" alt="" width="1600" height="924" />
              <p class="amso-campaign__eyebrow" data-campaign-copy="challengeResultEyebrow">Próba Miliona</p>
              <h2 data-campaign-copy="challengeResultTitle">Koniec próby</h2>
              <div class="amso-campaign__result-grid amso-campaign__result-grid--challenge">
                <span><small data-campaign-copy="resultPackages">Zrealizowane zamówienia</small> <strong data-campaign-challenge-packages>0</strong></span>
                <span><small>Wynik łączny</small> <strong data-campaign-challenge-total>0</strong></span>
                <span><small>Wynik wyzwania</small> <strong data-campaign-challenge-score>0</strong></span>
                <span><small data-campaign-challenge-best-label>Twój rekord wyzwania</small> <strong data-campaign-challenge-best>0</strong></span>
                <span><small data-campaign-copy="resultDistance">Przebyta droga</small> <strong><i data-campaign-challenge-distance>0</i> m</strong></span>
                <span data-campaign-challenge-saves-stat><small data-campaign-copy="resultWarranty">Gwarancja 48 M uratowała bieg</small> <strong data-campaign-challenge-saves>0</strong></span>
              </div>
              <div class="amso-campaign__actions">
                <button class="amso-campaign__button amso-campaign__button--primary" type="button" data-campaign-restart-challenge data-campaign-copy="retryChallenge">Spróbuj jeszcze raz</button>
                <button class="amso-campaign__button amso-campaign__button--secondary" type="button" data-campaign-toggle-share data-campaign-copy="shareResult">Udostępnij wynik</button>
                <button class="amso-campaign__text-link" type="button" data-campaign-restart-story data-campaign-copy="replayStory">Przejdź historię ponownie</button>
                <a class="amso-campaign__text-link" data-campaign-link data-campaign-copy="campaignBack">Wróć na stronę kampanii</a>
              </div>
              <div class="amso-campaign__share-panel" data-campaign-share-panel hidden>
                <img class="amso-campaign__share-lockup" src="${ea}" alt="" width="1600" height="924" />
                <p><strong data-campaign-copy="shareTurn">Teraz Twoja kolej.</strong> <span data-campaign-copy="shareLead">Wybierz, gdzie chcesz udostępnić kartę wyniku.</span></p>
                <div class="amso-campaign__share-actions">
                  <button type="button" data-campaign-share="facebook" data-campaign-copy="facebook">Facebook</button>
                  <button type="button" data-campaign-share="instagram" data-campaign-copy="instagram">Instagram</button>
                </div>
                <p class="amso-campaign__share-status" data-campaign-share-status role="status"></p>
              </div>
            </div>
          </section>

          <section class="amso-campaign__story-presentation" data-campaign-story-presentation hidden>
            <div class="amso-campaign__story-scrim" aria-hidden="true"></div>

            <article
              class="amso-campaign__story-scene-card"
              data-campaign-story-scene
              role="dialog"
              aria-modal="true"
              aria-labelledby="amso-campaign-story-scene-title"
              aria-describedby="amso-campaign-story-scene-body amso-campaign-story-visual-description"
            >
              <img class="amso-campaign__story-final-lockup" src="${$i}" alt="" width="1600" height="1460" />
              <p class="amso-campaign__story-scene-eyebrow" data-campaign-story-scene-eyebrow hidden></p>
              <h2 id="amso-campaign-story-scene-title" data-campaign-story-scene-title></h2>
              <div id="amso-campaign-story-scene-body" class="amso-campaign__story-scene-body" data-campaign-story-scene-body tabindex="0"></div>
              <p id="amso-campaign-story-visual-description" class="amso-campaign__sr-only" data-campaign-story-visual-description></p>
              <button
                class="amso-campaign__button amso-campaign__button--primary amso-campaign__story-continue"
                type="button"
                data-campaign-story-continue
              >Dalej</button>
            </article>

            <div class="amso-campaign__story-countdown" data-campaign-story-countdown hidden tabindex="-1" role="status" aria-live="assertive" aria-atomic="true">
              <p data-campaign-story-countdown-label>Wracamy do gry</p>
              <strong data-campaign-story-countdown-value>3</strong>
            </div>
          </section>

          <section class="amso-campaign__too-narrow" data-campaign-too-narrow hidden>
            <strong data-campaign-copy="narrowTitle">Potrzebujemy trochę więcej miejsca.</strong>
            <span data-campaign-copy="narrowBody">Obróć urządzenie, żeby rozpocząć grę.</span>
          </section>
        </section>
      </main>

      <footer class="amso-campaign__footer">
        <span data-campaign-copy="footerTagline">AMSO. Sprzęt z przeszłością. Na przyszłość.</span>
        <a data-campaign-link data-campaign-copy="footerCampaign">Strona kampanii</a>
      </footer>

      <div class="amso-campaign__sr-only" data-campaign-live aria-live="polite" aria-atomic="true"></div>
    `, e.replaceChildren(this.root), this.stage = Q(this.root, "[data-campaign-stage]"), this.worldVisualLayer = new Ii(Q(this.root, "[data-campaign-world-visual]")), this.canvas = Q(this.root, "[data-campaign-canvas]"), this.landingScreen = Q(this.root, "[data-campaign-landing]"), this.landingActions = Q(this.root, "[data-campaign-landing-actions]"), this.orientationScreen = Q(this.root, "[data-campaign-orientation]"), this.loadingScreen = Q(this.root, "[data-campaign-loading]"), this.loadingText = Q(this.root, "[data-campaign-loading-text]"), this.loadingProgress = Q(this.root, "[data-campaign-loading-progress]"), this.errorScreen = Q(this.root, "[data-campaign-error]"), this.errorText = Q(this.root, "[data-campaign-error-text]"), this.pauseScreen = Q(this.root, "[data-campaign-pause-screen]"), this.storyResultScreen = Q(this.root, "[data-campaign-story-result]"), this.challengeResultScreen = Q(this.root, "[data-campaign-challenge-result]"), this.storyPresentation = Q(this.root, "[data-campaign-story-presentation]"), this.storySceneCard = Q(this.root, "[data-campaign-story-scene]"), this.storySceneEyebrow = Q(this.root, "[data-campaign-story-scene-eyebrow]"), this.storySceneTitle = Q(this.root, "[data-campaign-story-scene-title]"), this.storySceneBody = Q(this.root, "[data-campaign-story-scene-body]"), this.storyVisualDescription = Q(this.root, "[data-campaign-story-visual-description]"), this.storyContinueButton = Q(this.root, "[data-campaign-story-continue]"), this.storyCountdown = Q(this.root, "[data-campaign-story-countdown]"), this.storyCountdownLabel = Q(this.root, "[data-campaign-story-countdown-label]"), this.storyCountdownValue = Q(this.root, "[data-campaign-story-countdown-value]"), this.hud = Q(this.root, "[data-campaign-hud]"), this.milestoneMessage = Q(this.root, "[data-campaign-milestone-message]"), this.hudMode = Q(this.root, "[data-campaign-hud-mode]"), this.hudEpoch = Q(this.root, "[data-campaign-hud-epoch]"), this.hudObjective = Q(this.root, "[data-campaign-hud-objective]"), this.hudControls = Q(this.root, "[data-campaign-hud-controls]"), this.hudPowerUps = Q(this.root, "[data-campaign-hud-powerups]"), this.hudNotice = Q(this.root, "[data-campaign-hud-notice]"), this.hudPackages = Q(this.root, "[data-campaign-hud-packages]"), this.hudScore = Q(this.root, "[data-campaign-hud-score]"), this.hudCombo = Q(this.root, "[data-campaign-hud-combo]"), this.muteButton = Q(this.root, "[data-campaign-mute]"), this.fullscreenButton = Q(this.root, "[data-campaign-fullscreen]"), this.liveRegion = Q(this.root, "[data-campaign-live]"), this.sharePanel = Q(this.root, "[data-campaign-share-panel]"), this.shareStatus = Q(this.root, "[data-campaign-share-status]"), this.tooNarrow = Q(this.root, "[data-campaign-too-narrow]"), this.presentationBackground = [Q(this.root, ".amso-campaign__header"), Q(this.root, ".amso-campaign__footer")], this.orientationQuery = window.matchMedia?.("(orientation: landscape)") ?? null, this.applyCopy(), this.updateFullscreenControl(), this.root.querySelectorAll("[data-campaign-link]").forEach((e) => {
			e.href = this.campaignUrl;
		}), this.root.querySelectorAll("[data-campaign-full-story]").forEach((e) => {
			e.href = this.fullStoryUrl;
		}), this.installListeners(), this.applyMilestoneLayout(), this.updateNarrowState();
	}
	showLanding(e) {
		this.destroyed || (this.activeMode = null, this.challengeResult = null, this.fullscreenPreference = e.fullscreenPreference, this.fullscreenPromptSeen = e.fullscreenPreference !== null, this.setMuted(e.muted, !1), this.applyWorldVisual("first-mile", "story.first_package", "landing"), this.setView("landing", this.landingScreen), this.renderLandingActions(e), this.canvas.tabIndex = -1, this.landingActions.querySelector("button")?.focus({ preventScroll: !0 }), this.announce("Gra gotowa. Wybierz swoją drogę."));
	}
	showLoading(e, t) {
		if (this.destroyed) return;
		let n = t ?? this.copy.loading;
		this.applyWorldVisual("first-mile", "story.first_package", "landing"), this.loadingText.textContent = n, typeof e == "number" && Number.isFinite(e) ? (this.loadingProgress.value = Math.min(1, Math.max(0, e)), this.loadingProgress.removeAttribute("data-indeterminate")) : (this.loadingProgress.removeAttribute("value"), this.loadingProgress.dataset.indeterminate = "true"), this.setView("loading", this.loadingScreen), this.announce(n);
	}
	showError(e) {
		if (this.destroyed) return;
		let t = e ?? this.copy.errorBody;
		this.errorText.textContent = t, this.setView("error", this.errorScreen), Q(this.errorScreen, "[data-campaign-retry]").focus({ preventScroll: !0 }), this.announce(`${this.copy.errorTitle} ${t}`);
	}
	showGame(e) {
		this.destroyed || (this.root.dataset.view === "story_scene" && this.callbacks.onSlide(!1, "keyboard"), this.hideStoryPresentation(), this.activeMode = e, this.lastWaveFeedbackKey = "", this.paused = !1, this.challengeResult = null, this.hideScreens(), this.root.dataset.view = "game", this.root.dataset.mode = e, this.hud.hidden = !1, this.hudMode.textContent = e === "story" ? this.copy.storyMode : this.copy.challengeMode, this.hudEpoch.hidden = e === "challenge", e === "challenge" && this.showStoryObjective(null), this.canvas.tabIndex = 0, this.canvas.setAttribute("aria-hidden", "false"), this.canvas.focus({ preventScroll: !0 }), this.announce(e === "story" ? this.copy.storyMode : this.copy.challengeMode));
	}
	showStoryScene(e) {
		if (this.destroyed) return;
		let t = Bi(e), n = this.root.dataset.view === "game", r = this.storyContinuationGate.arm(t.presentationId);
		n && this.callbacks.onSlide(!1, "keyboard"), this.activeMode = "story", this.root.dataset.mode = "story", this.root.dataset.view = "story_scene";
		let i = q(t.visualStateId);
		this.applyWorldVisual(i.worldId, i.stateId, "story"), this.storyPresentation.dataset.state = "scene", this.storyPresentation.dataset.copyPlacement = i.copyPlacement, this.storyPresentation.hidden = !1, this.storySceneCard.hidden = !1, this.storyCountdown.hidden = !0, this.hud.hidden = !0, this.canvas.tabIndex = -1, this.canvas.setAttribute("aria-hidden", "true"), this.setScreenModal(this.storyPresentation), r && (this.lastCountdownValue = null, this.storySceneCard.dataset.sceneId = t.sceneId, this.storySceneEyebrow.textContent = t.eyebrow ?? "", this.storySceneEyebrow.hidden = this.storySceneEyebrow.textContent.length === 0, this.storySceneTitle.textContent = t.title, this.storySceneBody.replaceChildren(...t.body.map((e) => {
			let t = document.createElement("p");
			return t.textContent = e, t;
		})), this.storySceneBody.scrollTop = 0, this.storyVisualDescription.textContent = [t.action, t.finalFrame].filter(Boolean).join(" "), this.storyContinueButton.textContent = t.continueLabel, this.storyContinueButton.dataset.sceneId = t.sceneId, this.storyContinueButton.dataset.presentationId = t.presentationId, this.storyContinueButton.disabled = !1, this.storySceneBody.focus({ preventScroll: !0 }), this.announce([
			t.eyebrow,
			t.title,
			...t.body,
			t.action,
			t.finalFrame
		].filter(Boolean).join(". ")));
	}
	showStoryReframe() {
		this.destroyed || (this.worldVisualLayer.setPhase("game"), this.root.dataset.view = "story_reframe", this.storyPresentation.dataset.state = "reframe", this.storyPresentation.hidden = !1, this.storySceneCard.hidden = !0, this.storyCountdown.hidden = !0, this.hud.hidden = !0, this.canvas.tabIndex = -1, this.canvas.setAttribute("aria-hidden", "true"), this.storyContinueButton.disabled = !0, delete this.storyContinueButton.dataset.sceneId, delete this.storyContinueButton.dataset.presentationId, this.storyContinuationGate.clear(), this.setScreenModal(this.storyPresentation), this.storyPresentation.tabIndex = -1, this.storyPresentation.focus({ preventScroll: !0 }), this.announce(this.copy.storyCountdownLabel));
	}
	showStoryCountdown(e, t = this.copy.storyCountdownLabel) {
		this.destroyed || (this.worldVisualLayer.setPhase("game"), this.root.dataset.view = "story_countdown", this.storyPresentation.dataset.state = "countdown", this.storyPresentation.hidden = !1, this.storySceneCard.hidden = !0, this.storyCountdown.hidden = !1, this.hud.hidden = !0, this.canvas.tabIndex = -1, this.canvas.setAttribute("aria-hidden", "true"), this.storyContinueButton.disabled = !0, delete this.storyContinueButton.dataset.sceneId, delete this.storyContinueButton.dataset.presentationId, this.storyContinuationGate.clear(), this.setScreenModal(this.storyPresentation), this.storyCountdownLabel.textContent = t, this.storyCountdownValue.textContent = String(e), this.storyCountdownValue.dataset.value = String(e), e !== this.lastCountdownValue && (this.lastCountdownValue = e, this.storyCountdown.focus({ preventScroll: !0 })));
	}
	returnToGame() {
		this.destroyed || this.activeMode === null || (this.hideStoryPresentation(), this.hideScreens(), this.root.dataset.view = "game", this.root.removeAttribute("data-trust-corridor"), this.trustCorridor = !1, this.hud.removeAttribute("data-muted"), this.hud.hidden = !1, this.hudEpoch.hidden = this.activeMode === "challenge", this.canvas.tabIndex = 0, this.canvas.setAttribute("aria-hidden", "false"), this.canvas.focus({ preventScroll: !0 }), this.announce(this.copy.corridorResume));
	}
	setPaused(e) {
		this.destroyed || this.activeMode === null || (this.paused = e, this.pauseScreen.hidden = !e, this.root.toggleAttribute("data-paused", e), this.canvas.tabIndex = e ? -1 : 0, e ? (this.setScreenModal(this.pauseScreen), Q(this.pauseScreen, "[data-campaign-resume]").focus({ preventScroll: !0 }), this.announce(`${this.copy.pauseTitle}. ${this.copy.pauseBody}`)) : (this.setScreenModal(null), this.canvas.focus({ preventScroll: !0 }), this.announce(this.copy.corridorResume)));
	}
	update(e) {
		if (this.destroyed) return;
		let t = ra(e.visualStateId, e.visualNextStateId, e.visualProgress);
		this.applyWorldVisual(e.visualWorldId, t, this.root.dataset.view === "story_scene" ? "story" : "game", this.activeMode === "challenge" ? "offscreen" : "story-linked"), this.worldVisualLayer.setCounterValue(e.millionCounterValue), this.worldVisualLayer.setParallaxDistance(e.backgroundTravelPixels ?? 0, this.root.dataset.view === "game" && !this.paused, e.reducedMotion === !0), this.showMilestoneCelebration(e.milestoneCelebration ?? null, e.reducedMotion === !0);
		let n = e.authoredWave?.lastResult;
		if (n) {
			let t = `${e.authoredWave?.microlevelId}:${n.waveId}:${n.attempts}:${n.passed}:${e.authoredWave?.wavesCompleted}`;
			t !== this.lastWaveFeedbackKey && (this.lastWaveFeedbackKey = t, this.showPickupNotice(n.perfect ? "PERFEKCJA · bonus za pełną trasę" : n.passed ? "FALA ZALICZONA" : "POWTÓRZ FALĘ"));
		}
		this.hudPackages.textContent = Z(e.packagesCollected), this.hudScore.textContent = Z(e.score), this.hudCombo.textContent = `×${Z(e.combo)}`;
		let r = Ui(e.activePowerUps, e.activePowerUpStatuses, { gwarancja_48: this.copy.powerupWarrantyHud });
		this.hudPowerUps.textContent = r, this.hudPowerUps.hidden = r.length === 0;
		let i = Wi(e.storyObjectiveSegmentId, e.authoredWave, this.copy.controlsHud);
		if (this.hudControls.textContent = i ?? "", this.hudControls.hidden = i === null, this.activeMode === "story") {
			let t = e.epochIndexMax > 0 ? `${e.epochIndex + 1}/${e.epochIndexMax + 1}` : "";
			this.hudEpoch.textContent = [e.epochName, t].filter(Boolean).join(" · "), this.showStoryObjective(Ji(e.authoredWave) ?? Zi(e.storyObjectives, e.activeStoryOrderTypes));
		}
	}
	showMilestoneCelebration(e, t = !1) {
		if (!this.destroyed) {
			if (e == null) {
				this.milestoneMessage.hidden = !0, this.milestoneMessage.textContent = "", delete this.milestoneMessage.dataset.kind, delete this.milestoneMessage.dataset.intensity, this.milestoneMessage.removeAttribute("data-reduced-motion");
				return;
			}
			this.milestoneMessage.textContent = e.text, this.milestoneMessage.dataset.kind = e.kind, this.milestoneMessage.dataset.intensity = String(e.intensity), this.milestoneMessage.toggleAttribute("data-reduced-motion", t), this.milestoneMessage.hidden = !1;
		}
	}
	showPickupNotice(e, t = "default", n = 3800) {
		if (this.destroyed) return;
		let r = ++this.pickupNoticeVersion;
		this.hudNotice.textContent = e, this.hudNotice.dataset.tone = t, this.hudNotice.dataset.pulse = r % 2 == 0 ? "b" : "a", this.hudNotice.hidden = !1, this.announce(e), window.setTimeout(() => {
			this.destroyed || r !== this.pickupNoticeVersion || (this.hudNotice.hidden = !0, this.hudNotice.textContent = "", delete this.hudNotice.dataset.tone, delete this.hudNotice.dataset.pulse);
		}, n);
	}
	showStoryObjective(e) {
		this.destroyed || (this.hudObjective.textContent = e ?? "", this.hudObjective.title = e ?? "", this.hudObjective.hidden = e === null);
	}
	showStoryResult(e) {
		this.destroyed || (this.activeMode = "story", this.applyWorldVisual("million-finale", "story.million_finale", "result"), Q(this.storyResultScreen, "[data-campaign-story-packages]").textContent = Z(e.orders), Q(this.storyResultScreen, "[data-campaign-story-score]").textContent = Z(e.score), Q(this.storyResultScreen, "[data-campaign-story-combo]").textContent = `×${Z(e.bestCombo)}`, this.setView("story_result", this.storyResultScreen), Q(this.storyResultScreen, "[data-campaign-start-challenge]").focus({ preventScroll: !0 }), this.announce(`${this.copy.storyResultTitle}. ${this.copy.resultPackages}: ${Z(e.orders)}. ${this.copy.resultScore}: ${Z(e.score)}.`));
	}
	showChallengeResult(e) {
		this.destroyed || (this.activeMode = "challenge", this.applyWorldVisual("million-finale", "story.million_finale", "result"), this.challengeResult = e, Q(this.challengeResultScreen, "[data-campaign-challenge-packages]").textContent = Z(e.orders), Q(this.challengeResultScreen, "[data-campaign-challenge-total]").textContent = Z(e.totalScore), Q(this.challengeResultScreen, "[data-campaign-challenge-score]").textContent = Z(e.challengeScore), Q(this.challengeResultScreen, "[data-campaign-challenge-best]").textContent = Z(e.bestScore), Q(this.challengeResultScreen, "[data-campaign-challenge-best-label]").textContent = e.firstChallengeResult ? "Pierwszy wynik wyzwania" : "Twój rekord wyzwania", Q(this.challengeResultScreen, "[data-campaign-challenge-distance]").textContent = Z(e.distanceM), Q(this.challengeResultScreen, "[data-campaign-challenge-saves]").textContent = Z(e.warrantySaves), Q(this.challengeResultScreen, "[data-campaign-challenge-saves-stat]").hidden = e.warrantySaves === 0, this.sharePanel.hidden = !0, this.shareStatus.textContent = "", this.setView("challenge_result", this.challengeResultScreen), Q(this.challengeResultScreen, "[data-campaign-restart-challenge]").focus({ preventScroll: !0 }), this.announce(`${this.copy.challengeResultTitle}. Wynik łączny: ${Z(e.totalScore)}. Wynik wyzwania: ${Z(e.challengeScore)}. ${this.copy.resultPackages}: ${Z(e.orders)}.`));
	}
	setMuted(e, t = !0) {
		this.destroyed || (this.muted = e, this.muteButton.setAttribute("aria-pressed", String(e)), Q(this.muteButton, "[data-campaign-mute-icon]").textContent = e ? "×" : "♪", Q(this.muteButton, "[data-campaign-mute-label]").textContent = e ? this.copy.soundOff : this.copy.soundOn, t && this.callbacks.onMuteChange(e));
	}
	announce(e) {
		this.destroyed || (this.liveRegion.textContent = e);
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, document.removeEventListener("keydown", this.handleKeydown, !0), document.removeEventListener("keyup", this.handleKeyup, !0), document.removeEventListener("visibilitychange", this.handleVisibilityChange), document.removeEventListener("fullscreenchange", this.handleFullscreenChange), window.removeEventListener("resize", this.handleResize), this.orientationQuery?.removeEventListener?.("change", this.handleOrientationChange), this.root.removeEventListener("click", this.handleClick), this.canvas.removeEventListener("pointerdown", this.handlePointerDown), this.canvas.removeEventListener("pointermove", this.handlePointerMove), this.canvas.removeEventListener("pointerup", this.handlePointerUp), this.canvas.removeEventListener("pointercancel", this.handlePointerCancel), this.root.remove());
	}
	installListeners() {
		this.root.addEventListener("click", this.handleClick), this.canvas.addEventListener("pointerdown", this.handlePointerDown), this.canvas.addEventListener("pointermove", this.handlePointerMove), this.canvas.addEventListener("pointerup", this.handlePointerUp), this.canvas.addEventListener("pointercancel", this.handlePointerCancel), document.addEventListener("keydown", this.handleKeydown, !0), document.addEventListener("keyup", this.handleKeyup, !0), document.addEventListener("visibilitychange", this.handleVisibilityChange), document.addEventListener("fullscreenchange", this.handleFullscreenChange), window.addEventListener("resize", this.handleResize), this.orientationQuery?.addEventListener?.("change", this.handleOrientationChange);
	}
	applyCopy() {
		this.root.querySelectorAll("[data-campaign-copy]").forEach((e) => {
			let t = e.dataset.campaignCopy;
			t !== void 0 && Object.prototype.hasOwnProperty.call(this.copy, t) && (e.textContent = this.copy[t]);
		});
	}
	renderLandingActions(e) {
		if (this.landingActions.replaceChildren(), e.challengeUnlocked) {
			let e = document.createElement("h2");
			e.textContent = this.copy.choosePath;
			let t = this.createActionButton(this.copy.replayStory, !0);
			t.addEventListener("click", () => this.queueStart({
				mode: "story",
				restartStory: !0
			}), { once: !0 });
			let n = this.createActionButton(this.copy.challengeMode, !1);
			n.addEventListener("click", () => this.queueStart({
				mode: "challenge",
				restartStory: !1
			}), { once: !0 }), this.landingActions.append(e, t, n);
			return;
		}
		let t = this.createActionButton(this.copy.startStory, !0);
		t.addEventListener("click", () => this.queueStart({
			mode: "story",
			restartStory: !1
		}), { once: !0 }), this.landingActions.append(t);
	}
	createActionButton(e, t) {
		let n = document.createElement("button");
		return n.type = "button", n.className = `amso-campaign__button amso-campaign__button--${t ? "primary" : "secondary"}`, n.textContent = e, n;
	}
	queueStart(e) {
		if (!this.fullscreenPromptSeen && oa()) {
			this.fullscreenPromptSeen = !0, this.pendingStart = e, this.setView("orientation", this.orientationScreen), Q(this.orientationScreen, "[data-campaign-enter-fullscreen]").focus({ preventScroll: !0 });
			return;
		}
		if (this.fullscreenPreference === "fullscreen" && oa() && document.fullscreenElement === null) {
			this.enterFullscreen().finally(() => this.callbacks.onStart(e));
			return;
		}
		this.callbacks.onStart(e);
	}
	dispatchPendingStart(e) {
		this.rememberFullscreenPreference(e);
		let t = this.pendingStart;
		this.pendingStart = null, t !== null && this.callbacks.onStart(t);
	}
	rememberFullscreenPreference(e) {
		let t = !this.fullscreenPromptSeen || this.fullscreenPreference !== e;
		this.fullscreenPromptSeen = !0, this.fullscreenPreference = e, t && this.callbacks.onFullscreenPreferenceChange(e);
	}
	fullscreenApiAvailable() {
		return document.fullscreenEnabled !== !1 && typeof this.root.requestFullscreen == "function";
	}
	setCssGameMode(e) {
		this.root.toggleAttribute("data-css-game-mode", e), e && (this.root.dataset.cssGameMode = "true"), this.updateFullscreenControl();
	}
	updateFullscreenControl() {
		let e = document.fullscreenElement === this.root, t = this.root.dataset.cssGameMode === "true";
		this.fullscreenButton.setAttribute("aria-pressed", String(e || t)), Q(this.fullscreenButton, ".amso-campaign__tool-label").textContent = e ? this.copy.fullscreenExit : t ? this.copy.cssGameModeExit : this.fullscreenApiAvailable() ? this.copy.fullscreenEnter : this.copy.cssGameModeEnter;
		let n = Q(this.orientationScreen, "[data-campaign-enter-fullscreen]");
		n.textContent = this.fullscreenApiAvailable() ? this.copy.orientationFullscreen : this.copy.orientationFocus;
	}
	async enterFullscreen() {
		if (!this.fullscreenApiAvailable()) {
			this.setCssGameMode(!0);
			return;
		}
		try {
			document.fullscreenElement ?? await this.root.requestFullscreen({ navigationUI: "hide" });
		} catch {
			this.setCssGameMode(!0);
		}
		this.updateFullscreenControl();
	}
	toggleFullscreen() {
		(async () => {
			document.fullscreenElement == null ? this.root.dataset.cssGameMode === "true" ? this.setCssGameMode(!1) : await this.enterFullscreen() : await document.exitFullscreen?.().catch(() => void 0), (document.fullscreenElement != null || this.fullscreenApiAvailable()) && this.rememberFullscreenPreference(zi(document.fullscreenElement, this.root)), this.updateFullscreenControl();
		})();
	}
	hideScreens() {
		this.setScreenModal(null), [
			this.landingScreen,
			this.orientationScreen,
			this.loadingScreen,
			this.errorScreen,
			this.pauseScreen,
			this.storyResultScreen,
			this.challengeResultScreen
		].forEach((e) => {
			e.hidden = !0;
		});
	}
	setView(e, t) {
		this.hideStoryPresentation(), this.hideScreens(), t.hidden = !1, this.root.dataset.view = e, this.hud.hidden = !0, this.root.removeAttribute("data-trust-corridor"), this.trustCorridor = !1, this.canvas.tabIndex = -1, this.canvas.setAttribute("aria-hidden", "true"), t === this.orientationScreen && this.setScreenModal(t);
	}
	hideStoryPresentation() {
		this.storyPresentation.hidden = !0, this.storySceneCard.hidden = !1, this.storyCountdown.hidden = !0, this.storyContinueButton.disabled = !0, delete this.storyContinueButton.dataset.sceneId, delete this.storyContinueButton.dataset.presentationId, delete this.storySceneCard.dataset.sceneId, delete this.storyPresentation.dataset.state, delete this.storyPresentation.dataset.copyPlacement, this.lastCountdownValue = null, this.storyContinuationGate.clear(), this.setScreenModal(null);
	}
	setScreenModal(e) {
		this.activeModalScreen = e, this.applyModalInertState();
	}
	applyModalInertState() {
		let e = this.tooNarrowActive ? this.tooNarrow : this.activeModalScreen, t = e !== null;
		for (let e of this.presentationBackground) e.inert = t;
		for (let n of this.stage.children) n instanceof HTMLElement && (n.inert = t && n !== e);
		e && (e.inert = !1);
	}
	activeKeyboardDialog() {
		return this.pauseScreen.hidden ? this.orientationScreen.hidden ? null : this.orientationScreen : this.pauseScreen;
	}
	canControl() {
		return this.activeMode !== null && !this.paused && !this.trustCorridor && !this.tooNarrowActive && this.root.dataset.view === "game";
	}
	updateNarrowState() {
		let e = ia(window.innerWidth, window.innerHeight), t = e && !this.tooNarrowActive, n = !e && this.tooNarrowActive;
		this.tooNarrowActive = e, this.tooNarrow.hidden = !e, this.root.toggleAttribute("data-too-narrow", e), this.applyModalInertState();
		let r = this.root.dataset.view;
		t && this.activeMode !== null && !this.paused && (r === "game" || r === "story_reframe" || r === "story_countdown") ? this.callbacks.onPause("layout_change") : n && !this.pauseScreen.hidden && Q(this.pauseScreen, "[data-campaign-resume]").focus({ preventScroll: !0 });
	}
	applyWorldVisual(e, t, n, r = "story-linked") {
		let i = this.worldVisualLayer.show({
			worldId: e,
			stateId: t,
			phase: n,
			transitionMode: r
		});
		this.root.dataset.visualWorld = i.worldId, this.root.dataset.visualState = i.stateId, this.root.dataset.copyPlacement = i.copyPlacement;
	}
	async handleShare(e) {
		if (this.challengeResult !== null) {
			this.shareStatus.textContent = this.copy.sharePreparing;
			try {
				let t = await pa({
					platform: e,
					result: {
						score: this.challengeResult.totalScore,
						orders: this.challengeResult.orders
					},
					canonicalUrl: this.canonicalUrl,
					scoreLabel: this.copy.shareScoreLabel.toLocaleUpperCase("pl-PL"),
					ordersLabel: this.copy.resultPackages.toLocaleUpperCase("pl-PL"),
					callToAction: this.copy.shareTurn,
					publicationText: this.copy.sharePublication
				});
				this.callbacks.onShare?.(e, t), this.shareStatus.textContent = t === "cancelled" ? this.copy.shareCancelled : t === "download" ? this.copy.shareDownloaded : t === "facebook_url" ? this.copy.shareFacebookReady : this.copy.shareReady;
			} catch {
				this.shareStatus.textContent = this.copy.shareFailure;
			}
		}
	}
	applyMilestoneLayout() {
		let e = Ri(window.innerWidth, window.innerHeight);
		this.root.style.setProperty("--campaign-milestone-top", `${e.message.y}px`), this.root.style.setProperty("--campaign-milestone-max-width", `${e.message.width}px`);
	}
	tryContinueStory() {
		let e = this.storyContinueButton.dataset.sceneId, t = this.storyContinueButton.dataset.presentationId;
		e === void 0 || t === void 0 || !this.storyContinuationGate.consume(t) || (this.storyContinueButton.disabled = !0, this.callbacks.onStoryContinue(e));
	}
};
//#endregion
//#region src/CampaignController.ts
function ha() {
	try {
		return window.AMSOAnalyticsConsent === !0 || document.documentElement.dataset.analyticsConsent === "granted";
	} catch {
		return !1;
	}
}
function ga() {
	return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1;
}
function _a() {
	return new Promise((e) => window.requestAnimationFrame(() => e()));
}
var va = [
	"first-package",
	"order-backlog",
	"quality-process",
	"client-growth",
	"order-scale",
	"million-threshold"
];
function ya(e) {
	let t = e.authoredWave, n = t === null ? 0 : Math.max(0, va.indexOf(t.microlevelId) + 1), r = t?.microlevelId === "million-threshold" ? Math.max(0, Math.min(4, Math.ceil(t.wavesCompleted / Math.max(1, t.waveTarget) * 4))) : 0, i = t?.lastResult ?? null;
	return {
		music: {
			chapter: n,
			phase: e.authoredWavePhase === "burst" ? "burst" : "breath",
			finaleLayer: r
		},
		resultKey: t && i ? `${t.microlevelId}:${i.waveId}:${i.attempts}:${i.passed}:${t.wavesCompleted}` : null,
		resultCue: i === null ? null : i.perfect ? "wave-perfect" : i.passed ? "wave-success" : "wave-retry",
		completionCue: t?.completed === !0 ? t.microlevelId === "million-threshold" ? "million" : "chapter-complete" : null
	};
}
var ba = class {
	constructor(e, t, n = new Ai(), r = new y(t.assets.bundles)) {
		i(this, "config", void 0), i(this, "profile", void 0), i(this, "tracker", void 0), i(this, "shell", void 0), i(this, "audio", void 0), i(this, "assetLoader", void 0), i(this, "game", null), i(this, "lastSnapshot", null), i(this, "lastTrustCorridor", !1), i(this, "lastStorySegmentId", ""), i(this, "lastStorySceneId", ""), i(this, "lastVisualWorldId", null), i(this, "lastLogisticPhase", "inactive"), i(this, "lastWaveAudioKey", ""), i(this, "shownPowerUpHints", /* @__PURE__ */ new Set()), i(this, "qaReport", new ji()), i(this, "pendingStart", null), i(this, "startToken", 0), i(this, "destroyed", !1), this.config = t, this.profile = n, this.tracker = new p({
			gameVersion: t.gameVersion,
			consentGranted: ha
		}), this.audio = new me({ muted: n.snapshot.soundMuted }), this.assetLoader = r, this.shell = new ma(e, {
			onStart: (e) => {
				this.startRun(e);
			},
			onPause: () => this.pause(),
			onResume: () => this.resume(),
			onRestart: (e) => {
				this.startRun({
					mode: e,
					restartStory: e === "story"
				});
			},
			onReturnToMenu: () => this.returnToMenu(),
			onRetryLoad: () => {
				this.pendingStart === null ? this.showLanding() : this.startRun(this.pendingStart);
			},
			onJump: (e) => {
				this.audio.playCue("jump"), this.game?.jump(e);
			},
			onSlide: (e, t) => {
				e && this.audio.playCue("slide"), this.game?.crouch(e, t);
			},
			onMuteChange: (e) => {
				this.profile.setSoundMuted(e), this.audio.setMuted(e);
			},
			onFullscreenPreferenceChange: (e) => this.profile.setFullscreenPreference(e),
			onStoryContinue: (e) => {
				this.game?.continueStoryScene(e);
			}
		}, {
			campaignUrl: t.cta.path,
			fullStoryUrl: t.cta.path,
			copy: {
				...t.ui,
				startChallenge: t.cta.challengeLabel,
				fullStory: t.cta.campaignLabel
			}
		}), this.showLanding();
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.startToken += 1, this.game?.destroy(), this.game = null, this.shell.destroy(), this.audio.destroy());
	}
	showLanding() {
		this.destroyed || this.shell.showLanding({
			challengeUnlocked: this.profile.snapshot.storyCompleted,
			fullscreenPreference: this.profile.snapshot.fullscreenPreference,
			muted: this.profile.snapshot.soundMuted
		});
	}
	async startRun(e) {
		if (this.destroyed) return;
		let t = e.mode === "challenge" && !this.profile.snapshot.storyCompleted ? {
			mode: "story",
			restartStory: !1
		} : e;
		this.pendingStart = t;
		let n = ++this.startToken;
		this.game?.destroy(), this.game = null, this.lastSnapshot = null, this.lastTrustCorridor = !1, this.lastStorySegmentId = "", this.lastStorySceneId = "", this.lastVisualWorldId = null, this.lastLogisticPhase = "inactive", this.lastWaveAudioKey = "", this.shownPowerUpHints.clear(), this.shell.showLoading(void 0), this.config.audio.enabled && this.audio.start();
		try {
			let e = ee(t.mode);
			if (await this.assetLoader.ensureBundles(e, ({ readyCritical: e, totalCritical: t }) => {
				!this.destroyed && n === this.startToken && this.shell.showLoading(t === 0 ? 1 : e / t, this.uiCopy("loading", "Przygotowujemy pierwszą paczkę…"));
			}), await _a(), this.destroyed || n !== this.startToken) return;
			let r = this.createGameCallbacks();
			this.game = new Ti(this.shell.canvas, r, {
				reducedMotion: ga(),
				mode: t.mode,
				story: t.mode === "story" ? this.config.story : null,
				challenge: this.config.challenge,
				bestChallengeOrdersAtStart: this.profile.snapshot.bestChallengeOrders,
				awardStoryCompletionBonus: t.mode === "story" && !this.profile.snapshot.storyCompleted,
				powerUpCopy: {
					gwarancja_48: [this.uiCopy("parcelWarrantyLine1", "GWARANCJA"), this.uiCopy("parcelWarrantyLine2", "48 M")],
					podwojny_wynik: [this.uiCopy("parcelSecondLifeLine1", "2×"), this.uiCopy("parcelSecondLifeLine2", "PUNKTY")]
				}
			}), this.shell.showGame(t.mode), this.game.start("pointer"), this.tracker.track("game_started", { mode: t.mode });
		} catch (e) {
			this.game?.destroy(), this.game = null, this.tracker.loadFailed(e instanceof h ? e.code : "runtime_init_failed"), this.shell.showError();
		}
	}
	createGameCallbacks() {
		return {
			onStateChange: (e) => {
				e === "paused" && this.shell.setPaused(!0);
			},
			onSnapshot: (e) => this.handleSnapshot(e),
			onGameOver: (e) => this.handleGameOver(e),
			onStoryUpdate: (e) => this.handleStoryUpdate(e),
			onStoryComplete: () => {
				this.profile.completeStory(), this.tracker.track("story_completed", {});
			},
			onStoryObjectiveCompleted: (e) => {
				let t = {
					"epoch_1.training": "Skok i ślizg opanowane.",
					"epoch_1.order_backlog": "Zator Zamówień opanowany.",
					"epoch_2.quality_series": "SPRAWDZONY — cztery serie ukończone.",
					"epoch_3.matching_creative": "Pierwszy zestaw dopasowany.",
					"epoch_3.matching_growth": "Drugi zestaw dopasowany.",
					"epoch_3.matching_trust": "Trzeci zestaw dopasowany.",
					"epoch_4.order_peak": "Sześć zamówień gotowych.",
					"epoch_4.order_peak_final": "Szczyt Zamówień opanowany.",
					"epoch_5.million_threshold": "1 000 000 zamówień. Droga trwa dalej."
				}[e];
				this.shell.announce(t);
			},
			onSpecialPickup: (e) => {
				if (this.shownPowerUpHints.has(e)) return;
				this.shownPowerUpHints.add(e);
				let t = {
					podwojny_wynik: "2× WYNIK — punkty za każde zamówienie liczą się podwójnie.",
					gwarancja_48: this.uiCopy("powerupWarranty", "GWARANCJA 48 M — uratuje jedną próbę w Trybie Wyzwania.")
				};
				this.shell.showPickupNotice(t[e]);
			},
			onCollectiblePickup: (e) => {
				e.collectibleClass === "equipment" ? (this.audio.playEquipmentPickup(), this.shell.showPickupNotice(`+${e.basePoints}`, "equipment", 600)) : (this.audio.playParcelPickup(e.combo), this.shell.showPickupNotice(`+${e.basePoints}`, "parcel", 600));
			},
			onMilestoneCelebration: (e) => {
				this.audio.playMilestoneCue(e.kind, e.intensity), e.achievement === "record" && this.audio.playRecordCue(), this.shell.announce(e.text);
			},
			onModeChange: (e) => {
				this.shell.showStoryObjective(null), this.shell.showGame(e), e === "challenge" && this.shell.announce("Tryb Wyzwania. Wynik i zamówienia zostały zachowane. Tempo rośnie, a pierwsze niezabezpieczone zderzenie kończy bieg."), this.tracker.track("game_started", { mode: e });
			}
		};
	}
	handleSnapshot(e) {
		this.qaReport.record(e);
		let t = ya(e);
		this.audio.setMusicState(t.music), t.resultKey !== null && t.resultKey !== this.lastWaveAudioKey && (this.lastWaveAudioKey = t.resultKey, t.resultCue !== null && this.audio.playCue(t.resultCue), t.completionCue !== null && this.audio.playCue(t.completionCue)), this.warmWorldAssetWindow(e.visualWorldId);
		let n = this.lastSnapshot;
		if (n !== null) {
			e.collisions > n.collisions && this.audio.playCue("collision"), e.warrantySaves > n.warrantySaves && this.shell.showPickupNotice(this.uiCopy("warrantyConsumed", "GWARANCJA 48 M zadziałała — próba trwa dalej."));
			let t = e.activePowerUps.find((e) => !n.activePowerUps.includes(e));
			t !== void 0 && this.audio.playPowerUpCue(t);
		}
		this.lastSnapshot = e, this.shell.update(e), e.mode === "challenge" && e.logisticWavePhase !== this.lastLogisticPhase && (this.lastLogisticPhase = e.logisticWavePhase, e.logisticWavePhase === "warning" ? this.shell.announce(this.uiCopy("logisticWarning", "Uwaga: fala logistyczna")) : e.logisticWavePhase === "reward" && this.shell.announce(this.uiCopy("logisticReward", "Fala opanowana — droga jest czysta.")));
	}
	qaReportText() {
		return this.qaReport.text();
	}
	handleStoryUpdate(e) {
		if (e.trustCorridor !== this.lastTrustCorridor && (this.audio.playCue(e.trustCorridor ? "corridor-enter" : "corridor-exit"), e.trustCorridor || this.shell.announce(this.uiCopy("corridorResume", "Biegniemy dalej.")), this.lastTrustCorridor = e.trustCorridor), e.state === "scene" && e.scene) {
			let t = q(e.scene.id);
			this.warmWorldAssetWindow(t.worldId), e.scene.id !== this.lastStorySceneId && (this.lastStorySceneId = e.scene.id, this.audio.playCue(t.soundCue)), this.shell.showStoryObjective(null), this.shell.showStoryScene({
				sceneId: e.scene.id,
				visualStateId: Lr(e.scene.id, e.scenePageId ?? null),
				presentationId: e.scenePageId === null || e.scenePageId === void 0 ? e.scene.id : `${e.scene.id}:${e.scenePageId}`,
				eyebrow: e.scene.eyebrow,
				title: e.scene.title,
				body: e.scene.body,
				vignette: e.scene.vignette,
				continueLabel: e.scene.continueLabel,
				...e.sceneAction === null || e.sceneAction === void 0 ? {} : { action: e.sceneAction },
				...e.sceneFinalFrame === null || e.sceneFinalFrame === void 0 ? {} : { finalFrame: e.sceneFinalFrame }
			});
			return;
		}
		if (e.state === "reframe") {
			this.shell.showStoryReframe();
			return;
		}
		if (e.state === "countdown" && e.countdownValue !== null) {
			this.shell.showStoryCountdown(e.countdownValue);
			return;
		}
		if (e.state === "play") {
			this.shell.returnToGame();
			let t = e.playSegment?.id ?? "";
			t !== this.lastStorySegmentId && (this.lastStorySegmentId = t, this.shell.showStoryObjective(null));
		}
	}
	handleGameOver(e) {
		if (this.qaReport.recordResult(e), this.audio.stop(), e.mode === "story") {
			this.shell.showStoryResult({
				orders: e.packagesCollected,
				score: e.score,
				bestCombo: e.bestCombo
			});
			return;
		}
		let t = this.profile.snapshot.challengeRecordRuns === 0;
		this.profile.recordChallengeResult(e.challengeScore, e.challengeOrdersCollected), this.shell.showChallengeResult({
			orders: e.packagesCollected,
			totalScore: e.score,
			challengeScore: e.challengeScore,
			bestScore: this.profile.snapshot.bestChallengeScore,
			firstChallengeResult: t,
			distanceM: e.distanceM,
			warrantySaves: e.warrantySaves
		});
	}
	pause() {
		this.game?.state === "running" && (this.game.pause(), this.shell.setPaused(!0), this.audio.stop());
	}
	resume() {
		this.game?.state === "paused" && (this.game.resume(), this.shell.setPaused(!1), this.config.audio.enabled && this.audio.start());
	}
	returnToMenu() {
		this.startToken += 1, this.game?.destroy(), this.game = null, this.audio.stop(), this.showLanding();
	}
	warmWorldAssetWindow(e) {
		if (this.destroyed || e === this.lastVisualWorldId) return;
		this.lastVisualWorldId = e;
		let t = Fr(e).bundleId, n = [t, ne(t)].filter((e) => e !== null).filter((e) => !this.assetLoader.isBundleReady(e));
		n.length !== 0 && this.assetLoader.warmBundles(n).catch(() => void 0);
	}
	uiCopy(e, t) {
		return this.config.ui?.[e] ?? t;
	}
}, xa = "/assets/milion-runner/runner.js", Sa = "/assets/milion-runner/runner.css", Ca = "[data-amso-million-runner]", wa = Object.freeze(["/milion"]);
Object.freeze({
	schemaVersion: 4,
	enabled: !1,
	gameVersion: "0.0.0",
	claim: "1 000 000+",
	modulePath: xa,
	stylePath: Sa,
	triggerSelector: Ca,
	cta: Object.freeze({
		id: "million_landing",
		label: "Poznaj pełną historię AMSO",
		campaignLabel: "Poznaj pełną historię AMSO",
		challengeLabel: "Gramy dalej — tryb wyzwania",
		path: wa[0]
	}),
	facts: [],
	story: Object.freeze({
		activeDurationSeconds: 300,
		readingSpeedMultiplier: .3,
		speedStartMultiplier: .95,
		speedMaxMultiplier: 1.85,
		resumeCountdownSeconds: 3,
		firstCompletionBonusScore: 0,
		scenes: [],
		sequence: [],
		epochs: [],
		modeHandoff: Object.freeze({
			id: "story.challenge_handoff",
			from: "story",
			to: "challenge",
			safe: !0,
			confirmationRequired: !0,
			resumeCountdownSeconds: 3
		}),
		millionThreshold: Object.freeze({
			counterStart: 999950,
			counterTarget: 1e6,
			orderTarget: 50,
			combinationTarget: 12
		})
	}),
	challenge: Object.freeze({
		mode: "challenge",
		speedStartMultiplier: 1.85,
		speedMaxMultiplier: 3.5,
		logisticWaveMinSeconds: 20,
		logisticWaveMaxSeconds: 30,
		warrantyOneUse: !0
	}),
	audio: Object.freeze({ enabled: !0 }),
	assets: Object.freeze({ bundles: [Object.freeze({
		id: "common",
		resources: [Object.freeze({
			id: "disabled-placeholder",
			type: "procedural",
			source: "procedural:disabled-placeholder",
			critical: !0
		})]
	})] }),
	narrativeMode: !1
});
//#endregion
//#region src/index.ts
var Ta = null, $ = null;
function Ea(e) {
	if (e.schemaVersion !== 4 || !e.enabled) throw Error("runner_config_disabled_or_invalid");
	return e;
}
function Da(e) {
	window.location.assign(e);
}
function Oa(e, t) {
	let n = Ea(e);
	Ta?.destroy();
	let r = new ba(t, n);
	return Ta = r, {
		qaReport() {
			return r.qaReportText();
		},
		async copyQaReport() {
			try {
				return await navigator.clipboard.writeText(r.qaReportText()), !0;
			} catch {
				return !1;
			}
		},
		destroy() {
			r.destroy(), Ta === r && (Ta = null);
		}
	};
}
function ka(e, t = Da) {
	let n = Ea(e), r = !0;
	return {
		open() {
			r && t(n.cta.path);
		},
		close() {},
		destroy() {
			r = !1;
		}
	};
}
function Aa(e, t) {
	$?.destroy();
	let n = ka(e);
	return $ = n, window.AMSOMillionRunner = n, n;
}
function ja(e) {
	return Aa(e);
}
function Ma(e) {
	$?.open(e);
}
function Na(e) {
	$?.close(e);
}
function Pa() {
	$?.destroy(), $ = null, Ta?.destroy(), Ta = null, typeof window < "u" && delete window.AMSOMillionRunner;
}
function Fa(e, t = document) {
	let n = Ea(e);
	$?.destroy();
	let r = ka(n);
	$ = r;
	let i = n.triggerSelector ?? "[data-amso-million-runner]", a = Array.from(t.querySelectorAll(i)), o = (e) => {
		e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.preventDefault(), r.open({ sourceLocation: e.currentTarget instanceof HTMLElement ? e.currentTarget.dataset.runnerSource ?? "unknown" : "unknown" }));
	};
	for (let e of a) e.addEventListener("click", o);
	let s = {
		open: (e) => r.open(e),
		close: (e) => r.close(e),
		destroy() {
			for (let e of a) e.removeEventListener("click", o);
			r.destroy(), $ === s && ($ = null), typeof window < "u" && window.AMSOMillionRunner === s && delete window.AMSOMillionRunner;
		}
	};
	return $ = s, window.AMSOMillionRunner = s, s;
}
//#endregion
export { Aa as bootstrapRunner, Na as close, ka as createCampaignRedirectApi, Pa as destroy, ja as init, Fa as installRunner, Oa as mountCampaign, Ma as open };

//# sourceMappingURL=runner.js.map