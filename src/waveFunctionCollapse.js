const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE  = 25;
const NB_TILES = [40, 28];
const tiles = [];

setCanvasSize();

let collapsedTiles = [];

const tilesTypes = {
    water: {
        name: "eau",
        color: "blue",
        adjacentTypes: ["sand", "water"],
        weight: 1
    },
    sand: {
        name: "sable",
        color: "orange",
        adjacentTypes: ["grass", "water", "sand"],
        weight: 2
    },
    grass: {
        name: "herbe",
        color: "lightgreen",
        adjacentTypes: ["sand", "forest", "grass"],
        weight: 2
    },
    forest: {
        name: "foret",
        color: "darkgreen",
        adjacentTypes: ["forest", "grass"],
        weight: 1
    }
}

const voidType = {
    name: "vide",
    color: 'darkgrey',
    adjacentTypes: Object.keys(tilesTypes)
}

function setCanvasSize() {
    canvas.width = NB_TILES[0]*TILE_SIZE;
    canvas.height = NB_TILES[1]*TILE_SIZE;

    document.getElementById("informations").style.left = (canvas.width + 10) + "px";
}

function initTiles() {
    for (let row = 0; row < (canvas.height); row += TILE_SIZE) {
        for (let col = 0; col < (canvas.width); col += TILE_SIZE) {
            tiles.push(new Tile(col, row));
        }
    }
}

async function collapseAllTiles() {
    for (let i in tiles) {
        collapseNextTile();
        await sleep(10)
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function collapseNextTile() {
    let tile = getTileWithLessEntropy();

    if (tile === null)
        return;

    collapsedTiles = [];
    (async () => {
        if (tile.allowedTypes.length > 0) {;
            const adjacentTiles = getAdjacentNotEmptyTiles(tile);
            const numberAdjacentTypes = {};

            tile.allowedTypes.forEach(allowedType => {
                numberAdjacentTypes[tilesTypes[allowedType].name] = 1;
            });

            adjacentTiles.forEach(adjacentTile => {
                if (numberAdjacentTypes[adjacentTile.type.name] !== undefined)
                    numberAdjacentTypes[adjacentTile.type.name]++;
            });
            console.log(numberAdjacentTypes)
            const totalTypes = Object.values(numberAdjacentTypes).reduce((total, number) => total + number);
            const random = Math.ceil(Math.random() * totalTypes);
            console.log(random)
            let sum = 0;
            for (let i in tile.allowedTypes) {
                let type = tilesTypes[tile.allowedTypes[i]];
                sum += numberAdjacentTypes[type.name];
                if (random <= sum) {
                    tile.type = type;
                    break;
                }
            }
        } else {
            tile.type = voidType;
        }

        await propagate(tile);
    })();

    draw();
}

function propagate(tile) {
    const adjacentTiles = getAdjacentEmptyTiles(tile).filter(adjacentTile => !collapsedTiles.includes(adjacentTile));
    collapsedTiles = [...collapsedTiles, ...adjacentTiles];
    adjacentTiles.forEach(adjacentTile => {
        (async () => {
            let previousAllowedAdjacentTypes = adjacentTile.allowedTypes;
            let allowedAdjacentTypes = [];
            if (tile.type === voidType) {
                tile.allowedTypes.forEach(allowedType => {
                    allowedAdjacentTypes = [...new Set([...allowedAdjacentTypes, ...tilesTypes[allowedType].adjacentTypes])];
                });
            } else {
                allowedAdjacentTypes = tile.type.adjacentTypes;
            }
            adjacentTile.allowedTypes = adjacentTile.allowedTypes.filter(allowedType => allowedAdjacentTypes.includes(allowedType));

            if (adjacentTile.allowedTypes.length < previousAllowedAdjacentTypes.length)
                await propagate(adjacentTile);
        })();
    });

}

function getTileWithLessEntropy() {
    let tilesWithLessEntropy = getTilesWithLessEntropy();
    return (tilesWithLessEntropy.length === 0 ? null : tilesWithLessEntropy[Math.floor(Math.random() * tilesWithLessEntropy.length)]);
}

function getTilesWithLessEntropy() {
    let tilesWithLessEntropy = [];
    let smallerEntropy = Math.log(Object.keys(tilesTypes).length);
    tiles.forEach(tile => {
        let tileEntropy = Math.log(tile.allowedTypes.length);
        if (tile.type === voidType) {
            if (tileEntropy === smallerEntropy) {
                tilesWithLessEntropy.push(tile);
            } else if (tileEntropy < smallerEntropy) {
                smallerEntropy = tileEntropy;
                tilesWithLessEntropy = [tile];
            }
        }
    });

    return tilesWithLessEntropy;
}

function getAdjacentEmptyTiles(tile) {
    const adjacentTiles = [];
    tiles.forEach(otherTile => {
        if (otherTile.type === voidType &&
            ((Math.abs(otherTile.x - tile.x) === TILE_SIZE && otherTile.y === tile.y) ||
            ((Math.abs(otherTile.y - tile.y) === TILE_SIZE) && otherTile.x === tile.x))) {
            adjacentTiles.push(otherTile);
        }
    });
    return adjacentTiles;
}

function getAdjacentNotEmptyTiles(tile) {
    const adjacentTiles = [];
    tiles.forEach(otherTile => {
        if (otherTile.type !== voidType &&
            ((Math.abs(otherTile.x - tile.x) === TILE_SIZE && otherTile.y === tile.y) ||
                ((Math.abs(otherTile.y - tile.y) === TILE_SIZE) && otherTile.x === tile.x))) {
            adjacentTiles.push(otherTile);
        }
    });
    return adjacentTiles;
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    tiles.forEach(tile => {
        tile.draw();
    });
}


function getTileAt(x, y) {
    let tileAt = null;

    let i = 0;
    while (tileAt === null && i < tiles.length) {
        let tile = tiles[i];
        if (x - tile.x <= TILE_SIZE && y - tile.y <= TILE_SIZE)
            tileAt = tile;
        i++;
    }

    return tileAt;
}

window.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        collapseNextTile();
    } else if (e.key === " ") {
        collapseAllTiles();
    }
});

window.addEventListener("resize", e => {
    setCanvasSize();
    draw();
})

canvas.addEventListener("mousemove", e => {
    const infos = document.getElementById("informations");
    infos.innerHTML = "";
    const tile = getTileAt(e.layerX, e.layerY);
    if (tile !== null) {
        infos.innerHTML += "Position : (" + tile.x + " ; " + tile.y + ")<br>";
        if (tile.type === voidType)
            infos.innerHTML += "Voisins autorisés : " + tile.allowedTypes.map(type => tilesTypes[type].name) + "<br>";
        else
            infos.innerHTML += "Type : " + tile.type.name + "<br>";

        infos.style.display = "block";
    }
});

canvas.addEventListener("mouseout", e => {
    document.getElementById("informations").style.display = 'none';
})


class Tile {
    x;
    y;
    type;
    allowedTypes;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = voidType;
        this.allowedTypes = Object.keys(tilesTypes);
    }

    draw() {
        let tilesWithLessEntropy = getTilesWithLessEntropy();
        ctx.fillStyle = this.type.color;
        ctx.strokeStyle = (tilesWithLessEntropy.includes(this)) ? 'red' : 'transparent';
        ctx.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
    }
}

initTiles();
draw();