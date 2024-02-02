/////////////////////////////////////////
let networks = [];
let genomes = [];


let targetGenerationalPurgeThreshold = 0.5; //will try purge half of the bots


let networkSize = 10; //how many networks there are
let neuroneSize = 20; //how big each network's brain is
let errorInput = 0.12; //evolutionary mutation chance 0.5 max
let inputWeight = 0.8; // how much times bigger is the strength of mutation error on the input than output during breeding? (could have no use)


function getFitnessAll() { //run a generation and get all fitnesses
    let fitnesses = [];
    for (let i = 0; i < networks.length; i++) {
        fitnesses.push(normalisedScores[i]);
    }
    return fitnesses
}




function purgeGeneration(fitnesses) { //purge those who aren't good enough
    let remainingPredictedNumberOfPurged = networks.length;
    let i = 1;
    let networkDeclaredPurgedIndexes = [];

    // decrease purge threshold (i) by 0.05 until only half of the networks die
    while (remainingPredictedNumberOfPurged > networks.length / 1.5) {
        networkDeclaredPurgedIndexes = [];
        remainingPredictedNumberOfPurged = networks.length;
        for (let a = 0; a < networks.length; a++) {
            if (fitnesses[a] < i) {
                networkDeclaredPurgedIndexes.push(a);
                remainingPredictedNumberOfPurged -= 1;

            }
        }
        i -= 0.001
    }

    for (let i = 0; i < networkDeclaredPurgedIndexes.length; i++) {
        let index = networkDeclaredPurgedIndexes[i];
        networks.splice(index, 1);
        genomes.splice(index, 1);
        //normalisedScores.splice(index, 1)
    }
}

function getBestGenomes(fitnesses) {
    let returnTwoHighestFitnessesIndex = [0, 0]

    for (let i = 0; i < fitnesses.length; i++) {
        if (fitnesses[i][0] > fitnesses[returnTwoHighestFitnessesIndex[0]][0]) {
            returnTwoHighestFitnessesIndex[1] = returnTwoHighestFitnessesIndex[0]
            returnTwoHighestFitnessesIndex[0] = i
        }

    }
    return returnTwoHighestFitnessesIndex;
}


function generateGenomeOffSpring(genome1, genome2) {
    let error = Math.random() * (errorInput * 2) - errorInput
    let newGenome = [];

    for (let i = 0; i < neuroneSize; i++) {
        let input1 = Math.abs((genome1[i]["input"][0] + genome2[i]["input"][0]) / 2 + error * inputWeight);
        let input2 = Math.abs((genome1[i]["input"][1] + genome2[i]["input"][1]) / 2 + error * inputWeight);
        let input3 = Math.abs((genome1[i]["input"][2] + genome2[i]["input"][2]) / 2 + error * inputWeight);
        let input4 = Math.abs((genome1[i]["input"][3] + genome2[i]["input"][3]) / 2 + error * inputWeight);
        
        newGenome.push({ input: [input1, input2, input3, input4], output: [Math.abs((genome1[i]["output"][0] + genome2[i]["output"][0]) / 2 + error)] },);
    }
    return newGenome;
}


function regenerateNetworks(numberOfNetworks, fitnesses) {
    let bestGenomes = getBestGenomes(fitnesses);
    let genome1 = bestGenomes[0]
    let genome2 = bestGenomes[1]
    for (let i = 0; i < numberOfNetworks; i++) { // number of networks
        networks.push(new brain.NeuralNetwork());
        genomes.push(generateGenomeOffSpring(genomes[genome1], genomes[genome2]));
        networks[genomes.length - 1].train(genomes[genomes.length - 1]);
    }
}


function generateGenome() {  // generates the genomes
    let neurones = [];
    for (let i = 0; i < neuroneSize; i++) {
        neurones.push({ input: [Math.random(), Math.random(), Math.random(), Math.random()], output: [Math.random()] },);
    }
    return neurones
}

function generateNetworks(numberOfNetworks) {
    for (let i = 0; i < numberOfNetworks; i++) {// number of networks
        networks.push(new brain.NeuralNetwork());
        genomes.push(generateGenome());
        networks[i].train(genomes[i]);
    }
}

function getResultOne(enemyDirection, enemyDistance, playerX, playerY, index) {
    return networks[index].run([enemyDirection, enemyDistance, playerX, playerY])
}

function calculateBotDirection(enemyDirection, enemyDistance, playerX, playerY,index) {
    let desiredBotDirection = getResultOne(enemyDirection, enemyDistance, playerX, playerY, index);
    return desiredBotDirection * 360
}




/////////////////////////////////////////////



/// Game
/////////////

let enemyArr = [];
let playerArr = [];
let normalisedScores = [];

function Vector2D(x, y) {
    this.x = x;
    this.y = y;
}

function newGeneration() {
    //Canvas
    game.start();

    //Clear
    enemyArr = [];
    playerArr = [];
    normalisedScores = [];

    //--- SPAWNS PLAYERS
    for (let i = 0; i < networkSize; i++) {
        playerArr[i] = new Player(new Vector2D(game.canvas.width / 2, game.canvas.height / 2), new Vector2D(0, 0), "lightblue", 3, 18, i);
    }

    //--- SPAWNS NETWORKS
    generateNetworks(networkSize);
    
    //--- SPAWN RANDOM ENEMIES ALONG BORDER OF SCREEN
    let speed = 3;
    let random;
    for (let i = 0; i < 20; i++) {
        random = Math.random() * 10
        // enemyArr[i] = new Enemy(new Vector2D(600, 600), new Vector2D(0, 0), speed, 18);
        if (random <= 2.5) {    //top side
            enemyArr[i] = new Enemy(new Vector2D(Math.floor((Math.random() * game.canvas.width - 50) + 50), 70), new Vector2D(0, 0), speed, 9);
        } else if (random > 2.5 && random <= 5) {   //right side
            enemyArr[i] = new Enemy(new Vector2D(game.canvas.width - 50, Math.floor((Math.random() * game.canvas.height - 50) + 50)), new Vector2D(0, 0), speed, 9);
        } else if (random > 5 && random <= 7.5) {   //bottom side
            enemyArr[i] = new Enemy(new Vector2D(Math.floor((Math.random() * game.canvas.width - 50) + 50), game.canvas.height - 50), new Vector2D(0, 0), speed, 9);
        } else {                                   //left side
            enemyArr[i] = new Enemy(new Vector2D(50, Math.floor((Math.random() * game.canvas.height - 50) + 50)), new Vector2D(0, 0), speed, 9);
        }
    }   
}

//--- canvas functions
let game = { 
    start: function() {
        this.canvas = document.getElementById("canvas");
        this.ctx = canvas.getContext("2d");

        this.canvas.width = window.innerWidth - 30;
        this.canvas.height = window.innerHeight - 30;
    },
    
    stop: function() {
        this.ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
}


// player class
function Player(pos, vel, color, speed, radius, index) {  
    this.pos = pos;
    this.vel = vel;
    this.radius = radius;
    this.speed = speed;
    this.index = index;
    
    this.dead = false;
    this.score = 0;
    this.scorePushed = false;
    this.speedOneZero = 1;
    let scoreMax = 2000;

    //this.moving = false;    

    this.unnormalisedAngle = 1;
    this.angle = (this.unnormalisedAngle) * (Math.PI / 180);
    this.direction = new Vector2D(Math.cos(this.angle), Math.sin(this.angle))

    this.draw = function() {
        if (!this.dead) { //while player is alive
            game.ctx.beginPath();
            game.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
            game.ctx.fillStyle = color;
            game.ctx.fill();
            game.ctx.closePath();

            //--- score system - every frame alive increases score by 1 max 10000
            
            if (this.score < scoreMax) {
                this.score += 1;
            }
            game.ctx.font = '8pt Calibri';
            game.ctx.fillStyle = 'white';
            game.ctx.textAlign = 'center';
            game.ctx.fillText(this.score, this.pos.x, this.pos.y + 3);
            
        } else {
            if (!this.scorePushed) {
                normalisedScores.push(this.score / scoreMax);
                this.scorePushed = true;
                
                for (let i = 0; i < playerArr.length; i++){
                    if(i > this.index){
                        playerArr[i].updateIndex()
                    }
                }
    
                playerArr.splice(this.index, 1); 
            }
        }
    }

    this.update = function() {
        this.angle = (this.unnormalisedAngle) * (Math.PI / 180);
        this.direction = new Vector2D(Math.cos(this.angle), Math.sin(this.angle));
        this.pos.x += this.speed * this.direction.x * this.speedOneZero;
        this.pos.y += this.speed * this.direction.y * this.speedOneZero;
    }

    this.checkCollision = function() {
        // Collision - If touching enemies, or the entire player is out of the canvas, kill the player
        if (this.pos.x <= -18 || this.pos.y <= -18 || this.pos.x >= canvas.width + 18 || this.pos.y >= canvas.height + 18) {
            this.dead = true;

            return;
        }
        //this.moving = false;
        for(let i = 0; i < enemyArr.length; i++){
    
            let dx = this.pos.x - enemyArr[i].pos.x;
            let dy = this.pos.y - enemyArr[i].pos.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance < 18){
                this.dead = true;
    
                return;
            } else if (distance === 18){
                this.dead = true;
                return;
            }
            //--- BOT MOVEMENT
            let center = new Vector2D(game.canvas.width/2, game.canvas.height/2)
            if (distance < 150) {
                let angleA = Math.atan2(enemyArr[i].pos.y - this.pos.y, enemyArr[i].pos.x - this.pos.x); //Degrees from enemy
                let angleInDegrees = angleA * (180 / Math.PI);
                let enemyBearing = (Math.abs(angleInDegrees + 450) % 360);
                let normalisedEnemyBearing = enemyBearing / 360;
                let enemyDistance = distance;
                let normalisedEnemyDistance = enemyDistance / 150;
                let normalisedPlayerX = this.pos.x / game.canvas.width
                let normalisedPlayerY = this.pos.y / game.canvas.height
                this.unnormalisedAngle = calculateBotDirection(normalisedEnemyBearing, normalisedEnemyDistance, normalisedPlayerX, normalisedPlayerY, this.index);
                console.log(this.angle)
            } else{
                let angleA = Math.atan2(center.y - this.pos.y, center.x - this.pos.x); //Degrees from enemy
                let angleInDegrees = angleA * (180 / Math.PI);
                let enemyBearing = (Math.abs(angleInDegrees + 450) % 360);
                let normalisedEnemyBearing = enemyBearing / 360;
                let enemyDistance = 0;
                let normalisedEnemyDistance = enemyDistance / 150;
                let normalisedPlayerX = this.pos.x / game.canvas.width
                let normalisedPlayerY = this.pos.y / game.canvas.height
                this.unnormalisedAngle = calculateBotDirection(normalisedEnemyBearing, normalisedEnemyDistance, normalisedPlayerX, normalisedPlayerY, this.index);
                console.log(this.angle)
            }
        }

        

         
        // if(this.moving == false && this.pos.x == center.x && this.pos.y == center.y){
        //     this.speedOneZero = 0;  
        //     this.moving = false;
        // }else if(this.moving == false){
        //     this.speedOneZero = 1;
            
        //     this.unnormalisedAngle = enemyBearing;
        //     this.moving = true;
        // }
    }

    this.updateIndex = function(){
        this.index -= 1;
    }

}


// enemy class
function Enemy(pos, vel, speed, radius) {
    this.pos = pos;
    this.vel = vel;
    this.speed = speed;
    this.radius = radius;

    this.angle = Math.random() * 2 * Math.PI
    this.direction = new Vector2D(Math.cos(this.angle), Math.sin(this.angle))

    // --- draws enemy
    this.draw = function() {
        game.ctx.beginPath();
        game.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
        game.ctx.fillStyle = "red";
        game.ctx.fill();
        game.ctx.closePath();
    }
    // ---
    // --- updates position
    this.update = function() {
        this.pos.x += this.speed * this.direction.x;
        this.pos.y += this.speed * this.direction.y;
        this.checkEnemyBouncing()
    }

    this.checkEnemyBouncing = function(){
        if (this.pos.x <= this.radius) {
            this.direction.x = -this.direction.x;
        } else if (this.pos.x >= canvas.width - this.radius) {
            this.direction.x = -this.direction.x;
        } else if (this.pos.y <= this.radius) {
            this.direction.y = -this.direction.y;
        } else if (this.pos.y >= canvas.height - this.radius) {
            this.direction.y = -this.direction.y;
        }
    }
}


// listens for key strokes
// window.addEventListener("keydown", function(e) {
//     if (e.key == "a" || e.key == "ArrowLeft") {
//         player.left = true;
//     }
//     if (e.key == "d" || e.key == "ArrowRight") {
//         player.right = true;
//     }
//     if (e.key == "w" || e.key == "ArrowUp") {
//         player.up = true;
//     }
//     if (e.key == "s" || e.key == "ArrowDown") {
//         player.down = true;
//     }
// })

// window.addEventListener("keyup", function(e) {
//     if (e.key == "a" || e.key == "ArrowLeft") {
//         player.left = false;
//     }
//     if (e.key == "d" || e.key == "ArrowRight") {
//         player.right = false;
//     }
//     if (e.key == "w" || e.key == "ArrowUp") {
//         player.up = false;
//     }
//     if (e.key == "s" || e.key == "ArrowDown") {
//         player.down = false;
//     }
// })
// ---




//runs every frame
function animate() { //PROBLEM HERE //////////////////////
    let i = 0;
    window.requestAnimationFrame(animate);
    game.ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < playerArr.length; i++) {
        playerArr[i].draw();
        playerArr[i].update();
        playerArr[i].checkCollision();
        //console.log(playerArr[i].pos.x);
    }

    for (let i = 0; i < enemyArr.length; i++) {
        enemyArr[i].draw();
        enemyArr[i].update();
    }

    
     // if (i < 50 && playerArr.length == 0) {
     if (playerArr.length == 0) {
         //i++;
         purgeGeneration(getFitnessAll());
         //errorInput = (1 - fitnessTotalMean / fitnessesOutput.length) / 2 // error input gets smaller as we get closer
         regenerateNetworks(networkSize - networks.length, getFitnessAll());
         newGeneration();
     }
}
// ---
newGeneration();
animate();
