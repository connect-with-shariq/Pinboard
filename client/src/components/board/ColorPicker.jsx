import { NOTE_COLORS } from "../../utils/constants";

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker" role="radiogroup" aria-label="Note colour">
      {NOTE_COLORS.map((c) => (
        <button
          key={c}
          role="radio"
          aria-checked={c === value}
          className={`color-picker__dot ${c === value ? "color-picker__dot--active" : ""}`}
          style={{ background: c }}
          onClick={() => c !== value && onChange(c)}
          title="Change colour"
        />
      ))}
    </div>
  );
}
