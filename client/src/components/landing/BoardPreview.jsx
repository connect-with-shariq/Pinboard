// Decorative cork board for the landing page hero (pure CSS, no images)
export default function BoardPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview__board">
        <div className="pnote pnote--yellow" style={{ top: "8%", left: "6%", "--r": "-4deg" }}>
          <span className="pnote__pin" />
          <p>Weekend plan 🌄<br />hike → chai → sunset</p>
        </div>

        <div className="pnote pnote--blue pnote--photo" style={{ top: "6%", left: "48%", "--r": "3deg" }}>
          <span className="pnote__pin" />
          <div className="pnote__img" />
          <p>New studio setup!</p>
        </div>

        <div className="pnote pnote--pink" style={{ top: "50%", left: "12%", "--r": "2deg" }}>
          <span className="pnote__pin" />
          <p>Idea: a recipe swap board for the whole hostel 🍜</p>
          <div className="pnote__meta"><span>❤️ 24</span><span>💬 8</span></div>
        </div>

        <div className="pnote pnote--green" style={{ top: "54%", left: "56%", "--r": "-3deg" }}>
          <span className="pnote__pin" />
          <p>▶ demo-final.mp4</p>
          <div className="pnote__video"><span>▶</span></div>
        </div>

        <div className="preview__bubble" style={{ top: "40%", left: "60%" }}>
          <b>@riya</b> love this!! 🔥
        </div>
        <div className="preview__cursor" style={{ top: "34%", left: "38%" }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="#3d4ed8" stroke="#fff" strokeWidth="1.5" /></svg>
          <span>aman</span>
        </div>
      </div>
    </div>
  );
}
