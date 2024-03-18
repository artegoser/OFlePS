<script>
  import { SlideToggle } from '@skeletonlabs/skeleton';

  export let checked = false;
  export let leftText = '';
  export let rightText = '';
  export let name = 'toggle';
</script>

<SlideToggle {name} size="sm" active="bg-primary-500" bind:checked>
  {checked ? leftText : rightText}
</SlideToggle>
