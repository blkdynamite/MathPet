"use client";

export function NumberPad({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clr", "0", "⌫"];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            className="pad-key h-12"
            onClick={() => {
              if (k === "clr") onChange("");
              else if (k === "⌫") onChange(value.slice(0, -1));
              else if (value.length < 6) onChange(value + k);
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={value.length === 0}
        className="w-full py-3 rounded-2xl bg-numi-accent text-white font-bold text-lg shadow disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}
