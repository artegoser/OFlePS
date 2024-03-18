<script lang="ts">
  import type { Client, Account, Granularity } from '@ofleps/client';
  import type { Writable } from 'svelte/store';
  import { getContext, onMount } from 'svelte';
  import Form from '$lib/components/Form.svelte';
  import SelectInput from '$lib/components/SelectInput.svelte';

  import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
  import { goto } from '$app/navigation';

  export let data;

  const toastStore = getToastStore();

  let granularities: Granularity[] = data.granularities;
  let accounts: Account[] = data.accounts;

  let fromValue: string = accounts[0].id;
  let toValue: string = accounts[1].id;
  let granularityValue: string = granularities[0].granularity;

  function performAction() {
    const from = findAccountById(fromValue);
    const to = findAccountById(toValue);

    if (!from || !to || from.id === to.id) {
      return toastStore.trigger({
        message: 'Invalid accounts',
        background: 'variant-filled-error',
      });
    }

    goto(
      `/exchange/${from.currencySymbol}/${to.currencySymbol}/${granularityValue}/${from.id}/${to.id}`
    );
  }

  function findAccountById(id: string) {
    return accounts.find((a) => a.id === id);
  }
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <Form title="Go to exchange" onSubmit={performAction} buttonText="Go">
    <SelectInput
      label="From"
      options={accounts.map((a) => ({
        title: `${a.name} (${a.balance} ${a.currencySymbol})`,
        value: a.id,
      }))}
      bind:value={fromValue}
    />
    <SelectInput
      label="To"
      options={accounts.map((a) => ({
        title: `${a.name} (${a.balance} ${a.currencySymbol})`,
        value: a.id,
      }))}
      bind:value={toValue}
    />

    <SelectInput
      label="Granularity"
      options={granularities.map((g) => ({
        title: g.granularity,
        value: g.granularity,
      }))}
      bind:value={granularityValue}
    />
  </Form>
</div>
