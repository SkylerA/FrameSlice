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
        <Component {...pageProps} />;
      </Layout>
      <Analytics />
    </>
  );
}
