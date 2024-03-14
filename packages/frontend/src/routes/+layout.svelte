<script lang="ts">
  import '../app.postcss';
  import { AppShell, AppBar, Toast } from '@skeletonlabs/skeleton';

  // Floating UI for Popups
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from '@floating-ui/dom';
  import { storePopup } from '@skeletonlabs/skeleton';
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  import { initializeStores } from '@skeletonlabs/skeleton';
  initializeStores();

  import { env } from '$env/dynamic/public';
  import { Client } from '@ofleps/client';
  import { writable, type Writable } from 'svelte/store';
  import { onMount, setContext } from 'svelte';
  import { goto } from '$app/navigation';
  import type { HexString } from '@ofleps/utils';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  const user: Writable<Client> = writable();
  user.set(new Client(env.PUBLIC_OFLEPS_URL || 'http://localhost:3000'));

  user.subscribe(async () => {
    if (browser) {
      if ($user.privateKey) return;

      const privk = window.localStorage.getItem('privk');
      if (!privk && $page.url.pathname !== '/auth') {
        goto('/auth');
      } else {
        await $user.login(privk as HexString);
      }
    }
  });

  setContext('user', user);
</script>

<Toast />

<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <strong class="text-xl uppercase">OFlePS</strong>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <a
          class="btn btn-sm variant-ghost-surface"
          href="https://github.com/artegoser/ofleps"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <!-- Page Route Content -->
  <slot />
</AppShell>
