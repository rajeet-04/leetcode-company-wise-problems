"use client";

import { ExtensionImportGuide } from "./extension-import-guide";

export function ImportGuide({ onClose }: { onClose: () => void; onImport: (ids: string[]) => void }) {
  return <ExtensionImportGuide onClose={onClose} />;
}
