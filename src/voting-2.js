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

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function drawArrow(context, fromx, fromy, tox, toy) {
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


////////////////////////////////////


//////////////////////
// SIMULATION CLASS //
//////////////////////
class Simulation {
    constructor() {
        this.mouse = {
            x: 0,
            y: 0,
            candidate: null
        };
        this.canvas = document.getElementById("myCanvas");
        this.simulationField = {width: 0, height: 0};
        this.statsField = {width: 0, height: 0}
        this.ctx = this.canvas.getContext("2d");
        this.voters = [];
        this.candidates = [];
        this.election = null;
        this.electionType = 'majoritaire'

        this.resizeCanvas(window.innerWidth, 500);

        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;

        document.body.style.cursor = "default";
        this.candidates.forEach(candidate => {
            if (getDistance(this.mouse.x, this.mouse.y, candidate.x, candidate.y) <= candidate.radius) {
                document.body.style.cursor = this.mouse.candidate ? "grabbing" : "grab";
            }
        });
    }

    handleMouseDown() {
        this.candidates.forEach(candidate => {
            if (!this.mouse.candidate && getDistance(this.mouse.x, this.mouse.y, candidate.x, candidate.y) <= candidate.radius) {
                candidate.selected = true;
                this.mouse.candidate = candidate;
                document.body.style.cursor = "grabbing";
            }
        });
    }


    handleMouseUp() {
        if (this.mouse.candidate) {
            this.mouse.candidate.selected = false;
            this.mouse.candidate = null;
            document.body.style.cursor = "grab";
        }
    }

    handleChangeElectionType(electionType) {
        switch (electionType) {
            case 'approbation':
                this.election = new ElectionApprobation();
                break;
            default:
                this.election = new ElectionMajoritaire();
        }
    }

    handleChangeHonesty(honesty) {
        this.election.honnestVote = !!honesty;
    }

    resizeCanvas(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.simulationField = {width: width*0.6, height};
    }

    run(nbVoters = 100) {
        this.election = new ElectionMajoritaire();

        for (let i = 0; i < nbVoters; i++) {
            this.voters.push(new Voter(...this.getRandomPosition()));
        }

        const candidates = [
            ['Technocrates', '#3b64d4'],
            ['Verdoyants', '#4bad49'],
            ['Front Prospère', '#f0b922'],
            ['Parti Solidaire', '#f527f5'],
        ]

        candidates.forEach(([name, color]) => {
            this.candidates.push(new Candidate(name, ...this.getRandomPosition(), color));
        })

        this.animate();
    }

    animate() {
        this.drawPlan();
        this.drawVoters();
        this.moveCandidates();
        
        this.election.init(this.voters, this.candidates);
        this.election.runHonestPreferences();
        this.election.runPoll();
        this.election.runElection();

        this.drawCandidates();

        this.drawPoll();
        this.drawResults();

        requestAnimationFrame(this.animate.bind(this));
    }

    drawPlan() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw axis
        const width = this.simulationField.width;
        const height = this.simulationField.height;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#a3a2a2';
        drawArrow(this.ctx, 30, height / 2, width - 30, height / 2);
        drawArrow(this.ctx, width / 2, height - 30, width / 2, 30);
        this.ctx.stroke();
    }

    drawVoters() {this.voters.forEach(voter => voter.draw(this.ctx))}

    moveCandidates() {this.candidates.forEach(candidate => candidate.move(this.mouse, this.simulationField))}

    drawCandidates() {this.candidates.forEach(candidate => candidate.draw(this.ctx, this.election.winner === candidate) )}

    drawPoll() {
        const MAX_HEIGHT_BAR = 150;
        const WIDTH_BAR = 20;

        const X_START = this.simulationField.width + 150 + this.candidates.length * 45;
        const Y_START = 30 + MAX_HEIGHT_BAR;

        const nbVoters = this.voters.length;

        this.candidates.forEach((candidate, index) => {
        
            const votes = candidate.pollVotes;
            const heightBar = votes / nbVoters * MAX_HEIGHT_BAR;

            // Bar
            this.ctx.fillStyle = candidate.color;
            this.ctx.fillRect(X_START + index*(10 + WIDTH_BAR), Y_START, WIDTH_BAR, -heightBar);

            // Percentage
            this.ctx.font = "12px sans-serif";
            this.ctx.fillStyle = "black";
            const percentage = Math.round(votes/nbVoters*100) + '%';
            const text = this.ctx.measureText(percentage)
            this.ctx.fillText(percentage, X_START + index*(10 + WIDTH_BAR) - text.width/2 + WIDTH_BAR/2, 
                Y_START + WIDTH_BAR - heightBar - 24);
        });

        const winner = this.election.getPollWinner();
        this.ctx.font = "15px sans-serif";
        this.ctx.fillStyle = "black";
        this.ctx.fillText("Sondage honnête", X_START, Y_START + 15);        
        this.ctx.font = "18px sans-serif";
        this.ctx.fillStyle = winner?.color || 'grey';
        this.ctx.fillText(winner?.name || "Égalité", X_START, Y_START + 35);
    }

    drawResults() {
        const MAX_HEIGHT_BAR = 150;
        const WIDTH_BAR = 30;

        const X_START = this.simulationField.width + 50;
        const Y_START = 30 + MAX_HEIGHT_BAR;

        const nbVoters = this.voters.length;

        this.candidates.forEach((candidate, index) => {
        
            const votes = candidate.votes;
            const heightBar = votes / nbVoters * MAX_HEIGHT_BAR;

            // Bar
            this.ctx.fillStyle = candidate.color;
            this.ctx.fillRect(X_START + index*(15 + WIDTH_BAR), Y_START, WIDTH_BAR, -heightBar);

            // Percentage
            this.ctx.font = "18px sans-serif";
            this.ctx.fillStyle = "black";
            const percentage = Math.round(votes/nbVoters*100) + '%';
            const text = this.ctx.measureText(percentage)
            this.ctx.fillText(percentage, X_START + index*(15 + WIDTH_BAR) - text.width/2 + WIDTH_BAR/2, 
                Y_START + WIDTH_BAR - heightBar - 35);
        });

        const winner = this.election.winner;
        
        if (winner) {
            this.ctx.font = "25px sans-serif";
            this.ctx.fillStyle = "black";
            this.ctx.fillText("Victoire des", X_START, Y_START + 25);
            this.ctx.font = "bold 30px sans-serif";
            this.ctx.fillStyle = winner.color;
            this.ctx.fillText(winner.name, X_START, Y_START + 55);
        }
        else {
            this.ctx.font = "bold 25px sans-serif";
            this.ctx.fillStyle = "grey";
            this.ctx.fillText("Égalité", X_START, Y_START + 40);
        }
        
    }


    getRandomPosition() {
        return [
            Math.floor(gaussianDistribution(0, this.simulationField.width - 0)),
            Math.floor(gaussianDistribution(0, this.simulationField.height - 0))
        ];
    }
}


//////////////////////
// ELECTION CLASSES //
//////////////////////
class Election {
    constructor() {
        this.winner = null;
        this.voters = null;
        this.candidates = null;
        this.honnestVote = true;
        
        this.STATEGICAL_VOTERS = 0.75;
    }

    init(voters, candidates) {
        this.winner = null;
        this.voters = voters;
        this.candidates = candidates;

        this.voters.forEach(voter => {
            voter.honestPreferences = [];
            voter.votedCandidates = [];
        });

        this.candidates.forEach(candidate => {
            candidate.votes = 0;
            candidate.pollVotes = 0;
        })
    }

    runHonestPreferences() {
        this.voters.forEach(voter => voter.findHonestPreferences(this.candidates));
    }

    runPoll() {
        this.voters.forEach(voter => {
            if (voter.honestPreferences.length > 0) {
                voter.honestPreferences[0].pollVotes++;
            }
        })
    }

    areChancesLow(candidate) {
        const DIFF_THRESHOLD = 0.2; // difference de chances entre proba max et proba candidat de 20%
        const scores = this.candidates.map(c => c.pollVotes);
        const total = scores.reduce((acc, score) => acc + score);
        return Math.abs((candidate.pollVotes-Math.max(...scores))/total) > DIFF_THRESHOLD;
    }

    areChancesClose(candidate1, candidate2) {
        const DIFF_THRESHOLD = 0.10; // difference de chances entre les deux candidats de 10%
        const total = this.candidates.reduce((acc, c) => acc + c.pollVotes, 0);
        return Math.abs((candidate1.pollVotes-candidate2.pollVotes)/total) < DIFF_THRESHOLD;
    }

    runElection() {};

    getPollWinner() {
        return this.candidates.sort((c1, c2) => c2.pollVotes - c1.pollVotes)[0];
    }
}

class ElectionMajoritaire extends Election {
    runPoll() {
        this.voters.forEach(voter => {
            if (voter.honestPreferences.length > 0) {
                voter.honestPreferences[0].pollVotes++;
            }
        })
    }

    runElection() {
        this.voters.forEach(voter => {
            if (voter.honestPreferences.length > 0) {
                const closest = voter.honestPreferences[0];

                let voted = this.honnestVote ? closest : this.#makeStrategicalVote(voter, closest);

                voter.votedCandidates = [voted];
                voted.votes++;
            }
        });

        const orderedCandidates = [...this.candidates].sort((c1, c2) => c2.votes - c1.votes);
        if (orderedCandidates[0].votes > orderedCandidates[1].votes) {
            this.winner = orderedCandidates[0];
        }
    }

    #makeStrategicalVote(voter, closest) {
        let voted = null;
        if (voter.randomNumber < this.STATEGICAL_VOTERS && this.areChancesLow(closest)) {
            let i = 1;
            while (!voted && voter.honestPreferences.length > i && 
                    voter.getDistanceFromCandidate(voter.honestPreferences[i]) < voter.IDEOLOGY_PERIMETER) {
                if (!this.areChancesLow(voter.honestPreferences[i])) {
                    voted = voter.honestPreferences[i];
                }
                ++i;
            }
        }

        return voted || closest;
    }
}

class ElectionApprobation extends Election {
    runPoll() {
        this.voters.forEach(voter => {
            let i = 0;
            while (i < this.candidates.length && voter.getDistanceFromCandidate(voter.honestPreferences[i]) < voter.IDEOLOGY_PERIMETER) {
                voter.honestPreferences[i++].pollVotes++;
            }
        });
    }

    runElection() {
        this.voters.forEach(voter => {
            let i = 0;
            while (i < this.candidates.length && voter.getDistanceFromCandidate(voter.honestPreferences[i]) < voter.IDEOLOGY_PERIMETER) {
                const closest = voter.honestPreferences[i++];

                let ignoreCandidate = this.honnestVote ? false : this.#makeStrategicalVote(voter, closest);
                
                if (!ignoreCandidate) {
                    voter.votedCandidates.push(closest);
                    closest.votes++;
                }
            }
        });

        const orderedCandidates = [...this.candidates].sort((c1, c2) => c2.votes - c1.votes);
        if (orderedCandidates[0].votes > orderedCandidates[1].votes) {
            this.winner = orderedCandidates[0];
        }
    }

    #makeStrategicalVote(voter, closest) {
        let ignored = false;
        if (voter.randomNumber > this.STATEGICAL_VOTERS) return ignored;

        voter.votedCandidates.some(voted => {
            if (this.areChancesClose(voted, closest) && (voted.pollVotes <= closest.pollVotes || voter.randomNumber < 0.5)) {
                ignored = true;
                return;
            }
            if (!this.areChancesLow(voted)) {
                return;
            }
        });

        return ignored;
    }
}


/////////////////
// VOTER CLASS //
/////////////////
class Voter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.randomNumber = Math.random();
        this.honestPreferences = [];
        this.votedCandidates = [];

        this.IDEOLOGY_PERIMETER = 200;
        this.RADIUS = 6;
    }

    getColors() {
        const colors = [];
        this.votedCandidates.sort((c1, c2) => (c1.name < c2.name ? -1 : 1))
        this.votedCandidates.forEach(candidate => colors.push(candidate.color));
        if (colors.length === 0) colors.push('#a3a2a2');
        return colors;
    }

    findHonestPreferences(candidates) {
        this.honestPreferences = [...candidates].sort((c1, c2) => {
            return this.getDistanceFromCandidate(c1) - this.getDistanceFromCandidate(c2);
        });
    }

    getDistanceFromCandidate(candidate) {
        return getDistance(this.x, this.y, candidate.x, candidate.y);
    }

    draw(ctx) {
        const colors = this.getColors();
        colors.forEach((color, index) => {
            ctx.beginPath();
            ctx.fillStyle = color;
            const portion = 2 * Math.PI / this.getColors().length;
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.RADIUS, index * portion, (index + 1) * portion);
            ctx.lineTo(this.x, this.y);
            ctx.fill();
        });
    }
}


/////////////////////
// CANDIDATE CLASS //
/////////////////////
class Candidate {
    constructor(name, x, y, color) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.color = color;
        this.selected = false;
        this.votes = 0;
        this.pollVotes = 0;
    }

    draw(ctx, isWinner) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#434345';
        ctx.lineWidth = (isWinner ? 5 : 3);
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.font = (isWinner ? "bold " : "") + "20px sans-serif";
        ctx.fillStyle = "#434345";
        let eyes = "•   •";
        let text = ctx.measureText(eyes);
        ctx.fillText(eyes, this.x - text.width / 2, this.y);
        let mouth = (isWinner ? "o" : '—');
        text = ctx.measureText(mouth);
        ctx.fillText(mouth, this.x - text.width / 2, this.y + 15);
    }

    move(mouse, simulationField) {
        if (this.selected) {
            const offset = this.radius;
            this.x = Math.max(offset, Math.min(simulationField.width-offset, mouse.x));
            this.y = Math.max(offset, Math.min(simulationField.height-offset, mouse.y));
        }
    }
}

////////////////////////////////////

const simulation = new Simulation();
simulation.run(300);