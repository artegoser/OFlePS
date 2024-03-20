<script lang="ts">
  import type { Client, Account, PrivateOrder } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  import { ArrowTrendingUp, PlusCircle, Icon } from 'svelte-hero-icons';
  import { Tab, TabGroup } from '@skeletonlabs/skeleton';

  export let data;

  let tabSelected = 0;

  const user: Writable<Client> = getContext('user');

  let name: string | undefined = data.user?.name;
  let accounts: Account[] = [];
  let orders: PrivateOrder[] = [];

  onMount(async () => {
    accounts = await $user.getAccounts();
    orders = await $user.getOrders();
  });
</script>

<div class="container mx-auto p-5 flex flex-col">
  <div class="h1 p-5 rounded-2xl flex flex-wrap justify-center gap-2" in:slide>
    <div class="text-center">
      {name} accounts
    </div>
    <a href="/exchange" class="btn btn-sm variant-ghost-surface">
      <div class="pr-2"><Icon src={ArrowTrendingUp} size="24" /></div>
      Exchange
    </a>
    <a href="/add/account" class="btn variant-ghost-primary">
      <div class="pr-2"><Icon src={PlusCircle} size="24" /></div>
      Add
    </a>
  </div>
  <TabGroup justify="justify-center">
    <Tab bind:group={tabSelected} name="Accounts" value={0}>Accounts</Tab>
    <Tab bind:group={tabSelected} name="Orders" value={1}>Orders</Tab>
    <svelte:fragment slot="panel">
      {#if tabSelected === 0}
        <div class="flex flex-col gap-2">
          {#each accounts as account}
            <div
              transition:slide
              class="p-5 rounded-2xl flex flex-wrap justify-between items-center gap-2 {account.blocked
                ? 'variant-soft-error'
                : 'variant-soft-surface'}"
            >
              <div>
                {account.name}
                ({account.balance}
                {account.currencySymbol})
              </div>
              <a
                href="/accounts/{account.id}"
                class="btn variant-ghost-primary"
              >
                View
              </a>
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          {#each orders as order}
            <div
              transition:slide
              class="p-5 rounded-2xl flex flex-wrap justify-between items-center gap-2 {order.type
                ? 'variant-soft-success'
                : 'variant-soft-error'}"
            >
              <div>
                {order.fromCurrencySymbol}/{order.toCurrencySymbol}
              </div>

              <div>
                {order.type ? 'Buy' : 'Sell'}
                {order.quantity}
                {order.fromCurrencySymbol}
              </div>

              <div>Price: {order.price} {order.toCurrencySymbol}</div>

              <div>{new Date(order.date).toLocaleString()}</div>

              <button
                type="button"
                class="btn variant-soft-error"
                on:click={async () => {
                  await $user.cancelOrder(order.id);
                  orders = await $user.getOrders();
                  accounts = await $user.getAccounts();
                }}
              >
                Cancel
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </svelte:fragment>
  </TabGroup>
</div>
