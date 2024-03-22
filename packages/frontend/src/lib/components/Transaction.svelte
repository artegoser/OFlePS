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
    class="lg:w-96 w-full text-start variant-ghost-surface p-2 px-5 rounded-2xl flex justify-between lg:items-center items-start gap-2"
  >
    <div class="flex flex-col gap-2">
      <div class="font-bold {isIncome ? 'text-success-500' : 'text-error-500'}">
        {isIncome ? '+' : '-'}{transaction.amount}
        {transaction.currencySymbol}
      </div>

      <div class="text-center text-sm text-tertiary-500">
        {isIncome ? transaction.from : transaction.to}
      </div>
    </div>

    <div class="flex flex-col gap-2">
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
  </div>

  {#if isActive}
    <pre
      transition:slide
      class="text-start whitespace-pre-wrap lg:w-96 w-full break-words p-5 variant-soft-tertiary rounded-2xl rounded-tr-none">{to_pretty_html(
        transaction
      )}</pre>
  {/if}

  {#if transaction.comment && !isActive}
    <div
      class="text-start lg:w-96 w-full break-words p-5 variant-soft-primary rounded-2xl rounded-tr-none"
      transition:slide
    >
      {transaction.comment}
    </div>
  {/if}
</button>
