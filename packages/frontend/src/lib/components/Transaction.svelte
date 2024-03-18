<script lang="ts">
  import type { Account, Transaction } from '@ofleps/client';
  import { slide } from 'svelte/transition';

  export let transaction: Transaction;
  export let account: Account | null;

  export let onClick: () => void = () => {};

  const isIncome = transaction.to === account?.id;
</script>

<div
  transition:slide
  class="p-2 px-5 rounded-2xl flex lg:flex-row flex-col justify-between lg:items-center items-start gap-2 {isIncome
    ? 'variant-soft-success'
    : 'variant-soft-error'}"
>
  <div>
    {isIncome ? '+' : '-'}
    {transaction.amount}
    {transaction.currencySymbol}
  </div>

  <div class="break-all">
    {transaction.comment}
  </div>

  <div class="flex flex-col gap-2">
    <div>
      {new Date(transaction.date).toLocaleString()}
    </div>
    <button class="btn variant-soft-tertiary" on:click={onClick}>
      More info
    </button>
  </div>
</div>
