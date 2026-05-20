/* =========================================================================
 *  Voting systems simulator
 * ========================================================================= */


/* ---------- Math helpers ---------- */

function gaussianDistribution(min, max) {
    let u, v;
    do { u = Math.random(); } while (u === 0);
    do { v = Math.random(); } while (v === 0);

    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 5 + 0.5;
    if (num > 1 || num < 0) return gaussianDistribution(min, max);
    return num * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6),
               toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6),
               toY - headLen * Math.sin(angle + Math.PI / 6));
}


/* ---------- Color helpers ---------- */

function parseHex(hex) {
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return { r: 128, g: 128, b: 128 };
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function shadeColor(hex, percent) {
    const { r, g, b } = parseHex(hex);
    const f = percent / 100;
    const mix = (c, t) => Math.round(c + (t - c) * Math.abs(f));
    const target = f >= 0 ? 255 : 0;
    return `rgb(${mix(r, target)}, ${mix(g, target)}, ${mix(b, target)})`;
}

function isLightColor(hex) {
    const { r, g, b } = parseHex(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}


/* ---------- Default palette ---------- */

const DEFAULT_CANDIDATES = [
    { name: 'Blues',     color: '#3b64d4' },
    { name: 'Greens',          color: '#4bad49' },
    { name: 'Yellows',      color: '#f0b922' },
    { name: 'Pinks',      color: '#d83cd8' },
];

const EXTRA_COLORS = ['#ef4444', '#0ea5e9', '#f97316', '#14b8a6', '#a855f7', '#64748b'];


/* =========================================================================
 *  Voter
 * ========================================================================= */

class Voter {
    static RADIUS = 5;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.randomNumber = Math.random();
        this.honestPreferences = [];
        this.votedCandidates = [];
    }

    distanceTo(candidate) {
        return distance(this.x, this.y, candidate.x, candidate.y);
    }

    findHonestPreferences(candidates) {
        this.honestPreferences = [...candidates].sort(
            (a, b) => this.distanceTo(a) - this.distanceTo(b)
        );
    }

    draw(ctx) {
        const colors = this.votedCandidates.length
            ? [...this.votedCandidates].sort((a, b) => a.name.localeCompare(b.name)).map(c => c.color)
            : ['#b4b8c4'];

        const slice = (2 * Math.PI) / colors.length;
        colors.forEach((color, i) => {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, Voter.RADIUS, i * slice, (i + 1) * slice);
            ctx.closePath();
            ctx.fill();
        });
    }
}


/* =========================================================================
 *  Candidate
 * ========================================================================= */

class Candidate {
    static RADIUS = 28;

    constructor(name, x, y, color) {
        this.name = name;
        this.color = color;
        this.x = x;
        this.y = y;
        this.selected = false;
        this.votes = 0;
        this.pollVotes = 0;
    }

    moveTowardMouse(mouse, field) {
        if (!this.selected) return;
        const r = Candidate.RADIUS;
        this.x = Math.max(r, Math.min(field.width - r, mouse.x));
        this.y = Math.max(r, Math.min(field.height - r, mouse.y));
    }

    draw(ctx, isWinner) {
        const r = Candidate.RADIUS;
        const faceColor = isLightColor(this.color) ? '#1f2330' : '#ffffff';

        // Winner halo
        if (isWinner) {
            const t = Date.now() / 600;
            const pulse = 1 + 0.08 * (0.5 + 0.5 * Math.sin(t));
            ctx.save();
            ctx.fillStyle = this.color + '33';
            ctx.beginPath();
            ctx.arc(this.x, this.y, r + 8 * pulse, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }

        // Main circle
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;

        const grad = ctx.createRadialGradient(
            this.x - r * 0.35, this.y - r * 0.35, r * 0.15,
            this.x, this.y, r
        );
        grad.addColorStop(0, shadeColor(this.color, 22));
        grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.strokeStyle = shadeColor(this.color, -25);
        ctx.lineWidth = isWinner ? 2.5 : 1.5;
        ctx.arc(this.x, this.y, r, 0, 2 * Math.PI);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.arc(this.x - 7, this.y - 3, 2.2, 0, 2 * Math.PI);
        ctx.arc(this.x + 7, this.y - 3, 2.2, 0, 2 * Math.PI);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = faceColor;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (isWinner) {
            ctx.arc(this.x, this.y + 4, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        } else {
            ctx.moveTo(this.x - 5, this.y + 7);
            ctx.lineTo(this.x + 5, this.y + 7);
        }
        ctx.stroke();

        // Crown for the winner
        if (isWinner) {
            this.#drawCrown(ctx, this.x, this.y - r - 6);
        }

        ctx.font = '600 11px -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const padding = 6;
        const textY = this.y + r + 14;
        const textWidth = ctx.measureText(this.name).width;
        const pillH = 18;
        const pillW = textWidth + padding * 2;

        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, this.x - pillW / 2, textY - pillH / 2, pillW, pillH, 9);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#1f2330';
        ctx.fillText(this.name, this.x, textY);
    }

    #drawCrown(ctx, cx, cy) {
        const w = 16, h = 10;
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy + h / 2);
        ctx.lineTo(cx - w / 2, cy - h / 2);
        ctx.lineTo(cx - w / 4, cy);
        ctx.lineTo(cx,         cy - h / 2 - 2);
        ctx.lineTo(cx + w / 4, cy);
        ctx.lineTo(cx + w / 2, cy - h / 2);
        ctx.lineTo(cx + w / 2, cy + h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Jewel
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(cx, cy + 1, 1.6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
}


/* =========================================================================
 *  Election base class
 * ========================================================================= */

class Election {
    static STRATEGIC_VOTERS_RATIO = 0.75;

    constructor() {
        this.winner = null;
        this.runnerUp = null;
        this.voters = [];
        this.candidates = [];
        this.honestVote = true;
        this.radius = 200;
    }

    setData(voters, candidates) {
        this.winner = null;
        this.runnerUp = null;
        this.voters = voters;
        this.candidates = candidates;

        voters.forEach(v => {
            v.honestPreferences = [];
            v.votedCandidates = [];
        });
        candidates.forEach(c => {
            c.votes = 0;
            c.pollVotes = 0;
        });
    }

    runHonestPreferences() {
        this.voters.forEach(v => v.findHonestPreferences(this.candidates));
    }

    /** Honest poll: each voter signals their first preference. */
    runPoll() {
        this.voters.forEach(v => {
            if (v.honestPreferences.length > 0) v.honestPreferences[0].pollVotes++;
        });
    }

    /** True if candidate is meaningfully behind the leader in the poll. */
    isLowChance(candidate) {
        const scores = this.candidates.map(c => c.pollVotes);
        const total = scores.reduce((a, b) => a + b, 0) || 1;
        return Math.abs((candidate.pollVotes - Math.max(...scores)) / total) > 0.2;
    }

    isCloseTo(a, b) {
        const total = this.candidates.reduce((acc, c) => acc + c.pollVotes, 0) || 1;
        return Math.abs((a.pollVotes - b.pollVotes) / total) < 0.10;
    }

    runElection() { /* implemented by subclasses */ }
}


/* ---------- Plurality / Single-name majoritarian ---------- */

class PluralityElection extends Election {
    static label = 'First-past-the-post';
    static description = 'Each voter picks one candidate. The candidate with the most votes wins.';

    runElection() {
        this.voters.forEach(voter => {
            if (voter.honestPreferences.length === 0) return;
            const closest = voter.honestPreferences[0];
            const chosen = this.honestVote ? closest : this.#strategicVote(voter, closest);
            voter.votedCandidates = [chosen];
            chosen.votes++;
        });

        const ranked = [...this.candidates].sort((a, b) => b.votes - a.votes);
        if (ranked.length >= 2 && ranked[0].votes > ranked[1].votes) {
            this.winner = ranked[0];
            this.runnerUp = ranked[1];
        }
    }

    #strategicVote(voter, closest) {
        if (voter.randomNumber >= Election.STRATEGIC_VOTERS_RATIO) return closest;
        if (!this.isLowChance(closest)) return closest;

        for (let i = 1; i < voter.honestPreferences.length; i++) {
            const cand = voter.honestPreferences[i];
            if (voter.distanceTo(cand) >= this.radius) break;
            if (!this.isLowChance(cand)) return cand;
        }
        return closest;
    }
}


/* ---------- Approval voting ---------- */

class ApprovalElection extends Election {
    static label = 'Approval voting';
    static description = 'Each voter approves every candidate they find acceptable. The most-approved candidate wins.';

    runPoll() {
        this.voters.forEach(voter => {
            for (const cand of voter.honestPreferences) {
                if (voter.distanceTo(cand) >= this.radius) break;
                cand.pollVotes++;
            }
        });
    }

    runElection() {
        this.voters.forEach(voter => {
            for (const cand of voter.honestPreferences) {
                if (voter.distanceTo(cand) >= this.radius) break;
                const ignore = !this.honestVote && this.#shouldIgnore(voter, cand);
                if (!ignore) {
                    voter.votedCandidates.push(cand);
                    cand.votes++;
                }
            }
        });

        const ranked = [...this.candidates].sort((a, b) => b.votes - a.votes);
        if (ranked.length >= 2 && ranked[0].votes > ranked[1].votes) {
            this.winner = ranked[0];
            this.runnerUp = ranked[1];
        }
    }

    #shouldIgnore(voter, candidate) {
        if (voter.randomNumber > Election.STRATEGIC_VOTERS_RATIO) return false;

        // Ignore a candidate that would split votes with a stronger ally
        return voter.votedCandidates.some(prev =>
            this.isCloseTo(prev, candidate) &&
            (prev.pollVotes <= candidate.pollVotes || voter.randomNumber < 0.5)
        );
    }
}


/* =========================================================================
 *  Simulation
 * ========================================================================= */

const VOTING_SYSTEMS = {
    plurality: PluralityElection,
    approval:  ApprovalElection,
};


class Simulation {
    constructor() {
        this.canvas = document.getElementById('myCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.field = { width: 0, height: 0 };
        this.mouse = { x: 0, y: 0, draggedCandidate: null };

        this.voters = [];
        this.candidates = [];
        this.election = new PluralityElection();
        this.electionKey = 'plurality';

        this.showPreferences = false;
        this.showApprovalCircles = false;
        this.approvalRadius = 200;
        this.election.radius = this.approvalRadius;

        this.#bindCanvasEvents();
        this.#resizeCanvasToContainer();

        const ro = new ResizeObserver(() => this.#resizeCanvasToContainer());
        ro.observe(this.canvas.parentElement);
    }

    /* ---------- Setup ---------- */

    start(nbVoters = 300) {
        this.#generateVoters(nbVoters);
        DEFAULT_CANDIDATES.forEach(({ name, color }) =>
            this.candidates.push(new Candidate(name, ...this.#randomPosition(), color))
        );
        this.#tick();
    }

    /* ---------- Voters & candidates ---------- */

    #generateVoters(n) {
        this.voters = [];
        for (let i = 0; i < n; i++) {
            this.voters.push(new Voter(...this.#randomPosition()));
        }
    }

    setVoterCount(n) { this.#generateVoters(n); }

    addCandidate() {
        const used = new Set(this.candidates.map(c => c.color));
        const color = EXTRA_COLORS.find(c => !used.has(c)) ||
            `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`;
        const name = `Candidate ${this.candidates.length + 1}`;
        this.candidates.push(new Candidate(name, ...this.#randomPosition(), color));
    }

    removeCandidate(candidate) {
        const i = this.candidates.indexOf(candidate);
        if (i >= 0) this.candidates.splice(i, 1);
    }

    repositionCandidates() {
        this.candidates.forEach(c => {
            const [x, y] = this.#randomPosition();
            c.x = x;
            c.y = y;
        });
    }

    redistributeVoters() {
        this.voters.forEach(v => {
            const [x, y] = this.#randomPosition();
            v.x = x;
            v.y = y;
        });
    }

    setElectionType(key) {
        const Ctor = VOTING_SYSTEMS[key] ?? PluralityElection;
        const prev = this.election;
        this.election = new Ctor();
        this.election.honestVote = prev ? prev.honestVote : true;
        this.election.radius = this.approvalRadius;
        this.electionKey = key;
    }

    setHonestVote(honest) {
        this.election.honestVote = !!honest;
    }

    setApprovalRadius(r) {
        this.approvalRadius = r;
        this.election.radius = r;
    }

    /* ---------- Position helpers ---------- */

    #randomPosition() {
        return [
            Math.floor(gaussianDistribution(20, this.field.width - 20)),
            Math.floor(gaussianDistribution(20, this.field.height - 20)),
        ];
    }

    #resizeCanvasToContainer() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(240, Math.floor(rect.width));
        const height = Math.max(240, Math.floor(rect.height));

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.field = { width, height };
    }

    /* ---------- Mouse handling ---------- */

    #bindCanvasEvents() {
        const onMove = e => {
            const r = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - r.left;
            this.mouse.y = e.clientY - r.top;
            this.#updateCursor();
        };
        this.canvas.addEventListener('mousemove', onMove);
        this.canvas.addEventListener('mousedown', () => {
            for (const c of this.candidates) {
                if (distance(this.mouse.x, this.mouse.y, c.x, c.y) <= Candidate.RADIUS) {
                    c.selected = true;
                    this.mouse.draggedCandidate = c;
                    this.canvas.style.cursor = 'grabbing';
                    break;
                }
            }
        });
        window.addEventListener('mouseup', () => {
            if (this.mouse.draggedCandidate) {
                this.mouse.draggedCandidate.selected = false;
                this.mouse.draggedCandidate = null;
                this.#updateCursor();
            }
        });
    }

    #updateCursor() {
        if (this.mouse.draggedCandidate) {
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        const hovering = this.candidates.some(c =>
            distance(this.mouse.x, this.mouse.y, c.x, c.y) <= Candidate.RADIUS);
        this.canvas.style.cursor = hovering ? 'grab' : 'default';
    }

    /* ---------- Main loop ---------- */

    #tick() {
        this.#drawBackground();

        this.candidates.forEach(c => c.moveTowardMouse(this.mouse, this.field));

        this.election.setData(this.voters, this.candidates);
        this.election.runHonestPreferences();
        this.election.runPoll();
        this.election.runElection();

        if (this.showApprovalCircles && this.electionKey === 'approval') this.#drawApprovalCircles();
        if (this.showPreferences) this.#drawPreferenceLines();
        this.voters.forEach(v => v.draw(this.ctx));
        this.candidates.forEach(c => c.draw(this.ctx, this.election.winner === c));

        if (typeof this.onFrame === 'function') this.onFrame(this);

        requestAnimationFrame(() => this.#tick());
    }

    /* ---------- Drawing ---------- */

    #drawBackground() {
        const { width, height } = this.field;
        this.ctx.clearRect(0, 0, width, height);

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#cfd3df';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 6]);
        this.ctx.moveTo(width / 2, 16);
        this.ctx.lineTo(width / 2, height - 16);
        this.ctx.moveTo(16, height / 2);
        this.ctx.lineTo(width - 16, height / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#9aa0b2';
        this.ctx.lineWidth = 1.4;
        drawArrow(this.ctx, 16, height / 2, width - 16, height / 2);
        drawArrow(this.ctx, width / 2, height - 16, width / 2, 16);
        this.ctx.stroke();
    }

    #drawApprovalCircles() {
        const r = this.approvalRadius;
        this.ctx.save();
        this.candidates.forEach(c => {
            this.ctx.beginPath();
            this.ctx.fillStyle = c.color;
            this.ctx.globalAlpha = 0.08;
            this.ctx.arc(c.x, c.y, r, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.globalAlpha = 0.45;
            this.ctx.beginPath();
            this.ctx.strokeStyle = c.color;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([3, 4]);
            this.ctx.arc(c.x, c.y, r, 0, 2 * Math.PI);
            this.ctx.stroke();
        });
        this.ctx.restore();
        this.ctx.setLineDash([]);
    }

    #drawPreferenceLines() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.32;
        this.ctx.lineWidth = 1;
        this.voters.forEach(voter => {
            voter.votedCandidates.forEach(c => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = c.color;
                this.ctx.moveTo(voter.x, voter.y);
                this.ctx.lineTo(c.x, c.y);
                this.ctx.stroke();
            });
        });
        this.ctx.restore();
    }

    /* ---------- Metrics ---------- */

    getSatisfaction() {
        const winner = this.election.winner;
        const n = this.candidates.length;
        if (!winner || n <= 1 || this.voters.length === 0) return null;

        let total = 0;
        let counted = 0;
        for (const voter of this.voters) {
            if (voter.honestPreferences.length === 0) continue;
            const rank = voter.honestPreferences.indexOf(winner);
            if (rank < 0) continue;
            total += (n - 1 - rank) / (n - 1);
            counted++;
        }
        return counted ? total / counted : null;
    }
}


/* =========================================================================
 *  UI controller
 * ========================================================================= */

class UiController {
    constructor(simulation) {
        this.sim = simulation;

        this.systemSelect     = document.getElementById('voting-system');
        this.systemHint       = document.getElementById('system-description');
        this.honestySelect    = document.getElementById('honesty');
        this.voterSlider      = document.getElementById('voter-count');
        this.voterCountValue  = document.getElementById('voter-count-value');
        this.candidateList    = document.getElementById('candidate-list');
        this.addCandidateBtn  = document.getElementById('add-candidate');
        this.repositionBtn    = document.getElementById('reposition');
        this.redistributeBtn  = document.getElementById('redistribute');
        this.preferenceToggle = document.getElementById('show-preferences');
        this.approvalOptions  = document.getElementById('approval-options');
        this.radiusSlider     = document.getElementById('approval-radius');
        this.radiusValue      = document.getElementById('approval-radius-value');
        this.showRadiusToggle = document.getElementById('show-radius');

        this.winnerName    = document.getElementById('winner-name');
        this.electionChart = document.getElementById('election-chart');
        this.pollChart     = document.getElementById('poll-chart');
        this.pollSection   = document.getElementById('poll-section');
        this.satisfaction  = document.getElementById('satisfaction');

        this.#populateSystems();
        this.#wireUp();
        this.#renderCandidateList();
        this.#updateSystemHint();
        this.#updatePollVisibility();
        this.#updateApprovalOptionsVisibility();

        this.sim.onFrame = () => this.#updateResults();
    }

    #populateSystems() {
        this.systemSelect.innerHTML = '';
        for (const [key, Ctor] of Object.entries(VOTING_SYSTEMS)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = Ctor.label;
            this.systemSelect.appendChild(opt);
        }
    }

    #wireUp() {
        this.systemSelect.addEventListener('change', e => {
            this.sim.setElectionType(e.target.value);
            this.#updateSystemHint();
            this.#updateApprovalOptionsVisibility();
        });
        this.honestySelect.addEventListener('change', e => {
            this.sim.setHonestVote(e.target.value === '1');
            this.#updatePollVisibility();
        });
        this.voterSlider.addEventListener('input', e => {
            const n = parseInt(e.target.value, 10);
            this.voterCountValue.textContent = n;
            this.sim.setVoterCount(n);
        });
        this.addCandidateBtn.addEventListener('click', () => {
            this.sim.addCandidate();
            this.#renderCandidateList();
        });
        this.repositionBtn.addEventListener('click', () => this.sim.repositionCandidates());
        this.redistributeBtn.addEventListener('click', () => this.sim.redistributeVoters());
        this.preferenceToggle.addEventListener('change', e => {
            this.sim.showPreferences = e.target.checked;
        });
        this.radiusSlider.addEventListener('input', e => {
            const r = parseInt(e.target.value, 10);
            this.radiusValue.textContent = r;
            this.sim.setApprovalRadius(r);
        });
        this.showRadiusToggle.addEventListener('change', e => {
            this.sim.showApprovalCircles = e.target.checked;
        });
    }

    #updateApprovalOptionsVisibility() {
        this.approvalOptions.hidden = this.sim.electionKey !== 'approval';
    }

    #updateSystemHint() {
        const Ctor = VOTING_SYSTEMS[this.sim.electionKey];
        this.systemHint.textContent = Ctor?.description ?? '';
    }

    #updatePollVisibility() {
        const strategic = !this.sim.election.honestVote;
        this.pollSection.hidden = !strategic;
    }

    #renderCandidateList() {
        this.candidateList.innerHTML = '';
        this.sim.candidates.forEach(candidate => {
            const row = document.createElement('div');
            row.className = 'candidate-row';

            const swatch = document.createElement('label');
            swatch.className = 'candidate-color';
            swatch.style.background = candidate.color;
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = candidate.color;
            colorInput.addEventListener('input', e => {
                candidate.color = e.target.value;
                swatch.style.background = e.target.value;
            });
            swatch.appendChild(colorInput);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'candidate-name';
            nameInput.value = candidate.name;
            nameInput.addEventListener('input', e => {
                candidate.name = e.target.value || 'Unnamed';
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.title = 'Remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', () => {
                this.sim.removeCandidate(candidate);
                this.#renderCandidateList();
            });

            row.append(swatch, nameInput, removeBtn);
            this.candidateList.appendChild(row);
        });

        this.addCandidateBtn.disabled = this.sim.candidates.length >= 6;
    }

    /* ---------- Per-frame results refresh ---------- */

    #updateResults() {
        const winner = this.sim.election.winner;

        if (winner) {
            this.winnerName.textContent = winner.name;
            this.winnerName.style.color = winner.color;
        } else {
            this.winnerName.textContent = 'Tie';
            this.winnerName.style.color = 'var(--text-muted)';
        }

        const candidates = this.sim.candidates;
        const totalVotes = candidates.reduce((a, c) => a + c.votes, 0);
        this.#renderBars(this.electionChart, candidates, c => c.votes, totalVotes);

        if (!this.pollSection.hidden) {
            const pollTotal = candidates.reduce((a, c) => a + c.pollVotes, 0);
            this.#renderBars(this.pollChart, candidates, c => c.pollVotes, pollTotal);
        }

        const sat = this.sim.getSatisfaction();
        this.satisfaction.textContent = sat === null ? '—' : `${Math.round(sat * 100)}%`;
    }

    #renderBars(host, candidates, valueFn, total) {
        host.innerHTML = '';
        const max = Math.max(1, ...candidates.map(valueFn));
        const sorted = [...candidates].sort((a, b) => valueFn(b) - valueFn(a));

        if (sorted.length === 0) {
            host.innerHTML = '<div class="hint">No candidates.</div>';
            return;
        }

        sorted.forEach(c => {
            const value = valueFn(c);
            const pct = total > 0 ? (value / total) * 100 : 0;
            const barWidth = (value / max) * 100;

            const row = document.createElement('div');
            row.className = 'bar-row';
            row.innerHTML = `
                <div class="bar-info">
                    <div class="bar-name">
                        <span class="swatch" style="background:${c.color}"></span>
                        ${escapeHtml(c.name)}
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width:${barWidth}%;background:${c.color}"></div>
                    </div>
                </div>
                <div class="bar-pct">${formatPercent(pct)}</div>
            `;
            host.appendChild(row);
        });
    }
}


/* ---------- Small helpers ---------- */

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatPercent(p) {
    if (!isFinite(p)) return '0%';
    return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
}


/* =========================================================================
 *  Boot
 * ========================================================================= */

const simulation = new Simulation();
simulation.start(300);
new UiController(simulation);
