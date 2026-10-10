import type { ComponentProps } from 'react';

// Use document navigation until the deployed Vinext client router is reliable.
export default function PageLink(props: ComponentProps<'a'>) {
  return <a {...props} />;
}
