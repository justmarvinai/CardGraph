'use client';

import { Pause, Play } from 'lucide-react';
import { useEditor } from '@/store/editor';
import { ANIMATION_PRESETS, frameCount } from '@/engine/animation';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { SliderRow } from '@/components/ui/slider';
import { cn } from '@/lib/cn';

/** Loop presets. Frame 0 and the last frame are identical, so any loop is seamless. */
export function AnimationPanel({
  playing,
  onPlayingChange,
}: {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
}) {
  const animation = useEditor((s) => s.doc.animation);
  const setAnimation = useEditor((s) => s.setAnimation);
  const animated = animation.preset !== 'none';

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Movement</h3>
        <div className="grid gap-1.5">
          {ANIMATION_PRESETS.map((preset) => {
            const active = animation.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setAnimation({ preset: preset.id })}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-accent/60 bg-accent/8'
                    : 'border-white/8 bg-ink-900/50 hover:border-white/18',
                )}
              >
                <span className={cn('block text-[13px] font-medium', active ? 'text-accent' : 'text-ink-100')}>
                  {preset.name}
                </span>
                <span className="block text-[11px] leading-snug text-ink-400">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {animated && (
        <>
          <section className="space-y-3">
            <SliderRow
              label="Duration"
              value={animation.durationMs}
              min={2000}
              max={6000}
              step={100}
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onValueChange={(durationMs) => setAnimation({ durationMs })}
            />
            <SliderRow
              label="Amount"
              value={animation.amplitude}
              min={0.2}
              max={2}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onValueChange={(amplitude) => setAnimation({ amplitude })}
            />
            <Field label="Frame rate">
              <Segmented
                value={String(animation.fps)}
                onChange={(fps) => setAnimation({ fps: Number(fps) as 24 | 30 })}
                className="w-full"
                size="sm"
                options={[
                  { value: '24', label: '24 fps' },
                  { value: '30', label: '30 fps' },
                ]}
              />
            </Field>
            <p className="text-[11px] leading-snug text-ink-400">
              {frameCount(animation)} frames · loops perfectly · exports as GIF or MP4.
            </p>
          </section>

          <Button
            variant={playing ? 'secondary' : 'primary'}
            className="w-full"
            onClick={() => onPlayingChange(!playing)}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? 'Stop preview' : 'Preview loop'}
          </Button>
        </>
      )}
    </div>
  );
}
