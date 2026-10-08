<template>
  <section class="px-6 py-10">
    <h1 class="font-display text-2xl font-semibold">
      {{ $t($route.meta.titleKey ?? 'pages.admin') }}
    </h1>
    <p class="mt-2 text-muted">{{ $t('admin.shell.placeholder') }}</p>
  </section>
</template>
