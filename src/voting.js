let lastCandidateSelected = null;
let winner = null;
let predictedWinner = null;

const VOTE_SYSTEMS = ['vote-majoritaire', 'vote-approbation'];
let voteSystem = VOTE_SYSTEMS[0];
let honestVote = true;


const mouse = {
    x: 0,
    y: 0,
    candidate: null
};

const electionPlan = {
    width: 0,
    height: 0
}

const BORDER_WIDTH = 10;
const NB_VOTERS = 300;


window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);

function handleMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function handleMouseDown() {
    candidates.forEach(candidate => {
        if (getDistance(mouse.x, mouse.y, candidate.x, candidate.y) <= candidate.radius) {
            candidate.selected = true;
            mouse.candidate = candidate;
        }
    });
}

function handleMouseUp() {
    if (mouse.candidate) {
        mouse.candidate.selected = false;
        mouse.candidate = null;
    }
}

function changeVoteSystem(newVoteSystem) {
    if (VOTE_SYSTEMS.includes(newVoteSystem))
        voteSystem = newVoteSystem;
}

function changeHonestVote(val) {
    honestVote = val;
}

function gaussianDistribution(min, max) {
    let u, v;
    do {
        u = Math.random();
    } while (u === 0);
    do {
        v = Math.random();
    } while (v === 0);

    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 5 + 0.5;
    num = (num > 1 || num < 0) ? gaussianDistribution(min, max) : num * (max - min) + min;
    return num;
}

function getRandomPosition() {
    return [
        Math.floor(gaussianDistribution(BORDER_WIDTH, electionPlan.width - BORDER_WIDTH)),
        Math.floor(gaussianDistribution(BORDER_WIDTH, electionPlan.height - BORDER_WIDTH))
    ];
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = 500;

    electionPlan.width = 1000;
    electionPlan.height = canvas.height;
}

function canvas_arrow(context, fromx, fromy, tox, toy) {
    const headlen = 10; // length of head in pixels
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    context.lineWidth = 2;
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

class Simulation {
    constructor() {
        this.canvas = document.getElementById("myCanvas");
        this.ctx = canvas.getContext("2d");
        this.voters = [];
        this.candidates = {};
        this.election = new ElectionMajoritaire(this.candidates, this.voters);
    }

    run(nbVoters = 100, candidates = {}) {
        for (let i = 0; i < nbVoters; i++) {
            voters.push(new Voter(...getRandomPosition()));
        }
        this.candidates = candidates;

        this.drawPlan();
        this.drawVoters();
        this.updateCandidates();
        
        election.runHonestPreferences();
        election.runElection();

        let maxVotes = 0;
        let temp_winner = null;
        candidates.forEach((candidate, index) => {
            candidate.draw();

            if (!temp_winner || candidate.votes > maxVotes) {
                temp_winner = candidate;
                maxVotes = candidate.votes;
            }
            

            const MAX_HEIGHT_BAR = 200;
            const WIDTH_BAR = 30;
            const heightBar = candidate.votes/NB_VOTERS*MAX_HEIGHT_BAR
            ctx.fillStyle = candidate.color;
            ctx.fillRect(electionPlan.width + 50 + index*(15 + WIDTH_BAR), electionPlan.height/2, WIDTH_BAR, -heightBar);
            ctx.font = "18px sans-serif";
            ctx.fillStyle = "black";
            const percentage = Math.round(candidate.votes/NB_VOTERS*100) + '%';
            const text = ctx.measureText(percentage)
            ctx.fillText(percentage, electionPlan.width + 50 + index*(15 + WIDTH_BAR) - text.width/2 + WIDTH_BAR/2, electionPlan.height/2 + WIDTH_BAR - heightBar - 35);
        });
    
        winner = temp_winner;

        ctx.font = "25px sans-serif";
        ctx.fillStyle = "black";
        ctx.fillText("Victoire des", electionPlan.width + 50, electionPlan.height/2 + 30);
        ctx.font = "bold 30px sans-serif";
        ctx.fillStyle = winner.color;
        ctx.fillText(winner.name, electionPlan.width + 50, electionPlan.height/2 + 60);

        requestAnimationFrame(this.run);
    }

    drawPlan() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw axis
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#a3a2a2';
        canvas_arrow(ctx, 30, electionPlan.height / 2, electionPlan.width - 30, electionPlan.height / 2);
        canvas_arrow(ctx, electionPlan.width / 2, electionPlan.height - 30, electionPlan.width / 2, 30);
        this.ctx.stroke();
    }

    drawVoters() {this.voters.forEach(voter => voter.draw())}

    updateCandidates() {
        Object.values(this.candidates).forEach(candidate => candidate.update());
    }
}

class Election {
    constructor(candidates, voters) {
        this.candidates = candidates;
        this.voters = voters;
        this.poll = {};
        this.votes = {};
    }

    runHonestPreferences() {
        this.voters.forEach(voter => voter.findHonestPreferences(candidates));
    }

    runElection() {};
}

class ElectionMajoritaire extends Election {

    runElection() {
        this.voters.forEach(voter => {
            if (voter.honestPreferences.length > 0) {
                const voted = voter.honestPreferences[0];
                voter.votedCandidates = [voted];
                votes[voted] = votes[voted] ? 1 : votes[voted] + 1;
            }
        })
    }
}


class Voter {
    constructor(x, y, candidates) {
        this.x = x;
        this.y = y;
        this.initX = x;
        this.initY = y;
        this.radius = 6;
        this.candidates = candidates;
        this.randomNumber = Math.random();
        this.honestPreferences = [];
        this.votedCandidates = [];
    }

    draw() {
        const colors = this.getColors()
        colors.forEach((color, index) => {
            ctx.beginPath();
            ctx.fillStyle = color;
            const portion = 2 * Math.PI / this.getColors().length;
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.radius, index * portion, (index + 1) * portion);
            ctx.lineTo(this.x, this.y);
            ctx.fill();
        });
    }

    findHonestPreferences(candidates) {
        this.honestPreferences = [...candidates.sort((c1, c2) => {
            return this.getDistanceFromCandidate(c1) - this.getDistanceFromCandidate(c2);
        })];
    }

    getColors() {
        const colors = [];
        this.votedCandidates.forEach(candidate => colors.push(candidate.color));
        if (colors.length === 0) colors.push('#a3a2a2');
        return colors;
    }

    voteMajoritaire() {
        let chosenCandidate = null;
        let bestScore = 0;
        this.colors = [];

        // L'électeur choisit le candidat le plus proche
        candidates.forEach(candidate => {
            if (!chosenCandidate || this.getDistanceFromCandidate(candidate) < bestScore) {
                chosenCandidate = candidate;
                bestScore = this.getDistanceFromCandidate(candidate);
            }
        });

        // Si le candidat le plus proche n'a pas de chance d'être élu et qu'il veut voter stratégique
        if (!honestVote && chosenCandidate !== predictedWinner) {

            // Il cherche le plus proche candidat ayant une chance d'être élu (max 10% de diff avec la prédiction)
            let closestCandidate = {
                candidate: null,
                distance: 0
            }
            candidates.forEach(candidate => {
                if (candidate === chosenCandidate) return;
                if ((candidate.predictedVotes - predictedWinner.predictedVotes)/NB_VOTERS < 0.1 && (
                    !closestCandidate.candidate ||
                    this.getDistanceFromCandidate(candidate) < closestCandidate.distance)) {

                    closestCandidate = {
                        candidate: candidate,
                        distance: this.getDistanceFromCandidate(candidate)
                    }
                }
            })

            if (closestCandidate.candidate && 
                closestCandidate.candidate !== predictedWinner &&
                closestCandidate.candidate.predictedVotes > chosenCandidate.predictedVotes &&
                this.randomNumber <= 2/3) {
                    chosenCandidate = closestCandidate.candidate;
            }
        }

        if (chosenCandidate) {
            this.colors.push(chosenCandidate.color);
            chosenCandidate.votes++;
        }
    }

    voteApprob() {
        const perimeter = 150;
        this.colors = [];
        candidates.forEach(candidate => {
            if (this.getDistanceFromCandidate(candidate) <= perimeter) {
                candidate.votes++;
                this.colors.push(candidate.color);
            }
        });
    }

    prediction() {
        let chosenCandidate = null;
        let bestScore = 0;
        candidates.forEach(candidate => {
            if (!chosenCandidate || this.getDistanceFromCandidate(candidate) < bestScore) {
                chosenCandidate = candidate;
                bestScore = this.getDistanceFromCandidate(candidate);
            }
        });

        if (chosenCandidate) {
            chosenCandidate.predictedVotes++;
        }
    }

    getDistanceFromCandidate(candidate) {
        return getDistance(this.x, this.y, candidate.x, candidate.y);
    }
}

class Candidate {
    constructor(name, x, y, color) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.initX = x;
        this.initY = y;
        this.radius = 30;
        this.color = color;
        this.selected = false;
        this.votes = 0;
        this.predictedVotes = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#434345';
        ctx.lineWidth = (winner && winner === this ? 5 : 3);
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.font = (winner && winner === this ? "bold " : "") + "20px sans-serif";
        ctx.fillStyle = "#434345";
        let eyes = "•   •";
        let text = ctx.measureText(eyes);
        ctx.fillText(eyes, this.x - text.width / 2, this.y);
        let mouth = (winner && winner === this ? "o" : '—');
        text = ctx.measureText(mouth);
        ctx.fillText(mouth, this.x - text.width / 2, this.y + 15);
    }

    update() {
        this.votes = 0;
        this.predictedVotes = 0;
        if (this.selected) {
            const offset = BORDER_WIDTH+this.radius;
            this.x = Math.max(offset, Math.min(electionPlan.width-offset, mouse.x));
            this.y = Math.max(offset, Math.min(electionPlan.height-offset, mouse.y));
        }
    }

    getDistanceFromCandidate(candidate) {
        return getDistance(this.x, this.y, candidate.x, candidate.y);
    }
}



resizeCanvas();


candidates['techno'] = (new Candidate('Technocrates', ...getRandomPosition(), '#3b64d4')); // blue
candidates['verts'] = (new Candidate('Verdoyants', ...getRandomPosition(), '#4bad49')); // green
candidates['prosperes'] = (new Candidate('Front Prospère', ...getRandomPosition(), '#f0b922')); // gold
candidates['solidaires'] = (new Candidate('Parti Solidaire', ...getRandomPosition(), '#f527f5')); // purple

const simulation = new Simulation();
simulation.run(NB_VOTERS, candidates);