'use client';

import Link from 'next/link';
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

const TAB_ORDER: { project: Project; href: string }[] = [
  { project: 'basewords', href: '/basewords' },
  { project: 'colorpunks', href: '/colorpunks' },
];

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
        {/* Project switcher — both labels render at the same size and
            font as the original .project-title; the active one is fully
            opaque, the other dims slightly so the row reads as a tab
            pair rather than two equal headings. */}
        <nav className="project-tabs" aria-label="Switch project">
          {TAB_ORDER.map((t, i) => (
            <span key={t.project} className="project-tabs-row">
              {i > 0 && <span className="project-tabs-sep" aria-hidden>|</span>}
              <Link
                href={t.href}
                className={`project-title project-tab${
                  t.project === project ? ' active' : ''
                }`}
                aria-current={t.project === project ? 'page' : undefined}
              >
                {LABELS[t.project]}
              </Link>
            </span>
          ))}
        </nav>
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
            <FarcasterIcon size={14} />
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
