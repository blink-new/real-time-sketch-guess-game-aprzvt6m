
import React, { useState, useRef } from "react";
import { UserPlus, Users, Brush, Send, Timer, Trophy } from "lucide-react";
import clsx from "clsx";

const COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#A66CFF", "#FFB5E8"
];
const BG = "#F7F8FA";
const PRIMARY = "#4D96FF";
const FONT = "'Baloo 2', 'Quicksand', sans-serif";

const MOCK_WORDS = ["cat", "banana", "rocket", "pizza", "giraffe"];
const MOCK_USERS = [
  { id: 1, name: "You", color: COLORS[0] },
  { id: 2, name: "Alex", color: COLORS[1] },
  { id: 3, name: "Sam", color: COLORS[2] },
];

function randomWord() {
  return MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)];
}

function randomName() {
  const names = ["Alex", "Sam", "Jamie", "Taylor", "Jordan", "Morgan"];
  return names[Math.floor(Math.random() * names.length)];
}

function useFakeTimer(start: boolean, seconds: number, onEnd: () => void) {
  const [time, setTime] = useState(seconds);
  React.useEffect(() => {
    if (!start) return;
    setTime(seconds);
    if (seconds === 0) return;
    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [start, seconds]);
  return time;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<"home" | "lobby" | "game" | "results">("home");
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [users, setUsers] = useState(MOCK_USERS);
  const [isSketcher, setIsSketcher] = useState(true);
  const [word, setWord] = useState(randomWord());
  const [guesses, setGuesses] = useState<{ name: string; guess: string; correct?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [drawing, setDrawing] = useState<{ x: number; y: number; color: string }[][]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [timerStart, setTimerStart] = useState(false);
  const [scores, setScores] = useState<{ name: string; score: number }[]>([
    { name: "You", score: 0 },
    { name: "Alex", score: 0 },
    { name: "Sam", score: 0 },
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingNow, setDrawingNow] = useState(false);

  // Drawing logic (local only for now)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isSketcher) return;
    setDrawingNow(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing((prev) => [...prev, [{ x, y, color }]]);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingNow || !isSketcher) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), [...last, { x, y, color }]];
    });
  };
  const handlePointerUp = () => setDrawingNow(false);

  React.useEffect(() => {
    // Draw on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawing.forEach((line) => {
      ctx.beginPath();
      line.forEach((pt, i) => {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 4;
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    });
  }, [drawing]);

  // Timer
  const time = useFakeTimer(timerStart, 60, () => {
    setScreen("results");
    setTimerStart(false);
  });

  // UI Handlers
  const handleCreateRoom = () => {
    setRoom(Math.random().toString(36).slice(2, 7).toUpperCase());
    setName("You");
    setScreen("lobby");
  };
  const handleJoinRoom = () => {
    setRoom(room || Math.random().toString(36).slice(2, 7).toUpperCase());
    setName("You");
    setScreen("lobby");
  };
  const handleStartGame = () => {
    setScreen("game");
    setTimerStart(true);
    setIsSketcher(true);
    setWord(randomWord());
    setDrawing([]);
    setGuesses([]);
  };
  const handleSendGuess = () => {
    if (!input.trim()) return;
    const correct = input.trim().toLowerCase() === word;
    setGuesses((g) => [
      ...g,
      { name: "You", guess: input, correct },
    ]);
    setInput("");
    if (correct) {
      setScores((s) =>
        s.map((sc) =>
          sc.name === "You" ? { ...sc, score: sc.score + 10 } : sc
        )
      );
      setScreen("results");
      setTimerStart(false);
    }
  };
  const handleNextRound = () => {
    setIsSketcher((s) => !s);
    setWord(randomWord());
    setDrawing([]);
    setGuesses([]);
    setScreen("game");
    setTimerStart(true);
  };

  // UI Components
  const Home = () => (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: BG, fontFamily: FONT }}>
      <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-pink-400 to-yellow-400 drop-shadow-lg">Sketch & Guess</h1>
      <p className="mb-8 text-lg text-gray-600">Draw, guess, and have fun with friends in real-time!</p>
      <div className="flex gap-4">
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-pink-400 text-white font-bold shadow-lg hover:scale-105 transition"
          onClick={handleCreateRoom}
        >
          <UserPlus size={22} /> Create Room
        </button>
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-blue-400 text-blue-500 font-bold shadow hover:bg-blue-50 transition"
          onClick={() => setScreen("lobby")}
        >
          <Users size={22} /> Join Room
        </button>
      </div>
      <div className="mt-10 text-xs text-gray-400">Built with ❤️ by Blink</div>
    </div>
  );

  const Lobby = () => (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: BG, fontFamily: FONT }}>
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-blue-500">Room Code</h2>
        <div className="text-3xl font-mono mb-4 tracking-widest text-gray-800">{room || "ABCDE"}</div>
        <div className="mb-4 w-full">
          <div className="text-gray-500 mb-2">Players</div>
          <div className="flex gap-2 flex-wrap">
            {users.map((u) => (
              <span
                key={u.id}
                className="px-3 py-1 rounded-full font-semibold"
                style={{
                  background: u.color + "22",
                  color: u.color,
                  border: `1.5px solid ${u.color}`,
                }}
              >
                {u.name}
              </span>
            ))}
          </div>
        </div>
        <button
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-pink-400 text-white font-bold shadow-lg hover:scale-105 transition"
          onClick={handleStartGame}
        >
          <Brush size={20} className="inline mr-2" /> Start Game
        </button>
      </div>
      <button
        className="mt-8 text-blue-400 underline"
        onClick={() => setScreen("home")}
      >
        ← Back to Home
      </button>
    </div>
  );

  const Game = () => (
    <div className="flex flex-col min-h-screen" style={{ background: BG, fontFamily: FONT }}>
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-blue-400" />
          <span className="font-bold text-gray-700">Room: {room}</span>
        </div>
        <div className="flex items-center gap-4">
          <Timer size={20} className="text-yellow-400" />
          <span className="font-mono text-lg text-gray-700">{time}s</span>
        </div>
        <div className="flex items-center gap-2">
          {users.map((u) => (
            <span
              key={u.id}
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white border-2",
                isSketcher && u.name === "You" ? "border-pink-400 scale-110" : "border-gray-200"
              )}
              style={{ background: u.color }}
              title={u.name}
            >
              {u.name[0]}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col md:flex-row gap-6 p-6">
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className={clsx(
                "rounded-2xl border-2 border-blue-200 cursor-crosshair touch-none",
                !isSketcher && "opacity-80 pointer-events-none"
              )}
              style={{ background: "#F3F6FB" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {isSketcher && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={clsx(
                      "w-7 h-7 rounded-full border-2 transition",
                      color === c ? "border-pink-400 scale-110" : "border-white"
                    )}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            )}
            {!isSketcher && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-xl shadow text-lg font-bold text-blue-500">
                Guess the word!
              </div>
            )}
            {isSketcher && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-pink-400/90 px-4 py-2 rounded-xl shadow text-lg font-bold text-white tracking-widest">
                {word.toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow p-4 flex-1 flex flex-col">
            <div className="font-bold text-blue-400 mb-2">Chat</div>
            <div className="flex-1 overflow-y-auto mb-2 space-y-1">
              {guesses.length === 0 && (
                <div className="text-gray-400 text-sm">No guesses yet. Be the first!</div>
              )}
              {guesses.map((g, i) => (
                <div key={i} className={clsx(
                  "flex items-center gap-2",
                  g.correct ? "text-green-500 font-bold" : "text-gray-700"
                )}>
                  <span className="font-semibold">{g.name}:</span>
                  <span>{g.guess}</span>
                  {g.correct && <Trophy size={16} className="ml-1 text-yellow-400" />}
                </div>
              ))}
            </div>
            {!isSketcher && (
              <form
                className="flex gap-2"
                onSubmit={e => {
                  e.preventDefault();
                  handleSendGuess();
                }}
              >
                <input
                  className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Type your guess..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={time === 0}
                />
                <button
                  type="submit"
                  className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition"
                  disabled={time === 0}
                >
                  <Send size={18} />
                </button>
              </form>
            )}
            {isSketcher && (
              <div className="text-gray-400 text-xs mt-2">Waiting for guesses...</div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="font-bold text-pink-400 mb-2">Players</div>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => (
                <span
                  key={u.id}
                  className="px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: u.color + "22",
                    color: u.color,
                    border: `1.5px solid ${u.color}`,
                  }}
                >
                  {u.name}
                  {isSketcher && u.name === "You" && (
                    <span className="ml-1 text-xs text-pink-400">(Sketcher)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Results = () => (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: BG, fontFamily: FONT }}>
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-pink-400">Round Over!</h2>
        <div className="mb-4 text-lg text-gray-700">
          The word was: <span className="font-bold text-blue-500">{word.toUpperCase()}</span>
        </div>
        <div className="mb-4 w-full">
          <div className="text-gray-500 mb-2">Scores</div>
          <div className="flex flex-col gap-1">
            {scores
              .sort((a, b) => b.score - a.score)
              .map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="font-bold text-lg" style={{ color: COLORS[i % COLORS.length] }}>
                    {i === 0 && <Trophy size={18} className="inline text-yellow-400 mr-1" />}
                    {s.name}
                  </span>
                  <span className="ml-auto font-mono">{s.score} pts</span>
                </div>
              ))}
          </div>
        </div>
        <button
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-blue-400 text-white font-bold shadow-lg hover:scale-105 transition"
          onClick={handleNextRound}
        >
          Next Round
        </button>
      </div>
      <button
        className="mt-8 text-blue-400 underline"
        onClick={() => setScreen("home")}
      >
        ← Back to Home
      </button>
    </div>
  );

  // Main render
  return (
    <div>
      {screen === "home" && <Home />}
      {screen === "lobby" && <Lobby />}
      {screen === "game" && <Game />}
      {screen === "results" && <Results />}
    </div>
  );
};

export default App;