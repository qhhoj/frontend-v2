<template>
  <!-- Phone: two small blobs, because the desktop-sized ones would cover each other on a 375 px screen. -->
  <div
    aria-hidden="true"
    class="blob-field pointer-events-none fixed inset-0 -z-10 overflow-hidden"
  >
    <div
      class="blob-1 absolute -top-24 -left-20 size-75 rounded-full md:-top-48 md:-left-44 md:size-180"
    />
    <div
      class="blob-2 absolute top-[420px] -right-24 size-75 rounded-full md:top-56 md:-right-40 md:size-190"
    />
    <!-- Bottom-left, and gone on narrow or short viewports: there its centre would sink into blob-2's footprint. -->
    <div
      class="blob-3 absolute -bottom-72 -left-[350px] h-150 w-175 rounded-full max-md:hidden [@media(max-height:759px)]:hidden"
    />
  </div>
</template>
