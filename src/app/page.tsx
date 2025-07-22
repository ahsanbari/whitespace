"use client";
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./components/LeafletMap'), { ssr: false });

export default function Home() {
  return <LeafletMap />;
}
