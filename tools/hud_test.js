'use strict';
// Runs the packaged quickbuy script against a mocked Panorama tree and evaluates the
// packaged stylesheet's `visibility` cascade to count visible gameplay-HUD items.
//
//   python3 -I tools/extract_test_inputs.py <dir> [--original <original_vpk>]
//   node tools/hud_test.js <dir>
//
// The mock covers panel structure, classes and text only. It does not render Panorama,
// so layout, overlap and clipping are out of scope.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const DIR = process.argv[2];
if (!DIR) {
	console.error('usage: node tools/hud_test.js <dir from tools/extract_test_inputs.py>');
	process.exit(2);
}
const SCRIPT = fs.readFileSync(path.join(DIR, 'script.js'), 'utf8');

// ---------- mock panels ----------
class Panel {
	constructor(type, id, classes, parent) {
		this.type = type;
		this.id = id || '';
		this.classes = new Set((classes || '').split(/\s+/).filter(Boolean));
		this.children = [];
		this.parent = parent || null;
		this.text = '';
		this.attrs = {};
		this.image = null;
		if (parent) parent.children.push(this);
	}
	add(type, id, classes) { return new Panel(type, id, classes, this); }
	FindChildTraverse(id) {
		for (const c of this.children) {
			if (c.id === id) return c;
			const f = c.FindChildTraverse(id);
			if (f) return f;
		}
		return null;
	}
	GetParent() { return this.parent; }
	GetChildCount() { return this.children.length; }
	GetChild(i) { return this.children[i]; }
	SetHasClass(c, on) { if (on) this.classes.add(c); else this.classes.delete(c); }
	BHasClass(c) { return this.classes.has(c); }
	GetAttributeString(k, d) { return k in this.attrs ? this.attrs[k] : d; }
	SetImage(p) { this.image = p; }
}

const buildTree = () => {
	const hud = new Panel('Panel', 'Hud', 'viewing_as_player');
	const gold = hud.add('Panel', 'CurrentGoldAmount');
	gold.add('Label', 'hudCurGoldLabel').text = '0';
	const ctx = hud.add('Panel', 'CitadelHudQuickbuy', 'HudQuickbuy');
	const mini = ctx.add('Panel', 'HudMini', 'HudQuickbuyElement');
	const contents = mini.add('Panel', 'HudMiniContents');
	const next = contents.add('Panel', 'QuickbuyNext', 'CitadelHudQuickbuyEntry');
	next.add('Panel', '', 'ItemReadyIndicator').add('Label', '', 'ItemReadyLabel');
	contents.add('Panel', '', 'QueueSize').add('Label', '', 'ItemReadyLabel');
	const ns = ctx.add('Panel', 'QuickbuyNextSoulsNeeded');
	ns.add('Image', '', 'goldIcon QuickbuyNextSoulsNeededIcon');
	ns.add('Label', 'QuickbuyNextSoulsNeededLabel');
	const pc = ctx.add('Panel', 'QuickbuyUpcomingPreviewContainer');
	for (let n = 2; n <= 5; n++) {
		const slot = pc.add('Panel', `QuickbuyUpcomingPreview${n}`, 'QuickbuyUpcomingPreviewSlot');
		const sn = slot.add('Panel', '', 'QuickbuyUpcomingPreviewSoulsNeeded');
		sn.add('Image', '', 'goldIcon QuickbuyUpcomingPreviewSoulsNeededIcon');
		sn.add('Label', `QuickbuyUpcomingPreview${n}SoulsNeededLabel`);
		const um = slot.add('Panel', '', 'QuickbuyUpcomingMini');
		const entry = um.add('Panel', `QuickbuyPreview${n}Entry`, 'QuickbuyPreviewEntry');
		const icon = entry.add('Panel', 'ModIcon');
		icon.add('Image', 'ModIconImage');
		icon.add('Label', 'mod_tier_label');
	}
	ctx.add('Panel', 'QuickbuyQueue');
	ctx.add('Panel', 'QuickbuySellQueue');
	const total = ctx.add('Panel', 'QuickbuyShopTotalSummary');
	total.add('Label', 'QuickbuyShopTotalCostLabel', 'QuickbuyShopTotalCostLabel');
	return { hud, ctx };
};

const setSellQueue = (ctx, prices) => {
	const q = ctx.FindChildTraverse('QuickbuySellQueue');
	q.children = [];
	prices.forEach((p, i) => {
		const item = q.add('Panel', '', 'QuickbuyItem');
		item.add('Label', 'ModName').text = `Sell Item ${i + 1}`;
		item.add('Label', 'ModCost').text = String(p);
	});
};

const setQueue = (ctx, prices, souls) => {
	const q = ctx.FindChildTraverse('QuickbuyQueue');
	q.children = [];
	prices.forEach((p, i) => {
		const item = q.add('Panel', '', 'QuickbuyItem');
		item.add('Label', 'ModName').text = `Test Item ${i + 1}`;
		item.add('Label', 'ModCost').text = String(p);
		const icon = item.add('Panel', 'ModIcon');
		icon.add('Image', 'ModIconImage').attrs.src = `s2r://icon_${i + 1}.vtex`;
	});
	ctx.SetHasClass('Empty', prices.length === 0);
	ctx.parent.FindChildTraverse('hudCurGoldLabel').text = String(souls);
};

const loadScript = ctx => {
	let scheduled = [];
	let ummHandler = null;
	const $ = {
		GetContextPanel: () => ctx,
		Schedule: (t, fn) => { scheduled.push(fn); },
		DispatchEvent: () => {},
		RegisterForUnhandledEvent: (name, fn) => { ummHandler = fn; },
	};
	vm.runInNewContext(SCRIPT, { $, JSON, Math, Number, String, Object, isFinite, parseInt });
	const tick = () => { const fns = scheduled; scheduled = []; fns.forEach(f => f()); };
	tick(); // initial $.Schedule(0.0, ...)
	const umm = (key, value) => ummHandler(JSON.stringify({ umm: 1, t: 'set', id: 'enhanced_quickbuy', key, value }));
	return { tick, umm };
};

// ---------- CSS visibility cascade ----------
const parseCss = text => {
	text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;/g, '');
	// strip @keyframes blocks (nested braces)
	let out = '';
	for (let i = 0; i < text.length;) {
		if (text.startsWith('@keyframes', i)) {
			let j = text.indexOf('{', i), depth = 0;
			for (; j < text.length; j++) {
				if (text[j] === '{') depth++;
				else if (text[j] === '}' && --depth === 0) break;
			}
			i = j + 1;
		} else out += text[i++];
	}
	const rules = [];
	let order = 0;
	for (const m of out.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const decls = m[2].split(';').map(d => d.trim()).filter(Boolean);
		const vis = decls.filter(d => /^visibility\s*:/.test(d)).map(d => d.split(':')[1].trim());
		const ord = order++;
		if (!vis.length) continue;
		for (const sel of m[1].split(',').map(s => s.trim()).filter(Boolean)) {
			assert(!/[>+~]/.test(sel), `unsupported combinator in ${sel}`);
			const compounds = sel.split(/\s+/).map(c => {
				const t = { type: null, ids: [], classes: [], pseudo: [] };
				for (const tok of c.match(/[#.:]?[A-Za-z0-9_-]+/g)) {
					if (tok[0] === '#') t.ids.push(tok.slice(1));
					else if (tok[0] === '.') t.classes.push(tok.slice(1));
					else if (tok[0] === ':') t.pseudo.push(tok.slice(1));
					else t.type = tok;
				}
				return t;
			});
			const spec = compounds.reduce((a, c) => [a[0] + c.ids.length, a[1] + c.classes.length + c.pseudo.length, a[2] + (c.type ? 1 : 0)], [0, 0, 0]);
			rules.push({ sel, compounds, spec, order: ord, value: vis[vis.length - 1] });
		}
	}
	return rules;
};

const matchCompound = (p, c) => !c.pseudo.length && (!c.type || c.type === p.type)
	&& c.ids.every(id => p.id === id) && c.classes.every(cl => p.classes.has(cl));

const matches = (p, compounds) => {
	let i = compounds.length - 1;
	if (!matchCompound(p, compounds[i])) return false;
	let a = p.parent;
	for (i--; i >= 0; i--) {
		while (a && !matchCompound(a, compounds[i])) a = a.parent;
		if (!a) return false;
		a = a.parent;
	}
	return true;
};

const cmp = (x, y) => (x.spec[0] - y.spec[0]) || (x.spec[1] - y.spec[1]) || (x.spec[2] - y.spec[2]) || (x.order - y.order);

const ownVisibility = (rules, p) => {
	const hits = rules.filter(r => matches(p, r.compounds)).sort(cmp);
	return hits.length ? hits[hits.length - 1].value : 'visible';
};
const isShown = (rules, p) => { for (let a = p; a; a = a.parent) if (ownVisibility(rules, a) === 'collapse') return false; return true; };

// ---------- scenarios ----------
const ORIGINAL = 'original mod (reference)';
const variants = {
	'1-item': { css: 'css_1.css', max: 1 },
	'2-items': { css: 'css_2.css', max: 2 },
	'3-items': { css: 'css_3.css', max: 3 },
	[ORIGINAL]: { css: 'css_orig.css', max: 5 },
};
if (!fs.existsSync(path.join(DIR, variants[ORIGINAL].css))) {
	console.log('note: css_orig.css not found; skipping the original-mod reference run');
	delete variants[ORIGINAL];
}

const PRICES = [800, 500, 1250, 3000, 6200, 400];
let checks = 0;
for (const [name, v] of Object.entries(variants)) {
	const before = checks;
	const rules = parseCss(fs.readFileSync(path.join(DIR, v.css), 'utf8'));
	const summary = [];
	for (const pcSetting of [undefined, 1, 2, 3, 4, 5]) {
		for (let qlen = 0; qlen <= 6; qlen++) {
			for (const state of ['play', 'shop', 'dead', 'hud_off']) {
				const { hud, ctx } = buildTree();
				const { tick, umm } = loadScript(ctx);
				if (pcSetting !== undefined) umm('preview_count', pcSetting);
				if (state === 'hud_off') umm('show_hud_items', false);
				if (state === 'shop') hud.SetHasClass('gShopOpen', true);
				if (state === 'dead') hud.SetHasClass('dead', true);
				setQueue(ctx, PRICES.slice(0, qlen), 300);
				tick();

				const mini = ctx.FindChildTraverse('HudMini');
				const visibleSlots = [2, 3, 4, 5].filter(n => isShown(rules, ctx.FindChildTraverse(`QuickbuyUpcomingPreview${n}`)));
				const shown = (isShown(rules, mini) ? 1 : 0) + visibleSlots.length;

				const effCount = pcSetting === undefined ? 3 : pcSetting; // script default is 3
				let expected = 0;
				if (state === 'play') expected = Math.min(qlen, v.max === 1 ? 1 : Math.min(v.max, effCount));
				if (state === 'hud_off') expected = Math.min(qlen, 1); // native HudMini is not gated by the setting
				assert.strictEqual(shown, expected, `${name} pc=${pcSetting} q=${qlen} ${state}: shown ${shown} != ${expected}`);
				// visible previews are always the leading slots (2, 3, ...), never a gap
				assert.deepStrictEqual(visibleSlots, [2, 3, 4, 5].slice(0, visibleSlots.length));
				// each visible preview shows its queue item's cumulative remaining souls and icon
				let running = 0;
				const remaining = PRICES.slice(0, qlen).map(p => Math.max(0, (running += p) - 300));
				visibleSlots.forEach(n => {
					assert.strictEqual(ctx.FindChildTraverse(`QuickbuyUpcomingPreview${n}SoulsNeededLabel`).text, String(remaining[n - 1]));
					assert.strictEqual(ctx.FindChildTraverse(`QuickbuyPreview${n}Entry`).FindChildTraverse('ModIconImage').image, `s2r://icon_${n}.vtex`);
				});
				if (state === 'play' && qlen > 0) {
					assert.strictEqual(ctx.FindChildTraverse('QuickbuyNextSoulsNeededLabel').text, String(remaining[0]));
					assert.ok(isShown(rules, ctx.FindChildTraverse('QuickbuyNextSoulsNeeded')));
				}
				// corner badge / count label over the native icon stay hidden in our builds
				if (name !== ORIGINAL) {
					ctx.SetHasClass('ItemsReady', true);
					const qs = ctx.FindChildTraverse('HudMiniContents').children.find(c => c.classes.has('QueueSize'));
					assert.ok(!isShown(rules, qs), `${name}: QueueSize badge visible`);
					assert.ok(!isShown(rules, qs.children[0]), `${name}: count label visible`);
				}
				if (state === 'play' && qlen === 6) summary.push(`slider=${pcSetting === undefined ? 'unset(3)' : pcSetting}:${shown}`);
				checks++;
			}
		}
	}
	console.log(`${name.padEnd(26)} ${checks - before} scenarios; items shown with 6 queued -> ${summary.join('  ')}`);
}

// Documented price examples (README, REVIEW and 4x3-test-instructions.txt): 300 souls and
// three different, unrelated 800-soul items. Labels are listed left to right.
const priceExamples = [
	{ sells: [], labels: ['500', '1300', '2100'] },
	{ sells: [800], labels: ['100', '900', '1700'] }, // an 800-soul sale counts as 400
];
for (const [name, v] of Object.entries(variants)) {
	const rules = parseCss(fs.readFileSync(path.join(DIR, v.css), 'utf8'));
	for (const example of priceExamples) {
		const { ctx } = buildTree();
		const { tick } = loadScript(ctx);
		setQueue(ctx, [800, 800, 800], 300);
		setSellQueue(ctx, example.sells);
		tick();
		const shown = [ctx.FindChildTraverse('QuickbuyNextSoulsNeededLabel').text];
		[2, 3, 4, 5].forEach(n => {
			if (isShown(rules, ctx.FindChildTraverse(`QuickbuyUpcomingPreview${n}`))) {
				shown.push(ctx.FindChildTraverse(`QuickbuyUpcomingPreview${n}SoulsNeededLabel`).text);
			}
		});
		assert.deepStrictEqual(shown, example.labels.slice(0, Math.min(3, v.max)), `${name} price example`);
		checks++;
	}
}
console.log(`OK: ${checks} checks passed (including ${priceExamples.length * Object.keys(variants).length} price examples)`);
