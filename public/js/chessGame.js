const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
	const board = chess.board();
	boardElement.innerHTML = '';
	board.forEach((row, rowIndex) => {
		row.forEach((square, squareIndex) => {
			const squareElement = document.createElement('div');
			squareElement.classList.add(
				'square',
				(rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark'
			);

			squareElement.dataset.row = rowIndex;
			squareElement.dataset.col = squareIndex;

			if (square) {
				const pieceElement = document.createElement('div');
				pieceElement.classList.add(
					'piece',
					square.color === 'w' ? 'white' : 'black'
				);
				pieceElement.innerText = getPieceUnicode(square);
				pieceElement.draggable = playerRole === square.color;

				pieceElement.addEventListener('dragstart', (event) => {
					if (pieceElement.draggable) {
						draggedPiece = pieceElement;
						sourceSquare = { row: rowIndex, col: squareIndex };
						event.dataTransfer.setData('text/plain', '');
					}
				});

				pieceElement.addEventListener('dragend', (event) => {
					draggedPiece = null;
					sourceSquare = null;
				});

				squareElement.appendChild(pieceElement);
			}

			squareElement.addEventListener('dragover', function (event) {
				event.preventDefault();
			});

			squareElement.addEventListener('drop', function (event) {
				event.preventDefault();
				if (draggedPiece) {
					const targetSquare = {
						row: parseInt(squareElement.dataset.row),
						col: parseInt(squareElement.dataset.col),
					};

					handleMove(sourceSquare, targetSquare);
				}
			});
			boardElement.appendChild(squareElement);
		});
	});

	if (playerRole === 'b') {
		boardElement.classList.add('flipped');
	} else {
		boardElement.classList.remove('flipped');
	}
};

const handleMove = (source, target) => {
	const move = {
		from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
		to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
		promotion: 'q',
	};

	socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
	const unicodePieces = {
		r: '\u2656',
		n: '\u2658',
		b: '\u2657',
		q: '\u2655',
		k: '\u2654',
		p: '\u2659',
		R: '\u265C',
		N: '\u265E',
		B: '\u265D',
		Q: '\u265B',
		K: '\u265A',
		P: '\u265F',
	};

	return unicodePieces[piece.type] || '';
};

socket.on('playerRole', function (role) {
	playerRole = role;
	renderBoard();
});

socket.on('spectatorRole', function () {
	playerRole = null;
	renderBoard();
});

socket.on('boardState', function (fen) {
	chess.load(fen);
	renderBoard();
});

socket.on('move', function (move) {
	chess.move(move);
	renderBoard();
});

renderBoard();
