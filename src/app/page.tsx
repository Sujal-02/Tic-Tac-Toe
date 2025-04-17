// pages/index.js
'use client';
// pages/index.js
import { useState, useEffect } from 'react';
import { Sun, Moon, RotateCcw, Users, Monitor, Trophy, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TicTacToe() {
  const [theme, setTheme] = useState('dark');
  const [gameMode, setGameMode] = useState('computer');
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [gameStatus, setGameStatus] = useState('');
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });
  const [gameHistory, setGameHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  // Initialize theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Check for winner
  const calculateWinner = (squares) => {
    const lines = [
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

  // Check for game end conditions
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      if (result.winner === 'tie') {
        setWinner('tie');
        setWinningLine([]);
        setGameStatus("It's a tie!");
        setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
        setGameHistory(prev => [...prev, { winner: 'tie', moves: moveCount }]);
      } else {
        setWinner(result.winner);
        setWinningLine(result.line);
        setGameStatus(`${result.winner} wins!`);
        setScores(prev => ({ 
          ...prev, 
          [result.winner]: prev[result.winner] + 1 
        }));
        setGameHistory(prev => [...prev, { winner: result.winner, moves: moveCount }]);
      }
    } else {
      setGameStatus(`${isXNext ? 'X' : 'O'}'s turn`);
    }
  }, [board, moveCount]);

  // Computer move
  useEffect(() => {
    if (gameMode === 'computer' && !isXNext && !winner) {
      const timeoutId = setTimeout(() => {
        makeComputerMove();
      }, 600);
      return () => clearTimeout(timeoutId);
    }
  }, [isXNext, winner, gameMode]);

  // Make a move
  const handleClick = (index) => {
    if (board[index] || winner || (!isXNext && gameMode === 'computer')) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
    setMoveCount(prev => prev + 1);
  };

  // Computer's move
  const makeComputerMove = () => {
    // Simple AI: First try to win, then block, then pick center, then random
    const newBoard = [...board];
    
    // Check for winning move
    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) {
        newBoard[i] = 'O';
        if (calculateWinner(newBoard)?.winner === 'O') {
          setBoard(newBoard);
          setIsXNext(true);
          setMoveCount(prev => prev + 1);
          return;
        }
        newBoard[i] = null;
      }
    }
    
    // Check for blocking move
    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) {
        newBoard[i] = 'X';
        if (calculateWinner(newBoard)?.winner === 'X') {
          newBoard[i] = 'O';
          setBoard(newBoard);
          setIsXNext(true);
          setMoveCount(prev => prev + 1);
          return;
        }
        newBoard[i] = null;
      }
    }
    
    // Try to take center
    if (!newBoard[4]) {
      newBoard[4] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
      setMoveCount(prev => prev + 1);
      return;
    }
    
    // Pick a random available spot
    const emptySquares = newBoard.map((square, i) => square === null ? i : null).filter(i => i !== null);
    if (emptySquares.length > 0) {
      const randomIndex = emptySquares[Math.floor(Math.random() * emptySquares.length)];
      newBoard[randomIndex] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
      setMoveCount(prev => prev + 1);
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setMoveCount(0);
  };

  // Reset scores
  const resetScores = () => {
    setScores({ X: 0, O: 0, ties: 0 });
    setGameHistory([]);
    resetGame();
  };

  // Change game mode
  const handleModeChange = (mode) => {
    setGameMode(mode);
    resetGame();
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
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
            <TabsTrigger value="computer" className="flex items-center justify-center gap-2">
              <Monitor className="h-4 w-4" /> vs Computer
            </TabsTrigger>
            <TabsTrigger value="twoPlayer" className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" /> Two Players
            </TabsTrigger>
          </TabsList>
          <TabsContent value="computer">
            <p className="text-sm text-muted-foreground mb-4">
              Play against the computer. You are X, computer plays as O.
            </p>
          </TabsContent>
          <TabsContent value="twoPlayer">
            <p className="text-sm text-muted-foreground mb-4">
              Play against a friend on the same device.
            </p>
          </TabsContent>
        </Tabs>

        <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white'} mb-6`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant={isXNext ? "default" : "outline"}>X</Badge>
                <Badge variant={!isXNext ? "destructive" : "outline"}>O</Badge>
              </div>
              <div className="text-sm font-medium">
                {gameStatus}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Game board */}
            <div className={`grid grid-cols-3 gap-3 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} p-3 rounded-lg aspect-square`}>
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  disabled={!!winner || (!isXNext && gameMode === 'computer')}
                  className={`
                    aspect-square flex items-center justify-center rounded-md text-3xl font-bold
                    ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50'}
                    ${winningLine.includes(index) ? 'ring-2 ring-offset-2 ' + (theme === 'dark' ? 'ring-green-500 ring-offset-slate-900' : 'ring-green-500 ring-offset-white') : ''}
                    ${cell === 'X' ? 'text-blue-500' : cell === 'O' ? 'text-red-500' : ''}
                    transition-all duration-200 transform hover:scale-105
                  `}
                >
                  {cell}
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 gap-2">
            <Button variant="outline" onClick={resetGame} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> New Game
            </Button>
            <Button variant="secondary" onClick={resetScores} size="sm">
              Reset All
            </Button>
          </CardFooter>
        </Card>

        <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
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
                          <span>{game.winner === 'tie' ? 'Tie' : `${game.winner} won`}</span>
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