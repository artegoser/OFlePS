<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import type { Client } from '@ofleps/client';
  import Form from '$lib/components/Form.svelte';
  import { goto } from '$app/navigation';

  import { getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';
  import TextInput from '$lib/components/TextInput.svelte';

  export let data;

  const toastStore = getToastStore();
  const user: Writable<Client> = getContext('user');

  let toAccountId: string = '';
  let amount: string = '';
  let comment: string = '';

  async function performAction() {
    try {
      await $user.transfer({
        from: data.from,
        to: toAccountId,
        amount: parseFloat(amount),
        comment,
      });

      goto(`/accounts/${data.from}`);
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
  <Form title="Transfer from {data.from}" onSubmit={performAction}>
    <TextInput bind:value={toAccountId} label="To account" />
    <TextInput bind:value={comment} label="Description" />
    <TextInput bind:value={amount} label="Amount" />
  </Form>
</div>
