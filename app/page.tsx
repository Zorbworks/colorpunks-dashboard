import type { Metadata } from 'next';
import { ProjectPage } from '@/components/ProjectPage';

export const metadata: Metadata = {
  title: 'CWOMA.TOOLS/basewords',
};

/** Root renders the BaseWords project as the default landing. */
export default function RootPage() {
  return <ProjectPage project="basewords" />;
}
