<script lang="ts">
  import type { Client, Account } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';

  const user: Writable<Client> = getContext('user');

  let name: string | null = null;
  let accounts: Account[] = [];

  onMount(async () => {
    name = (await $user.getUserByPublicKey($user.publicKey!))?.name || null;
    accounts = await $user.getAccounts();
  });
</script>

<div class="container mx-auto p-5 flex flex-col">
  <div class="h1 p-5 rounded-2xl flex flex-wrap justify-center gap-2">
    <div>
      {name} accounts
    </div>
    <a href="/exchange" class="btn btn-sm variant-ghost-surface">Exchange</a>
    <a href="/add/account" class="btn variant-filled-primary">Add</a>
  </div>

  <div class="flex flex-col gap-2">
    {#each accounts as account}
      <div
        class="p-5 rounded-2xl flex flex-wrap justify-between items-center gap-2 {account.blocked
          ? 'variant-ghost-error'
          : 'variant-ghost-surface'}"
      >
        <div>
          {account.name}
          ({account.balance}
          {account.currencySymbol})
        </div>
        <a href="/accounts/{account.id}" class="btn variant-filled-primary">
          View
        </a>
      </div>
    {/each}
  </div>
</div>
