import Link from 'next/link';

export function Nav() {
  return (
    <header className="relative z-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="size-7" />
          <span className="font-display text-[16px] tracking-wide text-white">CARDGRAPH</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/app"
            className="rounded-lg px-3 py-2 text-[13px] text-ink-300 transition-colors hover:bg-white/6 hover:text-white"
          >
            Templates
          </Link>
          <Link
            href="/app"
            className="rounded-xl bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/16"
          >
            Open the editor
          </Link>
        </div>
      </nav>
    </header>
  );
}
