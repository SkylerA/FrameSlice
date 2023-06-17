// TODO Look into reducing size. // TODO https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer
// TODO look into react million for virtual dom speed ups

import "@/styles/globals.css";
// TODO remove this once this project uses App folder style
import "@/components/multiRangeSlider/multirangeSlider.css";
import { Analytics } from "@vercel/analytics/react";

import type { AppProps } from "next/app";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Analytics />
    </>
  );
}
