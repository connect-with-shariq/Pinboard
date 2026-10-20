import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="note-sticker">
        <h1>404</h1>
        <p>This note fell off the board.</p>
        <Link className="btn btn--primary" to="/board">Back to my board</Link>
      </div>
    </div>
  );
}
