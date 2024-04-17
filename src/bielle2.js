const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const width = window.innerWidth - 100;
const height = window.innerHeight - 100;
canvas.width = width;
canvas.height = height;

const numBoids = 500;
const boids = [];

for (let i = 0; i < numBoids; i++) {
  boids.push({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  });
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  for (const boid of boids) {
    ctx.fillRect(boid.x - 2, boid.y - 2, 4, 4);
  }
}

function update() {
  for (const boid of boids) {
    let avgX = 0;
    let avgY = 0;
    let avgVX = 0;
    let avgVY = 0;
    let count = 0;

    for (const other of boids) {
      if (other !== boid) {
        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          avgX += other.x;
          avgY += other.y;
          avgVX += other.vx;
          avgVY += other.vy;
          count++;
        }
      }
    }

    if (count > 0) {
      avgX /= count;
      avgY /= count;
      avgVX /= count;
      avgVY /= count;

      boid.vx += (avgX - boid.x) * 0.001;
      boid.vy += (avgY - boid.y) * 0.001;
      boid.vx -= avgVX * 0.01;
      boid.vy -= avgVY * 0.01;

      const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
      if (speed > 2.5) {
        boid.vx *= 0.1 / speed;
        boid.vy *= 0.1 / speed;
      }
    }

    // Ajout de la règle d'évitement des bords
    if (boid.x < 20) {
      boid.vx += 0.1;
    }
    if (boid.y < 20) {
      boid.vy += 0.1;
    }
    if (boid.x > width - 20) {

      boid.vx -= 0.1;
    }
    if (boid.y > height - 20) {
      boid.vy -= 0.1;
    }

    boid.x += boid.vx;
    boid.y += boid.vy;

    if (boid.x < 0) {
      boid.x += width;
    }
    if (boid.y < 0) {
      boid.y += height;
    }
    if (boid.x > width) {
      boid.x -= width;
    }
    if (boid.y > height) {
      boid.y -= height;
    }
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
