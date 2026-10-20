import Board from "../components/board/Board";

// board = "private" (my board) or "public"
export default function BoardPage({ board }) {
  // key forces a fresh board (scroll position, state) when switching tabs
  return <Board key={board} board={board} />;
}
