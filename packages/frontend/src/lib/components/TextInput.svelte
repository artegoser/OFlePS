<script lang="ts">
  export let label: string | undefined = undefined;
  export let placeholder: string = '';

  export let value: string = '';
  export let secure: boolean = false;
</script>

<div>
  <label class="label">
    {#if label}
      <span class="pl-4">{label}</span>
    {/if}
    {#if secure}
      <input class="input" type="password" {placeholder} bind:value />
    {:else}
      <input class="input" type="text" {placeholder} bind:value />
    {/if}
  </label>
</div>
