import { ref } from 'vue';

/** The contest whose announcements the app shell streams right now (the one the viewer is in), or null: contest pages leave that one to it. */
export const shellStreamKey = ref<string | null>(null);
