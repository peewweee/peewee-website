import { CastleHub } from "@/components/castle/castle-hub";

/**
 * Home — the 3D castle, full screen. It IS the navigation: each tower zooms in
 * and warps to its section (the Great Hall, Projects, About, Resume, Contact).
 * The accessible/keyboard path is the header nav.
 */
export default function HomePage() {
  return <CastleHub variant="hero" />;
}
