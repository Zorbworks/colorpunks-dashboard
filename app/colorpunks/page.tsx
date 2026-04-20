import type { Metadata } from 'next';
import { ProjectPage } from '@/components/ProjectPage';

export const metadata: Metadata = {
  title: 'CWOMA.TOOLS/colorpunks',
};

export default function ColorPunksRoute() {
  return <ProjectPage project="colorpunks" />;
}
