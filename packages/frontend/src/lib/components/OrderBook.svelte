<script lang="ts">
  import type { Order } from '@ofleps/client';
  import { slide } from 'svelte/transition';

  export let bids: Order[];
  export let asks: Order[];
</script>

<div class="variant-ghost-surface p-5 mx-5 rounded-2xl">
  <div class="flex justify-between">
    <div class="font-bold text-right">Price</div>
    <div class="font-bold">Quantity</div>
  </div>
  {#if bids.length === 0}
    <div class="text-center">No bids</div>
  {/if}
  {#each { length: bids.length } as _, index}
    {@const reverseIndex = bids.length - 1 - index}
    {@const order = bids[reverseIndex]}
    <div
      transition:slide
      class="flex justify-between m-2 py-2 px-5 variant-soft-success rounded-2xl"
    >
      <div class="text-right">{order.price}</div>
      <div>{order.quantity}</div>
    </div>
  {/each}
  <div
    class="flex justify-between m-2 py-2 px-5 variant-soft-tertiary rounded-2xl"
  >
    <div class="text-right">{(bids[0]?.price + asks[0]?.price) / 2 || 0}</div>
    <div>Price</div>
  </div>
  {#if asks.length === 0}
    <div class="text-center">No asks</div>
  {/if}
  {#each asks as order}
    <div
      transition:slide
      class="flex justify-between m-2 py-2 px-5 variant-soft-error rounded-2xl"
    >
      <div class="text-right">{order.price}</div>
      <div>{order.quantity}</div>
    </div>
  {/each}
</div>
