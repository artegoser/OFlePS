<script lang="ts">
  export let title: string;
  export let buttonText: string = 'Submit';
  export let onSubmit: () => void;
</script>

<div
  class="variant-ghost-surface p-5 mx-5 rounded-2xl mt-2 flex flex-col gap-2 text center"
>
  <div class="flex justify-between">
    <div>{title}</div>
    <slot name="title" />
  </div>
  <slot />
  <button type="button" class="btn variant-filled-primary" on:click={onSubmit}>
    {buttonText}
  </button>
</div>
