const STEPS = [
  {
    number: '01',
    title: 'Pick a template',
    body: 'Price trend, grade comparison, sale comparison, population report or a top-sales duo. All finished designs.',
  },
  {
    number: '02',
    title: 'Drop in your card',
    body: 'The backdrop is built from your own image — cover-scaled, heavily blurred and graded to your theme.',
  },
  {
    number: '03',
    title: 'Export',
    body: 'PNG or JPG at up to 2× for a still, GIF or MP4 for a perfectly looped one. Straight to your downloads.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-white/7 bg-ink-900/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="relative">
              <span className="font-display text-5xl leading-none text-white/10">{step.number}</span>
              <h3 className="mt-3 text-[17px] font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-400">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
