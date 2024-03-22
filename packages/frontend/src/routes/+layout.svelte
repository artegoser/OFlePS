<script lang="ts">
  import '../app.postcss';
  import { AppShell, AppBar, Toast, Modal } from '@skeletonlabs/skeleton';

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
  import { afterNavigate, goto } from '$app/navigation';
  import type { HexString } from '@ofleps/utils';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  const user: Writable<Client> = writable();
  user.set(new Client(env.PUBLIC_OFLEPS_URL || 'http://localhost:8080'));

  async function authRedir() {
    if (browser) {
      if ($user.jwt) return;
      const savedJWT = window.localStorage.getItem('jwt_t');
      const savedTOTP = window.localStorage.getItem('totp_k');
      if (!savedJWT || !savedTOTP) {
        if ($page.url.pathname !== '/auth') goto('/auth');
      } else {
        try {
          await $user.setCredentials(savedJWT, savedTOTP);

          if (window.sessionStorage.getItem('loggedIn') !== 'true') {
            try {
              await $user.getUser();
              window.sessionStorage.setItem('loggedIn', 'true');
            } catch {
              window.localStorage.removeItem('jwt_t');
              window.localStorage.removeItem('totp_k');
              goto('/auth');
            }
          }
        } catch {
          goto('/auth');
        }
      }
    }
  }

  user.subscribe(authRedir);

  setContext('user', user);

  afterNavigate(() => {
    document.getElementById('page')?.scrollTo(0, 0);

    authRedir();
  });
</script>

<Toast />
<Modal />

<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <img class="h-10" src="/logo.png" alt="Ofleps Logo" />

        <a href="/my" class="btn btn-sm variant-ghost-surface mx-2">My</a>
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
  <span id="page"><slot /></span>
</AppShell>
