<script lang="ts">
  import { to_pretty_html } from '$lib';
  import type {
    Account,
    ExchangeTransactionData,
    Transaction,
  } from '@ofleps/client';
  import { slide } from 'svelte/transition';

  export let exchange_transaction_data: ExchangeTransactionData;

  let data = exchange_transaction_data.data;
  let transaction = exchange_transaction_data.transaction;

  let color: string;
  let isIncome: boolean;

  let isActive = false;

  if (data.type === 'buy' || data.type === 'sell') {
    color = 'text-error-500';
    isIncome = false;
  } else if (data.type === 'buy_success' || data.type === 'sell_success') {
    color = 'text-success-500';
    isIncome = true;
  } else if (
    data.type === 'refund_unutilized_funds' ||
    data.type === 'cancel'
  ) {
    color = 'text-tertiary-500';
    isIncome = true;
  }
</script>

<button
  class="flex flex-col gap-2 w-full"
  on:click={() => {
    isActive = !isActive;
  }}
>
  <div
    transition:slide
    class="text-start variant-ghost-surface p-2 px-5 rounded-2xl flex flex-row justify-between lg:items-center items-start gap-2"
  >
    <div class="font-bold {color}">
      {isIncome ? '+' : '-'}{transaction.amount}
      {transaction.currencySymbol}
    </div>

    <div>
      {data.pair}
      {data.type}
      {data.quantity}
      for
      {data.price}
    </div>

    <div>
      {new Date(transaction.date).toLocaleString([], {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
  </div>

  {#if isActive}
    <pre
      transition:slide
      class="text-start break-words whitespace-pre-wrap p-5 variant-soft-tertiary rounded-2xl rounded-tr-none">{to_pretty_html(
        exchange_transaction_data
      )}</pre>
  {/if}
</button>
