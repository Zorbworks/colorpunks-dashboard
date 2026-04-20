import type { Metadata } from 'next';
import { ProjectPage } from '@/components/ProjectPage';

export const metadata: Metadata = {
  title: 'CWOMA.TOOLS/basewords',
};

export default function BaseWordsRoute() {
  return <ProjectPage project="basewords" />;
}
