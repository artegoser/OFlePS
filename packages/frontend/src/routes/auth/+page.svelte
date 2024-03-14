<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import Toggle from '$lib/components/Toggle.svelte';
  import type { Client } from '@ofleps/client';
  import type { HexString } from '@ofleps/utils';
  import type { ToastSettings } from '@skeletonlabs/skeleton';
  import { getContext } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import Form from '$lib/components/Form.svelte';

  const toastStore = getToastStore();

  let type: boolean = true; // false = login, true = register

  let text = 'Register';
  $: text = type ? 'Register' : 'Login';

  let name: string = '';
  let email: string = '';
  let privateKey: string = '';

  const user: Writable<Client> = getContext('user');

  async function performAction() {
    try {
      if (type) {
        await $user.registerUser(name, email);
      } else {
        await $user.login(privateKey as HexString);
      }

      if (browser) {
        localStorage.setItem('privk', $user.privateKey as HexString);
      } else {
        throw new Error('No browser');
      }

      goto('/my');
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
  <Form title={text} buttonText={text} onSubmit={performAction}>
    <svelte:fragment slot="title"
      ><Toggle bind:checked={type} />
    </svelte:fragment>

    {#if type}
      <input class="input" type="text" placeholder="Name" bind:value={name} />
      <input
        class="input"
        type="email"
        placeholder="Email"
        bind:value={email}
      />
    {:else}
      <input
        class="input"
        type="text"
        placeholder="Private key"
        bind:value={privateKey}
      />
    {/if}
  </Form>
</div>
