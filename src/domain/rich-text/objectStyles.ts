import { z } from 'zod';

export const objectStyleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number().nonnegative(),
  cornerRadius: z.number().nonnegative(),
  opacity: z.number().min(0).max(1),
  shadow: z
    .object({
      color: z.string(),
      blur: z.number().nonnegative(),
      offsetX: z.number(),
      offsetY: z.number(),
    })
    .optional(),
});

export type ObjectStyle = z.infer<typeof objectStyleSchema>;

export const DEFAULT_OBJECT_STYLES: Record<string, ObjectStyle> = {
  urdu_border_frame: {
    id: 'urdu_border_frame',
    name: 'اردو بارڈر فریم',
    fill: 'transparent',
    stroke: '#0f172a',
    strokeWidth: 2,
    cornerRadius: 4,
    opacity: 1,
  },
  poetry_callout_box: {
    id: 'poetry_callout_box',
    name: 'شاعری باکس',
    fill: '#f8fafc',
    stroke: '#cbd5e1',
    strokeWidth: 1,
    cornerRadius: 8,
    opacity: 1,
    shadow: {
      color: 'rgba(0, 0, 0, 0.05)',
      blur: 4,
      offsetX: 0,
      offsetY: 2,
    },
  },
  headline_accent_box: {
    id: 'headline_accent_box',
    name: 'سرخی اٹیچڈ باکس',
    fill: '#1e293b',
    stroke: '#0f172a',
    strokeWidth: 0,
    cornerRadius: 2,
    opacity: 0.95,
  },
};
