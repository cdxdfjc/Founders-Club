import Image from "next/image";

export function ComingSoon({
  title,
  description,
  emoji = "🦄",
}: {
  title: string;
  description: string;
  emoji?: string;
}) {
  return (
    <div className="rise">
      <div className="flex items-center gap-3 mb-6">
        <div className="chip">
          <span>{emoji}</span>
          <span>Sezione</span>
        </div>
      </div>
      <h1 className="font-display-tight font-semibold text-5xl sm:text-7xl leading-[0.9] tracking-tighter">
        {title}
      </h1>
      <p className="mt-5 text-lg text-ink/70 max-w-2xl leading-relaxed">
        {description}
      </p>

      <div className="mt-14 card p-10 sm:p-14 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(50,203,255,0.15), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(239,156,218,0.2), transparent 60%)",
          }}
        />
        <div className="relative">
          <Image
            src="/unicorn-v2.png"
            alt=""
            width={140}
            height={140}
            className="mx-auto float drop-shadow-[0_20px_40px_rgba(137,161,239,0.4)]"
          />
          <h2 className="mt-6 font-display font-semibold text-2xl sm:text-3xl">
            In arrivo presto ✨
          </h2>
          <p className="mt-2 text-ink/60 max-w-md mx-auto">
            Stiamo lavorando a questa sezione. Sarà disponibile nei prossimi
            update.
          </p>
        </div>
      </div>
    </div>
  );
}
