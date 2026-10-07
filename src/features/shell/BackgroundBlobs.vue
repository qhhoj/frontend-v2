<template>
  <div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div class="blob-1 absolute -top-48 -left-44 size-[720px] rounded-full" />
    <div class="blob-2 absolute top-56 -right-40 size-[760px] rounded-full" />
    <!-- Bottom-left, and gone on narrow or short viewports: there its centre would sink into blob-2's footprint. -->
    <div
      class="blob-3 absolute -bottom-72 -left-[350px] h-[600px] w-[700px] rounded-full max-md:hidden [@media(max-height:759px)]:hidden"
    />
  </div>
</template>
