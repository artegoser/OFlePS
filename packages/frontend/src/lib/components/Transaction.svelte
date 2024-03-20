<script lang="ts">
  import { to_pretty_html } from '$lib';
  import type { Account, Transaction } from '@ofleps/client';
  import { slide } from 'svelte/transition';

  export let transaction: Transaction;
  export let account: Account | null;

  let isActive = false;

  const isIncome = transaction.to === account?.id;
</script>

<button
  class="flex flex-col gap-2"
  on:click={() => {
    isActive = !isActive;
  }}
>
  <div
    transition:slide
    class="variant-ghost-surface mt-2 p-2 px-5 rounded-2xl flex flex-row justify-between lg:items-center items-start gap-2"
  >
    <div class="flex flex-col gap-2">
      <div class="font-bold {isIncome ? 'text-success-500' : 'text-error-500'}">
        {isIncome ? '+' : '-'}
        {transaction.amount}
        {transaction.currencySymbol}
      </div>

      <div class="font-bold">
        {isIncome ? transaction.from : transaction.to}
      </div>
    </div>

    <div class="break-all hidden lg:block">
      {transaction.comment}
    </div>

    <div class="flex flex-col gap-2">
      <div>
        {new Date(transaction.date).toLocaleDateString()}
      </div>
    </div>
  </div>

  {#if isActive}
    <div class="flex flex-col gap-2 items-end p-5 text-start" transition:slide>
      <pre>{to_pretty_html(transaction)}</pre>
    </div>
  {:else if transaction.comment}
    <div
      class="ml-10 mr-5 break-all flex flex-col gap-2 items-end justify-self-end p-5 lg:hidden variant-soft-primary rounded-2xl rounded-tr-none"
      transition:slide
    >
      {transaction.comment}
    </div>
  {/if}
</button>
