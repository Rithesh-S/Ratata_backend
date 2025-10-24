// const Position = require("../model/positionModel");

const Position = require("../model/positionModel");

// /**
//  * Represents a walkable path in the arena.
//  * @type {number}
//  */
// const PATH = 0;

// /**
//  * Represents a wall in the arena.
//  * @type {number}
//  */
// const WALL = 1; 

// /**
//  * Generates a symmetrical maze-like arena using a randomized depth-first search.
//  * The maze is generated on one half and then mirrored horizontally.
//  *
//  * @param {number} size The desired approximate size of the arena. Will be adjusted to the next odd number if even.
//  * @param {number} [spawnCount=2] The number of random spawn points to generate within the paths.
//  * @returns {{arena: number[][], spawns: number[][], spawnCount: number}} An object containing the 2D arena grid and an array of spawn point coordinates and the maximum spawn count.
//  */
// const generateArena = (size, spawnCount = 2) => {
//     if (size % 2 === 0) {
//         size++;
//     }
//     const arena = Array.from({ length: size }, () => Array(size).fill(WALL));
//     const carve = (x, y) => {
//         const directions = [
//             [0, 2], [0, -2], 
//             [2, 0], [-2, 0]  
//         ].sort(() => Math.random() - 0.5);

//         for (const [dx, dy] of directions) {
//             const [nx, ny] = [x + dx, y + dy];
//             if (nx > 0 && nx < size && ny > 0 && ny < size && arena[ny][nx] === WALL) {
//                 arena[ny][nx] = PATH;
//                 arena[y + dy / 2][x + dx / 2] = PATH;
//                 carve(nx, ny);
//             }
//         }
//     };

//     arena[1][1] = PATH;
//     carve(1, 1);

//     for (let y = 0; y < size; y++) {
//         for (let x = 0; x < Math.floor(size / 2); x++) {
//             arena[y][size - x - 1] = arena[y][x];
//         }
//     }

//     const spawns = [];
//     let attempts = 0;
//     const maxAttempts = 1000;

//     while (spawns.length < spawnCount && attempts < maxAttempts) {
//         const sx = Math.floor(Math.random() * size);
//         const sy = Math.floor(Math.random() * size);
//         if (arena[sy][sx] === PATH) {
//             spawns.push([sx, sy]);
//         }
//         attempts++;
//     }

//     return { arena, spawns, spawnCount };
// };


// module.exports = {
//     generateArena,
//     randomSpawnAssigner
// }

/**
 * Represents a walkable path in the arena.
 * @type {number}
 */
const PATH = 0;

/**
 * Represents a wall in the arena.
 * @type {number}
 */
const WALL = 1;

/**
 * Counts the number of wall neighbors around a given cell.
 * Considers out-of-bounds cells as walls to create a solid border.
 * @param {number[][]} grid The arena grid.
 * @param {number} x The x-coordinate of the cell.
 * @param {number} y The y-coordinate of the cell.
 * @returns {number} The count of adjacent wall tiles.
 */
const countWallNeighbors = (grid, x, y) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            const nx = x + i;
            const ny = y + j;

            if (nx < 0 || ny < 0 || nx >= grid[0].length || ny >= grid.length || grid[ny][nx] === WALL) {
                count++;
            }
        }
    }
    return count;
};

/**
 * Performs one step of the Cellular Automata simulation.
 * @param {number[][]} grid The current arena grid.
 * @param {object} rules The rules for cell survival and birth.
 * @param {number} rules.survivalThreshold A wall stays a wall if its neighbor count is this or higher.
 * @param {number} rules.birthThreshold A path becomes a wall if its neighbor count is this or higher.
 * @returns {number[][]} The grid after one simulation step.
 */
const runSimulationStep = (grid, rules) => {
    const newGrid = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(PATH));
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            const neighbors = countWallNeighbors(grid, x, y);
            if (grid[y][x] === WALL) {
                if (neighbors >= rules.survivalThreshold) {
                    newGrid[y][x] = WALL;
                }
            } else {
                if (neighbors >= rules.birthThreshold) {
                    newGrid[y][x] = WALL;
                }
            }
        }
    }
    return newGrid;
};

/**
 * Finds all connected path regions in the grid using a Breadth-First Search (BFS) flood fill.
 * @param {number[][]} grid The arena grid.
 * @returns {number[][][]} An array of regions, where each region is an array of [x, y] coordinates.
 */
const findRegions = (grid) => {
    const regions = [];
    const visited = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(false));

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] === PATH && !visited[y][x]) {
                const newRegion = [];
                const queue = [[x, y]];
                visited[y][x] = true;

                while (queue.length > 0) {
                    const [cx, cy] = queue.shift();
                    newRegion.push([cx, cy]);

                    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    for (const [dx, dy] of directions) {
                        const nx = cx + dx;
                        const ny = cy + dy;

                        if (
                            nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length &&
                            grid[ny][nx] === PATH && !visited[ny][nx]
                        ) {
                            visited[ny][nx] = true;
                            queue.push([nx, ny]);
                        }
                    }
                }
                regions.push(newRegion);
            }
        }
    }
    return regions;
};

/**
 * Carves a simple line between two points.
 * @param {number[][]} grid The arena grid to modify.
 * @param {number[]} start The starting [x, y] coordinate.
 * @param {number[]} end The ending [x, y] coordinate.
 * @param {number} radius The thickness of the tunnel.
 */
const carvePath = (grid, start, end, radius) => {
    let [x1, y1] = start;
    let [x2, y2] = end;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        for (let i = -radius; i <= radius; i++) {
           for (let j = -radius; j <= radius; j++) {
               if (Math.sqrt(i*i + j*j) <= radius) {
                   const px = x1 + i;
                   const py = y1 + j;
                   if (px >= 0 && py >= 0 && px < grid[0].length && py < grid.length) {
                       grid[py][px] = PATH;
                   }
               }
           }
        }

        if ((x1 === x2) && (y1 === y2)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 < dx) { err += dx; y1 += sy; }
    }
};

/**
 * Generates an arena using Cellular Automata, ensuring full connectivity.
 *
 * @param {object} [options={}] Configuration options for generation.
 * @param {number} [options.size=51] The size of the arena.
 * @param {number} [options.spawnCount=4] The number of spawn points to generate.
 * @param {number} [options.fillPercent=0.48] Initial random fill percentage for walls.
 * @param {number} [options.simulationSteps=6] Number of simulation iterations.
 * @param {number} [options.survivalThreshold=4] A wall needs this many neighbors to survive.
 * @param {number} [options.birthThreshold=5] A path needs this many neighbors to become a wall.
 * @param {number} [options.minRegionSize=20] Regions smaller than this will be filled in.
 * @returns {{arena: number[][], spawns: number[][]}} An object containing the connected 2D arena and spawn points.
 */
const generateArena = (options = {}) => {
    const {
        size = 51,
        spawnCount = 2,
        fillPercent = 0.48,
        simulationSteps = 6,
        survivalThreshold = 4,
        birthThreshold = 5,
        minRegionSize = 20
    } = options;

    // 1. GENERATE: Seed and simulate the Cellular Automata
    let arena = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => (Math.random() < fillPercent ? WALL : PATH))
    );

    const rules = { survivalThreshold, birthThreshold };
    for (let i = 0; i < simulationSteps; i++) {
        arena = runSimulationStep(arena, rules);
    }

    // 2. ANALYZE: Find all regions and clean up small ones
    let regions = findRegions(arena);
    regions.forEach(region => {
        if (region.length < minRegionSize) {
            region.forEach(([x, y]) => arena[y][x] = WALL);
        }
    });

    // 3. CONNECT: Re-find regions and connect them
    regions = findRegions(arena).sort((a, b) => b.length - a.length);

    if (regions.length > 1) {
        const mainRegion = regions.shift();
        const mainRegionPoints = new Set(mainRegion.map(([x, y]) => `${x},${y}`));

        for (const regionToConnect of regions) {
            let bestDist = Infinity;
            let bestPointA = null;
            let bestPointB = null;

            for (const pointA of regionToConnect) {
                for (const pointB of mainRegion) {
                    const dist = Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestPointA = pointA;
                        bestPointB = pointB;
                    }
                }
            }
            if (bestPointA && bestPointB) {
                carvePath(arena, bestPointA, bestPointB, 1);
            }
        }
    }
    
    // 4. PLACE SPAWNS: Use Heat Map (Distance Transform) for optimal placement
    const spawns = [];
    const pathCoords = [];
    for(let y = 0; y < size; y++) {
        for(let x = 0; x < size; x++) {
            if(arena[y][x] === PATH) {
                pathCoords.push([x, y]);
            }
        }
    }
    
    if (pathCoords.length > 0) {
        let attempts = 0;
        const maxAttempts = 1000;
        const minSpawnDistanceSq = Math.pow(size / spawnCount, 2); // Squared distance for efficiency

        while (spawns.length < spawnCount && attempts < maxAttempts) {
            const potentialSpawn = pathCoords[Math.floor(Math.random() * pathCoords.length)];
            let isValid = true;

            // Check distance from other spawns
            for (const existingSpawn of spawns) {
                const distSq = Math.pow(potentialSpawn[0] - existingSpawn[0], 2) + Math.pow(potentialSpawn[1] - existingSpawn[1], 2);
                if (distSq < minSpawnDistanceSq) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                spawns.push(potentialSpawn);
            }
            attempts++;
        }
    }

    return { arena, spawns, spawnCount };
    
};

const randomSpawnAssigner = (players, spawns) => {
    let availableSpawns = [...spawns];

    // Fisher-Yates shuffle to randomize spawn points
    for (let i = availableSpawns.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableSpawns[i], availableSpawns[j]] = [availableSpawns[j], availableSpawns[i]];
    }

    const playerIds = Object.keys(players);
    playerIds.forEach((e, i) => {
        // ADD THIS CHECK: Only assign a position if a spawn point exists
        if (availableSpawns[i]) {
            players[e].position = new Position(...availableSpawns[i]);
        } else {
            // Handle cases where there are more players than spawns
            console.error(`Warning: No spawn point available for player ${players[e].id}. Player index: ${i}`);
            // You might want to assign a default position or handle this case differently
            // For example: players[e].position = new Position(0, 0); 
        }
    });
    return players;
};


module.exports = {
    generateArena,
    randomSpawnAssigner
};