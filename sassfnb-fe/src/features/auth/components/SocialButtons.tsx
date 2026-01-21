// src/features/auth/components/SocialButtons.tsx
type Props = {
  disabled?: boolean;
};

export default function SocialButtons({ disabled }: Props) {
  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Chưa bật social login"
      >
        <span className="text-white/70">Google</span>
        <span className="text-xs font-normal text-white/50">(demo UI)</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Chưa bật social login"
      >
        <span className="text-white/70">Microsoft</span>
        <span className="text-xs font-normal text-white/50">(demo UI)</span>
      </button>
    </div>
  );
}
