'use client';

import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** BaseWords terms-of-use modal. Surfaced from above the MINT button
 *  and from the bottom of the BaseWords ABOUT modal. */
export function TermsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="[ TERMS ] BASEWORDS">
      <p>
        By using this platform, you agree to these terms, please read them
        carefully.
      </p>
      <ol className="about-list">
        <li>
          <strong>Entertainment Only:</strong> Base words is an experimental,
          community-driven project created purely for entertainment purposes.
          It has no affiliation with Coinbase, Base, or any of their partners
          or entities.
        </li>
        <li>
          <strong>Respectful Use:</strong> We&rsquo;ve built BASE WORDS as an
          open, permissionless platform that&rsquo;s accessible to everyone.
          Please show respect to the community by not minting offensive,
          defamatory, abusive, discriminatory or otherwise objectionable
          words.
        </li>
        <li>
          <strong>Blocking Words:</strong> We reserve the right to block any
          words we believe violate these guidelines, and we can do so at our
          sole discretion. There will be no refunds for blocked mints.
        </li>
      </ol>
    </Modal>
  );
}
