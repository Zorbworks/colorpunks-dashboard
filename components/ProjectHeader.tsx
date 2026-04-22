'use client';

import { useState } from 'react';
import { AboutModal } from './AboutModal';
import { RecentModal } from './RecentModal';
import { FarcasterIcon } from './FarcasterIcon';
import { BASEWORDS_ADDRESS, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';
import type { Project } from './ProjectPage';

interface Props {
  project: Project;
}

const LABELS: Record<Project, string> = {
  basewords: 'BASEWORDS',
  colorpunks: 'COLORPUNKS',
};

const OPENSEA: Record<Project, string> = {
  basewords: `https://opensea.io/assets/base/${BASEWORDS_ADDRESS}`,
  colorpunks: `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`,
};

const FARCASTER: Record<Project, string> = {
  basewords: 'https://farcaster.xyz/~/channel/basewords',
  colorpunks: 'https://farcaster.xyz/~/channel/colorpunks',
};

export function ProjectHeader({ project }: Props) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  return (
    <>
      <section className="project-header">
        <h1 className="project-title">{LABELS[project]}</h1>
        <div className="project-nav">
          <button
            type="button"
            className="opensea-btn"
            onClick={() => setAboutOpen(true)}
          >
            ABOUT
          </button>
          <a
            className="opensea-btn"
            href={OPENSEA[project]}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPENSEA
          </a>
          <button
            type="button"
            className="opensea-btn"
            onClick={() => setRecentOpen(true)}
          >
            RECENT
          </button>
          <a
            className="fc-square"
            href={FARCASTER[project]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Farcaster channel"
            title="Farcaster channel"
          >
            <FarcasterIcon size={18} />
          </a>
        </div>
      </section>

      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        project={project}
      />
      <RecentModal
        open={recentOpen}
        onClose={() => setRecentOpen(false)}
        project={project}
      />
    </>
  );
}
