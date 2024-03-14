<script lang="ts">
  import type { Order } from '$lib';

  export let bids: Order[];
  export let asks: Order[];
</script>

<div class="variant-ghost-surface p-5 mx-5 rounded-2xl">
  <div class="flex justify-between">
    <div class="font-bold text-right">Price</div>
    <div class="font-bold">Quantity</div>
  </div>
  {#each bids as order}
    <div
      class="flex justify-between m-2 py-2 px-5 variant-ghost-success rounded-2xl"
    >
      <div class="text-right">{order.price}</div>
      <div>{order.quantity}</div>
    </div>
  {/each}
  <div
    class="flex justify-between m-2 py-2 px-5 variant-ghost-tertiary rounded-2xl"
  >
    <div class="text-right">{(bids[0]?.price + asks[0]?.price) / 2}</div>
    <div>Price</div>
  </div>
  {#each asks as order}
    <div
      class="flex justify-between m-2 py-2 px-5 variant-ghost-error rounded-2xl"
    >
      <div class="text-right">{order.price}</div>
      <div>{order.quantity}</div>
    </div>
  {/each}
</div>
