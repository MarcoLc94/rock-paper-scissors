const crypto = require('crypto');
const prompt = require('prompt-sync')();
const Table = require('cli-table3'); // Import cli-table3
const chalk = require('chalk');

class KeyGenerator {
  static createKey() {
    return crypto.randomBytes(32); // 256 bits
  }

  static createHMAC(secretKey, message) {
    return chalk.yellow(crypto.createHmac('sha256', secretKey).update(message).digest('hex'));
  }
}

class GameRules {
  constructor(availableMoves) {
    if (availableMoves.length % 2 === 0 || availableMoves.length < 3) {
      throw new Error(chalk.red('The number of moves must be odd and greater than or equal to 3.'));
    }
    this.availableMoves = availableMoves;
  }

  determineWinner(playerChoice, computerChoice) {
    const playerIndex = this.availableMoves.indexOf(playerChoice);
    const computerIndex = this.availableMoves.indexOf(computerChoice);
    const middleRange = Math.floor(this.availableMoves.length / 2);

    if (playerIndex === computerIndex) {
      return chalk.gray('Draw');
    }

    const winningMoves = [];
    for (let i = 1; i <= middleRange; i++) {
      winningMoves.push((playerIndex + i) % this.availableMoves.length);
    }

    return winningMoves.includes(computerIndex) ? chalk.green('Player wins!') : chalk.red('Computer wins!');
  }
}

class HelpMenu {
  static showHelpTable(availableMoves, rules, page = 1, pageSize = 5) {
    const totalMoves = availableMoves.length;
    const totalPages = Math.ceil(totalMoves / pageSize);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalMoves);

    console.log(chalk.blue(`Displaying page ${page} of ${totalPages}`));

    const helpTable = new Table({
      head: [chalk.bold('v PC\\User >')].concat(availableMoves), // Headers with emphasis
      colWidths: Array(availableMoves.length + 1).fill(12) // Adjust column width
    });

    for (const playerMove of availableMoves) {
      const row = [chalk.bold(playerMove)]; // Emphasize the player move
      for (const opponentMove of availableMoves) {
        if (playerMove === opponentMove) {
          row.push(chalk.gray('Draw'));
        } else {
          row.push(rules.determineWinner(playerMove, opponentMove).includes('Player') ? chalk.green('Win') : chalk.red('Lose'));
        }
      }
      helpTable.push(row);
    }

    console.log(chalk.blue('Help Table: The results are from your point of view.'));
    console.log(chalk.blue('Example: If you choose Rock and the computer chooses Paper, you Lose.'));
    console.log(helpTable.toString());

    if (page < totalPages) {
      console.log(chalk.green('Press Enter to see the next page.'));
    }
  }
}

class Game {
  constructor(availableMoves) {
    this.availableMoves = availableMoves;
    this.rules = new GameRules(availableMoves);
    this.secretKey = KeyGenerator.createKey();
    this.computerMove = this.availableMoves[Math.floor(Math.random() * this.availableMoves.length)];
    this.hmac = KeyGenerator.createHMAC(this.secretKey, this.computerMove);
  }

  start() {
    console.log(`HMAC: ${this.hmac}`);
    this.showMenu();

    const playerChoiceIndex = this.getPlayerChoice();
    if (playerChoiceIndex === -1) {
      console.log(chalk.red('Exiting the game...'));
      return;
    }

    const playerChoice = this.availableMoves[playerChoiceIndex - 1];
    console.log(chalk.blue(`Your choice: ${playerChoice}`));
    console.log(chalk.red(`Computer choice: ${this.computerMove}`));

    const result = this.rules.determineWinner(playerChoice, this.computerMove);
    console.log(result);
    console.log(`HMAC key: ${this.secretKey.toString('hex')}`);
  }

  showMenu() {
    console.log('Available moves:');
    this.availableMoves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log(chalk.red('0 - exit'));
    console.log(chalk.yellow('? - help'));
  }

  getPlayerChoice() {
    let playerInput = prompt('Enter your move: ');

    while (playerInput !== '0' && playerInput !== '?' && (isNaN(playerInput) || playerInput < 1 || playerInput > this.availableMoves.length)) {
      console.log(chalk.bgRed('Invalid option, please try again.'));
      this.showMenu();
      playerInput = prompt(chalk.bgGreen('Enter your move: '));
    }

    if (playerInput === '?') {
      HelpMenu.showHelpTable(this.availableMoves, this.rules); // Show help table with cli-table3
      return this.getPlayerChoice();
    }

    return parseInt(playerInput);
  }
}

function validateMoves(availableMoves) {
  if (availableMoves.length < 3 || availableMoves.length % 2 === 0 || new Set(availableMoves).size !== availableMoves.length) {
    console.error(chalk.bgRed('Error: Provide an odd number of non-repeated moves (>= 3). Example: rock paper scissors'));
    process.exit(1);
  }
}

const availableMoves = process.argv.slice(2);
validateMoves(availableMoves);

const game = new Game(availableMoves);
game.start();
