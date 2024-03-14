<script lang="ts">
  export let placeholder: string = '';
  export let value: string = '';
  export let label: string | undefined = undefined;
</script>

<div class="my-2">
  <label class="label">
    <span class="pl-4">{label}</span>
    <input class="input" type="text" {placeholder} bind:value />
  </label>
</div>
