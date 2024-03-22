<script lang="ts">
  import { goto } from '$app/navigation';
  import Toggle from '$lib/components/Toggle.svelte';
  import type { Client } from '@ofleps/client';
  import type { ToastSettings } from '@skeletonlabs/skeleton';
  import { getContext } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import Form from '$lib/components/Form.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import Cookies from 'js-cookie';
  import { trigger_error } from '$lib';

  const toastStore = getToastStore();

  let type: boolean = false; // false = login, true = register

  let text = 'Register';
  $: text = type ? 'Register' : 'Login';

  let alias: string = '';
  let password: string = '';
  let name: string = '';
  let email: string = '';

  const user: Writable<Client> = getContext('user');

  async function performAction() {
    try {
      if (type) {
        await $user.registerUser(alias, password, name, email);
      } else {
        await $user.signin(alias, password);
      }

      localStorage.setItem('jwt_t', $user.jwt!);
      Cookies.set('user_alias', alias);

      goto('/my');
    } catch (e: any) {
      trigger_error(toastStore, e);
    }
  }
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <Form title={text} buttonText={text} onSubmit={performAction}>
    <svelte:fragment slot="title">
      <Toggle bind:checked={type} />
    </svelte:fragment>

    {#if type}
      <TextInput label="Alias" bind:value={alias} />
      <TextInput label="Name" bind:value={name} />
      <TextInput label="Email" bind:value={email} />
      <TextInput label="Password" secure bind:value={password} />
    {:else}
      <TextInput label="Alias" bind:value={alias} />
      <TextInput label="Password" secure bind:value={password} />
    {/if}
  </Form>
</div>
