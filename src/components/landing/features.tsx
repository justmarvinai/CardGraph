import {
  Crop, Film, Layers, Lock, MousePointerClick, Palette, Sun, TrendingUp,
} from 'lucide-react';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Charts that follow your data',
    body: 'Type dates and prices; the curve, the percentage, the arrow colour and the axis labels update as you go.',
  },
  {
    icon: Palette,
    title: 'Every colour is yours',
    body: 'Accent, text, chart, panel and background are all editable — presets to start from, a picker when you want exact.',
  },
  {
    icon: Sun,
    title: 'Light and dark',
    body: 'One switch restyles the whole graphic. Both themes are designed, not auto-inverted.',
  },
  {
    icon: Crop,
    title: 'Six formats',
    body: '4:5, 1:1, 9:16, 16:9, 4:3 and 3:4. Change format and the layout rebuilds around your content.',
  },
  {
    icon: Film,
    title: 'Loops that actually loop',
    body: 'Hover, sway, float or tilt your card, then export a GIF or MP4 with a seam you cannot see.',
  },
  {
    icon: MousePointerClick,
    title: 'Edit as much or as little',
    body: 'Fill in the form and you are done — or drag, resize, restyle and add your own text and logos.',
  },
  {
    icon: Layers,
    title: 'Save your own presets',
    body: 'Keep a design you like and apply it to the next card in one click. Export presets to move them between devices.',
  },
  {
    icon: Lock,
    title: 'Your images stay yours',
    body: 'Everything runs in your browser. No account, no server, no upload of your card photos.',
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="max-w-2xl font-display text-4xl leading-none tracking-tight text-white sm:text-5xl">
        BUILT FOR THE WAY <span className="text-accent">CARD PEOPLE POST</span>
      </h2>

      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title}>
            <span className="inline-grid size-9 place-items-center rounded-xl border border-accent/25 bg-accent/8 text-accent">
              <Icon className="size-4" />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-white">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
