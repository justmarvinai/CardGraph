'use client';

import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, Eye, EyeOff,
  Lock, MousePointerSquareDashed, RotateCcw, Trash2, Unlock,
} from 'lucide-react';
import type { ChartNode, ImageNode, Node, TextNode, DividerNode, BadgeNode } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { useNodes } from '@/store/use-nodes';
import { FONTS, nearestWeight } from '@/engine/fonts';
import { Field, Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SliderRow } from '@/components/ui/slider';
import { Segmented } from '@/components/ui/segmented';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { BadgeField } from './badge-field';
import { cn } from '@/lib/cn';

/** Everything about the selected node — the "power user" path. */
export function PropertiesPanel() {
  const selection = useEditor((s) => s.selection);
  const nodes = useNodes();
  const updateNodes = useEditor((s) => s.updateNodes);
  const resetNode = useEditor((s) => s.resetNode);
  const removeNodes = useEditor((s) => s.removeNodes);
  const duplicateNodes = useEditor((s) => s.duplicateNodes);
  const reorderNode = useEditor((s) => s.reorderNode);
  const overrides = useEditor((s) => s.doc.overrides);

  const selected = nodes.filter((node) => selection.includes(node.id));

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <MousePointerSquareDashed className="size-6 text-ink-600" />
        <p className="text-[13px] text-ink-400">
          Select something on the canvas to restyle it — or use the Content tab to fill the template in.
        </p>
      </div>
    );
  }

  if (selected.length > 1) {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-ink-300">{selected.length} elements selected</p>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={() => duplicateNodes(selection)}>
            <Copy className="size-3.5" /> Duplicate
          </Button>
          <Button size="sm" variant="danger" onClick={() => removeNodes(selection)}>
            <Trash2 className="size-3.5" /> Remove
          </Button>
        </div>
      </div>
    );
  }

  const node = selected[0];
  const patch = (value: Partial<Node>) => updateNodes([{ id: node.id, patch: value }]);
  const isExtra = node.fromTemplate === false;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-white">{node.name}</p>
          <p className="text-[11px] capitalize text-ink-500">{node.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content={node.visible ? 'Hide' : 'Show'}>
            <button
              type="button"
              onClick={() => patch({ visible: !node.visible })}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
              aria-label={node.visible ? 'Hide element' : 'Show element'}
            >
              {node.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </button>
          </Tooltip>
          <Tooltip content={node.locked ? 'Unlock' : 'Lock'}>
            <button
              type="button"
              onClick={() => patch({ locked: !node.locked })}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
              aria-label={node.locked ? 'Unlock element' : 'Lock element'}
            >
              {node.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
            </button>
          </Tooltip>
          {overrides[node.id] && !isExtra && (
            <Tooltip content="Back to the template's own placement and styling">
              <button
                type="button"
                onClick={() => resetNode(node.id)}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
                aria-label="Reset element"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <Field label="X">
          <Input
            type="number"
            value={Math.round(node.x)}
            onChange={(e) => patch({ x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Y">
          <Input
            type="number"
            value={Math.round(node.y)}
            onChange={(e) => patch({ y: Number(e.target.value) })}
          />
        </Field>
        <Field label="Width">
          <Input
            type="number"
            value={Math.round(node.width)}
            onChange={(e) => patch({ width: Math.max(8, Number(e.target.value)) })}
          />
        </Field>
        <Field label="Height">
          <Input
            type="number"
            value={Math.round(node.height)}
            onChange={(e) => patch({ height: Math.max(0, Number(e.target.value)) })}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <SliderRow
          label="Rotation"
          value={node.rotation}
          min={-180}
          max={180}
          format={(v) => `${Math.round(v)}°`}
          onValueChange={(rotation) => patch({ rotation })}
        />
        <SliderRow
          label="Opacity"
          value={node.opacity}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onValueChange={(opacity) => patch({ opacity })}
        />
      </section>

      {node.type === 'text' && <TextProperties node={node} patch={patch} />}
      {node.type === 'image' && <ImageProperties node={node} patch={patch} />}
      {node.type === 'chart' && <ChartProperties node={node} patch={patch} />}
      {node.type === 'divider' && <DividerProperties node={node} patch={patch} />}
      {node.type === 'badge' && <BadgeProperties node={node} patch={patch} />}

      <section className="space-y-2 border-t border-white/7 pt-4">
        {isExtra && (
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" onClick={() => reorderNode(node.id, 'forward')}>
              <ArrowUp className="size-3.5" /> Forward
            </Button>
            <Button size="sm" variant="secondary" onClick={() => reorderNode(node.id, 'backward')}>
              <ArrowDown className="size-3.5" /> Backward
            </Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={() => duplicateNodes([node.id])}>
            <Copy className="size-3.5" /> Duplicate
          </Button>
          <Button size="sm" variant="danger" onClick={() => removeNodes([node.id])}>
            <Trash2 className="size-3.5" /> {isExtra ? 'Delete' : 'Hide'}
          </Button>
        </div>
      </section>
    </div>
  );
}

function TextProperties({ node, patch }: { node: TextNode; patch: (p: Partial<Node>) => void }) {
  const font = FONTS.find((f) => f.family === node.fontFamily) ?? FONTS[3];
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Text</h3>

      <Field label="Font">
        <Select
          value={node.fontFamily}
          onValueChange={(family) =>
            patch({ fontFamily: family, fontWeight: nearestWeight(family, node.fontWeight) } as Partial<Node>)
          }
          options={FONTS.map((f) => ({ value: f.family, label: f.family }))}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Weight">
          <Select
            value={String(node.fontWeight)}
            onValueChange={(weight) => patch({ fontWeight: Number(weight) } as Partial<Node>)}
            options={font.weights.map((w) => ({ value: String(w), label: String(w) }))}
          />
        </Field>
        <Field label="Size">
          <Input
            type="number"
            value={Math.round(node.fontSize)}
            onChange={(e) => patch({ fontSize: Math.max(6, Number(e.target.value)) } as Partial<Node>)}
          />
        </Field>
      </div>

      <Field label="Alignment">
        <Segmented
          value={node.align}
          onChange={(align) => patch({ align } as Partial<Node>)}
          className="w-full"
          size="sm"
          options={[
            { value: 'left', label: <AlignLeft className="mx-auto size-3.5" />, title: 'Left' },
            { value: 'center', label: <AlignCenter className="mx-auto size-3.5" />, title: 'Centre' },
            { value: 'right', label: <AlignRight className="mx-auto size-3.5" />, title: 'Right' },
          ]}
        />
      </Field>

      <SliderRow
        label="Letter spacing"
        value={node.letterSpacing}
        min={-0.08}
        max={0.4}
        step={0.005}
        format={(v) => `${(v * 100).toFixed(1)}%`}
        onValueChange={(letterSpacing) => patch({ letterSpacing } as Partial<Node>)}
      />
      <SliderRow
        label="Line height"
        value={node.lineHeight}
        min={0.8}
        max={2}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onValueChange={(lineHeight) => patch({ lineHeight } as Partial<Node>)}
      />

      <div className="flex items-center justify-between">
        <Label>Colour</Label>
        <ColorPicker value={node.color} onChange={(color) => patch({ color } as Partial<Node>)} label="Text" />
      </div>

      <Segmented
        value={node.transform}
        onChange={(transform) => patch({ transform } as Partial<Node>)}
        className="w-full"
        size="sm"
        options={[
          { value: 'none', label: 'As typed' },
          { value: 'uppercase', label: 'UPPERCASE' },
        ]}
      />

      <ToggleRow
        label="Shrink to fit"
        hint="Long card names stay on one line."
        checked={node.autoFit}
        onChange={(autoFit) => patch({ autoFit } as Partial<Node>)}
      />

      <GlowControls
        shadow={node.shadow}
        color={node.color}
        onChange={(shadow) => patch({ shadow } as Partial<Node>)}
      />
    </section>
  );
}

function ImageProperties({ node, patch }: { node: ImageNode; patch: (p: Partial<Node>) => void }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Image</h3>
      <Field label="Fit">
        <Segmented
          value={node.fit}
          onChange={(fit) => patch({ fit } as Partial<Node>)}
          className="w-full"
          size="sm"
          options={[
            { value: 'contain', label: 'Fit' },
            { value: 'cover', label: 'Fill' },
          ]}
        />
      </Field>
      <SliderRow
        label="Corner radius"
        value={node.radius}
        min={0}
        max={120}
        onValueChange={(radius) => patch({ radius } as Partial<Node>)}
      />
      <ToggleRow
        label="Mirror"
        checked={node.flipX}
        onChange={(flipX) => patch({ flipX } as Partial<Node>)}
      />
      <ToggleRow
        label="Animate this image"
        hint="Loop presets move every image marked as a card."
        checked={node.role === 'card'}
        onChange={(isCard) => patch({ role: isCard ? 'card' : 'extra' } as Partial<Node>)}
      />
      <GlowControls
        shadow={node.shadow}
        color="#000000"
        label="Shadow"
        onChange={(shadow) => patch({ shadow } as Partial<Node>)}
      />
    </section>
  );
}

function ChartProperties({ node, patch }: { node: ChartNode; patch: (p: Partial<Node>) => void }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Chart</h3>

      <Field label="Curve colour">
        <Segmented
          value={node.strokeMode}
          onChange={(strokeMode) => patch({ strokeMode } as Partial<Node>)}
          className="w-full"
          size="sm"
          options={[
            { value: 'auto', label: 'Follow trend' },
            { value: 'custom', label: 'Fixed' },
          ]}
        />
      </Field>
      {node.strokeMode === 'custom' && (
        <div className="flex items-center justify-between">
          <Label>Colour</Label>
          <ColorPicker value={node.stroke} onChange={(stroke) => patch({ stroke } as Partial<Node>)} label="Curve" />
        </div>
      )}

      <SliderRow
        label="Line width"
        value={node.strokeWidth}
        min={1}
        max={30}
        step={0.5}
        onValueChange={(strokeWidth) => patch({ strokeWidth } as Partial<Node>)}
      />
      <SliderRow
        label="Glow"
        value={node.glow}
        min={0}
        max={120}
        onValueChange={(glow) => patch({ glow } as Partial<Node>)}
      />
      <ToggleRow label="Smooth curve" checked={node.smooth} onChange={(smooth) => patch({ smooth } as Partial<Node>)} />
      <ToggleRow label="Panel" checked={node.showPanel} onChange={(showPanel) => patch({ showPanel } as Partial<Node>)} />
      {node.showPanel && (
        <>
          <div className="flex items-center justify-between">
            <Label>Panel colour</Label>
            <ColorPicker value={node.panelFill} onChange={(panelFill) => patch({ panelFill } as Partial<Node>)} label="Panel" />
          </div>
          <SliderRow
            label="Panel opacity"
            value={node.panelOpacity}
            min={0}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onValueChange={(panelOpacity) => patch({ panelOpacity } as Partial<Node>)}
          />
          <SliderRow
            label="Panel radius"
            value={node.panelRadius}
            min={0}
            max={160}
            onValueChange={(panelRadius) => patch({ panelRadius } as Partial<Node>)}
          />
        </>
      )}
      <ToggleRow label="Price axis" checked={node.showYAxis} onChange={(showYAxis) => patch({ showYAxis } as Partial<Node>)} />
      <ToggleRow label="Date axis" checked={node.showXAxis} onChange={(showXAxis) => patch({ showXAxis } as Partial<Node>)} />
      <ToggleRow label="Grid lines" checked={node.showGrid} onChange={(showGrid) => patch({ showGrid } as Partial<Node>)} />
      <SliderRow
        label="Axis text size"
        value={node.axisFontSize}
        min={8}
        max={80}
        onValueChange={(axisFontSize) => patch({ axisFontSize } as Partial<Node>)}
      />
      <div className="flex items-center justify-between">
        <Label>Axis colour</Label>
        <ColorPicker value={node.axisColor} onChange={(axisColor) => patch({ axisColor } as Partial<Node>)} label="Axis" />
      </div>
      <Field label="Axis font">
        <Select
          value={node.axisFontFamily}
          onValueChange={(axisFontFamily) => patch({ axisFontFamily } as Partial<Node>)}
          options={FONTS.map((f) => ({ value: f.family, label: f.family }))}
        />
      </Field>
    </section>
  );
}

function DividerProperties({ node, patch }: { node: DividerNode; patch: (p: Partial<Node>) => void }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Divider</h3>
      <Field label="Orientation">
        <Segmented
          value={node.orientation}
          onChange={(orientation) => patch({ orientation } as Partial<Node>)}
          className="w-full"
          size="sm"
          options={[
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
          ]}
        />
      </Field>
      <SliderRow
        label="Thickness"
        value={node.thickness}
        min={0.5}
        max={24}
        step={0.5}
        format={(v) => v.toFixed(1)}
        onValueChange={(thickness) => patch({ thickness } as Partial<Node>)}
      />
      <SliderRow
        label="Fade ends"
        value={node.fade}
        min={0}
        max={1}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onValueChange={(fade) => patch({ fade } as Partial<Node>)}
      />
      <div className="flex items-center justify-between">
        <Label>Colour</Label>
        <ColorPicker value={node.color} onChange={(color) => patch({ color } as Partial<Node>)} label="Divider" />
      </div>
    </section>
  );
}

function BadgeProperties({ node, patch }: { node: BadgeNode; patch: (p: Partial<Node>) => void }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Source mark</h3>
      <BadgeField
        kind={node.kind}
        badgeId={node.badgeId}
        text={node.text}
        assetId={node.assetId}
        onChange={(update) =>
          patch({
            ...(update.kind !== undefined ? { kind: update.kind as BadgeNode['kind'] } : {}),
            ...(update.badgeId !== undefined ? { badgeId: update.badgeId } : {}),
            ...(update.text !== undefined ? { text: update.text } : {}),
            ...(update.assetId !== undefined ? { assetId: update.assetId } : {}),
          } as Partial<Node>)
        }
      />
      <Field label="Caption">
        <Input value={node.caption} onChange={(e) => patch({ caption: e.target.value } as Partial<Node>)} />
      </Field>
      <div className="flex items-center justify-between">
        <Label>Mark colour</Label>
        <ColorPicker value={node.color} onChange={(color) => patch({ color } as Partial<Node>)} label="Mark" />
      </div>
      <div className="flex items-center justify-between">
        <Label>Caption colour</Label>
        <ColorPicker
          value={node.captionColor}
          onChange={(captionColor) => patch({ captionColor } as Partial<Node>)}
          label="Caption"
        />
      </div>
    </section>
  );
}

function GlowControls({
  shadow,
  color,
  label = 'Glow',
  onChange,
}: {
  shadow: TextNode['shadow'];
  color: string;
  label?: string;
  onChange: (shadow: TextNode['shadow']) => void;
}) {
  return (
    <div className="space-y-2">
      <ToggleRow
        label={label}
        checked={Boolean(shadow)}
        onChange={(on) =>
          onChange(on ? { color, blur: 40, offsetX: 0, offsetY: 0, opacity: 0.45 } : null)
        }
      />
      {shadow && (
        <>
          <SliderRow
            label="Blur"
            value={shadow.blur}
            min={0}
            max={200}
            onValueChange={(blur) => onChange({ ...shadow, blur })}
          />
          <SliderRow
            label="Offset Y"
            value={shadow.offsetY}
            min={-80}
            max={80}
            onValueChange={(offsetY) => onChange({ ...shadow, offsetY })}
          />
          <SliderRow
            label="Strength"
            value={shadow.opacity}
            min={0}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onValueChange={(opacity) => onChange({ ...shadow, opacity })}
          />
          <div className="flex items-center justify-between">
            <Label>Colour</Label>
            <ColorPicker
              value={shadow.color.startsWith('#') ? shadow.color : color}
              onChange={(next) => onChange({ ...shadow, color: next })}
              label={label}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-1">
      <span className="min-w-0">
        <span className="block text-[12px] text-ink-200">{label}</span>
        {hint && <span className="block text-[11px] leading-snug text-ink-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-ink-600',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  );
}
