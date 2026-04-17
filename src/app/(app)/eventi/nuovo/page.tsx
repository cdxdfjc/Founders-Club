import { createEvent } from "@/lib/actions/events";
import { SubmitButton } from "@/components/SubmitButton";
import { AiTextarea } from "@/components/AiTextarea";

export default function NuovoEventoPage() {
  return (
    <div className="rise max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
          Organizza un <span className="gradient-text">meetup</span>
        </h1>
        <p className="mt-3 text-ink/60 max-w-xl">
          Proponi un incontro di persona. Bastano due founder, un posto e
          un&apos;ora.
        </p>
      </header>

      <form action={createEvent} className="card p-6 sm:p-8 space-y-6">
        <div>
          <label htmlFor="title" className="label">
            Titolo
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={4}
            maxLength={120}
            placeholder="es. Caffè founder a Milano"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Descrizione
          </label>
          <AiTextarea
            name="description"
            required
            minLength={10}
            maxLength={4000}
            rows={4}
            placeholder="Cosa si farà, a chi è rivolto, tono dell'evento…"
            className="field resize-y min-h-[100px]"
            context="Descrizione di un meetup/evento per founder su Founders Club"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="label">
              Città
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              minLength={2}
              maxLength={80}
              placeholder="es. Milano"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="venue" className="label">
              Luogo
            </label>
            <input
              id="venue"
              name="venue"
              type="text"
              required
              minLength={2}
              maxLength={200}
              placeholder="es. Bar Basso, Via Plinio 39"
              className="field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="starts_at" className="label">
              Data e ora
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              className="field"
            />
          </div>
          <div>
            <label htmlFor="max_participants" className="label">
              Max partecipanti{" "}
              <span className="text-ink/40 font-normal">(opzionale)</span>
            </label>
            <input
              id="max_participants"
              name="max_participants"
              type="number"
              min={2}
              max={500}
              placeholder="Illimitati"
              className="field"
            />
          </div>
        </div>

        <SubmitButton
          className="btn-gradient !py-3 !px-6 w-full sm:w-auto"
          style={{
            background:
              "linear-gradient(135deg, #00A5E0 0%, #32CBFF 50%, #89A1EF 100%)",
          }}
          pendingLabel="Pubblico…"
        >
          ☕ Pubblica meetup
        </SubmitButton>
      </form>
    </div>
  );
}
