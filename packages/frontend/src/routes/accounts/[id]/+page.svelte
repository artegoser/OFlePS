<script lang="ts">
  export let data;

  import ActionAnchor from '$lib/components/ActionAnchor.svelte';

  import type { Client, Account, GroupedTransactions } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';
  import {
    TabGroup,
    type ModalSettings,
    type ToastSettings,
    Tab,
  } from '@skeletonlabs/skeleton';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

  import { slide } from 'svelte/transition';
  import { to_pretty_html } from '$lib';
  import Transaction from '$lib/components/Transaction.svelte';
  import ExchangeTransaction from '$lib/components/ExchangeTransaction.svelte';

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  const user: Writable<Client> = getContext('user');

  let account: Account | null;
  let groupedTransactions: GroupedTransactions = {
    transactions: [],
    exchange: [],
  };

  let page = 1;
  let tabSelected = 0;

  onMount(async () => {
    account = await $user.getAccountById(data.id);
    groupedTransactions = await $user.getTransactionsGrouped(data.id, page);
  });

  async function nextPage() {
    try {
      const groupedNew = await $user.getTransactionsGrouped(data.id, ++page);
      groupedTransactions.transactions.push(...groupedNew.transactions);
      groupedTransactions.exchange.push(...groupedNew.exchange);
    } catch (e: any) {
      const t: ToastSettings = {
        message: e.message,
        background: 'variant-ghost-error',
      };
      toastStore.trigger(t);
    }
  }

  function showModal(title: string, body: string) {
    const modal: ModalSettings = {
      type: 'alert',
      title,
      body: `<pre>${body}</pre>`,
    };
    modalStore.trigger(modal);
  }
</script>

<div class="container mx-auto p-5 flex flex-col">
  {#if account}
    <div
      class="h1 p-5 flex flex-wrap justify-center items-center gap-2"
      transition:slide
    >
      <div>
        {account?.name} ({account?.balance}
        {account?.currencySymbol})
      </div>
      <div>
        <button
          class="btn variant-ghost-surface"
          on:click={() => showModal(`Account info`, to_pretty_html(account))}
        >
          More info
        </button>
        <ActionAnchor href="/transfer/{data.id}">Transfer</ActionAnchor>
      </div>
    </div>
  {/if}

  <TabGroup justify="justify-center">
    <Tab bind:group={tabSelected} name="Transactions" value={0}>
      Transactions
    </Tab>
    <Tab bind:group={tabSelected} name="Exchange" value={1}>Exchange</Tab>

    <svelte:fragment slot="panel">
      <div class="flex flex-col gap-2">
        {#if tabSelected === 0}
          {#if groupedTransactions.transactions.length === 0}
            <div class="text-center">No transactions</div>
          {/if}
          {#each groupedTransactions.transactions as transaction}
            <Transaction {transaction} {account} />
          {/each}
        {:else if tabSelected === 1}
          {#if groupedTransactions.exchange.length === 0}
            <div class="text-center">No exchange transactions</div>
          {/if}
          {#each groupedTransactions.exchange as exchange_transaction_data}
            <ExchangeTransaction
              {exchange_transaction_data}
              onClick={() => {
                showModal(
                  `Exchange transaction info`,
                  to_pretty_html(exchange_transaction_data)
                );
              }}
            />
          {/each}
        {/if}
      </div>
    </svelte:fragment>
  </TabGroup>

  <div class="flex flex-col py-5">
    {#if groupedTransactions.transactions.length > 0}
      <div transition:slide>
        <button class="btn variant-ghost-primary" on:click={nextPage}>
          Next page
        </button>
      </div>
    {/if}
  </div>
</div>
