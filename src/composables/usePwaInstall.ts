import { ref, onMounted, onBeforeUnmount } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

const deferred = ref<BeforeInstallPromptEvent | null>(null)
const installable = ref(false)
const installed = ref(false)

let listenersAttached = false

function onPrompt(e: Event) {
  e.preventDefault()
  deferred.value = e as BeforeInstallPromptEvent
  installable.value = localStorage.getItem(DISMISS_KEY) !== '1'
}

function onInstalled() {
  installed.value = true
  installable.value = false
  deferred.value = null
}

export function usePwaInstall() {
  onMounted(() => {
    if (listenersAttached) return
    listenersAttached = true
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      installed.value = true
    }
  })

  onBeforeUnmount(() => {
    // keep listeners alive across route changes; only detach on full teardown
  })

  async function install() {
    const evt = deferred.value
    if (!evt) return
    await evt.prompt()
    const { outcome } = await evt.userChoice
    if (outcome === 'accepted') {
      installed.value = true
    }
    installable.value = false
    deferred.value = null
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    installable.value = false
  }

  return { installable, installed, install, dismiss }
}
