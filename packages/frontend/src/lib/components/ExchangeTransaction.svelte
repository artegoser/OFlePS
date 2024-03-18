<script lang="ts">
  import type {
    Account,
    ExchangeTransactionData,
    Transaction,
  } from '@ofleps/client';
  import { slide } from 'svelte/transition';

  export let exchange_transaction_data: ExchangeTransactionData;

  export let onClick: () => void = () => {};

  let data = exchange_transaction_data.data;
  let transaction = exchange_transaction_data.transaction;

  let color: string;
  let isIncome: boolean;

  if (data.type === 'buy' || data.type === 'sell') {
    color = 'variant-soft-error';
    isIncome = false;
  } else if (data.type === 'buy_success' || data.type === 'sell_success') {
    color = 'variant-soft-success';
    isIncome = true;
  } else if (
    data.type === 'refund_unutilized_funds' ||
    data.type === 'cancel'
  ) {
    color = 'variant-soft-surface';
    isIncome = true;
  }
</script>

<div
  transition:slide
  class="p-2 px-5 rounded-2xl flex lg:flex-row flex-col justify-between lg:items-center items-start gap-2 {color}"
>
  <div>
    {isIncome ? '+' : '-'}
    {transaction.amount}
    {transaction.currencySymbol}
  </div>

  <div>
    {data.pair}
    {data.type}
    {data.quantity}
    for
    {data.price}
  </div>

  <div class="flex flex-col gap-2">
    <div></div>
    <button class="btn variant-soft-tertiary" on:click={onClick}>
      More info
    </button>
  </div>
</div>
