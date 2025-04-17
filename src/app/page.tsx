// pages/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, RotateCcw, Users, Monitor, Trophy, AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

// Define types for game state
type CellValue = 'X' | 'O' | null;
type GameMode = 'computer' | 'twoPlayer';
type Theme = 'dark' | 'light';
type Winner = 'X' | 'O' | 'tie' | null;
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameHistoryItem {
  winner: 'X' | 'O' | 'tie';
  moves: number;
  computerStarts?: boolean;
}

interface ScoreState {
  X: number;
  O: number;
  ties: number;
}

interface WinnerResult {
  winner: CellValue | 'tie';
  line: number[];
}

export default function TicTacToe(): React.ReactElement {
  const [theme, setTheme] = useState<Theme>('dark');
  const [gameMode, setGameMode] = useState<GameMode>('computer');
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [scores, setScores] = useState<ScoreState>({ X: 0, O: 0, ties: 0 });
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [computerStarts, setComputerStarts] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aiLevel, setAiLevel] = useState<number>(50);
  const [learningData, setLearningData] = useState<Record<string, number>>({});
  const [gameCount, setGameCount] = useState<number>(0);

  // Toggle theme
  const toggleTheme = (): void => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  // Initialize theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Update AI difficulty based on slider
  useEffect(() => {
    if (aiLevel < 33) {
      setDifficulty('easy');
    } else if (aiLevel < 67) {
      setDifficulty('medium');
    } else {
      setDifficulty('hard');
    }
  }, [aiLevel]);

  // Check for winner
  const calculateWinner = (squares: CellValue[]): WinnerResult | null => {
    const lines: number[][] = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }

    if (squares.every(square => square !== null)) {
      return { winner: 'tie', line: [] };
    }

    return null;
  };

  // Get board state as string for learning data
  const getBoardStateKey = (boardState: CellValue[]): string => {
    return boardState.map(cell => cell === null ? '-' : cell).join('');
  };

  // Check for game end conditions
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      if (result.winner === 'tie') {
        setWinner('tie');
        setWinningLine([]);
        setGameStatus("It's a tie!");
        setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
        setGameHistory(prev => [...prev, { 
          winner: 'tie', 
          moves: moveCount,
          computerStarts
        }]);
        setGameCount(prev => prev + 1);
      } else if (result.winner === 'X' || result.winner === 'O') {
        const winningPlayer = result.winner as 'X' | 'O';
        setWinner(winningPlayer);
        setWinningLine(result.line);
        setGameStatus(`${winningPlayer} wins!`);
        setScores(prev => ({ 
          ...prev, 
          [winningPlayer]: prev[winningPlayer] + 1 
        }));
        setGameHistory(prev => [...prev, { 
          winner: winningPlayer, 
          moves: moveCount,
          computerStarts
        }]);
        
        // Update learning data
        if (gameMode === 'computer') {
          updateLearningData(result.winner);
        }
        
        setGameCount(prev => prev + 1);
      }
    } else {
      setGameStatus(`${isXNext ? 'X' : 'O'}'s turn`);
    }
  }, [board, moveCount, computerStarts, gameMode]);

  // Update AI learning data based on game outcome
  const updateLearningData = (winner: 'X' | 'O'): void => {
    const newLearningData = { ...learningData };
    
    // Extract move sequences from the current game
    const moveSequence: string[] = [];
    let tempBoard = Array(9).fill(null);
    
    for (let i = 0; i < moveCount; i++) {
      const player = (i % 2 === 0) !== computerStarts ? 'X' : 'O';
      const index = findDifference(board, tempBoard, player);
      if (index !== -1) {
        tempBoard[index] = player;
        moveSequence.push(getBoardStateKey(tempBoard));
      }
    }
    
    // Assign rewards/penalties based on outcome
    moveSequence.forEach((boardState, index) => {
      const isComputerMove = (index % 2 === 0 && computerStarts) || (index % 2 === 1 && !computerStarts);
      const value = newLearningData[boardState] || 0;
      
      if (winner === 'O' && isComputerMove) {
        // Computer wins - reinforce moves
        newLearningData[boardState] = value + (1 - index / moveCount);
      } else if (winner === 'X' && isComputerMove) {
        // Computer loses - penalize moves
        newLearningData[boardState] = value - (1 - index / moveCount);
      }
    });
    
    setLearningData(newLearningData);
  };

  // Find the difference between two boards to determine the last move
  const findDifference = (currentBoard: CellValue[], previousBoard: CellValue[], player: CellValue): number => {
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === player && previousBoard[i] === null) {
        return i;
      }
    }
    return -1;
  };

  // Computer move
  useEffect(() => {
    if (gameMode === 'computer' && 
        ((computerStarts && isXNext) || (!computerStarts && !isXNext)) && 
        !winner) {
      const timeoutId = setTimeout(() => {
        makeComputerMove();
      }, 600);
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isXNext, winner, gameMode, computerStarts]);

  // AI makes a move after starting a new game if computer starts
  useEffect(() => {
    if (gameMode === 'computer' && computerStarts && moveCount === 0 && !winner) {
      const timeoutId = setTimeout(() => {
        makeComputerMove();
      }, 600);
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computerStarts, moveCount, gameMode, winner]);

  // Make a move
  const handleClick = (index: number): void => {
    if (board[index] || winner || 
        (gameMode === 'computer' && 
         ((computerStarts && isXNext) || (!computerStarts && !isXNext)))) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = computerStarts ? (isXNext ? 'X' : 'O') : (isXNext ? 'X' : 'O');
    setBoard(newBoard);
    setIsXNext(!isXNext);
    setMoveCount(prev => prev + 1);
  };

  // Get available moves
  const getAvailableMoves = (currentBoard: CellValue[]): number[] => {
    return currentBoard.map((cell, index) => cell === null ? index : null)
      .filter((index): index is number => index !== null);
  };

  // Evaluate board for minimax algorithm
  const evaluateBoard = (boardState: CellValue[], depth: number): number => {
    const result = calculateWinner(boardState);
    
    if (result) {
      if (result.winner === 'tie') {
        return 0;
      }
      const computerSymbol = computerStarts ? 'X' : 'O';
      if (result.winner === computerSymbol) {
        return 10 - depth; // Prefer quicker wins
      } else {
        return depth - 10; // Avoid quick losses
      }
    }
    return 0;
  };

  // Minimax algorithm with alpha-beta pruning
  const minimax = (
    boardState: CellValue[], 
    depth: number, 
    isMaximizing: boolean, 
    alpha: number = -Infinity, 
    beta: number = Infinity
  ): { score: number; index?: number } => {
    const result = calculateWinner(boardState);
    
    // Terminal state
    if (result || depth === 0) {
      return { score: evaluateBoard(boardState, depth) };
    }
    
    const availableMoves = getAvailableMoves(boardState);
    
    // For learning-based choices, sometimes return early with a learned move
    if (depth === 1 && difficulty !== 'easy' && Math.random() < 0.8) {
      const currentStateKey = getBoardStateKey(boardState);
      const learnedMoveScores: { index: number; score: number }[] = [];
      
      availableMoves.forEach(index => {
        const tempBoard = [...boardState];
        tempBoard[index] = isMaximizing ? (computerStarts ? 'X' : 'O') : (computerStarts ? 'O' : 'X');
        const nextStateKey = getBoardStateKey(tempBoard);
        const learnedScore = learningData[nextStateKey] || 0;
        learnedMoveScores.push({ index, score: learnedScore });
      });
      
      if (learnedMoveScores.length > 0) {
        learnedMoveScores.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);
        // Sometimes pick one of the top moves based on learning
        if (Math.random() < 0.7) {
          const topMoves = learnedMoveScores.slice(0, Math.min(3, learnedMoveScores.length));
          const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
          return { score: selectedMove.score, index: selectedMove.index };
        }
      }
    }
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMoveIndex: number | undefined;
      
      for (const index of availableMoves) {
        const tempBoard = [...boardState];
        tempBoard[index] = computerStarts ? 'X' : 'O';
        
        const { score } = minimax(tempBoard, depth - 1, false, alpha, beta);
        
        if (score > bestScore) {
          bestScore = score;
          bestMoveIndex = index;
        }
        
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      
      return { score: bestScore, index: bestMoveIndex };
    } else {
      let bestScore = Infinity;
      let bestMoveIndex: number | undefined;
      
      for (const index of availableMoves) {
        const tempBoard = [...boardState];
        tempBoard[index] = computerStarts ? 'O' : 'X';
        
        const { score } = minimax(tempBoard, depth - 1, true, alpha, beta);
        
        if (score < bestScore) {
          bestScore = score;
          bestMoveIndex = index;
        }
        
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      
      return { score: bestScore, index: bestMoveIndex };
    }
  };

  // Smart computer move with adaptive difficulty
  const makeComputerMove = (): void => {
    const symbol = computerStarts ? 'X' : 'O';
    const emptySquares = getAvailableMoves(board);
    
    if (emptySquares.length === 0) return;
    
    let moveIndex: number;
    const difficultyFactor = Math.random() * 100;
    
    // Adjust minimax depth and randomness based on difficulty
    if (difficultyFactor > aiLevel) {
      // Make a random move occasionally based on difficulty
      moveIndex = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    } else {
      // Different minimax depths based on difficulty
      let minimaxDepth = 1;
      
      if (difficulty === 'medium') {
        minimaxDepth = emptySquares.length <= 7 ? 3 : 2;
      } else if (difficulty === 'hard') {
        minimaxDepth = emptySquares.length <= 7 ? 5 : 3;
      }
      
      // Use minimax to find the best move
      const { index } = minimax(board, minimaxDepth, true);
      moveIndex = index !== undefined ? index : emptySquares[0];
    }
    
    const newBoard = [...board];
    newBoard[moveIndex] = symbol;
    setBoard(newBoard);
    setIsXNext(!isXNext);
    setMoveCount(prev => prev + 1);
  };

  // Reset game and alternate who starts
  const resetGame = (): void => {
    setBoard(Array(9).fill(null));
    
    // Only alternate who goes first in computer mode
    if (gameMode === 'computer') {
      setComputerStarts(prev => !prev);
    } else {
      setIsXNext(true); // Always X first in two-player mode
    }
    
    setWinner(null);
    setWinningLine([]);
    setMoveCount(0);
  };

  // Reset scores
  const resetScores = (): void => {
    setScores({ X: 0, O: 0, ties: 0 });
    setGameHistory([]);
    setLearningData({});
    setGameCount(0);
    resetGame();
  };

  // Change game mode and reset the game
  const handleModeChange = (mode: string): void => {
    const newMode = mode as GameMode;
    setGameMode(newMode);
    setComputerStarts(false);
    resetGame();
  };

  // Format the current player display
  const getCurrentPlayerDisplay = (): string => {
    if (winner) return '';
    
    if (gameMode === 'computer') {
      const playerSymbol = isXNext ? 'X' : 'O';
      const computerSymbol = computerStarts ? 'X' : 'O';
      
      if ((isXNext && !computerStarts) || (!isXNext && computerStarts)) {
        return `Your turn (${playerSymbol})`;
      } else {
        return `Computer thinking... (${computerSymbol})`;
      }
    } else {
      return `${isXNext ? 'X' : 'O'}'s turn`;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Tic Tac Toe
          </h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch checked={theme === 'light'} onCheckedChange={toggleTheme} />
                  <Moon className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs defaultValue="computer" className="mb-6" onValueChange={handleModeChange} value={gameMode}>
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="computer" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" /> vs Computer
            </TabsTrigger>
            <TabsTrigger value="twoPlayer" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Two Players
            </TabsTrigger>
          </TabsList>
          <TabsContent value="computer">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Play against the computer. {computerStarts ? 'Computer plays first (X).' : 'You play first (X).'}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">AI Intelligence</span>
                  </div>
                  <Badge variant="outline">{difficulty}</Badge>
                </div>
                <Slider 
                  value={[aiLevel]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={(values) => setAiLevel(values[0])}
                  className="w-full" 
                />
              </div>
              
              {gameCount > 2 && (
                <div className="text-xs text-muted-foreground">
                  AI learning from your moves ({Object.keys(learningData).length} patterns learned)
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="twoPlayer">
            <p className="text-sm text-muted-foreground mb-4">
              Play against a friend on the same device.
            </p>
          </TabsContent>
        </Tabs>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant={isXNext ? "default" : "outline"}>X</Badge>
                <Badge variant={!isXNext ? "destructive" : "outline"}>O</Badge>
              </div>
              <div className="text-sm font-medium">
                {winner ? gameStatus : getCurrentPlayerDisplay()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Game board */}
            <div className="grid grid-cols-3 gap-3 bg-muted p-3 rounded-lg aspect-square">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  disabled={!!winner || (gameMode === 'computer' && 
                                        ((computerStarts && isXNext) || 
                                         (!computerStarts && !isXNext)))}
                  className={`
                    aspect-square flex items-center justify-center rounded-md text-3xl font-bold
                    bg-card hover:bg-accent 
                    ${winningLine.includes(index) ? 'ring-2 ring-offset-2 ring-green-500 ring-offset-background' : ''}
                    ${cell === 'X' ? 'text-blue-500' : cell === 'O' ? 'text-red-500' : ''}
                    transition-all duration-200 transform hover:scale-105
                  `}
                  aria-label={`Square ${index + 1}`}
                >
                  {cell}
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 gap-2">
            <Button variant="outline" onClick={resetGame} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> New Game
              {gameMode === 'computer' && (
                <Badge variant="outline" className="ml-1">
                  {!computerStarts ? 'Computer starts next' : 'You start next'}
                </Badge>
              )}
            </Button>
            <Button variant="secondary" onClick={resetScores} size="sm">
              Reset All
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-blue-500">{scores.X}</div>
                <div className="text-xs text-muted-foreground">X Wins</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">{scores.ties}</div>
                <div className="text-xs text-muted-foreground">Ties</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-red-500">{scores.O}</div>
                <div className="text-xs text-muted-foreground">O Wins</div>
              </div>
            </div>
            
            {gameHistory.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Games</h4>
                  <div className="space-y-1">
                    {gameHistory.slice(-3).reverse().map((game, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          {game.winner === 'tie' ? (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          ) : game.winner === 'X' ? (
                            <Badge variant="default" className="h-5">X</Badge>
                          ) : (
                            <Badge variant="destructive" className="h-5">O</Badge>
                          )}
                          <span>
                            {game.winner === 'tie' ? 'Tie' : `${game.winner} won`}
                            {gameMode === 'computer' && game.computerStarts !== undefined && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {game.computerStarts ? '(computer first)' : '(you first)'}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{game.moves} moves</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
