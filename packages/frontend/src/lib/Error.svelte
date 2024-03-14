<script lang="ts">
  import { Icon, XMark, ExclamationTriangle } from 'svelte-hero-icons';

  export let text: string;
  export let closed: boolean = false;
</script>

<aside class="alert variant-ghost-error">
  <!-- Icon -->
  <div><Icon src={ExclamationTriangle} size="64" /></div>
  <!-- Message -->
  <div class="alert-message">
    <h3 class="h3">Error</h3>
    <p>{text}</p>
  </div>
  <!-- Actions -->
  <div class="alert-actions">
    <button
      class="btn-icon variant-ghost-tertiary"
      on:click={() => (closed = true)}><Icon src={XMark} size="32" /></button
    >
  </div>
</aside>
