<script lang="ts">
  export let data;

  import ActionAnchor from '$lib/components/ActionAnchor.svelte';

  import type { Client, Account, Transaction } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';
  import type { ModalSettings, ToastSettings } from '@skeletonlabs/skeleton';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

  import { slide } from 'svelte/transition';
  import { to_pretty_html } from '$lib';

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  const user: Writable<Client> = getContext('user');

  let account: Account | null = data.account;
  let transactions: Transaction[] = [];
  let page = 1;

  onMount(async () => {
    transactions = await $user.getTransactions(data.id, page);
  });

  async function nextPage() {
    try {
      transactions.push(...(await $user.getTransactions(data.id, ++page)));
    } catch (e: any) {
      const t: ToastSettings = {
        message: e.message,
        background: 'variant-filled-error',
      };
      toastStore.trigger(t);
    }
  }

  function showModal(title: string, body: string) {
    const modal: ModalSettings = {
      type: 'alert',
      title,
      body,
    };
    modalStore.trigger(modal);
  }
</script>

<div class="container mx-auto p-5 flex flex-col">
  <div class="h1 p-5 flex flex-wrap justify-center items-center gap-2">
    <div>
      {account?.name} ({account?.balance}
      {account?.currencySymbol})
    </div>
    <div>
      <button
        class="btn variant-filled-surface"
        on:click={() => showModal(`Account info`, to_pretty_html(account))}
      >
        More info
      </button>
      <ActionAnchor href="/transfer/{data.id}">Transfer</ActionAnchor>
    </div>
  </div>

  <div class="flex flex-col gap-2">
    {#each transactions as transaction}
      {@const isIncome = transaction.to === account?.id}
      <div
        transition:slide
        class="p-2 px-5 rounded-2xl flex lg:flex-row flex-col justify-between lg:items-center items-start gap-2 {isIncome
          ? 'variant-soft-success'
          : 'variant-soft-error'}"
      >
        <div>
          {isIncome ? '+' : '-'}
          {transaction.amount}
          {account?.currencySymbol}
        </div>

        <div class="break-all">
          {transaction.comment}
        </div>

        <div class="flex flex-col gap-2">
          <div>
            {new Date(transaction.date).toLocaleString()}
          </div>
          <button
            class="btn variant-soft-tertiary"
            on:click={() => {
              showModal(`Transaction info`, to_pretty_html(transaction));
            }}
          >
            More info
          </button>
        </div>
      </div>
    {/each}

    {#if transactions.length > 0}
      <div transition:slide>
        <button class="btn variant-filled-primary" on:click={nextPage}>
          Next page
        </button>
      </div>
    {/if}
  </div>
</div>
