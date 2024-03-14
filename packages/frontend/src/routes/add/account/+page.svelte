<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import type { Client } from '@ofleps/client';
  import Form from '$lib/components/Form.svelte';
  import { goto } from '$app/navigation';

  import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
  import TextInput from '$lib/components/TextInput.svelte';

  const toastStore = getToastStore();
  const user: Writable<Client> = getContext('user');

  let name: string = '';
  let description: string = '';
  let currencySymbol: string = '';

  async function performAction() {
    try {
      const { id } = await $user.createAccount(
        name,
        description,
        currencySymbol
      );

      goto(`/accounts/${id}`);
    } catch (e: any) {
      const t: ToastSettings = {
        message: e.message,
        background: 'variant-filled-error',
      };
      toastStore.trigger(t);
    }
  }
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <Form title="Add account" onSubmit={performAction}>
    <TextInput bind:value={name} label="Name" />
    <TextInput bind:value={description} label="Description" />
    <TextInput bind:value={currencySymbol} label="Currency symbol" />
  </Form>
</div>
