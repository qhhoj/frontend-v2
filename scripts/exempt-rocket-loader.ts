/**
 * The live site sits behind Cloudflare, whose Rocket Loader rewrites every `<script>` (type `<hash>-module`) and runs
 * them only after its own script has loaded: the app starts a round trip late and the pre-paint theme script runs
 * after first paint. `data-cfasync="false"` opts a script out.
 */
export function exemptFromRocketLoader(html: string) {
  return html.replace(/<script(?![^>]*\sdata-cfasync=)/g, '<script data-cfasync="false"');
}
