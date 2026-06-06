"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ParticleNetwork, GeometricMesh, ContourLines, OrbitalRings, FloatingShapes,
} from "@/components/art/backgrounds";

const LANDINGS = [
  { slug: "aurora", name: "Aurora", desc: "Light · glassmorphism · particle network", art: <ParticleNetwork className="absolute inset-0 opacity-70" /> },
  { slug: "editorial", name: "Editorial", desc: "Luxury serif · minimal · contour lines", art: <ContourLines className="absolute inset-0 opacity-60" a={[180, 83, 9]} b={[120, 113, 108]} /> },
  { slug: "midnight", name: "Midnight", desc: "Dark luxe · glowing constellation", art: <ParticleNetwork className="absolute inset-0 opacity-90" a={[245, 200, 100]} b={[56, 189, 248]} />, dark: true },
  { slug: "prism", name: "Prism", desc: "Bold · low-poly geometric mesh", art: <GeometricMesh className="absolute inset-0 opacity-80" /> },
  { slug: "vault", name: "Vault", desc: "Premium · concentric orbital rings", art: <OrbitalRings className="absolute inset-0 opacity-60" a={[234, 88, 12]} b={[2, 132, 199]} /> },
];

const BACKGROUNDS = [
  { name: "Particle Network", node: <ParticleNetwork className="absolute inset-0" /> },
  { name: "Geometric Mesh", node: <GeometricMesh className="absolute inset-0" /> },
  { name: "Contour Lines", node: <ContourLines className="absolute inset-0" /> },
  { name: "Orbital Rings", node: <OrbitalRings className="absolute inset-0" /> },
  { name: "Floating Shapes", node: <FloatingShapes className="absolute inset-0" /> },
];

export default function PreviewIndex() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Design previews</h1>
        <p className="mt-1 text-slate-500">Pick a landing direction and a background — each is live.</p>

        <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-slate-400">Landing designs</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LANDINGS.map((l) => (
            <Link key={l.slug} href={`/preview/${l.slug}`} className="group block overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl">
              <div className={`relative h-44 overflow-hidden ${l.dark ? "bg-[#080810]" : "bg-gradient-to-br from-orange-50 to-sky-50"}`}>
                {l.art}
                <div className="absolute inset-0 grid place-items-center">
                  <span className={`text-2xl font-extrabold tracking-tight ${l.dark ? "text-white" : "text-slate-900"}`}>{l.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="font-bold">{l.name}</div>
                  <div className="text-xs text-slate-500">{l.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <h2 className="mt-12 text-sm font-bold uppercase tracking-wider text-slate-400">Background art</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BACKGROUNDS.map((b) => (
            <div key={b.name} className="relative h-44 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50/50 to-sky-50/50">
              {b.node}
              <span className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2 py-1 text-xs font-bold backdrop-blur">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
