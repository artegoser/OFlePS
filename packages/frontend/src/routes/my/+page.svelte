<script lang="ts">
  import type { Client, Account } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  import { ArrowTrendingUp, PlusCircle, Icon } from 'svelte-hero-icons';

  export let data;

  const user: Writable<Client> = getContext('user');

  let name: string | undefined = data.user?.name;
  let accounts: Account[] = [];

  onMount(async () => {
    accounts = await $user.getAccounts();
  });
</script>

<div class="container mx-auto p-5 flex flex-col">
  <div class="h1 p-5 rounded-2xl flex flex-wrap justify-center gap-2">
    <div>
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
        <a href="/accounts/{account.id}" class="btn variant-ghost-primary">
          View
        </a>
      </div>
    {/each}
  </div>
</div>
