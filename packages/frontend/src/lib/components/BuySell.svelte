<script lang="ts">
  import TextInput from './TextInput.svelte';

  export let from: string;
  export let to: string;

  export let onBuy: () => void;
  export let onSell: () => void;

  export let quantity: string = '0';
  export let price = '0';
</script>

<div class="variant-ghost-surface p-5 mx-5 rounded-2xl">
  <TextInput label="Quantity" bind:value={quantity} />
  <TextInput label="Price" bind:value={price} />
  <div class="grid grid-cols-2 gap-2 p-2">
    <button type="button" class="btn variant-ghost-success" on:click={onBuy}>
      Buy
    </button>
    <button type="button" class="btn variant-ghost-error" on:click={onSell}>
      Sell
    </button>
  </div>
  <div class="text-center">
    Buy/Sell {quantity}
    {from} for
    {parseFloat(quantity) * parseFloat(price)}
    {to}
  </div>
</div>
