const crypto = require('crypto');
const prompt = require('prompt-sync')();

class KeyGenerator {
  static generateKey() {
    return crypto.randomBytes(32); // 256 bits
  }

  static generateHMAC(key, message) {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }
}

class MoveRules {
  constructor(moves) {
    if (moves.length % 2 === 0 || moves.length < 3) {
      throw new Error('The number of moves must be an odd number greater than or equal to 3.');
    }
    this.moves = moves;
  }

  getResult(playerMove, computerMove) {
    const playerIndex = this.moves.indexOf(playerMove);
    const computerIndex = this.moves.indexOf(computerMove);
    const half = Math.floor(this.moves.length / 2);

    if (playerIndex === computerIndex) {
      return 'Draw';
    }

    const winRange = [];
    for (let i = 1; i <= half; i++) {
      winRange.push((playerIndex + i) % this.moves.length);
    }

    return winRange.includes(computerIndex) ? 'Player wins!' : 'Computer wins!';
  }
}

class HelpTable {
  static generateTable(moves, rules) {
    const table = [];
    const headers = ['Move'].concat(moves);

    table.push(headers.join(' | '));

    for (const move of moves) {
      const row = [move];
      for (const opponent of moves) {
        if (move === opponent) {
          row.push('Draw');
        } else {
          row.push(rules.getResult(move, opponent).includes('Player') ? 'Win' : 'Lose');
        }
      }
      table.push(row.join(' | '));
    }

    console.log(table.join('\n'));
  }
}

class Game {
  constructor(moves) {
    this.moves = moves;
    this.rules = new MoveRules(moves);
    this.key = KeyGenerator.generateKey();
    this.computerMove = this.moves[Math.floor(Math.random() * this.moves.length)];
    this.hmac = KeyGenerator.generateHMAC(this.key, this.computerMove);
  }

  play() {
    console.log(`HMAC: ${this.hmac}`);
    this.displayMenu();

    const playerMoveIndex = this.getPlayerMove();
    if (playerMoveIndex === -1) {
      console.log('Exiting the game...');
      return;
    }

    const playerMove = this.moves[playerMoveIndex - 1];
    console.log(`Your move: ${playerMove}`);
    console.log(`Computer move: ${this.computerMove}`);

    const result = this.rules.getResult(playerMove, this.computerMove);
    console.log(result);
    console.log(`HMAC key: ${this.key.toString('hex')}`);
  }

  displayMenu() {
    console.log('Available moves:');
    this.moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log('0 - exit');
    console.log('? - help');
  }

  getPlayerMove() {
    let move = prompt('Enter your move: ');

    while (move !== '0' && move !== '?' && (isNaN(move) || move < 1 || move > this.moves.length)) {
      console.log('Invalid choice, please try again.');
      this.displayMenu();
      move = prompt('Enter your move: ');
    }

    if (move === '?') {
      HelpTable.generateTable(this.moves, this.rules);
      return this.getPlayerMove();
    }

    return parseInt(move);
  }
}

function validateMoves(moves) {
  if (moves.length < 3 || moves.length % 2 === 0 || new Set(moves).size !== moves.length) {
    console.error('Error: Provide an odd number of non-repeating moves (>= 3). Example: rock paper scissors');
    process.exit(1);
  }
}

const moves = process.argv.slice(2);
validateMoves(moves);

const game = new Game(moves);
game.play();
