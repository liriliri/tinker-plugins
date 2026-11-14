export const tw = {
  background: {
    app: 'vrm-app-wash',
    preview: 'vrm-preview-wash',
  },

  text: {
    primary: 'text-[var(--vrm-ink)]',
    muted: 'text-[var(--vrm-muted)]',
    secondary: 'text-[var(--vrm-secondary)]',
    danger: 'text-white',
  },

  toast: {
    error: 'vrm-toast bg-[var(--vrm-danger)]/92',
  },

  button: {
    icon: 'vrm-tool-btn',
    iconActive: 'vrm-tool-btn vrm-tool-btn-active',
  },

  dropzone: {
    default: 'vrm-dropzone',
    hover: 'vrm-dropzone vrm-dropzone-hot',
  },

  chrome: 'vrm-chrome',
  metaTitle: 'vrm-meta-title',
  metaSub: 'vrm-meta-sub',
  fadeIn: 'vrm-fade-in',

  overlay: {
    loading:
      'bg-[color-mix(in_srgb,var(--vrm-ink)_18%,transparent)] backdrop-blur-[2px]',
  },
}
