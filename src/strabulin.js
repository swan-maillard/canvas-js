const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

window.addEventListener('resize', () => {
    resizeCanvas();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    face.draw();

    requestAnimationFrame(animate);
}


class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    multiply(coeff) {
        this.x *= coeff;
        this.y *= coeff;
        return this;
    }

    divide(coeff) {
        if (coeff !== 0) {
            this.x /= coeff;
            this.y /= coeff;
        }
        return this;
    }

    scale(scaledNorm) {
        if (scaledNorm > 0) {
            const norm = this.norm();
            this.divide(norm)
                .multiply(scaledNorm);
        }
        return this;
    }

    norm() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static multiply(v, coeff) {
        return new Vector(v.x*coeff, v.y*coeff);
    }
}

class Face {
    constructor(x, y, eyeSeparation, eyeSize) {
        this.pos = new Vector(x, y);
        this.eyeSeparation = eyeSeparation;
        this.eyeSize = eyeSize;
        this.eye1 = new Eye(x-eyeSeparation-eyeSize, y, eyeSize, false);
        this.eye2 = new Eye(x+eyeSeparation+eyeSize, y, eyeSize, false);
    }

    draw() {
        this.eye1.draw();
        this.eye2.draw();

        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y + this.eyeSize);
        ctx.lineTo(this.pos.x-this.eyeSize, this.pos.y + this.eyeSeparation + 2*this.eyeSize);
        ctx.lineTo(this.pos.x+this.eyeSeparation, this.pos.y + this.eyeSeparation + 2*this.eyeSize);
        ctx.moveTo(this.pos.x-this.eyeSeparation-this.eyeSize, this.pos.y + this.eyeSeparation + 3*this.eyeSize)
        ctx.lineTo(this.pos.x+this.eyeSeparation+this.eyeSize, this.pos.y + this.eyeSeparation + 3*this.eyeSize)
        ctx.stroke();
    }
}

class Eye {
    constructor(x, y, size, strabisme) {
        this.pos = new Vector(x, y);
        this.size = size;
        this.strabisme = strabisme;
    }

    draw() {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2);
        ctx.fill();

        let vect = Vector.sub(mouse, this.pos);
        if (vect.norm() > this.size/2) {
            vect.divide(vect.norm()).multiply(this.size/2);
        }

        let newPos = Vector.add(this.pos, vect);
        if (this.strabisme) {
            newPos.add(new Vector(-this.size/4, -this.size/3))
        }

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(newPos.x, newPos.y, this.size/3, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "white"
        ctx.beginPath();
        ctx.arc(newPos.x + this.size/4, newPos.y + this.size/10, this.size/10, 0, Math.PI*2);
        ctx.fill();
    }
}


const mouse = new Vector(0, 0);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

resizeCanvas();
face = new Face(canvas.width/2, 250, 50, 100);
animate();