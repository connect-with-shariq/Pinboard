import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useBoardNotes from "../../hooks/useBoardNotes";
import { useAuth } from "../../context/AuthContext";
import { BOARD_SIZE, NOTE_WIDTH } from "../../utils/constants";
import { ownerId } from "../../utils/helpers";
import NoteCard from "./NoteCard";
import BoardToolbar from "./BoardToolbar";
import EmptyBoard from "./EmptyBoard";

export default function Board({ board }) {
  const { user } = useAuth();
  const { notes, loading, actions } = useBoardNotes(board);
  const [focusId, setFocusId] = useState(null); // new note to focus for typing
  const viewportRef = useRef(null);
  const surfaceRef = useRef(null);
  const isPublic = board === "public";
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightId, setHighlightId] = useState(null);

  // Opened from a notification / home card: scroll to that note and flash it
  const focusNote = location.state?.focusNote;
  useEffect(() => {
    if (!focusNote || loading) return;
    const note = notes.find((n) => n._id === focusNote);
    const v = viewportRef.current;
    if (!note || !v) return;
    v.scrollTo({
      left: Math.max(0, note.position.x - v.clientWidth / 2 + NOTE_WIDTH / 2),
      top: Math.max(0, note.position.y - v.clientHeight / 3),
      behavior: "smooth",
    });
    setHighlightId(focusNote);
    navigate(location.pathname, { replace: true, state: null }); // don't jump again on refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNote, loading]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2600);
    return () => clearTimeout(t);
  }, [highlightId]);

  const addNoteAt = async (x, y) => {
    const note = await actions.createNote({ x: Math.max(0, x), y: Math.max(0, y) });
    if (note) setFocusId(note._id);
  };

  // Double-click on empty space -> new note exactly there
  const onDoubleClick = (e) => {
    if (e.target !== surfaceRef.current) return;
    addNoteAt(e.nativeEvent.offsetX - 20, e.nativeEvent.offsetY - 15);
  };

  // Toolbar button -> new note in the middle of what you're looking at
  const addNoteInView = () => {
    const v = viewportRef.current;
    addNoteAt(v.scrollLeft + v.clientWidth / 2 - NOTE_WIDTH / 2, v.scrollTop + v.clientHeight / 2 - 80);
  };

  return (
    <div className="board-wrap">
      <BoardToolbar isPublic={isPublic} count={notes.length} onAdd={addNoteInView} />

      <div className="board-viewport" ref={viewportRef}>
        <div
          ref={surfaceRef}
          className={`board-surface ${isPublic ? "board-surface--public" : ""}`}
          style={{ width: BOARD_SIZE.width, height: BOARD_SIZE.height }}
          onDoubleClick={onDoubleClick}
        >
          {notes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              isMine={String(ownerId(note)) === String(user._id)}
              isPublic={isPublic}
              autoFocus={note._id === focusId}
              highlight={note._id === highlightId}
              actions={actions}
              onStickNext={(n) => addNoteAt(n.position.x + NOTE_WIDTH + 24, n.position.y + 16)}
            />
          ))}
        </div>
      </div>

      {!loading && notes.length === 0 && <EmptyBoard isPublic={isPublic} />}
      {loading && <div className="board-loading"><div className="spinner" /></div>}
    </div>
  );
}
