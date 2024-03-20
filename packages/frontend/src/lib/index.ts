import type { ToastSettings } from '@skeletonlabs/skeleton';
import YAML from 'yaml';

export function dateToUtc(date: string) {
  return new Date(date).getTime() / 1000;
}

export interface Options {
  title: string;
  value: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function to_pretty_html(obj: any) {
  return YAML.stringify(obj, null, 2)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trigger_error(toastStore: any, error: any) {
  const t: ToastSettings = {
    message: error.message.replace(/\n/g, '<br/>'),
    background: 'variant-filled-error',
  };
  toastStore.trigger(t);
}
