<script lang="ts">
  import type { Options } from '$lib';

  export let options: Options[];
  export let label: string = '';
  export let className: string = '';
  export let value: string;
  export let onChange: () => void = () => {};
</script>

<label class="label {className}">
  <span>{label}</span>
  <select class="select" bind:value on:change={onChange}>
    {#each options as option}
      <option value={option.value}>{option.title}</option>
    {/each}
  </select>
</label>
