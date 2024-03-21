<script lang="ts">
  import type { PrivateOrder } from '@ofleps/client';
  import { slide } from 'svelte/transition';

  export let order: PrivateOrder;
  export let onClick: () => void;
</script>

<div
  transition:slide
  class="lg:w-96 w-full variant-ghost-surface p-5 rounded-2xl flex flex-col flex-wrap justify-between gap-2"
>
  <div class="flex justify-between gap-2">
    <div>
      {order.fromCurrencySymbol}
    </div>

    <div>{new Date(order.date).toLocaleString()}</div>
  </div>

  <hr class="!border-t-4 w-full" />

  <div class="flex justify-between gap-2">
    <div>
      {order.type ? 'Purchase' : 'Sale'} by price:
    </div>
    <div>
      {order.price}
      {order.toCurrencySymbol}
    </div>
  </div>

  <div class="flex justify-between gap-2">
    <div>In total:</div>
    <div>
      {order.quantity * order.price}
      {order.toCurrencySymbol}
    </div>
  </div>

  <div class="flex justify-between gap-2">
    <div>Quantity:</div>
    <div>
      {order.quantity}
      {order.fromCurrencySymbol}
    </div>
  </div>

  <div class="flex justify-between gap-2">
    <div>To account:</div>
    <div>
      {order.accountId}
    </div>
  </div>

  <hr class="!border-t-4 w-full" />

  <button type="button" class="btn variant-soft-error" on:click={onClick}>
    Cancel
  </button>
</div>
