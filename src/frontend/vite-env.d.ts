/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CANISTER_ID_IP_ADDRESS_BACKEND: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 