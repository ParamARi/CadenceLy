import TapBpmModal, { type TapBpmSession } from "@/components/TapBpmModal";

type Props = {
  session: TapBpmSession | null;
  onClose: () => void;
};

/** Single shared Tap BPM modal; pass session from `useTapBpmSession`. */
export function TapBpmModalRoot({ session, onClose }: Props) {
  if (session == null) return null;
  return (
    <TapBpmModal
      show
      onClose={onClose}
      title={session.title}
      artistName={session.artistName}
      videoId={session.videoId ?? undefined}
      songLookupQuery={session.songLookupQuery ?? undefined}
      onUseMeasuredBpm={session.onUseMeasuredBpm}
    />
  );
}
