<script lang="ts">
  export let data;

  import ActionAnchor from '$lib/components/ActionAnchor.svelte';

  import type { Client, Account, Transaction } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';
  import type { ModalSettings, ToastSettings } from '@skeletonlabs/skeleton';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  const user: Writable<Client> = getContext('user');

  let account: Account | null = null;
  let transactions: Transaction[] = [];
  let page = 1;

  onMount(async () => {
    account = await $user.getAccountById(data.id);
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
  <div
    class="h1 p-5 rounded-2xl flex flex-wrap justify-center items-center gap-2"
  >
    <div>
      {account?.name} ({account?.balance}
      {account?.currencySymbol})
    </div>
    <div>
      <button
        class="btn variant-ghost-tertiary"
        on:click={() =>
          showModal(
            `ID: ${account?.id}`,
            `Description: ${account?.description}`
          )}
      >
        More info
      </button>
      <ActionAnchor href="/transfer/{data.id}">Transfer</ActionAnchor>
    </div>
  </div>

  <div class="flex flex-col gap-2">
    {#each transactions as transaction}
      <div
        class="p-2 rounded-2xl flex flex-wrap justify-between items-center gap-2 {transaction.to ===
        account?.id
          ? 'variant-ghost-success'
          : 'variant-ghost-error'}"
      >
        <div>
          {transaction.amount}
          {account?.currencySymbol}
        </div>

        <div class="break-all">
          {transaction.comment}
        </div>

        <div>
          {new Date(transaction.date).toLocaleString()}
        </div>

        <button
          class="btn variant-ghost-tertiary"
          on:click={() => {
            showModal(
              `ID: ${transaction.id}`,
              `From: ${transaction.from} To: ${transaction.to} Type: ${transaction.type}`
            );
          }}
        >
          More info
        </button>
      </div>
    {/each}
  </div>
</div>
